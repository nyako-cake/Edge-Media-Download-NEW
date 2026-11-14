/**
 * Twitter / X 账号监控：用 auth_token + ct0 轮询「点赞」和「书签」，
 * 把新增的推文链接投递到下载队列。
 *
 * - 所有状态按资源库隔离（eagle.library.path）
 * - 启动时补抓「上次关闭后」新增的内容（分页直到覆盖上次检查时间）
 * - 接口：Viewer / Likes / Bookmarks（x.com 内部 GraphQL）
 */

const twitterAuth = require("./twitter-auth");
const { getJson, getRaw } = require("./x-http");
const { scopedKey } = require("./library-context");
const twitterDm = require("./twitter-dm");
const logger = require("./logger");

const SEEN_KEY = "Edge-Media-Download-NEW.twitterSeen";
const ENABLED_KEY = "Edge-Media-Download-NEW.twitterMonitorEnabled";
const INTERVAL_KEY = "Edge-Media-Download-NEW.twitterMonitorInterval";
const INTERVAL_MS_KEY = "Edge-Media-Download-NEW.twitterMonitorIntervalMs";
const MIN_INTERVAL_MS = 30000;
/** 好友聊天单独节奏：2~10 分钟，步进 2 分钟 */
const DM_INTERVAL_MS_KEY = "Edge-Media-Download-NEW.twitterDmIntervalMs";
const DM_LAST_CHECK_KEY = "Edge-Media-Download-NEW.twitterDmLastCheckAt";
/** 各来源最后一次抓取成功的时间，决定下一轮增量起点 */
const LAST_LIKES_KEY = "Edge-Media-Download-NEW.twitterLastLikesAt";
const LAST_BOOKMARKS_KEY = "Edge-Media-Download-NEW.twitterLastBookmarksAt";
/** 每轮抓取成功的时间与结果，用于判断哪些是新一轮的链接 */
const FETCH_LOG_KEY = "Edge-Media-Download-NEW.twitterFetchLog";
const MAX_FETCH_LOG = 30;
const MIN_DM_INTERVAL_MS = 120000;
const DEFAULT_DM_INTERVAL_MINUTES = 2;
const LIKES_KEY = "Edge-Media-Download-NEW.twitterMonitorLikes";
const BOOKMARKS_KEY = "Edge-Media-Download-NEW.twitterMonitorBookmarks";
const DM_KEY = "Edge-Media-Download-NEW.twitterMonitorDm";
const DM_CHATS_KEY = "Edge-Media-Download-NEW.twitterDmChats";
const CHAT_PASSCODE_KEY = "Edge-Media-Download-NEW.xchatPasscode";
const CONVERSATIONS_KEY = "Edge-Media-Download-NEW.twitterDmConversations";
const BASELINE_KEY = "Edge-Media-Download-NEW.twitterBaselineAt";
const LAST_CHECK_KEY = "Edge-Media-Download-NEW.twitterLastCheckAt";
const PROFILE_KEY = "Edge-Media-Download-NEW.twitterProfile";

const MAX_SEEN = 5000;
const MAX_DOWNLOAD_PER_CYCLE = Number.MAX_SAFE_INTEGER;
const MAX_CATCHUP_DOWNLOAD = Number.MAX_SAFE_INTEGER;
const MAX_CATCHUP_PAGES = 200;
/** 点赞 / 收藏 / 好友链接每轮各自最多抓 100 条 */
const MAX_ITEMS_PER_KIND = 100;
const DEFAULT_INTERVAL_MINUTES = 10;

const QUERY_IDS = {
  Viewer: "TpQxQtWMTMnIAMPlMGMqNw",
  Likes: "a6ZbplAY_XzbVt5jy_Ko_Q",
  Bookmarks: "jbqsfdzI0EMFHAtpEC6vyA",
};

const FEATURES = { rweb_video_screen_enabled: false };

let timer = null;
let changeTimer = null;
let dmTimer = null;
let dmIntervalMs = 0;
let dmNextRunAt = 0;
let dmRunning = false;
let running = false;
let lastResult = null;
let nextRunAt = 0;
let currentIntervalMs = 0;
let lastRunAt = 0;

/* --------------------------------------------------------------- storage */

