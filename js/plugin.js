/**
 * Eagle 视频下载插件
 * 主入口 - 处理插件初始化和下载队列管理
 */

const i18next = require("i18next");
const {
  isYtDlpInstalled,
  downloadYtDlp,
  uninstallYtDlp,
  getYtDlpUpdateInfo,
  getInstalledYtDlpVersion,
  getLatestYtDlpVersion,
  getFfmpegSource,
} = require("./binary");
const { isNetworkError } = require("./net-guard");
const { getJson } = require("./x-http");
const downloader = require("./downloader");
const sankakuAuth = require("./sankaku-auth");
const twitterAuth = require("./twitter-auth");
const twitterMonitor = require("./twitter-monitor");
const twitterName = require("./twitter-name");
const libraryIndex = require("./library-index");
const errorLog = require("./error-log");
const ui = require("./ui-replica");

// 资源库索引复用同一套归一化规则（同一条推文 / 同一链接的不同写法算同一个）
libraryIndex.configure({ keyOf: downloadKey });

// 状态管理
let isInitialized = false;

/**
 * 计算导入 Eagle 时使用的标签：
 * 小红书按偏好决定是否写入话题标签，其他站点优先用适配器标签，否则写站点名。
 */
function buildImportTags(metadata) {
  // 站点适配器可以给出更准确的标签（如小红书话题）
  const adapterTags = Array.isArray(metadata.tags)
    ? metadata.tags
      .map((tag) => String(tag || "").trim().replace(/^#+/, ""))
      .filter(Boolean)
    : [];
  const isXiaohongshu = String(metadata.extractor || "").toLowerCase() === "xiaohongshu";
  if (isXiaohongshu) {
    // 偏好设置里关闭后，小红书笔记不写任何标签
    return getXhsTagsPref() ? adapterTags.slice(0, 30) : [];
  }
  const baseTags = adapterTags.length ? adapterTags.slice(0, 30) : [metadata.extractor || "video"];
  const isTwitter = String(metadata.extractor || "").toLowerCase() === "twitter";
  if (!isTwitter) return baseTags;
  // 推特额外追加「标签规则」勾选出来的字段标签，按调整后的顺序排在站点标签之后
  const ruleTags = twitterName.buildTwitterTags(metadata, getTwitterTagsPref());
  const merged = baseTags.slice();
  for (const tag of ruleTags) {
    if (!merged.some((existing) => existing.toLowerCase() === tag.toLowerCase())) merged.push(tag);
  }
  return merged.slice(0, 30);
}

/**
 * 计算导入 Eagle 时使用的素材名：
 * 推特按勾选字段拼名，未勾选任何字段时沿用适配器给出的标题；
 * 同一条推文的多个文件按 (i/N) 追加序号（推特、小红书各有一个开关，可关闭），避免重名。
 */
function buildImportName(metadata, part) {
  const extractor = String((metadata && metadata.extractor) || "").toLowerCase();
  let appendPart = true;
  if (extractor === "twitter") appendPart = getTwitterMultiFilePref();
  else if (extractor === "xiaohongshu") appendPart = getXhsMultiFilePref();
  return twitterName.composeImportName(
    metadata,
    getTwitterNamePrefs(),
    part,
    i18next.t("error.downloadedVideo"),
    appendPart
  );
}

/**
 * 计算导入 Eagle 时使用的注释：
 * 推特按注释规则的勾选字段拼接，未勾选任何字段时沿用推文正文。
 */
function buildImportAnnotation(metadata) {
  const isTwitter = String(metadata.extractor || "").toLowerCase() === "twitter";
  const composed = isTwitter ? twitterName.buildTwitterAnnotation(metadata, getTwitterAnnotationPrefs()) : "";
  if (composed) return composed.slice(0, twitterName.ANNOTATION_MAX_LENGTH);
  return metadata.description ? metadata.description.slice(0, 5000) : "";
}

async function importToEagle(videoPath, metadata, sourceUrl, part) {
  if (typeof eagle === "undefined") {
    throw new Error(i18next.t("error.eagleApiNotAvailable"));
  }
  const tags = buildImportTags(metadata);
  const importOptions = {
    name: buildImportName(metadata, part),
    website: sourceUrl || undefined,
    tags,
    annotation: buildImportAnnotation(metadata),
  };
  try {
    const item = await eagle.item.addFromPath(videoPath, importOptions);
    return item;
  } catch (error) {
    throw new Error(`${i18next.t("error.eagleImportFailed")}: ${error.message}`);
  }
}

// 自动设置 Eagle 数据来源 key
const AUTO_ADD_SOURCE_KEY = "eagle-video-downloader.autoAddSource";
// 清晰度与帧率偏好存储 key
const MAX_RESOLUTION_KEY = "eagle-video-downloader.maxResolution";
const MAX_FRAMERATE_KEY = "eagle-video-downloader.maxFramerate";
const THREAD_COUNT_KEY = "eagle-video-downloader.threadCount";

/**
 * 获取用户是否自动设置 Eagle 数据来源 (默认 true)
 */
function getAutoAddSourcePref() {
  const val = localStorage.getItem(AUTO_ADD_SOURCE_KEY);
  return val === null ? true : val === "true";
}

/**
 * 保存用户是否自动设置 Eagle 数据来源
 */
function setAutoAddSourcePref(value) {
  localStorage.setItem(AUTO_ADD_SOURCE_KEY, String(value));
}

// 小红书下载是否写入话题标签
const XHS_TAGS_KEY = "eagle-video-downloader.xhsTags";

/**
 * 获取是否把小红书话题写入 Eagle 标签（默认开启）
 */
function getXhsTagsPref() {
  const val = localStorage.getItem(XHS_TAGS_KEY);
  return val === null ? true : val === "true";
}

/**
 * 保存是否写入小红书标签
 */
function setXhsTagsPref(value) {
  localStorage.setItem(XHS_TAGS_KEY, String(value));
}

// 小红书同一篇笔记产出多个文件时，是否在名称末尾追加 (i/N) 区分
const XHS_MULTI_FILE_KEY = "eagle-video-downloader.xhsMultiFile";

/**
 * 获取小红书多图是否追加序号（默认开启）
 */
function getXhsMultiFilePref() {
  const val = localStorage.getItem(XHS_MULTI_FILE_KEY);
  return val === null ? true : val === "true";
}

/**
 * 保存小红书多图是否追加序号
 */
function setXhsMultiFilePref(value) {
  localStorage.setItem(XHS_MULTI_FILE_KEY, String(value));
}

// 同一条推文产出多个文件时，是否在名称末尾追加 (i/N) 区分
const TWITTER_MULTI_FILE_KEY = "eagle-video-downloader.twitterMultiFile";

/**
 * 获取推特多文件是否追加序号（默认开启）
 */
function getTwitterMultiFilePref() {
  const val = localStorage.getItem(TWITTER_MULTI_FILE_KEY);
  return val === null ? true : val === "true";
}

/**
 * 保存推特多文件是否追加序号
 */
function setTwitterMultiFilePref(value) {
  localStorage.setItem(TWITTER_MULTI_FILE_KEY, String(value));
}

// 推特素材命名 / 注释的勾选状态与字段顺序（JSON：{ authorId, tweetId, screenName, text, name, order }）
const TWITTER_NAME_KEY = "eagle-video-downloader.twitterName";
const TWITTER_ANNOTATION_KEY = "eagle-video-downloader.twitterAnnotation";
const TWITTER_TAGS_KEY = "eagle-video-downloader.twitterTagRules";

/**
 * 为「五个字段 + 顺序」这类偏好造一组读写函数，命名规则与注释规则各用一个 key
 * @param {string} storageKey
 */
function createFieldPrefsStore(storageKey) {
  function get() {
    const raw = localStorage.getItem(storageKey);
    let saved = null;
    if (raw) {
      try {
        saved = JSON.parse(raw);
      } catch (e) {
        saved = null;
      }
    }
    const prefs = twitterName.getDefaultPrefs();
    if (saved && typeof saved === "object") {
      for (const field of twitterName.FIELD_ORDER) {
        if (typeof saved[field] === "boolean") prefs[field] = saved[field];
      }
      if (Array.isArray(saved.order)) prefs.order = twitterName.normalizeOrder(saved.order);
      if (Array.isArray(saved.join)) prefs.join = twitterName.normalizeJoin(saved.join);
    }
    return prefs;
  }

  function save(prefs) {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  }

  function setField(field, value) {
    if (!twitterName.FIELD_ORDER.includes(field)) return;
    const prefs = get();
    prefs[field] = value === true;
    save(prefs);
  }

  function setOrder(order) {
    const prefs = get();
    prefs.order = twitterName.normalizeOrder(order);
    save(prefs);
    return prefs.order;
  }

  /**
   * 标记某个字段是否和它上面那条已勾选字段合并成一条标签
   * @param {string} field
   * @param {boolean} joined
   * @returns {string[]} 校正后的 join 列表
   */
  function setJoin(field, joined) {
    if (!twitterName.FIELD_ORDER.includes(field)) return get().join;
    const prefs = get();
    const list = Array.isArray(prefs.join) ? prefs.join.slice() : [];
    const index = list.indexOf(field);
    if (joined === true && index < 0) list.push(field);
    if (joined !== true && index >= 0) list.splice(index, 1);
    prefs.join = twitterName.normalizeJoin(list);
    save(prefs);
    return prefs.join;
  }

  function move(field, direction) {
    const prefs = get();
    const moved = twitterName.moveInOrder(prefs.order, field, direction);
    if (!moved) return null;
    return setOrder(moved);
  }

  return { get, setField, setOrder, setJoin, move };
}

const twitterNamePrefsStore = createFieldPrefsStore(TWITTER_NAME_KEY);
const twitterAnnotationPrefsStore = createFieldPrefsStore(TWITTER_ANNOTATION_KEY);
const twitterTagsPrefsStore = createFieldPrefsStore(TWITTER_TAGS_KEY);

/**
 * 获取推特素材命名的勾选状态与字段顺序，缺失的字段回落到默认值
 * @returns {{authorId: boolean, tweetId: boolean, screenName: boolean, text: boolean, name: boolean, order: string[]}}
 */
function getTwitterNamePrefs() {
  return twitterNamePrefsStore.get();
}

/**
 * 保存单个推特命名字段的勾选状态
 * @param {string} field
 * @param {boolean} value
 */
function setTwitterNamePref(field, value) {
  twitterNamePrefsStore.setField(field, value);
}

/**
 * 保存命名用的字段拼接顺序，返回校正后的顺序
 * @param {string[]} order
 * @returns {string[]}
 */
function setTwitterNameOrder(order) {
  return twitterNamePrefsStore.setOrder(order);
}

/**
 * 把命名字段上移或下移一格，返回新顺序（越界时返回 null）
 * @param {string} field
 * @param {"up"|"down"} direction
 * @returns {string[]|null}
 */
function moveTwitterNameField(field, direction) {
  return twitterNamePrefsStore.move(field, direction);
}

/**
 * 获取推特素材注释的勾选状态与字段顺序
 * @returns {{authorId: boolean, tweetId: boolean, screenName: boolean, text: boolean, name: boolean, order: string[]}}
 */
function getTwitterAnnotationPrefs() {
  return twitterAnnotationPrefsStore.get();
}

/**
 * 保存单个推特注释字段的勾选状态
 * @param {string} field
 * @param {boolean} value
 */
function setTwitterAnnotationPref(field, value) {
  twitterAnnotationPrefsStore.setField(field, value);
}

/**
 * 保存注释用的字段拼接顺序，返回校正后的顺序
 * @param {string[]} order
 * @returns {string[]}
 */
function setTwitterAnnotationOrder(order) {
  return twitterAnnotationPrefsStore.setOrder(order);
}

/**
 * 把注释字段上移或下移一格，返回新顺序（越界时返回 null）
 * @param {string} field
 * @param {"up"|"down"} direction
 * @returns {string[]|null}
 */
function moveTwitterAnnotationField(field, direction) {
  return twitterAnnotationPrefsStore.move(field, direction);
}

/**
 * 获取推特素材标签规则的勾选状态与字段顺序
 * @returns {{authorId: boolean, tweetId: boolean, screenName: boolean, text: boolean, name: boolean, order: string[]}}
 */
function getTwitterTagsPref() {
  return twitterTagsPrefsStore.get();
}

/**
 * 保存单个推特标签字段的勾选状态
 * @param {string} field
 * @param {boolean} value
 */
function setTwitterTagsPref(field, value) {
  twitterTagsPrefsStore.setField(field, value);
}

/**
 * 保存标签用的字段顺序，返回校正后的顺序
 * @param {string[]} order
 * @returns {string[]}
 */
function setTwitterTagsOrder(order) {
  return twitterTagsPrefsStore.setOrder(order);
}

/**
 * 保存标签字段是否与上一条已勾选字段合并成一条标签，返回新顺序下的合并标记
 * @param {string} field
 * @param {boolean} joined
 * @returns {string[]}
 */
function setTwitterTagsJoin(field, joined) {
  return twitterTagsPrefsStore.setJoin(field, joined);
}

/**
 * 把标签字段上移或下移一格，返回新顺序（越界时返回 null）
 * @param {string} field
 * @param {"up"|"down"} direction
 * @returns {string[]|null}
 */
function moveTwitterTagsField(field, direction) {
  return twitterTagsPrefsStore.move(field, direction);
}

/**
 * 获取清晰度上限偏好 (默认 'auto')
 */
function getMaxResolutionPref() {
  return localStorage.getItem(MAX_RESOLUTION_KEY) || "auto";
}

/**
 * 保存清晰度上限偏好
 */
function setMaxResolutionPref(value) {
  const val = value || "auto";
  localStorage.setItem(MAX_RESOLUTION_KEY, val);
  downloader.setQualityPrefs({
    resolution: val,
    framerate: getMaxFrameratePref(),
  });
}

/**
 * 获取帧率上限偏好 (默认 'auto')
 */
function getMaxFrameratePref() {
  return localStorage.getItem(MAX_FRAMERATE_KEY) || "auto";
}

/**
 * 保存帧率上限偏好
 */
function setMaxFrameratePref(value) {
  const val = value || "auto";
  localStorage.setItem(MAX_FRAMERATE_KEY, val);
  downloader.setQualityPrefs({
    resolution: getMaxResolutionPref(),
    framerate: val,
  });
}

/**
 * 获取下载线程数偏好（"auto" 表示交给 yt-dlp 默认）
 */
function getThreadCountPref() {
  return localStorage.getItem(THREAD_COUNT_KEY) || "auto";
}

/**
 * 保存下载线程数偏好
 */
function setThreadCountPref(value) {
  const val = value || "auto";
  localStorage.setItem(THREAD_COUNT_KEY, val);
  downloader.setThreadCount(val);
}

// 下载队列
const downloadQueue = [];
const MAX_CONCURRENT = 3;
let activeCount = 0;
let queueIdCounter = 0;
let queuePaused = false;

/**
 * 初始化 i18next
 */
async function initI18n() {
  const enTranslation = require("../Plugin/_locales/en.json");
  const zhCNTranslation = require("../Plugin/_locales/zh_CN.json");

  await i18next.init({
    lng: eagle.app.locale || "en",
    fallbackLng: "en",
    resources: {
      en: { translation: enTranslation },
      zh_CN: { translation: zhCNTranslation },
    },
  });
  
  // 将 i18next 设置为全局变量，供其他模块使用
  global.i18next = i18next;
}

/**
 * 应用翻译到 UI 元素
 */
function applyTranslations() {
  // 界面文案以中文固定写在 index.html 内，不再按 Eagle 语言回写
  const input = document.getElementById("urlInput");
  if (input) input.placeholder = "粘贴视频链接…";
}
/**
 * 插件生命周期：创建时初始化引擎与界面
 */
eagle.onPluginCreate(async (plugin) => {
  await initI18n();
  applyTranslations();
  ui.updateTheme();
  try {
    setupEventListeners();
  } catch (e) {
    console.error("setupEventListeners failed:", e);
  }
  startLibraryWatcher();

  try {
    ui.renderTwitterProfile();
    twitterMonitor.fetchProfile().then((profile) => {
      if (profile && profile.ok) ui.renderTwitterProfile(profile);
    }).catch(() => {});
  } catch (e) {}

  twitterMonitor.init().then((result) => {
    const status = document.getElementById("twitterAuthStatus");
    if (!status || !result || result.skipped) return;
    if (result.ok === false) {
      status.textContent = "验证失败：" + (result.error || "error");
      return;
    }
    if (result.baseline) {
      status.textContent = "Cookie 有效，已建立抓取基线";
      return;
    }
    status.textContent = describeCatchupResult(result);
  }).catch((e) => {
    console.warn("[twitter-monitor] init failed:", e && e.message);
  });

  // 打开插件 10 秒内先跑一次全量抓取（点赞 / 收藏 / 好友链接），之后按下拉框间隔轮询
  setTimeout(() => {
    try {
      const prefs = twitterMonitor.getPrefs();
      if (!prefs || !(prefs.likes || prefs.bookmarks || prefs.dm)) return;
      libraryIndex
        .build({ force: true })
        .catch(() => {})
        .then(() => twitterMonitor.catchUp({ includeDm: true }))
        .catch((e) => {
          console.warn("[twitter-monitor] auto catchup failed:", e && e.message);
        });
    } catch (e) {}
  }, 10000);

  setupWindowState();
  startIngestBridge();
  downloader.setQualityPrefs({
    resolution: getMaxResolutionPref(),
    framerate: getMaxFrameratePref(),
  });
  downloader.setThreadCount(getThreadCountPref());
  try {
    await initializeBinaries();
  } catch (e) {
    console.error("initializeBinaries failed:", e);
  }
});

/**
 * 跟随 Eagle 主题变化
 */
eagle.onThemeChanged(() => {
  ui.updateTheme();
});

/** 当前资源库路径，用于切换时刷新账号与监控 */
let lastLibraryPath = null;
function startLibraryWatcher() {
  try {
    lastLibraryPath = (eagle.library && eagle.library.path) || "";
  } catch (e) {
    lastLibraryPath = "";
  }

  setInterval(() => {
    let current = "";
    try {
      current = (eagle.library && eagle.library.path) || "";
    } catch (e) {
      current = "";
    }
    if (current === lastLibraryPath) return;
    lastLibraryPath = current;
    try {
      ui.refreshAccountFields();
    } catch (e) {}
    try {
      twitterMonitor.refreshForLibrary();
    } catch (e) {}
  }, 3000);
}

function setupEventListeners() {
  const closeBtn = document.getElementById("closeButton");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      saveWindowSize();
      window.close();
    });
  }

  setupPinButton();

  const getUi = () => (typeof window !== "undefined" ? window.EVDUI : null);

  /* 面板切换：下载页即主界面，其余面板进入偏好页 */
  document.addEventListener("evd:panel", (e) => {
    const view = e.detail && e.detail.view;
    if (!view) return;
    if (view === "download") {
      ui.hideDepsPage();
    } else {
      openDepsPage(view);
    }
  });

  /* 输入栏 */
  const urlInput = document.getElementById("urlInput");
  const downloadBtn = document.getElementById("downloadBtn");
  const pasteBtn = document.getElementById("pasteBtn");

  const submitUrl = (raw) => {
    const value = String(raw || "").trim();
    if (!value) return;
    if (!isInitialized) {
      ui.setInputBarState("error", "请先在依赖页安装 yt-dlp 后再下载");
      openDepsPage("dependencies");
      return;
    }
    document.dispatchEvent(new CustomEvent("startDownload", { detail: { url: value } }));
    if (urlInput) {
      urlInput.value = "";
      urlInput.focus();
    }
  };

  if (downloadBtn && urlInput) {
    downloadBtn.addEventListener("click", () => submitUrl(urlInput.value));
  }
  if (urlInput) {
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitUrl(urlInput.value);
      }
    });
  }
  if (pasteBtn && urlInput) {
    pasteBtn.addEventListener("click", () => {
      let text = "";
      try {
        text = eagle.clipboard.readText() || "";
      } catch (e) {
        text = "";
      }
      if (!text) {
        ui.setInputBarState("error", "剪贴板里没有可用的链接");
        return;
      }
      urlInput.value = text.trim();
      urlInput.focus();
      submitUrl(text);
    });
  }

  document.addEventListener("startDownload", async (e) => {
    const url = e.detail && e.detail.url;
    if (!ui.isValidUrl(url)) {
      ui.setInputBarState("error", "链接无效，需要 https 视频地址");
      return;
    }
    const status = await addToQueue(url, e.detail && e.detail.from);
    // 把入队结果回给抓取层，用于统计「检测到重复」
    try {
      document.dispatchEvent(new CustomEvent("evd:download-result", { detail: { url, status } }));
    } catch (err) {
      // ignore
    }
  });

  /* 下载队列操作按钮：重试 / 复制 / 删除 */
  document.addEventListener("evd:queue-action", (e) => {
    const detail = e.detail || {};
    if (typeof detail.id !== "number") return;
    if (detail.action === "retry") retryDownload(detail.id);
    if (detail.action === "copy") copyUrl(detail.id);
    if (detail.action === "copyError") copyError(detail.id);
    if (detail.action === "remove") deleteDownloadItem(detail.id);
  });

  /* 全部开始 / 全部暂停 */
  document.addEventListener("evd:queue-bulk", (e) => {
    const action = e.detail && e.detail.action;
    if (action === "start") resumeAllDownloads();
    if (action === "pause") pauseAllDownloads();
  });

  /* 主题 */
  document.addEventListener("evd:theme-pick", (e) => {
    const theme = e.detail && e.detail.theme;
    if (theme) ui.setManualTheme(theme);
  });
  const followToggle = document.getElementById("followThemeToggle");
  if (followToggle) {
    followToggle.addEventListener("change", (e) => {
      ui.setFollowEagleTheme(!!e.target.checked);
    });
  }

  /* 通用页：自动数据来源、清晰度、帧率、线程 */
  const autoAddToggle = document.getElementById("autoAddSourceToggle");
  if (autoAddToggle) {
    autoAddToggle.checked = getAutoAddSourcePref();
    autoAddToggle.addEventListener("change", (e) => {
      setAutoAddSourcePref(!!e.target.checked);
    });
  }

  const maxResolution = document.getElementById("maxResolution");
  if (maxResolution) {
    maxResolution.value = getMaxResolutionPref();
    maxResolution.addEventListener("change", (e) => {
      setMaxResolutionPref(e.target.value);
      downloader.setQualityPrefs({
        resolution: getMaxResolutionPref(),
        framerate: getMaxFrameratePref(),
      });
    });
  }

  const maxFramerate = document.getElementById("maxFramerate");
  if (maxFramerate) {
    maxFramerate.value = getMaxFrameratePref();
    maxFramerate.addEventListener("change", (e) => {
      setMaxFrameratePref(e.target.value);
      downloader.setQualityPrefs({
        resolution: getMaxResolutionPref(),
        framerate: getMaxFrameratePref(),
      });
    });
  }

  const threadCount = document.getElementById("threadCount");
  if (threadCount) {
    threadCount.value = getThreadCountPref();
    threadCount.addEventListener("change", (e) => {
      setThreadCountPref(e.target.value);
      downloader.setThreadCount(getThreadCountPref());
    });
  }

  /* 导入信息页：三个文件开关 */
  const xhsTagsToggle = document.getElementById("xhsTagsToggle");
  if (xhsTagsToggle) {
    xhsTagsToggle.checked = getXhsTagsPref();
    xhsTagsToggle.addEventListener("change", (e) => setXhsTagsPref(!!e.target.checked));
  }
  const xhsMultiFileToggle = document.getElementById("xhsMultiFileToggle");
  if (xhsMultiFileToggle) {
    xhsMultiFileToggle.checked = getXhsMultiFilePref();
    xhsMultiFileToggle.addEventListener("change", (e) => setXhsMultiFilePref(!!e.target.checked));
  }
  const twMultiFileToggle = document.getElementById("twMultiFileToggle");
  if (twMultiFileToggle) {
    twMultiFileToggle.checked = getTwitterMultiFilePref();
    twMultiFileToggle.addEventListener("change", (e) => setTwitterMultiFilePref(!!e.target.checked));
  }

  /* 推特三列：勾选与顺序都写入偏好 */
  const TAG_FIELDS = ["authorId", "tweetId", "screenName", "text", "name"];
  const COLUMN_OF_FIELD = {
    name: getTwitterNamePrefs(),
    annotation: getTwitterAnnotationPrefs(),
    tags: getTwitterTagsPref(),
  };
  const FIELD_OWNER = {};
  ["name", "annotation", "tags"].forEach((column) => {
    TAG_FIELDS.forEach((field) => { FIELD_OWNER[field + ":" + column] = true; });
  });

  document.addEventListener("evd:tag-check", (e) => {
    const field = e.detail && e.detail.field;
    if (!field || !e.detail.panel) return;
    const panel = e.detail.panel;
    const checked = !!e.detail.checked;
    if (panel === "name") setTwitterNamePref(field, checked);
    if (panel === "annotation") setTwitterAnnotationPref(field, checked);
    if (panel === "tags") setTwitterTagsPref(field, checked);
  });

  const persistTagLayout = (reason) => {
    const shellState = getUi() ? getUi().tagState() : null;
    if (!shellState) return;

    if (reason === "reset") {
      setTwitterNameOrder(twitterName.DEFAULT_ORDER);
      setTwitterAnnotationOrder(twitterName.DEFAULT_ORDER);
      setTwitterTagsOrder(twitterName.DEFAULT_ORDER);
      TAG_FIELDS.forEach((field) => setTwitterTagsJoin(field, false));
    } else {
      setTwitterNameOrder(shellState.name.order);
      setTwitterAnnotationOrder(shellState.annotation.order);
      setTwitterTagsOrder(shellState.tags.order);
      TAG_FIELDS.forEach((field) => setTwitterTagsJoin(field, shellState.join.indexOf(field) >= 0));
    }

    ui.applyTwitterNameOrder(getTwitterNamePrefs().order);
    ui.applyTwitterAnnotationOrder(getTwitterAnnotationPrefs().order);
    ui.applyTwitterTagsOrder(getTwitterTagsPref().order, getTwitterTagsPref().join);
  };

  document.addEventListener("evd:tag-change", (e) => {
    persistTagLayout((e.detail && e.detail.reason) || "order");
  });

  const resetOrder = document.getElementById("resetOrder");
  if (resetOrder) {
    resetOrder.addEventListener("click", () => {
      const shellUi = getUi();
      if (shellUi) shellUi.resetLayout();
    });
  }

  /* 依赖页 */
  const ytdlpCheck = document.getElementById("ytdlpCheck");
  if (ytdlpCheck) ytdlpCheck.addEventListener("click", () => loadYtdlpUpdateStatus());

  const ytdlpUninstall = document.getElementById("ytdlpUninstall");
  if (ytdlpUninstall) ytdlpUninstall.addEventListener("click", () => handleYtdlpAction("uninstall"));

  const ytdlpReinstall = document.getElementById("ytdlpReinstall");
  if (ytdlpReinstall) {
    ytdlpReinstall.addEventListener("click", () => handleYtdlpAction("reinstall"));
  }

  const ffmpegCheck = document.getElementById("ffmpegCheck");
  if (ffmpegCheck) ffmpegCheck.addEventListener("click", () => loadDepsInfo());

  const ffmpegReinstall = document.getElementById("ffmpegReinstall");
  if (ffmpegReinstall) ffmpegReinstall.addEventListener("click", () => openEagleFfmpegStore());

  /* 账号页：Sankaku */
  const sankakuInput = document.getElementById("sankakuToken");
  const sankakuSave = document.getElementById("sankakuSave");
  const sankakuClear = document.getElementById("sankakuClear");
  const sankakuStatus = document.getElementById("sankakuAuthStatus");

  if (sankakuSave && sankakuInput) {
    sankakuSave.addEventListener("click", () => {
      const token = sankakuAuth.parseAccessToken(sankakuInput.value);
      if (!token) {
        if (sankakuStatus) sankakuStatus.textContent = "access_token 无效";
        return;
      }
      sankakuAuth.setStoredAuth(sankakuInput.value);
      if (sankakuStatus) sankakuStatus.textContent = "已保存";
    });
  }

  if (sankakuClear && sankakuInput) {
    sankakuClear.addEventListener("click", () => {
      sankakuAuth.setStoredAuth("");
      sankakuInput.value = "";
      if (sankakuStatus) sankakuStatus.textContent = "已清除";
    });
  }

  /* 账号页：Twitter / X */
  const twToken = document.getElementById("authToken");
  const twCt0 = document.getElementById("ct0");
  const twPasscode = document.getElementById("chatPasscode");
  const twStatus = document.getElementById("twitterAuthStatus");
  const twSave = document.getElementById("twitterSave");
  const twClear = document.getElementById("twitterClear");
  const twIntervals = document.getElementById("monitorInterval");
  const setTwStatus = (text) => {
    if (twStatus) twStatus.textContent = text;
  };

  const twLastRun = document.getElementById("monitorLastRun");
  const fmtClock = (ms) => {
    if (!ms) return "—";
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  };
  // 每次抓取成功都会落在记录里，这里显示最近一次各来源的时间，用来判断链接是不是新一轮的
  const updateLastRunLine = () => {
    if (!twLastRun) return;
    const log = twitterMonitor.getFetchLog ? twitterMonitor.getFetchLog() : [];
    const timestamps = [
      twitterMonitor.getKindLastCheckAt("likes"),
      twitterMonitor.getKindLastCheckAt("bookmarks"),
      twitterMonitor.getKindLastCheckAt("dm"),
    ].filter(Boolean);
    const latest = timestamps.length ? Math.max(...timestamps) : 0;
    const parts = [];
    const likeAt = twitterMonitor.getKindLastCheckAt("likes");
    const bookmarkAt = twitterMonitor.getKindLastCheckAt("bookmarks");
    const dmAt = twitterMonitor.getKindLastCheckAt("dm");
    if (likeAt) parts.push("点赞 " + fmtClock(likeAt));
    if (bookmarkAt) parts.push("收藏 " + fmtClock(bookmarkAt));
    if (dmAt) parts.push("好友 " + fmtClock(dmAt));
    twLastRun.textContent = latest
      ? "最近抓取：" + parts.join(" / ") + (log[0] ? "（新增 " + log[0].newCount + "）" : "")
      : "最近抓取：—";
  };
  if (twLastRun) {
    updateLastRunLine();
    setInterval(updateLastRunLine, 10000);
  }

  const describeInterval = (ms) => {
    if (ms % 3600000 === 0) return ms / 3600000 + " 小时";
    if (ms < 60000) return Math.round(ms / 1000) + " 秒";
    return ms / 60000 + " 分钟";
  };

  const applyInterval = () => {
    const minutes = twIntervals ? Number(twIntervals.value) || 0 : 0;
    ui.setIntervalChoice(minutes);
    if (!minutes) {
      twitterMonitor.stop();
      setTwStatus("自动抓取已关闭");
      return false;
    }
    if (!twitterAuth.hasAuth()) {
      setTwStatus("Cookie 无效，无法启动自动抓取");
      return false;
    }
    const intervalMs = Math.max(twitterMonitor.MIN_INTERVAL_MS, minutes * 60000);
    twitterMonitor.start(intervalMs);
    setTwStatus("自动抓取运行中，每 " + describeInterval(intervalMs) + " 一次");
    updateLastRunLine();
    return true;
  };

  if (twSave && twToken && twCt0) {
    twSave.addEventListener("click", async () => {
      const cookie = twitterAuth.buildCookie(twToken.value, twCt0.value);
      if (!cookie) {
        setTwStatus("auth_token 或 ct0 无效");
        return;
      }
      twitterAuth.setStoredCookie(cookie);
      twitterMonitor.setPrefs({ chatPasscode: twPasscode ? String(twPasscode.value || "").trim() : "" });
      setTwStatus("正在保存…");

      const profile = await twitterMonitor.fetchProfile();
      if (profile && profile.ok) {
        setTwStatus("已保存，@" + (profile.screenName || "?"));
        ui.renderTwitterProfile(profile);
      } else {
        setTwStatus("已保存，账号资料暂未获取");
        ui.renderTwitterProfile();
      }
      if (ui.refreshChatList) ui.refreshChatList();
      applyInterval();
    });
  }

  if (twClear && twToken && twCt0) {
    twClear.addEventListener("click", () => {
      twitterAuth.setStoredCookie("");
      twToken.value = "";
      twCt0.value = "";
      twitterMonitor.setPrefs({ chatPasscode: "" });
      if (twPasscode) twPasscode.value = "";
      twitterMonitor.saveProfile({});
      twitterMonitor.clearConversations();
      ui.renderTwitterProfile(null);
      if (ui.renderChatList) ui.renderChatList();
      setTwStatus("已清除 Cookie");
      twitterMonitor.stop();
      if (twIntervals) twIntervals.value = "0";
    });
  }

  if (twIntervals) twIntervals.addEventListener("change", applyInterval);

  // 好友聊天独立间隔（2~10 分钟，步进 2 分钟）
  const dmIntervals = document.getElementById("dmMonitorInterval");
  if (dmIntervals) {
    const savedDmMs = twitterMonitor.getPrefs().dmMs;
    if (savedDmMs) dmIntervals.value = String(Math.round(savedDmMs / 60000));
    dmIntervals.addEventListener("change", () => {
      const minutes = Number(dmIntervals.value) || 2;
      twitterMonitor.setPrefs({ dmMs: minutes * 60000 });
      if (twitterMonitor.isRunning()) twitterMonitor.startDm(minutes * 60000);
      setTwStatus("好友抓取运行中，每 " + minutes + " 分钟一次");
    });
  }

  const twLikes = document.getElementById("twitterMonitorLikes");
  const twBookmarks = document.getElementById("twitterMonitorBookmarks");
  const twDm = document.getElementById("twitterMonitorDm");
  const onSourceChange = () => {
    twitterMonitor.setPrefs({
      likes: !!(twLikes && twLikes.checked),
      bookmarks: !!(twBookmarks && twBookmarks.checked),
      dm: !!(twDm && twDm.checked),
    });
    const anySource = (twLikes && twLikes.checked) || (twBookmarks && twBookmarks.checked) || (twDm && twDm.checked);
    if (!anySource) {
      twitterMonitor.stop();
      setTwStatus("未选择抓取内容，自动抓取已停止");
      return;
    }
    if (!(twDm && twDm.checked)) twitterMonitor.stopDm();
    else if (twitterMonitor.isRunning()) twitterMonitor.startDm(twitterMonitor.getPrefs().dmMs);
    applyInterval();
  };
  const savedSourcePrefs = twitterMonitor.getPrefs();
  if (twLikes) twLikes.checked = savedSourcePrefs.likes !== false;
  if (twBookmarks) twBookmarks.checked = savedSourcePrefs.bookmarks !== false;
  if (twDm) twDm.checked = savedSourcePrefs.dm !== false;
  if (twLikes) twLikes.addEventListener("change", onSourceChange);
  if (twBookmarks) twBookmarks.addEventListener("change", onSourceChange);
  if (twDm) twDm.addEventListener("change", onSourceChange);

  // 两个分组折叠面板：点击标题展开/收起，切到其他页面时自动收起
  const groupHeads = document.querySelectorAll(".account-group-head");
  const setGroupOpen = (head, open) => {
    head.classList.toggle("open", open);
    head.setAttribute("aria-expanded", open ? "true" : "false");
    const body = document.getElementById(head.dataset.target);
    if (body) body.hidden = !open;
  };
  const closeGroups = () => {
    Array.prototype.forEach.call(groupHeads, (head) => setGroupOpen(head, false));
  };
  Array.prototype.forEach.call(groupHeads, (head) => {
    setGroupOpen(head, false);
    head.addEventListener("click", () => setGroupOpen(head, !head.classList.contains("open")));
    head.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setGroupOpen(head, !head.classList.contains("open"));
    });
  });
  document.addEventListener("evd:panel", (event) => {
    if (!event.detail || event.detail.view !== "account") closeGroups();
  });

  const twTest = document.getElementById("monitorTest");
  if (twTest) {
    twTest.addEventListener("click", async () => {
      if (!twitterAuth.hasAuth()) {
        setTwStatus("Cookie 无效");
        return;
      }
      twTest.disabled = true;
      setTwStatus("正在抓取…");
      let result = null;
      try {
        // 抓取前先重扫资源库：库内文件被删掉后不能被旧索引挡成「重复」
        await libraryIndex.build({ force: true });
        result = await twitterMonitor.catchUp({ includeDm: true });
      } catch (e) {
        result = { ok: false, error: (e && e.message) || "error" };
      }
      twTest.disabled = false;
      if (!result || result.ok === false) {
        setTwStatus("抓取失败：" + ((result && result.error) || "error"));
        return;
      }
      setTwStatus(describeCatchupResult(result));
      updateLastRunLine();
    });
  }
}

