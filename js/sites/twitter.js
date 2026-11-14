/**
 * Twitter / X site adapter.
 *
 * Handles tweet URLs. NSFW / age-restricted tweets return a TweetTombstone for
 * logged-out requests, which leaves yt-dlp without any format. In that case we
 * resolve the direct CDN url through a public API and let yt-dlp download it.
 */

const { validateUrl, assertHostAllowed, secureHttpsGet } = require("../net-guard");

const STATUS_ID_RE = /\/(?:status|statuses)\/(\d+)/;
const ALLOWED_MEDIA_DOMAINS = ["video.twimg.com"];
const RECOVERABLE_ERROR_RE = /No video formats found|No video could be found|TweetTombstone|NSFW|age.?restrict|not authorized|requires authentication|Postprocessing|Invalid data found|Error opening input/i;

function match(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === "twitter.com" || host === "x.com" || host.endsWith(".twitter.com") || host.endsWith(".x.com");
  } catch {
    return false;
  }
}

function getSiteArgs() {
  return [
    "--ignore-no-formats-error",
  ];
}

function getStatusId(url) {
  const matched = String(url || "").match(STATUS_ID_RE);
  return matched ? matched[1] : null;
}

function getOutputTemplate(args) {
  const index = args.indexOf("-o");
  if (index >= 0 && typeof args[index + 1] === "string" && args[index + 1].trim()) {
    return args[index + 1];
  }
  return null;
}

function pickBestVideoUrl(tweet) {
  const videos = tweet && tweet.media && Array.isArray(tweet.media.videos) ? tweet.media.videos : [];
  for (const video of videos) {
    const variants = Array.isArray(video.variants) ? video.variants.filter((variant) => {
      if (!variant || typeof variant.url !== "string") return false;
      const kind = `${variant.content_type || ""} ${variant.container || ""}`.toLowerCase();
      return kind.includes("mp4") || kind.includes("video/");
    }) : [];
    variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const candidate = variants.length > 0 ? variants[0].url : video.url;
    if (typeof candidate === "string" && candidate.startsWith("https://")) {
      return candidate;
    }
  }
  return null;
}

/** 一条推文里所有视频的直链（每个视频取最高码率 mp4） */
function pickVideoUrls(tweet) {
  const videos = tweet && tweet.media && Array.isArray(tweet.media.videos) ? tweet.media.videos : [];
  const urls = [];
  for (const video of videos) {
    if (!video) continue;
    const variants = Array.isArray(video.variants)
      ? video.variants.filter((variant) => {
        if (!variant || typeof variant.url !== "string") return false;
        if (!/^https:\/\/video\.twimg\.com\//i.test(variant.url)) return false;
        const kind = `${variant.content_type || ""} ${variant.container || ""}`.toLowerCase();
        return kind.includes("mp4") || /\.mp4(\?|$)/i.test(variant.url);
      })
      : [];
    variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    const candidate = variants.length > 0 ? variants[0].url : video.url;
    if (typeof candidate === "string" && candidate.startsWith("https://") && !urls.includes(candidate)) {
      urls.push(candidate);
    }
  }
  return urls;
}

/**
 * Resolve tweet media through a public API (works for NSFW tweets without login).
 */
const TWEET_API_TIMEOUT = 6000;

/**
 * 拉取一个推文公开接口的 JSON（6 秒超时，失败返回 null，不阻塞后续来源）
 */
function fetchJsonFromApi(apiUrl, timeoutMs) {
  return new Promise(async (resolve) => {
    let settled = false;
    const finish = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    try {
      await validateUrl(apiUrl);
      const req = await secureHttpsGet(
        apiUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            return finish(null);
          }
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            body += chunk;
            if (body.length > 2e6) {
              res.destroy();
              finish(null);
            }
          });
          res.on("end", () => {
            try {
              finish(JSON.parse(body));
            } catch (e) {
              finish(null);
            }
          });
          res.on("error", () => finish(null));
        }
      );
      req.on("error", () => finish(null));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        finish(null);
      });
    } catch (e) {
      finish(null);
    }
    setTimeout(() => finish(null), timeoutMs + 2000);
  });
}

/**
 * 把 vxtwitter 的响应整理成 fxtwitter 的 tweet 结构
 */