function readJson(baseKey, fallback) {
  try {
    const key = scopedKey(baseKey);
    let raw = localStorage.getItem(key);
    if (raw === null) {
      const legacy = localStorage.getItem(baseKey);
      if (legacy !== null) {
        localStorage.setItem(key, legacy);
        raw = legacy;
      }
    }
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function readNumber(baseKey) {
  try {
    const key = scopedKey(baseKey);
    let raw = localStorage.getItem(key);
    if (raw === null) {
      const legacy = localStorage.getItem(baseKey);
      if (legacy !== null) {
        localStorage.setItem(key, legacy);
        raw = legacy;
      }
    }
    return Number(raw) || 0;
  } catch (e) {
    return 0;
  }
}

function writeValue(baseKey, value) {
  try {
    localStorage.setItem(scopedKey(baseKey), String(value));
  } catch (e) {
    // ignore
  }
}

function readSeen() {
  const parsed = readJson(SEEN_KEY, []);
  return new Set(Array.isArray(parsed) ? parsed : []);
}

function writeSeen(set) {
  writeValue(SEEN_KEY, JSON.stringify(Array.from(set).slice(-MAX_SEEN)));
}

function getPrefs() {
  try {
    const savedMs = readNumber(INTERVAL_MS_KEY);
    const legacyMinutes = readNumber(INTERVAL_KEY);
    const ms = savedMs || (legacyMinutes ? legacyMinutes * 60000 : DEFAULT_INTERVAL_MINUTES * 60000);
    const readFlag = (key) => localStorage.getItem(scopedKey(key)) !== "0";
    return {
      enabled: localStorage.getItem(scopedKey(ENABLED_KEY)) === "1",
      ms: Math.max(MIN_INTERVAL_MS, ms || DEFAULT_INTERVAL_MINUTES * 60000),
      dmMs: Math.max(MIN_DM_INTERVAL_MS, readNumber(DM_INTERVAL_MS_KEY) || DEFAULT_DM_INTERVAL_MINUTES * 60000),
      likes: readFlag(LIKES_KEY),
      bookmarks: readFlag(BOOKMARKS_KEY),
      dm: readFlag(DM_KEY),
      dmChats: readJson(DM_CHATS_KEY, []) || [],
      chatPasscode: localStorage.getItem(scopedKey(CHAT_PASSCODE_KEY)) || "",
    };
  } catch (e) {
    return {
      enabled: false,
      ms: DEFAULT_INTERVAL_MINUTES * 60000,
      likes: true,
      bookmarks: true,
      dm: true,
      dmChats: [],
      chatPasscode: "",
    };
  }
}

function setPrefs(patch) {
  if (typeof patch.enabled === "boolean") writeValue(ENABLED_KEY, patch.enabled ? "1" : "0");
  if (patch.ms) writeValue(INTERVAL_MS_KEY, Math.max(MIN_INTERVAL_MS, Number(patch.ms) || 0));
  if (patch.dmMs) writeValue(DM_INTERVAL_MS_KEY, Math.max(MIN_DM_INTERVAL_MS, Number(patch.dmMs) || 0));
  if (typeof patch.likes === "boolean") writeValue(LIKES_KEY, patch.likes ? "1" : "0");
  if (typeof patch.bookmarks === "boolean") writeValue(BOOKMARKS_KEY, patch.bookmarks ? "1" : "0");
  if (typeof patch.dm === "boolean") writeValue(DM_KEY, patch.dm ? "1" : "0");
  if (Array.isArray(patch.dmChats)) writeValue(DM_CHATS_KEY, JSON.stringify(patch.dmChats.map(String)));
  if (typeof patch.chatPasscode === "string") writeValue(CHAT_PASSCODE_KEY, patch.chatPasscode);
}

function getBaselineAt() {
  return readNumber(BASELINE_KEY);
}

function setBaselineAt(value) {
  writeValue(BASELINE_KEY, value || 0);
}

function getLastCheckAt() {
  return readNumber(LAST_CHECK_KEY);
}

function getDmLastCheckAt() {
  return readNumber(DM_LAST_CHECK_KEY);
}

function setDmLastCheckAt(value) {
  writeValue(DM_LAST_CHECK_KEY, value || Date.now());
}

function getKindLastCheckAt(kind) {
  const map = { likes: LAST_LIKES_KEY, bookmarks: LAST_BOOKMARKS_KEY, dm: DM_LAST_CHECK_KEY };
  const key = map[kind];
  return key ? readNumber(key) : 0;
}

function setKindLastCheckAt(kind, value) {
  const map = { likes: LAST_LIKES_KEY, bookmarks: LAST_BOOKMARKS_KEY, dm: DM_LAST_CHECK_KEY };
  const key = map[kind];
  if (key) writeValue(key, value || Date.now());
}

function getFetchLog() {
  return readJson(FETCH_LOG_KEY, []) || [];
}

/** 每次抓取成功落一条：开始/结束时间、各来源是否成功、本轮新增与重复数 */
function appendFetchLog(entry) {
  const record = {
    startedAt: entry.startedAt || Date.now(),
    finishedAt: entry.finishedAt || Date.now(),
    mode: entry.mode || "poll",
    likesOk: entry.likesOk !== false,
    bookmarksOk: entry.bookmarksOk !== false,
    dmOk: entry.dmOk !== false,
    newCount: Number(entry.newCount) || 0,
    duplicateCount: Number(entry.duplicateCount) || 0,
    error: entry.error || null,
  };
  try {
    const list = getFetchLog();
    list.unshift(record);
    writeValue(FETCH_LOG_KEY, JSON.stringify(list.slice(0, MAX_FETCH_LOG)));
  } catch (e) {
    // 日志失败不影响抓取
  }
  logger.info("monitor", "一轮结束", {
    mode: record.mode,
    newCount: record.newCount,
    duplicateCount: record.duplicateCount,
    likesOk: record.likesOk,
    bookmarksOk: record.bookmarksOk,
    dmOk: record.dmOk,
    error: record.error
  });
}

function setLastCheckAt(value) {
  writeValue(LAST_CHECK_KEY, value || Date.now());
}

/* --------------------------------------------------------------- api */

function describeError(result) {
  if (result.status === 401 || result.status === 403) return "cookie 无效或已过期";
  if (result.status === 404) return "X 接口已更新（queryId 失效）";
  if (result.status === 422) return "请求参数被拒绝";
  if (result.status === 429) return "请求过于频繁（429）";
  if (result.status === 0) return "网络错误（可能需要代理）" + (result.error ? "：" + result.error : "");
  return "HTTP " + result.status;
}

function findTweetIds(node, out, depth) {
  if (!node || depth > 14) return;
  if (Array.isArray(node)) {
    for (const item of node) findTweetIds(item, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const result = node.tweet_results && node.tweet_results.result;
  if (result) {
    const legacy = result.legacy || result;
    const id = legacy.id_str || legacy.rest_id || result.rest_id;
    if (id && /^\d+$/.test(String(id))) out.push(String(id));
  }
  for (const key of Object.keys(node)) {
    if (key === "tweet_results") continue;
    findTweetIds(node[key], out, depth + 1);
  }
}

/** 从时间线响应里取出推文 id / 时间 / 下一页 cursor */
function extractTimeline(json) {
  const instructions = [];
  const visit = (node, depth) => {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, depth + 1));
      return;
    }
    if (typeof node !== "object") return;
    if (Array.isArray(node.instructions)) instructions.push(...node.instructions);
    for (const key of Object.keys(node)) {
      if (key !== "instructions") visit(node[key], depth + 1);
    }
  };
  visit(json, 0);

  const items = [];
  let cursor = null;
  for (const instruction of instructions) {
    if (!instruction) continue;
    if (instruction.cursorType === "Bottom" && instruction.value) cursor = instruction.value;
    if (!Array.isArray(instruction.entries)) continue;
    for (const entry of instruction.entries) {
      if (!entry) continue;
      const content = entry.content || {};
      const itemContent = content.itemContent;
      const tweet = itemContent && itemContent.tweet_results && itemContent.tweet_results.result;
      if (tweet) {
        const legacy = tweet.legacy || tweet;
        const id = legacy.id_str || legacy.rest_id || tweet.rest_id;
        const createdAt = legacy.created_at ? Date.parse(legacy.created_at) : 0;
        if (id) items.push({ id: String(id), createdAt });
      }
      if (typeof entry.entryId === "string" && entry.entryId.startsWith("cursor-bottom") && content.value) {
        cursor = content.value;
      }
    }
  }
  return { items, cursor };
}

function findUserLegacy(node, depth) {
  if (!node || depth > 10) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findUserLegacy(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;
  if (node.legacy && typeof node.legacy === "object" && node.legacy.screen_name) return node.legacy;
  for (const key of Object.keys(node)) {
    const found = findUserLegacy(node[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function normalizeProfile(legacy, fallbackId) {
  const avatar = legacy && (legacy.profile_image_url_https || legacy.profile_image_url || legacy.image_url);
  return {
    id: (legacy && legacy.id_str) || fallbackId || "",
    screenName: (legacy && legacy.screen_name) || "",
    name: (legacy && legacy.name) || "",
    avatar: typeof avatar === "string" ? avatar.replace("_normal.", "_200x200.") : "",
  };
}

/** 头像走插件自己的代理请求，转成 data URL，避免渲染层直连图片 CDN 失败 */
async function withAvatarData(profile) {
  if (!profile || !profile.avatar) return profile;
  try {
    const result = await getRaw(profile.avatar, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        accept: "image/*",
      },
    });
    if (result.status === 200 && result.buffer && result.buffer.length) {
      const type = String(result.contentType || "image/jpeg").split(";")[0];
      const dataUrl = "data:" + type + ";base64," + result.buffer.toString("base64");
      if (dataUrl.length < 400000) profile.avatarData = dataUrl;
    }
  } catch (e) {
    // 忽略头像失败，不影响账号信息
  }
  return profile;
}

function saveProfile(profile) {
  try {
    writeValue(PROFILE_KEY, JSON.stringify(profile || {}));
  } catch (e) {
    // ignore
  }
}

function getSavedProfile() {
  const parsed = readJson(PROFILE_KEY, null);
  return parsed && typeof parsed === "object" ? parsed : null;
}

async function getProfile(auth) {
  const url = "https://x.com/i/api/graphql/" + QUERY_IDS.Viewer + "/Viewer?variables=%7B%7D&features=%7B%7D";
  const result = await getJson(url, { headers: auth.headers });
  if (result.status !== 200 || !result.json) {
    return { ok: false, status: result.status, error: describeError(result) };
  }
  const body = result.body || "";
  const idMatch = body.match(/"rest_id":"(\d+)"/);
  const legacy = findUserLegacy(result.json, 0);
  const profile = normalizeProfile(legacy, idMatch ? idMatch[1] : "");

  // 兜底：某些版本 Viewer 返回结构不同，直接从文本里取字段
  if (!profile.screenName) {
    const matched = body.match(/"screen_name":"([^"]+)"/);
    if (matched) profile.screenName = matched[1];
  }
  if (!profile.name) {
    const matched = body.match(/"name":"((?:[^"\\]|\\.)+)"/);
    if (matched) profile.name = matched[1].replace(/\\"/g, '"');
  }
  if (!profile.avatar) {
    const matched = body.match(/"(?:profile_image_url_https|image_url)":"([^"]+)"/);
    if (matched) profile.avatar = matched[1].replace(/\\\//g, "/").replace("_normal.", "_200x200.");
  }
  return { ok: true, ...profile };
}

function endpoointUrl(kind, variables) {
  const op = kind === "likes" ? "Likes" : "Bookmarks";
  return (
    "https://x.com/i/api/graphql/" +
    QUERY_IDS[op] +
    "/" +
    op +
    "?variables=" +
    encodeURIComponent(JSON.stringify(variables)) +
    "&features=" +
    encodeURIComponent(JSON.stringify(FEATURES))
  );
}

async function fetchPage(auth, kind, userId, cursor, count) {
  const variables =
    kind === "likes"
      ? {
          userId,
          count,
          includePromotedContent: false,
          withClientEventToken: false,
          withBirdwatchNotes: false,
          withVoice: true,
        }
      : { count, includePromotedContent: true };
  if (cursor) variables.cursor = cursor;

  const result = await getJson(endpoointUrl(kind, variables), { headers: auth.headers });
  if (result.status !== 200 || !result.json) {
    return { ok: false, status: result.status, error: describeError(result), items: [], cursor: null };
  }
  const timeline = extractTimeline(result.json);
  return { ok: true, items: timeline.items, cursor: timeline.cursor };
}

async function fetchLikes(auth, userId, count) {
  const page = await fetchPage(auth, "likes", userId, null, count);
  if (!page.ok) return page;
  return { ok: true, items: Array.from(new Set(page.items.map((item) => item.id))).map((id) => ({ id, source: "like" })) };
}

async function fetchBookmarks(auth, count) {
  const page = await fetchPage(auth, "bookmarks", "", null, count);
  if (!page.ok) return page;
  return { ok: true, items: Array.from(new Set(page.items.map((item) => item.id))).map((id) => ({ id, source: "bookmark" })) };
}

/** 从最新一页往回翻，直到推文时间早于 since 或翻页上限 */
async function fetchSince(auth, kind, userId, since, maxPages) {
  const collected = [];
  let cursor = null;
  let reachedOld = false;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    const page = await fetchPage(auth, kind, userId, cursor, 20);
    if (!page.ok) return { ok: false, error: page.error, items: collected };
    if (!page.items.length) break;

    for (const item of page.items) {
      if (item.createdAt && item.createdAt < since) {
        reachedOld = true;
        continue;
      }
      collected.push(item);
      if (collected.length >= MAX_ITEMS_PER_KIND) break;
    }
    cursor = page.cursor;
    if (reachedOld || !cursor || collected.length >= MAX_ITEMS_PER_KIND) break;
  }

  return { ok: true, items: collected.slice(0, MAX_ITEMS_PER_KIND) };
}

/** 把某条推文标记为已处理，避免扩展推送与监控重复下载 */
function markTweetSeen(url) {
  const matched = String(url || "").match(/\/status\/(\d+)/);
  if (!matched) return false;
  const seen = readSeen();
  if (seen.has(matched[1])) return false;
  seen.add(matched[1]);
  writeSeen(seen);
  return true;
}

/**
 * 派发下载请并统计被插件判为重复（库里已有同链接 / 队列已有同任务）的条数。
 * 事件派发是同步的，所以这里能可靠回收本轮结果。
 */
/** 逐条派发入队，用 evd:download-result 收结果，统计被判重复的条数 */
async function dispatchDownloads(entries) {
  const waiting = new Map();
  const onResult = (e) => {
    const detail = (e && e.detail) || {};
    const resolve = waiting.get(detail.url);
    if (resolve) resolve(detail.status || "queued");
  };
  document.addEventListener("evd:download-result", onResult);
  let duplicateCount = 0;
  try {
    const pending = [];
    for (const entry of entries) {
      const id = typeof entry === "string" ? entry : entry && entry.id;
      if (!id) continue;
      const from = typeof entry === "object" && entry ? entry.sender || null : null;
      const url = "https://x.com/i/status/" + id;
      pending.push(
        new Promise((resolve) => {
          let settled = false;
          const finish = (status) => {
            if (settled) return;
            settled = true;
            if (status === "duplicate" || status === "skip") duplicateCount += 1;
            resolve(status);
          };
          waiting.set(url, finish);
          // 入队失败或没有回执时也给个兜底，避免一直挂着
          setTimeout(() => finish("timeout"), 8000);
          // scrape: true 让入队端识别出「这是抓取来的」，
          // 已被标记为失败的链接就直接跳过，不再每轮重试
          document.dispatchEvent(new CustomEvent("startDownload", { detail: { url, from, scrape: true } }));
        })
      );
    }
    await Promise.all(pending);
  } finally {
    document.removeEventListener("evd:download-result", onResult);
  }
  return duplicateCount;
}

/* --------------------------------------------------------------- poll */

const defaultApi = {
  getProfile,
  fetchLikes,
  fetchBookmarks,
  fetchSince,
  fetchDmShares: twitterDm.fetchDmShares,
  fetchConversations: twitterDm.fetchConversations,
};

/** 一轮抓取的诊断摘要：只记开关、状态与数量 */
function writePollDebug(info) {
  try {
    require("fs").writeFileSync(
      require("path").join(process.env.TEMP || require("os").tmpdir(), "evd_poll_debug.json"),
      JSON.stringify(info, null, 2)
    );
  } catch (error) {
    /* 诊断写不进去不影响功能 */
  }
}

async function pollOnce(options = {}) {
  const { baselineOnly = false, api = defaultApi } = options;
  const auth = twitterAuth.getAuth();
  if (!auth) {
    writePollDebug({ at: new Date().toISOString(), error: "no-cookie" });
    return { ok: false, error: "no-cookie" };
  }

  const profile = await api.getProfile(auth);
  if (!profile.ok) {
    writePollDebug({ at: new Date().toISOString(), error: "profile", status: profile.status });
    return { ok: false, error: profile.error, status: profile.status };
  }

  const seen = readSeen();
  const isFirstRun = !getBaselineAt();
  const prefs = getPrefs();
  const startedAt = Date.now();

  const collected = [];
  const likes = prefs.likes ? await api.fetchLikes(auth, profile.id, MAX_ITEMS_PER_KIND) : { ok: true, items: [] };
  if (likes.ok) collected.push(...likes.items.slice(0, MAX_ITEMS_PER_KIND));

  const bookmarks = prefs.bookmarks ? await api.fetchBookmarks(auth, MAX_ITEMS_PER_KIND) : { ok: true, items: [] };
  if (bookmarks.ok) collected.push(...bookmarks.items.slice(0, MAX_ITEMS_PER_KIND));

  /* 私信里的推文链接：带发送者资料，队列里显示好友头像与昵称；选了聊天就只抓这些聊天 */
  const dmSince = getDmLastCheckAt() ? getDmLastCheckAt() - 60000 : (getLastCheckAt() ? getLastCheckAt() - 60000 : 0);
  const dm = prefs.dm && !dmTimer
    ? await api.fetchDmShares(auth, {
        conversationIds: prefs.dmChats || [],
        selfId: profile.id,
        passcode: prefs.chatPasscode || "",
        since: dmSince,
      })
    : { ok: true, items: [] };
  writePollDebug({
    at: new Date().toISOString(),
    dmEnabled: !!prefs.dm,
    chatCount: (prefs.dmChats || []).length,
    hasPasscode: !!prefs.chatPasscode,
    dmOk: !!dm.ok,
    dmError: dm.ok ? null : dm.error || null,
    dmItems: (dm.items || []).length,
    likesOk: !!likes.ok,
    bookmarksOk: !!bookmarks.ok,
  });
  if (dm.ok) {
    for (const item of dm.items.slice(0, MAX_ITEMS_PER_KIND)) {
      collected.push({ id: item.id, source: "dm", sender: item.sender, text: item.text });
    }
  }

  // 私信链接不按 seen 跳过：库里的文件被删掉后要能重新下载，真正重复由库索引判断
  const fresh = collected.filter((item) => item.id && (item.source === "dm" || !seen.has(item.id)));
  for (const item of collected) seen.add(item.id);
  writeSeen(seen);
  const finishedAt = Date.now();
  setLastCheckAt(finishedAt);
  if (likes.ok) setKindLastCheckAt("likes", finishedAt);
  if (bookmarks.ok) setKindLastCheckAt("bookmarks", finishedAt);
  if (dm.ok && prefs.dm) setKindLastCheckAt("dm", finishedAt);

  if (isFirstRun || baselineOnly) {
    setBaselineAt(Date.now());
    appendFetchLog({ startedAt, finishedAt, mode: "baseline", likesOk: likes.ok, bookmarksOk: bookmarks.ok, dmOk: dm.ok, newCount: 0 });
    return {
      ok: true,
      baseline: true,
      screenName: profile.screenName,
      newCount: 0,
      likesOk: likes.ok,
      bookmarksOk: bookmarks.ok,
      dmOk: dm.ok,
      dmError: dm.ok ? null : dm.error,
    };
  }

  const toDownload = fresh.slice(0, MAX_DOWNLOAD_PER_CYCLE);
  const duplicateCount = await dispatchDownloads(toDownload);
  appendFetchLog({
    startedAt,
    finishedAt: Date.now(),
    mode: "poll",
    likesOk: likes.ok,
    bookmarksOk: bookmarks.ok,
    dmOk: dm.ok,
    newCount: toDownload.length - duplicateCount,
    duplicateCount,
  });

  return {
    ok: true,
    screenName: profile.screenName,
    newCount: toDownload.length - duplicateCount,
    duplicateCount,
    likesOk: likes.ok,
    bookmarksOk: bookmarks.ok,
    dmOk: dm.ok,
    likesError: likes.ok ? null : likes.error,
    bookmarksError: bookmarks.ok ? null : bookmarks.error,
    dmError: dm.ok ? null : dm.error,
  };
}

/**
 * 补抓：翻页收取「上次检查时间之后」新增的点赞与收藏，全部加入下载队列。
 * 首次运行（没有历史检查时间）只建立基线。
 */
async function catchUp(options = {}) {
  const { maxPages = MAX_CATCHUP_PAGES, maxDownload = MAX_CATCHUP_DOWNLOAD, api = defaultApi, includeDm = false } = options;
  const auth = twitterAuth.getAuth();
  if (!auth) return { ok: false, error: "no-cookie" };

  const lastCheck = getLastCheckAt();
  if (!lastCheck) {
    const baseline = await pollOnce({ baselineOnly: true });
    return { ok: true, baseline: true, newCount: 0, screenName: baseline.screenName };
  }

  const profile = await api.getProfile(auth);
  if (!profile.ok) return { ok: false, error: profile.error };

  const startedAt = Date.now();
  // 每个来源用自己的上次成功时间来算增量窗口，避免别的来源跑得勤把窗口推得太近而漏链接
  const likesSince = (getKindLastCheckAt("likes") || lastCheck) - 60000;
  const bookmarkSince = (getKindLastCheckAt("bookmarks") || lastCheck) - 60000;
  const dmSince = (getKindLastCheckAt("dm") || lastCheck) - 60000;
  const seen = readSeen();
  const prefs = getPrefs();

  const likes = prefs.likes
    ? await api.fetchSince(auth, "likes", profile.id, likesSince, maxPages)
    : { ok: true, items: [] };
  const bookmarks = prefs.bookmarks
    ? await api.fetchSince(auth, "bookmarks", "", bookmarkSince, maxPages)
    : { ok: true, items: [] };

  /* 聊天里的推文链接：抓取测试与定时轮询都走 X Chat 解密；有独立好友定时器时交给它，除非显式要求全量 */
  const dm = prefs.dm && (!dmTimer || includeDm)
    ? await api.fetchDmShares(auth, {
        conversationIds: prefs.dmChats || [],
        selfId: profile.id,
        passcode: prefs.chatPasscode || "",
        since: dmSince,
      })
    : { ok: true, items: [] };
  writePollDebug({
    at: new Date().toISOString(),
    mode: "catchup",
    dmEnabled: !!prefs.dm,
    chatCount: (prefs.dmChats || []).length,
    hasPasscode: !!prefs.chatPasscode,
    dmOk: !!dm.ok,
    dmError: dm.ok ? null : dm.error || null,
    dmItems: (dm.items || []).length,
  });

  const collected = [];
  if (likes.ok) collected.push(...likes.items.slice(0, MAX_ITEMS_PER_KIND).map((item) => ({ id: item.id, source: "like" })));
  if (bookmarks.ok) collected.push(...bookmarks.items.slice(0, MAX_ITEMS_PER_KIND).map((item) => ({ id: item.id, source: "bookmark" })));
  if (dm.ok) collected.push(...dm.items.slice(0, MAX_ITEMS_PER_KIND).map((item) => ({ id: item.id, source: "dm", sender: item.sender, text: item.text })));

  const unique = [];
  const seenIds = new Set();
  for (const item of collected) {
    // 私信链接不按 seen 跳过：库里的文件被删掉后要能重新下载，真正重复由库索引判断
    if (!item.id || seenIds.has(item.id) || (item.source !== "dm" && seen.has(item.id))) continue;
    seenIds.add(item.id);
    unique.push(item);
  }

  for (const item of unique) seen.add(item.id);
  writeSeen(seen);
  const finishedAt = Date.now();
  setLastCheckAt(finishedAt);
  if (likes.ok) setKindLastCheckAt("likes", finishedAt);
  if (bookmarks.ok) setKindLastCheckAt("bookmarks", finishedAt);
  if (dm.ok && prefs.dm) setKindLastCheckAt("dm", finishedAt);

  const toDownload = unique.slice(0, maxDownload);
  const duplicateCount = await dispatchDownloads(toDownload.map((item) => item.id));
  appendFetchLog({
    startedAt,
    finishedAt,
    mode: "catchup",
    likesOk: likes.ok,
    bookmarksOk: bookmarks.ok,
    dmOk: dm.ok,
    newCount: toDownload.length - duplicateCount,
    duplicateCount,
  });

  return {
    ok: true,
    screenName: profile.screenName,
    newCount: toDownload.length - duplicateCount,
    duplicateCount,
    truncated: unique.length > toDownload.length,
    likesOk: likes.ok,
    bookmarksOk: bookmarks.ok,
    dmOk: dm.ok,
    dmError: dm.ok ? null : dm.error,
    likesError: likes.ok ? null : likes.error,
    bookmarksError: bookmarks.ok ? null : bookmarks.error,
  };
}

/* --------------------------------------------------------------- lifecycle */

/** 好友聊天独立一轮：只抓聊天里的推文链接 */
async function fetchDmCycle(options = {}) {
  const { api = defaultApi } = options;
  const auth = twitterAuth.getAuth();
  if (!auth) return { ok: false, error: "no-cookie" };

  const prefs = getPrefs();
  if (!prefs.dm) return { ok: true, skipped: true, newCount: 0 };

  const profile = await api.getProfile(auth);
  if (!profile.ok) return { ok: false, error: profile.error };

  const startedAt = Date.now();
  const lastCheck = getDmLastCheckAt() || getLastCheckAt();
  const since = lastCheck ? lastCheck - 60000 : 0;
  const dm = await api.fetchDmShares(auth, {
    conversationIds: prefs.dmChats || [],
    selfId: profile.id,
    passcode: prefs.chatPasscode || "",
    since,
  });
  writePollDebug({
    at: new Date().toISOString(),
    mode: "dm-cycle",
    dmEnabled: true,
    chatCount: (prefs.dmChats || []).length,
    hasPasscode: !!prefs.chatPasscode,
    dmOk: !!dm.ok,
    dmError: dm.ok ? null : dm.error || null,
    dmItems: (dm.items || []).length,
  });

  // 与点赞/收藏共用 seen：抓过的链接不再每轮重投。
  // 之前这里刻意不看 seen，结果是已删除或已失败的推文每 2 分钟被重新入队一次。
  const seen = readSeen();
  const unique = [];
  const seenIds = new Set();
  if (dm.ok) {
    for (const item of dm.items.slice(0, MAX_ITEMS_PER_KIND)) {
      if (!item.id || seenIds.has(item.id) || seen.has(item.id)) continue;
      seenIds.add(item.id);
      unique.push(item);
    }
  }
  for (const item of unique) seen.add(item.id);
  writeSeen(seen);
  setDmLastCheckAt(Date.now());

  const duplicateCount = await dispatchDownloads(unique.map((item) => item.id));
  appendFetchLog({
    startedAt,
    finishedAt: Date.now(),
    mode: "dm",
    likesOk: true,
    bookmarksOk: true,
    dmOk: dm.ok,
    newCount: unique.length - duplicateCount,
    duplicateCount,
  });
  return {
    ok: true,
    screenName: profile.screenName,
    newCount: unique.length - duplicateCount,
    duplicateCount,
    dmOk: dm.ok,
    dmError: dm.ok ? null : dm.error,
  };
}

async function runDmTick() {
  if (dmRunning) return lastResult;
  dmRunning = true;
  try {
    lastResult = await fetchDmCycle();
  } catch (e) {
    lastResult = { ok: false, error: (e && e.message) || "dm-cycle-failed" };
  } finally {
    dmRunning = false;
    if (dmTimer && dmIntervalMs) dmNextRunAt = Date.now() + dmIntervalMs;
  }
  return lastResult;
}

/** 启动好友聊天独立定时器（最低 2 分钟） */
function startDm(ms) {
  stopDm();
  const interval = Math.max(MIN_DM_INTERVAL_MS, Number(ms) || DEFAULT_DM_INTERVAL_MINUTES * 60000);
  setPrefs({ dmMs: interval });
  dmIntervalMs = interval;
  dmNextRunAt = Date.now() + interval;
  dmTimer = setInterval(runDmTick, interval);
  return interval;
}

function stopDm() {
  if (dmTimer) {
    clearInterval(dmTimer);
    dmTimer = null;
  }
  dmIntervalMs = 0;
  dmNextRunAt = 0;
}

function markNextRun(intervalMs) {
  currentIntervalMs = intervalMs;
  nextRunAt = Date.now() + intervalMs;
}

/** 已完成一次检测后，把「下次检测」重新对齐到一个完整间隔，避免倒计时停在旧值 */
function markRunFinished() {
  if (!timer || !currentIntervalMs) return;
  lastRunAt = Date.now();
  markNextRun(currentIntervalMs);
}

/** 统一调度入口：清理旧定时器，按需立即检测一次，再挂新的轮询 */
function schedule(intervalMs, runNow) {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (runNow) runCycle();
  markNextRun(intervalMs);
  timer = setInterval(runCycle, intervalMs);
}

async function runCycle() {
  if (running) return lastResult;
  running = true;
  try {
    lastResult = await pollOnce();
  } catch (error) {
    lastResult = { ok: false, error: (error && error.message) || "unknown" };
  } finally {
    running = false;
  }
  markRunFinished();
  return lastResult;
}

function start(ms) {
  const interval = Math.max(MIN_INTERVAL_MS, Number(ms) || DEFAULT_INTERVAL_MINUTES * 60000);
  // 同一间隔下刚检测过（例如同时改了抓取项与间隔），不要立刻再补一次，避免重复检测
  const justChecked = isRunning() && currentIntervalMs === interval && Date.now() - lastRunAt < 5000;
  stop();
  setPrefs({ enabled: true, ms: interval });
  schedule(interval, false);
  // 改完间隔后 5 秒再跑一次（刚检测过就跳过）
  if (!justChecked) {
    if (changeTimer) clearTimeout(changeTimer);
    changeTimer = setTimeout(() => {
      changeTimer = null;
      runCycle();
    }, 5000);
  }
  // 好友聊天按自己的间隔单独轮询
  const prefs = getPrefs();
  if (prefs.dm) startDm(prefs.dmMs);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (changeTimer) {
    clearTimeout(changeTimer);
    changeTimer = null;
  }
  stopDm();
  setPrefs({ enabled: false });
  nextRunAt = 0;
  currentIntervalMs = 0;
}

function isRunning() {
  return !!timer;
}

function getStatus() {
  return {
    running: isRunning(),
    prefs: getPrefs(),
    baselineAt: getBaselineAt(),
    lastCheckAt: getLastCheckAt(),
    last: lastResult,
  };
}

async function testConnection() {
  const auth = twitterAuth.getAuth();
  if (!auth) return { ok: false, error: "no-cookie" };
  const profile = await getProfile(auth);
  if (!profile.ok) return profile;
  const likes = await fetchLikes(auth, profile.id, 3);
  const bookmarks = await fetchBookmarks(auth, 3);
  await withAvatarData(profile);
  saveProfile(profile);
  return {
    ok: true,
    screenName: profile.screenName,
    name: profile.name,
    avatar: profile.avatar,
    avatarData: profile.avatarData || "",
    id: profile.id,
    likesOk: likes.ok,
    likesError: likes.ok ? null : likes.error,
    bookmarksOk: bookmarks.ok,
    bookmarksError: bookmarks.ok ? null : bookmarks.error,
  };
}

/** 只刷新账号资料（头像 / 昵称 / 用户名），不触发监控请求 */
async function fetchProfile() {
  const auth = twitterAuth.getAuth();
  if (!auth) return { ok: false, error: "no-cookie" };
  const profile = await getProfile(auth);
  if (profile.ok) {
    await withAvatarData(profile);
    saveProfile(profile);
  }
  return profile;
}

/** 本地缓存的会话列表（上次刷新结果），用于账号页直接渲染 */
function getCachedConversations() {
  const cached = readJson(CONVERSATIONS_KEY, []);
  return Array.isArray(cached) ? cached : [];
}

/** 清除会话缓存与已选聊天（账号登出时调用） */
function clearConversations() {
  writeValue(CONVERSATIONS_KEY, "[]");
  writeValue(DM_CHATS_KEY, "[]");
}

/** 拉取会话列表并缓存；界面「选择聊天」用 */
async function refreshConversations() {  const auth = twitterAuth.getAuth();
  if (!auth) return { ok: false, error: "no-cookie", items: [] };
  let selfId = "";
  try {
    const saved = getSavedProfile();
    selfId = (saved && saved.id) || "";
  } catch (e) {
    selfId = "";
  }
  let result;
  try {
    result = await twitterDm.fetchConversations(auth, selfId);
  } catch (error) {
    return { ok: false, error: (error && error.message) || "error", items: [] };
  }
  if (result.ok) writeValue(CONVERSATIONS_KEY, JSON.stringify(result.items));
  return result;
}

/** 插件启动：补抓上次关闭后新增内容，然后按偏好开始轮询 */
async function init() {
  const prefs = getPrefs();
  if (!prefs.enabled || !twitterAuth.hasAuth()) return { ok: false, skipped: true };

  let result = null;
  try {
    result = await catchUp();
  } catch (error) {
    result = { ok: false, error: (error && error.message) || "unknown" };
  }

  const interval = Math.max(MIN_INTERVAL_MS, prefs.ms || DEFAULT_INTERVAL_MINUTES * 60000);
  // catchUp 已经完成一次完整扫描并把结果入队，这里不再额外跑一遍 runCycle，
  // 否则插件每次启动都会连续检测两次（同一条时间线被扫两遍）；只有补抓失败时才重试一次。
  schedule(interval, !(result && result.ok));
  setPrefs({ enabled: true, ms: interval });
  if (prefs.dm) startDm(prefs.dmMs);
  return result;
}

/** 资源库切换后重新读取凭证与偏好 */
function refreshForLibrary() {
  const prefs = getPrefs();
  if (prefs.enabled && twitterAuth.hasAuth()) {
    const interval = Math.max(MIN_INTERVAL_MS, prefs.ms);
    // 已在运行且间隔没变：保留原定时器，避免每次资源库事件都重置「下次检测」并补一次立即检测
    if (isRunning() && currentIntervalMs === interval) {
      return true;
    }
    schedule(interval, false);
    if (prefs.dm) startDm(prefs.dmMs);
    return true;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  stopDm();
  return false;
}

module.exports = {
  MIN_INTERVAL_MS,
  MIN_DM_INTERVAL_MS,
  findTweetIds,
  extractTimeline,
  describeError,
  init,
  catchUp,
  start,
  stop,
  isRunning,
  getStatus,
  testConnection,
  pollOnce,
  runCycle,
  getPrefs,
  setPrefs,
  fetchProfile,
  getSavedProfile,
  saveProfile,
  getCachedConversations,
  refreshConversations,
  clearConversations,
  markTweetSeen,
  dispatchDownloads,
  fetchDmCycle,
  startDm,
  stopDm,
  getDmLastCheckAt,
  getKindLastCheckAt,
  getFetchLog,
  getLastCheckAt,
  setLastCheckAt,
  setBaselineAt,
  refreshForLibrary,
};