/**
 * 打开 Eagle 官方 FFmpeg 依赖安装弹窗或应用商店页面
 */
async function openEagleFfmpegStore() {
  if (typeof eagle !== "undefined" && eagle.extraModule && eagle.extraModule.ffmpeg && typeof eagle.extraModule.ffmpeg.install === "function") {
    try {
      await eagle.extraModule.ffmpeg.install();
      return;
    } catch (e) {}
  }
  const isZh = eagle.app.locale && eagle.app.locale.startsWith("zh");
  const url = isZh
    ? "https://community-cn.eagle.cool/plugin/detail/eagle-plugin-ffmpeg"
    : "https://community.eagle.cool/plugin/detail/eagle-plugin-ffmpeg";
  try {
    const { shell } = require("electron");
    shell.openExternal(url);
  } catch (e) {
    window.open(url, "_blank");
  }
}

/**
 * 初始化二进制文件
 * yt-dlp 和 ffmpeg 均为必需依赖，缺失时进入依赖管理页（门槛模式）
 */
async function initializeBinaries() {
  if (depsReady()) {
    isInitialized = true;
    initializeMainUI();
    loadDepsInfo();
    // 后台检查 yt-dlp 是否有新版本，有则提示用户（齿轮红点）
    checkForUpdateAndNotify();
    return;
  }

  // 缺少必要依赖：进入依赖管理页门槛模式，装齐后自动进入主界面
  ui.showDepsPage({
    tab: "dependencies",
    gating: true,
    autoAddSourcePref: getAutoAddSourcePref(),
    xhsTagsPref: getXhsTagsPref(),
    xhsMultiFilePref: getXhsMultiFilePref(),
    twitterMultiFilePref: getTwitterMultiFilePref(),
    twitterNamePref: getTwitterNamePrefs(),
    twitterAnnotationPref: getTwitterAnnotationPrefs(),
    twitterTagsPref: getTwitterTagsPref(),
    maxResolutionPref: getMaxResolutionPref(),
    maxFrameratePref: getMaxFrameratePref(),
    threadCountPref: getThreadCountPref(),
  });
  ui.updateDepsBadge(true);
  loadDepsInfo();
}