function normalizeVxTweet(data) {
  if (!data || typeof data !== "object") return null;
  const extended = Array.isArray(data.media_extended) ? data.media_extended : [];
  const mediaUrls = Array.isArray(data.mediaURLs) ? data.mediaURLs : [];
  const videos = [];
  const photos = [];

  for (const item of extended) {
    if (!item || typeof item.url !== "string") continue;
    const type = String(item.type || "").toLowerCase();
    if (type === "video" || /^https:\/\/video\.twimg\.com\//i.test(item.url)) {
      videos.push({
        url: item.url,
        duration: Number(item.duration_millis) > 0 ? Number(item.duration_millis) / 1000 : 0,
        thumbnail_url: item.thumbnail_url || null,
        variants: [{ url: item.url, content_type: "video/mp4", bitrate: 0 }],
      });
    } else if (/^https:\/\/pbs\.twimg\.com\//i.test(item.url)) {
      photos.push(item.url);
    }
  }

  if (!videos.length && !photos.length) {
    for (const url of mediaUrls) {
      if (typeof url !== "string") continue;
      if (/^https:\/\/pbs\.twimg\.com\//i.test(url)) photos.push(url);
    }
  }

  if (!videos.length && !photos.length && !String(data.text || "").trim()) return null;

  return {
    text: typeof data.text === "string" ? data.text : "",
    author: {
      screen_name: data.user_screen_name || "",
      name: data.user_name || data.user_screen_name || "",
      id: data.user_id_str ? String(data.user_id_str) : null,
    },
    media: { videos, photos },
  };
}

/**
 * 依次尝试多个公开接口解析推文媒体：fxtwitter → vxtwitter。
 * 单个来源 6 秒超时，避免旧实现最长 20 秒空等。
 */
async function fetchTweetJson(statusId) {
  const fx = await fetchJsonFromApi(`https://api.fxtwitter.com/status/${statusId}`, TWEET_API_TIMEOUT);
  if (fx && fx.tweet) return fx;

  const vx = await fetchJsonFromApi(`https://api.vxtwitter.com/status/${statusId}`, TWEET_API_TIMEOUT);
  const normalized = normalizeVxTweet(vx);
  if (normalized) return { tweet: normalized };

  return null;
}

/**
 * 推文里的图片地址（统一换成原图）
 */
function pickPhotoUrls(tweet) {
  const photos = tweet && tweet.media && Array.isArray(tweet.media.photos) ? tweet.media.photos : [];
  const urls = [];
  for (const photo of photos) {
    const raw = typeof photo === "string" ? photo : photo && (photo.url || photo.media_url_https);
    if (typeof raw !== "string" || !/^https:\/\/pbs\.twimg\.com\//i.test(raw)) continue;
    const base = raw.replace(/[?&]name=[^&]+/i, "");
    urls.push(base + (base.includes("?") ? "&" : "?") + "name=orig");
  }
  return urls;
}

/** 这条推文自己有没有媒体 */
function hasOwnMedia(tweet) {
  if (!tweet || !tweet.media) return false;
  const videos = Array.isArray(tweet.media.videos) ? tweet.media.videos.length : 0;
  const photos = Array.isArray(tweet.media.photos) ? tweet.media.photos.length : 0;
  return videos > 0 || photos > 0;
}

/**
 * 找出媒体实际挂在哪个对象上。
 *
 * 转发（retweet）在 fxtwitter / vxtwitter 里通常直接返回原帖，媒体就在顶层；
 * 引用转发（quote）则不同：外层是「引用者写的话」，图片/视频挂在被引用的那条
 * （tweet.quote）上，外层 media 为空。之前只读顶层，这类链接就会一路落到
 * yt-dlp，最终报「没有可下载的格式」。
 */
function resolveMediaTweet(tweet) {
  if (!tweet) return null;
  if (hasOwnMedia(tweet)) return tweet;
  const nested = [tweet.quote, tweet.quoted_status, tweet.retweeted_status, tweet.retweeted_status_result];
  for (const item of nested) {
    if (hasOwnMedia(item)) return item;
  }
  return tweet;
}

/** 推文对应的页面地址（转发/引用时指向真正持有媒体的原帖） */
function tweetPageUrl(tweet) {
  if (!tweet) return null;
  if (typeof tweet.url === "string" && /^https:\/\/(?:x|twitter)\.com\//i.test(tweet.url)) return tweet.url;
  const id = tweet.id ? String(tweet.id) : "";
  if (!id) return null;
  const handle = tweet.author && tweet.author.screen_name ? String(tweet.author.screen_name) : "i";
  return "https://x.com/" + handle + "/status/" + id;
}

function buildTitle(tweet, text, statusId) {
  const cleaned = String(text || "").replace(/https:\/\/t\.co\/\S+/gi, "").replace(/\s+/g, " ").trim();
  const author = tweet && tweet.author ? tweet.author.screen_name || tweet.author.name : "";
  const head = cleaned || "Twitter " + statusId;
  const suffix = author ? " - @" + author : "";
  return (head + suffix).slice(0, 180);
}

/**
 * 推文元信息：有视频交给 yt-dlp 下载，只有图片时走插件的图片下载通道。
 * 推文正文写入 description，导入 Eagle 时会成为注释。
 */
async function customGetInfo(url) {
  const statusId = getStatusId(url);
  if (!statusId) return null;

  let data = null;
  try {
    data = await fetchTweetJson(statusId);
  } catch (e) {
    return null;
  }
  const tweet = data && data.tweet;
  if (!tweet) return null;

  const text = typeof tweet.text === "string" ? tweet.text : "";
  const author = tweet.author || {};
  // 引用转发时媒体在被引用的那条上；文案与作者仍用外层（用户时间线上看到的那条）
  const mediaTweet = resolveMediaTweet(tweet) || tweet;
  const base = {
    title: buildTitle(tweet, text, statusId),
    description: text,
    uploader: author.name || author.screen_name || "Twitter",
    extractor: "twitter",
    webpage_url: url,
    id: statusId,
    // 自动标签用的作者字段：数字 ID 供「推特 ID」标签读取
    authorId: author.id ? String(author.id) : null,
    authorScreenName: author.screen_name || null,
    authorName: author.name || null,
    thumbnail: mediaTweet.media && mediaTweet.media.videos && mediaTweet.media.videos[0] ? mediaTweet.media.videos[0].thumbnail_url || null : null,
  };

  const videos = mediaTweet.media && Array.isArray(mediaTweet.media.videos) ? mediaTweet.media.videos : [];
  if (videos.length) {
    const videoUrls = pickVideoUrls(mediaTweet);
    // 视频挂在被转发/被引用的原帖上：下载目标换成原帖，否则 yt-dlp 拿这条链接解析不到格式
    const pageUrl = tweetPageUrl(mediaTweet);
    const retarget = pageUrl && pageUrl !== url ? { webpage_url: pageUrl, sourceUrl: pageUrl } : {};
    return Object.assign({}, base, {
      duration: Number(videos[0].duration) || 0,
      ...(videoUrls.length > 1 ? { videoUrls } : {}),
    }, retarget);
  }

  const photos = pickPhotoUrls(mediaTweet);
  if (photos.length) {
    return Object.assign({}, base, {
      type: "image",
      imageUrl: photos[0],
      images: photos,
      webpage_url: url,
    });
  }

  return null;
}

async function handleExecFailure({ stderr, args, onProgress, onOutput, execYtDlp, url }) {
  try {
    if (!match(url) || !Array.isArray(args) || args.includes("--dump-json")) return null;
    if (!RECOVERABLE_ERROR_RE.test(String(stderr || ""))) return null;

    const statusId = getStatusId(url);
    const outputTemplate = getOutputTemplate(args);
    if (!statusId || !outputTemplate) return null;

    const data = await fetchTweetJson(statusId);
    const directUrl = pickBestVideoUrl(resolveMediaTweet(data && data.tweet));
    if (!directUrl) return null;

    await validateUrl(directUrl);
    assertHostAllowed(directUrl, ALLOWED_MEDIA_DOMAINS);

    return await execYtDlp(
      [directUrl, "-o", outputTemplate, "--no-warnings", "--merge-output-format", "mp4"],
      onProgress,
      onOutput,
      false
    );
  } catch (e) {
    return null;
  }
}

module.exports = {
  match,
  getSiteArgs,
  customGetInfo,
  handleExecFailure,
  pickPhotoUrls,
  pickVideoUrls,
};