/**
 * 是否已具备使用插件所需的全部依赖（yt-dlp + ffmpeg）
 */
function depsReady() {
  return isYtDlpInstalled() && !!getFfmpegSource();
}

/**
 * 依赖状态变化后调用：
 * - 已就绪且尚未初始化 → 退出门槛模式，进入主界面
 * - 未就绪 → 锁定依赖页（门槛模式）
 */
function refreshDepsGatingState() {
  if (depsReady()) {
    if (!isInitialized) {
      isInitialized = true;
      ui.hideDepsPage();
      initializeMainUI();
      checkForUpdateAndNotify();
    } else {
      getYtDlpUpdateInfo().then(({ hasUpdate }) => {
        ui.updateDepsBadge(hasUpdate);
      }).catch(() => {
        ui.updateDepsBadge(false);
      });
    }
  } else {
    isInitialized = false;
    ui.setDepsGating(true);
    ui.updateDepsBadge(true);
  }
}

/**
 * 初始化主 UI
 */
function initializeMainUI() {
  ui.showMainUI();
  ui.setupInputBar();
  restoreErrorLog();
  const urlInput = document.getElementById("urlInput");
  if (urlInput) urlInput.focus();
  // 后台建立本库链接索引（分片异步），用于「库里是否已有同链接文件」的重复判断
  try {
    libraryIndex.build().catch(() => {});
    // 定时重扫：用户在资源库里删掉文件后，不能再被旧索引当成重复
    setInterval(() => {
      libraryIndex.build({ force: true }).catch(() => {});
    }, 60000);
  } catch (e) {
    // ignore
  }
}

/**
 * 启动时把上次的下载失败记录恢复进队列（只恢复失败项，重开窗口不丢）
 */
function restoreErrorLog() {
  const entries = errorLog.list();
  for (const entry of entries) {
    if (!entry || !entry.url) continue;
    if (downloadQueue.some((item) => item.url === entry.url)) continue;
    const item = {
      id: ++queueIdCounter,
      url: entry.url,
      title: entry.title || entry.url,
      state: "error",
      progress: 0,
      speed: "",
      eta: "",
      phase: null,
      processingPercent: undefined,
      error: entry.error || "",
      from: entry.from || null,
    };
    downloadQueue.push(item);
    ui.appendQueueItem(item);
  }
}

/**
 * 添加下载任务到队列
 */
const RECENT_DOWNLOAD_KEY = "evd.recentDownloads";
const RECENT_DOWNLOAD_TTL = 24 * 60 * 60 * 1000;
const RECENT_DOWNLOAD_LIMIT = 500;

/** 抓取结果文案：本次新增 X 条 · 检测到重复 Y 条 */
function describeCatchupResult(result) {
  const parts = ["本次新增 " + (result.newCount || 0) + " 条"];
  if (result.duplicateCount) parts.push("检测到重复 " + result.duplicateCount + " 条");
  if (result.truncated) parts.push("（已截断至上限）");
  return parts.join(" · ");
}

/** 归一化下载对象：同一条推文 / 同一个 Sankaku 投稿视为同一个任务 */
function downloadKey(url) {
  const text = String(url || "");
  const tweet = text.match(/\/status\/(\d+)/);
  if (tweet) return "tw:" + tweet[1];
  const sankaku = text.match(/\/(?:posts?|post\/show)\/([A-Za-z0-9]+)/i);
  if (sankaku) return "sk:" + sankaku[1];
  const xiaohongshu = text.match(/xiaohongshu\.com\/(?:explore|discovery\/item|note)\/([0-9a-f]{24})/i);
  if (xiaohongshu) return "xhs:" + xiaohongshu[1].toLowerCase();
  // 普通链接：统一主机名大小写、去掉末尾斜杠与 #锚点，避免同链接写法不同判成两条
  try {
    const parsed = new URL(text.trim());
    return "url:" + parsed.hostname.toLowerCase().replace(/^www\./, "") + parsed.pathname.replace(/\/+$/, "") + parsed.search;
  } catch (e) {
    return "url:" + text.split("#")[0].replace(/\/+$/, "");
  }
}

function loadRecentDownloads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_DOWNLOAD_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveRecentDownloads(map) {
  try {
    const now = Date.now();
    const entries = Object.entries(map)
      .filter(([, ts]) => now - ts < RECENT_DOWNLOAD_TTL)
      .sort((a, b) => b[1] - a[1])
      .slice(0, RECENT_DOWNLOAD_LIMIT);
    localStorage.setItem(RECENT_DOWNLOAD_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (e) {
    // ignore
  }
}

/** 队列里仍在进行中的状态（只有这些能拦重复；已完成/失败不拦，交给实时库索引判断） */
const ACTIVE_QUEUE_STATES = ["waiting", "preparing", "downloading"];

/** 重复判定：库里已有同链接文件，或队列里正有同一任务在下载 */
async function isDuplicateDownload(url) {
  const key = downloadKey(url);
  if (downloadQueue.some((item) => ACTIVE_QUEUE_STATES.includes(item.state) && downloadKey(item.url) === key)) return true;
  try {
    return await libraryIndex.hasSameLink(url);
  } catch (e) {
    return false;
  }
}

function recordDownloaded(url) {
  const key = downloadKey(url);
  const recent = loadRecentDownloads();
  recent[key] = Date.now();
  saveRecentDownloads(recent);
  try {
    twitterMonitor.markTweetSeen(url);
  } catch (e) {
    // ignore
  }
}

async function addToQueue(url, from) {
  if (!isInitialized) return "skip";
  // 之前失败过的同一条链接：直接把那条失败记录重新排进队，避免列表里出现两条
  const failed = downloadQueue.find((item) => item.state === "error" && item.url === url);
  if (failed) {
    failed.state = "waiting";
    failed.progress = 0;
    failed.speed = "";
    failed.eta = "";
    failed.phase = null;
    failed.processingPercent = undefined;
    failed.error = null;
    ui.updateQueueItem(failed.id, failed);
    processQueue();
    return "queued";
  }
  if (await isDuplicateDownload(url)) {
    console.info("[queue] duplicate skipped:", url);
    try {
      document.dispatchEvent(new CustomEvent("evd:download-duplicate", { detail: { url } }));
    } catch (e) {
      // ignore
    }
    return "duplicate";
  }

  // 判重期间可能已有同链接任务入队，入队前再看一次（只看进行中的）
  if (downloadQueue.some((entry) => ACTIVE_QUEUE_STATES.includes(entry.state) && downloadKey(entry.url) === downloadKey(url))) return "duplicate";

  const item = {
    id: ++queueIdCounter,
    url,
    title: url,
    state: "waiting",
    progress: 0,
    speed: "",
    eta: "",
    phase: null,
    processingPercent: undefined,
    error: null,
    from: from && (from.screenName || from.name || from.id) ? from : null,
  };

  downloadQueue.push(item);
  ui.appendQueueItem(item);
  processQueue();
  return "queued";
}

/**
 * 处理队列，启动等待中的任务（最多 MAX_CONCURRENT 个并发）
 */
function processQueue() {
  if (queuePaused) return;
  while (activeCount < MAX_CONCURRENT) {
    const nextItem = downloadQueue.find((item) => item.state === "waiting");
    if (!nextItem) break;
    activeCount++;
    executeDownload(nextItem);
  }
}

/**
 * 全部暂停：不再派发排队任务，并中断正在跑的 yt-dlp 进程；
 * 被中断的任务退回「等待中」，点「全部开始」后会重新排入。
 */
function pauseAllDownloads() {
  queuePaused = true;
  for (const item of downloadQueue) {
    if (item.state === "preparing" || item.state === "downloading") {
      item.state = "waiting";
      item.progress = 0;
      item.speed = "";
      item.eta = "";
      item.phase = null;
      item.processingPercent = undefined;
      ui.updateQueueItem(item.id, item);
    }
  }
  try {
    downloader.cancelAll();
  } catch (e) {
    console.error("cancelAll failed:", e);
  }
  ui.setQueuePaused(true);
}

/**
 * 全部开始：恢复派发排队任务
 */
function resumeAllDownloads() {
  queuePaused = false;
  ui.setQueuePaused(false);
  processQueue();
}

/**
 * 将下载失败的底层异常转换为对用户友好的错误提示
 */
/**
 * 推文失败时回查公开接口，拿到真实原因（受保护 / 已删除 / 无视频）。
 * 仅用于 x.com、twitter.com 链接，4 秒超时，失败返回空。
 */
async function probeTweetFailure(url) {
  const matched = String(url || "").match(/\/status(?:es)?\/(\d+)/);
  if (!matched) return "";
  const res = await getJson("https://api.fxtwitter.com/status/" + matched[1], {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      accept: "application/json",
    },
    timeout: 4000,
  });
  if (!res || !res.status) return "";
  if (res.status === 404) return "推文不存在或已删除";
  if (res.status === 401 || res.status === 403) {
    return "推文受保护，账号所有者限制了可以查看其帖子的用户";
  }
  if (res.status === 200) {
    const tweet = res.json && res.json.tweet;
    const videos = tweet && tweet.media && Array.isArray(tweet.media.videos) ? tweet.media.videos : [];
    if (!videos.length) return "该推文没有可下载的视频";
  }
  return "";
}

function isTwitterUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return hostname === "x.com" || hostname === "twitter.com" || hostname.endsWith(".x.com") || hostname.endsWith(".twitter.com");
  } catch {
    return false;
  }
}

async function formatDownloadError(error, url) {
  if (error?.code === 'ENETBOUNDARY') {
    return i18next.t("error.blockedAddress");
  }
  if (isNetworkError(error)) {
    return i18next.t("error.networkUnavailable");
  }
  const msg = error?.message || '';
  if (/Unsupported URL/i.test(msg)) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname === 'dribbble.com' || hostname.endsWith('.dribbble.com')) {
        return i18next.t("error.dribbbleProtected");
      }
    } catch {}
    return i18next.t("error.unsupportedUrl");
  }
  if (/Video unavailable|This video is unavailable|Unable to download video/i.test(msg)) {
    return i18next.t("error.videoUnavailable");
  }
  if (/Private video|This video is private|Sign in to confirm/i.test(msg)) {
    return i18next.t("error.privateVideo");
  }
  // 推文：yt-dlp 的原始报错往往含糊（No video formats found 也可能是推文已被删除），回查真实状态
  if (isTwitterUrl(url) && /No video formats found|not authorized|TweetTombstone|requires authentication|No video could be found/i.test(msg)) {
    const real = await probeTweetFailure(url);
    if (real) return real;
  }
  return msg || i18next.t("download.failed");
}

/**
 * 执行单个下载任务
 */
async function executeDownload(item) {
  try {
    item.state = "preparing";
    ui.updateQueueItem(item.id, item);

    const videoInfo = await downloader.getVideoInfo(item.url);
    item.title = videoInfo.title || i18next.t("error.untitledVideo");
    item.state = "downloading";
    item.phase = null;
    item.processingPercent = undefined;
    item.eta = "";
    ui.updateQueueItem(item.id, item);

    const results = await downloader.downloadVideo(
      item.url,
      (progress) => {
        if (progress.phase) {
          item.phase = progress.phase;
          item.processingPercent = undefined;
        }
        if (typeof progress.processingPercent === "number") item.processingPercent = progress.processingPercent;
        if (typeof progress.percent === "number" && !progress.phase) item.progress = progress.percent;
        if (typeof progress.currentSpeed === "string") item.speed = progress.currentSpeed;
        if (typeof progress.eta === "string") item.eta = progress.eta;
        ui.updateQueueItem(item.id, item);
      },
      null,
      videoInfo
    );

    item.state = "completed";
    item.progress = 100;
    item.speed = "";
    item.eta = "";
    item.phase = null;
    item.processingPercent = undefined;
    ui.updateQueueItem(item.id, item);
    // 已经成功下载：清掉持久化的失败记录
    errorLog.remove(item.url);

    for (const result of results) {
      const sourceUrl = getAutoAddSourcePref() ? item.url : undefined;
      await importToEagle(result.path, result.metadata, sourceUrl, {
        index: result.partIndex,
        total: result.partTotal,
      });
      downloader.cleanup(result.path);
    }
    recordDownloaded(item.url);
  } catch (error) {
    // 被「全部暂停」中断的任务已退回等待中，不按失败处理
    if (item.state === "waiting") return;
    item.state = "error";
    item.error = await formatDownloadError(error, item.url);
    ui.updateQueueItem(item.id, item);
    // 失败记录落盘，关掉窗口重开仍在
    errorLog.add({ url: item.url, title: item.title, error: item.error, from: item.from });
  } finally {
    activeCount--;
    processQueue();
  }
}

/**
 * 重试失败的下载任务
 */
function retryDownload(id) {
  const item = downloadQueue.find((item) => item.id === id);
  if (!item || item.state !== "error") return;

  item.state = "waiting";
  item.progress = 0;
  item.error = null;
  item.speed = "";
  item.eta = "";
  item.phase = null;
  item.processingPercent = undefined;
  ui.updateQueueItem(item.id, item);
  processQueue();
}

/**
 * 复制下载任务的错误信息
 */
async function copyError(id) {
  const item = downloadQueue.find((item) => item.id === id);
  if (!item || !item.error) return;
  try {
    await navigator.clipboard.writeText(item.error);
    ui.showCopiedErrorFeedback(id);
  } catch (error) {
    console.error("Failed to copy error:", error);
  }
}

/**
 * 后台检查 yt-dlp 版本，有新版本时更新齿轮红点提示
 */
async function checkForUpdateAndNotify() {
  try {
    const { hasUpdate } = await getYtDlpUpdateInfo();
    ui.updateDepsBadge(hasUpdate || !depsReady());
  } catch (e) {
    ui.updateDepsBadge(!depsReady());
  }
}

/**
 * 打开设置与依赖管理页面并加载信息
 */
function openDepsPage(tab = "settings") {
  ui.showDepsPage({
    tab,
    autoAddSourcePref: getAutoAddSourcePref(),
    xhsTagsPref: getXhsTagsPref(),
    xhsMultiFilePref: getXhsMultiFilePref(),
    twitterMultiFilePref: getTwitterMultiFilePref(),
    twitterNamePref: getTwitterNamePrefs(),
    twitterAnnotationPref: getTwitterAnnotationPrefs(),
    twitterTagsPref: getTwitterTagsPref(),
    maxResolutionPref: getMaxResolutionPref(),
    maxFrameratePref: getMaxFrameratePref(),
    threadCountPref: getThreadCountPref(),
  });
  loadDepsInfo();
}

/**
 * 关闭依赖管理页面，回到主界面
 */
function closeDepsPage() {
  ui.hideDepsPage();
}

/**
 * 加载并展示各依赖的当前状态
 */
function loadDepsInfo(options = {}) {
  const ffmpegSource = getFfmpegSource();
  const ytdlpInstalled = isYtDlpInstalled();

  if (ffmpegSource === "eagle") {
    ui.updateFfmpegCard("eagle", {});
  } else {
    ui.updateFfmpegCard("missing", {});
  }

  if (!ytdlpInstalled) {
    ui.updateYtdlpCard("missing");
    return;
  }

  if (options.ytdlpKnownLatest) {
    ui.updateYtdlpCard("latest", { version: options.ytdlpKnownLatest });
  } else {
    loadYtdlpUpdateStatus();
  }
}

/**
 * 检查 yt-dlp 是否有更新并渲染对应卡片状态
 */
function loadYtdlpUpdateStatus() {
  ui.updateYtdlpCard("installed", { checkingUpdate: true });
  const latestVersion = getLatestYtDlpVersion();

  getInstalledYtDlpVersion().then((installedVersion) => {
    if (!installedVersion) { ui.updateYtdlpCard("missing"); return; }
    if (installedVersion !== latestVersion) {
      ui.updateYtdlpCard("outdated", { installedVersion, latestVersion });
    } else {
      ui.updateYtdlpCard("latest", { version: installedVersion });
    }
  }).catch(() => {});
}

/**
 * 执行 yt-dlp 操作：install / update / reinstall / uninstall
 */
async function handleYtdlpAction(action) {
  if (action === "uninstall") {
    uninstallYtDlp();
    ui.updateYtdlpCard("missing");
    refreshDepsGatingState();
    return;
  }

  const statusKey = {
    install: "deps.installing",
    update: "deps.updating",
    reinstall: "deps.reinstalling",
  }[action] || "deps.updating";

  const doneKey = {
    install: "deps.doneInstalled",
    update: "deps.doneUpdated",
    reinstall: "deps.doneReinstalled",
  }[action] || "deps.doneInstalled";

  const statusText = i18next.t(statusKey);
  ui.updateYtdlpCard("busy", { statusText, percent: 0 });

  try {
    await downloadYtDlp((progress) => {
      ui.updateYtdlpCard("busy", { statusText, percent: progress });
    });

    const version = await getInstalledYtDlpVersion();
    ui.updateYtdlpCard("done", { statusText: i18next.t(doneKey), version });

    setTimeout(() => {
      loadDepsInfo({ ytdlpKnownLatest: version });
      refreshDepsGatingState();
    }, 1500);
  } catch (e) {
    const message = isNetworkError(e) ? i18next.t("error.networkUnavailable") : e.message;
    ui.updateYtdlpCard("error", { message, retryAction: action });
  }
}

/**
 * 复制下载任务的 URL
 */
async function copyUrl(id) {
  const item = downloadQueue.find((item) => item.id === id);
  if (!item) return;

  try {
    await navigator.clipboard.writeText(item.url);
    ui.showCopiedFeedback(id);
  } catch (error) {
    console.error("Failed to copy URL:", error);
  }
}

/**
 * 删除一条下载记录（正在下载的任务不允许删除）
 */
function deleteDownloadItem(id) {
  const index = downloadQueue.findIndex((entry) => entry.id === id);
  if (index < 0) return;
  if (!ui.canDeleteQueueItem(downloadQueue[index])) return;
  const url = downloadQueue[index].url;
  downloadQueue.splice(index, 1);
  ui.removeQueueItem(id);
  // 手动删除后不再出现在下次打开列表里
  errorLog.remove(url);
}

// ---------------------------------------------------------------------------
// 窗口尺寸记忆
// ---------------------------------------------------------------------------
const WINDOW_SIZE_KEY = "evd.windowSize.v2";

function getSavedWindowSize() {
  try {
    const raw = localStorage.getItem(WINDOW_SIZE_KEY);
    if (!raw) return null;
    const size = JSON.parse(raw);
    const width = Number(size && size.width);
    const height = Number(size && size.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    if (width < 320 || height < 320 || width > 4000 || height > 4000) return null;
    return { width: Math.round(width), height: Math.round(height) };
  } catch (e) {
    return null;
  }
}

function saveWindowSize() {
  try {
    const width = Math.round(window.innerWidth);
    const height = Math.round(window.innerHeight);
    if (width > 0 && height > 0) {
      localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify({ width, height }));
    }
  } catch (e) {}
}

/**
 * 启动时恢复上次窗口尺寸，并在缩放 / 关闭时保存
 */
function setupWindowState() {
  const saved = getSavedWindowSize();
  const api = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;
  if (saved && api && typeof api.setSize === "function") {
    Promise.resolve().then(async () => {
      try {
        const current = typeof api.getSize === "function" ? await api.getSize() : null;
        const width = Array.isArray(current) ? current[0] : current && current.width;
        const height = Array.isArray(current) ? current[1] : current && current.height;
        if (width == null || height == null || Math.abs(width - saved.width) > 2 || Math.abs(height - saved.height) > 2) {
          await api.setSize(saved.width, saved.height);
        }
      } catch (e) {}
    });
  }

  let saveTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveWindowSize, 300);
  });
  window.addEventListener("beforeunload", saveWindowSize);
}

// ---------------------------------------------------------------------------
// 桥接服务：接收浏览器扩展 / 局域网设备推送的链接（监听 0.0.0.0:43110）
// ---------------------------------------------------------------------------
const INGEST_PORT = 43110;
const INGEST_ALLOWED_HOSTS = ["x.com", "twitter.com", "mobile.twitter.com", "video.twimg.com", "pbs.twimg.com", "sankaku.app", "sankakucomplex.com", "xiaohongshu.com", "xhslink.com"];

function isIngestUrlAllowed(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return INGEST_ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed));
  } catch (e) {
    return false;
  }
}

function writeBridgeResponse(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

let peersCache = { at: 0, list: [] };

function getLocalSubnets() {
  const subnets = new Set();
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const info of interfaces[name] || []) {
        if (info.family === "IPv4" && !info.internal && info.address) {
          subnets.add(info.address.split(".").slice(0, 3).join("."));
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return Array.from(subnets);
}

function probePeer(ip) {
  return new Promise((resolve) => {
    const http = require("http");
    const req = http.get({ host: ip, port: INGEST_PORT, path: "/ping", timeout: 400 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
        if (body.length > 4096) res.destroy();
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json && json.app === "eagle-video-downloader") {
            resolve({ ip, name: json.name || ip, ready: !!json.ready });
            return;
          }
        } catch (e) {
          // ignore
        }
        resolve(null);
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
  });
}

/** 扫描同网段内运行本插件的设备 */
async function scanLanPeers(force) {
  const now = Date.now();
  if (!force && peersCache.list.length && now - peersCache.at < 30000) return peersCache.list;

  const selfIps = new Set();
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const info of interfaces[name] || []) {
        if (info.family === "IPv4" && info.address) selfIps.add(info.address);
      }
    }
  } catch (e) {}

  const targets = [];
  for (const subnet of getLocalSubnets()) {
    for (let host = 1; host <= 254; host++) {
      const ip = subnet + "." + host;
      if (!selfIps.has(ip)) targets.push(ip);
    }
  }
  if (!targets.length) return [];

  const peers = [];
  const concurrency = 64;
  for (let index = 0; index < targets.length; index += concurrency) {
    const batch = targets.slice(index, index + concurrency);
    const results = await Promise.all(batch.map((ip) => probePeer(ip)));
    for (const item of results) {
      if (item) peers.push(item);
    }
    if (peers.length >= 20) break;
  }

  peersCache = { at: Date.now(), list: peers };
  return peers;
}

function startIngestBridge() {
  if (startIngestBridge.server) return startIngestBridge.server;
  let http;
  try {
    http = require("http");
  } catch (e) {
    return null;
  }
  // 运行环境没有 http 模块时（如浏览器预览），桥接服务直接跳过
  if (!http || typeof http.createServer !== "function") return null;

  const server = http.createServer((req, res) => {
    const pathname = String(req.url || "/").split("?")[0];

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    if (pathname === "/ping") {
      let name = "";
      try {
        name = require("os").hostname();
      } catch (e) {}
      writeBridgeResponse(res, 200, { ok: true, app: "eagle-video-downloader", ready: !!isInitialized, name });
      return;
    }

    if (pathname === "/peers") {
      scanLanPeers()
        .then((peers) => writeBridgeResponse(res, 200, { ok: true, peers }))
        .catch(() => writeBridgeResponse(res, 200, { ok: true, peers: [] }));
      return;
    }

    if (pathname !== "/ingest" || req.method !== "POST") {
      writeBridgeResponse(res, 404, { ok: false, error: "not-found" });
      return;
    }

    let body = "";
    let tooLarge = false;
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16 * 1024) {
        tooLarge = true;
        req.destroy();
      }
    });
    req.on("end", () => {
      if (tooLarge) return;
      let payload = null;
      try {
        payload = JSON.parse(body || "{}");
      } catch (e) {
        payload = null;
      }
      const target = payload && typeof payload.url === "string" ? payload.url.trim() : "";
      if (!target || !isIngestUrlAllowed(target)) {
        writeBridgeResponse(res, 400, { ok: false, error: "invalid-url" });
        return;
      }
      if (!isInitialized) {
        writeBridgeResponse(res, 503, { ok: false, error: "not-ready" });
        return;
      }
      addToQueue(target);
      try {
        if (eagle.window && typeof eagle.window.restore === "function") eagle.window.restore();
        if (eagle.window && typeof eagle.window.focus === "function") eagle.window.focus();
      } catch (e) {}
      writeBridgeResponse(res, 200, { ok: true, url: target });
    });
    req.on("error", () => {});
  });

  server.on("error", (error) => {
    console.warn("[ingest] bridge error:", error && error.message);
  });
  server.listen(INGEST_PORT, "0.0.0.0");
  startIngestBridge.server = server;
  return server;
}

/**
 * Always-on-top toggle (state persisted in localStorage).
 */
function setupPinButton() {
  const pinButton = document.getElementById("pinBtn");
  if (!pinButton) return;

  const STORAGE_KEY = "evd.alwaysOnTop";
  const api = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;

  const render = (pinned) => {
    pinButton.classList.toggle("active", pinned);
    pinButton.setAttribute("aria-pressed", pinned ? "true" : "false");
  };

  const apply = async (pinned) => {
    try {
      if (api && typeof api.setAlwaysOnTop === "function") {
        await api.setAlwaysOnTop(pinned);
      }
    } catch (e) {
      console.error("Failed to set always on top:", e);
      return;
    }
    render(pinned);
    try {
      localStorage.setItem(STORAGE_KEY, pinned ? "1" : "0");
    } catch (e) {}
  };

  let pinned = false;
  try {
    pinned = localStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {}
  render(pinned);
  if (pinned) apply(true);

  pinButton.addEventListener("click", () => {
    pinned = !pinned;
    apply(pinned);
  });
}

// 供测试使用；Electron 运行时不会用到
module.exports = {
  buildImportTags,
  buildImportName,
  buildImportAnnotation,
  getTwitterNamePrefs,
  setTwitterNamePref,
  setTwitterNameOrder,
  moveTwitterNameField,
  getTwitterAnnotationPrefs,
  setTwitterAnnotationPref,
  setTwitterAnnotationOrder,
  moveTwitterAnnotationField,
  getTwitterTagsPref,
  setTwitterTagsPref,
  setTwitterTagsOrder,
  setTwitterTagsJoin,
  moveTwitterTagsField,
  getXhsMultiFilePref,
  setXhsMultiFilePref,
  getTwitterMultiFilePref,
  setTwitterMultiFilePref,
};

