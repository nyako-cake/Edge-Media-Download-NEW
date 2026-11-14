/**
 * Eagle 视频下载插件
 * 主入口 - 处理插件初始化和下载队列管理
 *
 * 说明：本文件由已发布产物 Plugin/dist/plugin.js 反推回填，
 * 以保证 npm run build 能重现当前发布的构建。
 */
var i18next = require("i18next");
var {
  isYtDlpInstalled,
  downloadYtDlp,
  uninstallYtDlp,
  getYtDlpUpdateInfo,
  getInstalledYtDlpVersion,
  getLatestYtDlpVersion,
  getFfmpegSource
} = require("./binary");
var { isNetworkError } = require("./net-guard");
var { getJson } = require("./x-http");
var downloader = require("./downloader");
var sankakuAuth = require("./sankaku-auth");
var twitterAuth = require("./twitter-auth");
var twitterMonitor = require("./twitter-monitor");
var twitterName = require("./twitter-name");
var libraryIndex = require("./library-index");
var errorLog = require("./error-log");
var ui = require("./ui-replica");
libraryIndex.configure({ keyOf: downloadKey });
var isInitialized = false;
function buildImportTags(metadata) {
  const adapterTags = Array.isArray(metadata.tags) ? metadata.tags.map((tag) => String(tag || "").trim().replace(/^#+/, "")).filter(Boolean) : [];
  const isXiaohongshu = String(metadata.extractor || "").toLowerCase() === "xiaohongshu";
  if (isXiaohongshu) {
    return getXhsTagsPref() ? adapterTags.slice(0, 30) : [];
  }
  const baseTags = adapterTags.length ? adapterTags.slice(0, 30) : [metadata.extractor || "video"];
  const isTwitter = String(metadata.extractor || "").toLowerCase() === "twitter";
  if (!isTwitter)
    return baseTags;
  const ruleTags = twitterName.buildTwitterTags(metadata, getTwitterTagsPref());
  const merged = baseTags.slice();
  for (const tag of ruleTags) {
    if (!merged.some((existing) => existing.toLowerCase() === tag.toLowerCase()))
      merged.push(tag);
  }
  return merged.slice(0, 30);
}
function buildImportName(metadata, part) {
  const extractor = String(metadata && metadata.extractor || "").toLowerCase();
  let appendPart = true;
  if (extractor === "twitter")
    appendPart = getTwitterMultiFilePref();
  else if (extractor === "xiaohongshu")
    appendPart = getXhsMultiFilePref();
  return twitterName.composeImportName(
    metadata,
    getTwitterNamePrefs(),
    part,
    i18next.t("error.downloadedVideo"),
    appendPart
  );
}
function buildImportAnnotation(metadata) {
  const isTwitter = String(metadata.extractor || "").toLowerCase() === "twitter";
  const composed = isTwitter ? twitterName.buildTwitterAnnotation(metadata, getTwitterAnnotationPrefs()) : "";
  if (composed)
    return composed.slice(0, twitterName.ANNOTATION_MAX_LENGTH);
  return metadata.description ? metadata.description.slice(0, 5e3) : "";
}
async function importToEagle(videoPath, metadata, sourceUrl, part) {
  if (typeof eagle === "undefined") {
    throw new Error(i18next.t("error.eagleApiNotAvailable"));
  }
  const tags = buildImportTags(metadata);
  const importOptions = {
    name: buildImportName(metadata, part),
    website: sourceUrl || void 0,
    tags,
    annotation: buildImportAnnotation(metadata)
  };
  try {
    const item = await eagle.item.addFromPath(videoPath, importOptions);
    return item;
  } catch (error) {
    throw new Error(`${i18next.t("error.eagleImportFailed")}: ${error.message}`);
  }
}
var AUTO_ADD_SOURCE_KEY = "Edge-Media-Download-NEW.autoAddSource";
var MAX_RESOLUTION_KEY = "Edge-Media-Download-NEW.maxResolution";
var MAX_FRAMERATE_KEY = "Edge-Media-Download-NEW.maxFramerate";
var THREAD_COUNT_KEY = "Edge-Media-Download-NEW.threadCount";
function getAutoAddSourcePref() {
  const val = localStorage.getItem(AUTO_ADD_SOURCE_KEY);
  return val === null ? true : val === "true";
}
function setAutoAddSourcePref(value) {
  localStorage.setItem(AUTO_ADD_SOURCE_KEY, String(value));
}
var XHS_TAGS_KEY = "Edge-Media-Download-NEW.xhsTags";
function getXhsTagsPref() {
  const val = localStorage.getItem(XHS_TAGS_KEY);
  return val === null ? true : val === "true";
}
function setXhsTagsPref(value) {
  localStorage.setItem(XHS_TAGS_KEY, String(value));
}
var XHS_MULTI_FILE_KEY = "Edge-Media-Download-NEW.xhsMultiFile";
function getXhsMultiFilePref() {
  const val = localStorage.getItem(XHS_MULTI_FILE_KEY);
  return val === null ? true : val === "true";
}
function setXhsMultiFilePref(value) {
  localStorage.setItem(XHS_MULTI_FILE_KEY, String(value));
}
var TWITTER_MULTI_FILE_KEY = "Edge-Media-Download-NEW.twitterMultiFile";
function getTwitterMultiFilePref() {
  const val = localStorage.getItem(TWITTER_MULTI_FILE_KEY);
  return val === null ? true : val === "true";
}
function setTwitterMultiFilePref(value) {
  localStorage.setItem(TWITTER_MULTI_FILE_KEY, String(value));
}
var TWITTER_NAME_KEY = "Edge-Media-Download-NEW.twitterName";
var TWITTER_ANNOTATION_KEY = "Edge-Media-Download-NEW.twitterAnnotation";
var TWITTER_TAGS_KEY = "Edge-Media-Download-NEW.twitterTagRules";
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
        if (typeof saved[field] === "boolean")
          prefs[field] = saved[field];
      }
      if (Array.isArray(saved.order))
        prefs.order = twitterName.normalizeOrder(saved.order);
      if (Array.isArray(saved.join))
        prefs.join = twitterName.normalizeJoin(saved.join);
    }
    return prefs;
  }
  function save(prefs) {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  }
  function setField(field, value) {
    if (!twitterName.FIELD_ORDER.includes(field))
      return;
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
  function setJoin(field, joined) {
    if (!twitterName.FIELD_ORDER.includes(field))
      return get().join;
    const prefs = get();
    const list = Array.isArray(prefs.join) ? prefs.join.slice() : [];
    const index = list.indexOf(field);
    if (joined === true && index < 0)
      list.push(field);
    if (joined !== true && index >= 0)
      list.splice(index, 1);
    prefs.join = twitterName.normalizeJoin(list);
    save(prefs);
    return prefs.join;
  }
  function move(field, direction) {
    const prefs = get();
    const moved = twitterName.moveInOrder(prefs.order, field, direction);
    if (!moved)
      return null;
    return setOrder(moved);
  }
  return { get, setField, setOrder, setJoin, move };
}
var twitterNamePrefsStore = createFieldPrefsStore(TWITTER_NAME_KEY);
var twitterAnnotationPrefsStore = createFieldPrefsStore(TWITTER_ANNOTATION_KEY);
var twitterTagsPrefsStore = createFieldPrefsStore(TWITTER_TAGS_KEY);
function getTwitterNamePrefs() {
  return twitterNamePrefsStore.get();
}
function setTwitterNamePref(field, value) {
  twitterNamePrefsStore.setField(field, value);
}
function setTwitterNameOrder(order) {
  return twitterNamePrefsStore.setOrder(order);
}
function moveTwitterNameField(field, direction) {
  return twitterNamePrefsStore.move(field, direction);
}
function getTwitterAnnotationPrefs() {
  return twitterAnnotationPrefsStore.get();
}
function setTwitterAnnotationPref(field, value) {
  twitterAnnotationPrefsStore.setField(field, value);
}
function setTwitterAnnotationOrder(order) {
  return twitterAnnotationPrefsStore.setOrder(order);
}
function moveTwitterAnnotationField(field, direction) {
  return twitterAnnotationPrefsStore.move(field, direction);
}
function getTwitterTagsPref() {
  return twitterTagsPrefsStore.get();
}
function setTwitterTagsPref(field, value) {
  twitterTagsPrefsStore.setField(field, value);
}
function setTwitterTagsOrder(order) {
  return twitterTagsPrefsStore.setOrder(order);
}
function setTwitterTagsJoin(field, joined) {
  return twitterTagsPrefsStore.setJoin(field, joined);
}
function moveTwitterTagsField(field, direction) {
  return twitterTagsPrefsStore.move(field, direction);
}
function getMaxResolutionPref() {
  return localStorage.getItem(MAX_RESOLUTION_KEY) || "auto";
}
function setMaxResolutionPref(value) {
  const val = value || "auto";
  localStorage.setItem(MAX_RESOLUTION_KEY, val);
  downloader.setQualityPrefs({
    resolution: val,
    framerate: getMaxFrameratePref()
  });
}
function getMaxFrameratePref() {
  return localStorage.getItem(MAX_FRAMERATE_KEY) || "auto";
}
function setMaxFrameratePref(value) {
  const val = value || "auto";
  localStorage.setItem(MAX_FRAMERATE_KEY, val);
  downloader.setQualityPrefs({
    resolution: getMaxResolutionPref(),
    framerate: val
  });
}
function getThreadCountPref() {
  return localStorage.getItem(THREAD_COUNT_KEY) || "auto";
}
var DOWNLOAD_SOUND_KEY = "Edge-Media-Download-NEW.downloadSound";
function getDownloadSoundPref() {
  const val = localStorage.getItem(DOWNLOAD_SOUND_KEY);
  return val === null ? true : val === "true";
}
function setDownloadSoundPref(value) {
  localStorage.setItem(DOWNLOAD_SOUND_KEY, String(value));
}
var __evdSoundLast = 0;
var __evdSoundPlaying = false;
var __evdAudioEl = null;
var CUSTOM_SOUND_KEY = "Edge-Media-Download-NEW.customSound";
var DEFAULT_SOUND_FILE = "assets/sounds/notify.wav";
function ensureAudioEl() {
  if (!__evdAudioEl) {
    __evdAudioEl = new Audio();
    __evdAudioEl.preload = "auto";
    __evdAudioEl.volume = 0.9;
    __evdAudioEl.addEventListener("ended", function () {
      __evdSoundPlaying = false;
    });
  }
  return __evdAudioEl;
}
function pluginRootDir() {
  try {
    const href = location.href.split("?")[0].split("#")[0];
    const dirUrl = href.substring(0, href.lastIndexOf("/") + 1);
    let decoded = decodeURIComponent(dirUrl);
    decoded = decoded.replace(/^file:\/\/\//i, "").replace(/^file:\/\//i, "").replace(/^\/+/, "");
    return decoded.replace(/\/+$/, "");
  } catch (e) {
    return "";
  }
}
function defaultSoundFile() {
  return DEFAULT_SOUND_FILE;
}
function getCustomSoundFile() {
  try {
    return localStorage.getItem(CUSTOM_SOUND_KEY) || "";
  } catch (e) {
    return "";
  }
}
function setCustomSoundFile(file) {
  try {
    localStorage.setItem(CUSTOM_SOUND_KEY, file || "");
  } catch (e) {
  }
}
function soundFileName(file) {
  return String(file || "").split(/[\\\/]/).pop();
}
function soundUrl(file) {
  if (!file)
    return defaultSoundFile();
  if (/^(assets\/|blob:|data:|file:)/i.test(file))
    return file;
  return "file:///" + encodeURI(file.replace(/\\/g, "/"));
}
function playSoundFile(url, onFail) {
  try {
    const el = ensureAudioEl();
    if (el.src !== url)
      el.src = url;
    try {
      el.currentTime = 0;
    } catch (e) {
    }
    __evdSoundPlaying = true;
    const p = el.play();
    if (p && typeof p.then === "function") {
      p.then(null, () => {
        __evdSoundPlaying = false;
        if (onFail)
          onFail();
      });
    }
  } catch (e) {
    __evdSoundPlaying = false;
    if (onFail)
      onFail();
  }
}
function playDownloadAddedSound(force) {
  if (!getDownloadSoundPref())
    return;
  const now = Date.now();
  if (!force && now - __evdSoundLast < 300)
    return;
  __evdSoundLast = now;
  if (__evdSoundPlaying)
    return;
  const custom = getCustomSoundFile();
  const file = custom || defaultSoundFile();
  playSoundFile(soundUrl(file), () => {
    if (custom) {
      setCustomSoundFile("");
      const label = document.getElementById("customSoundName");
      if (label) {
        label.textContent = "默认音效";
        label.title = "敲敲.wav";
      }
      playDownloadAddedSound(true);
    }
  });
}document.addEventListener("pointerdown", function unlockSound() {
  ensureSoundContext();
  document.removeEventListener("pointerdown", unlockSound);
});
function setThreadCountPref(value) {
  const val = value || "auto";
  localStorage.setItem(THREAD_COUNT_KEY, val);
  downloader.setThreadCount(val);
}
var downloadQueue = [];
var CONCURRENCY_KEY = "evd.maxConcurrentDownloads";
var CONCURRENCY_VALUES = [3, 6, 9, 16, 32];
function getConcurrencyPref() {
  try {
    const value = Number(localStorage.getItem(CONCURRENCY_KEY));
    if (CONCURRENCY_VALUES.indexOf(value) >= 0)
      return value;
  } catch (e) {
  }
  return 3;
}
function setConcurrencyPref(value) {
  const next = Number(value);
  const picked = CONCURRENCY_VALUES.indexOf(next) >= 0 ? next : 3;
  try {
    localStorage.setItem(CONCURRENCY_KEY, String(picked));
  } catch (e) {
  }
}
var MAX_CONCURRENT = 3;
var activeCount = 0;
var queueIdCounter = 0;
var queuePaused = false;
async function initI18n() {
  const enTranslation = require("../Plugin/_locales/en.json");
  const zhCNTranslation = require("../Plugin/_locales/zh_CN.json");
  await i18next.init({
    lng: eagle.app.locale || "en",
    fallbackLng: "en",
    resources: {
      en: { translation: enTranslation },
      zh_CN: { translation: zhCNTranslation }
    }
  });
  global.i18next = i18next;
}
function applyTranslations() {
  const input = document.getElementById("urlInput");
  if (input)
    input.placeholder = "\u7C98\u8D34\u89C6\u9891\u94FE\u63A5\u2026";
}
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
      if (profile && profile.ok)
        ui.renderTwitterProfile(profile);
    }).catch(() => {
    });
  } catch (e) {
  }
  twitterMonitor.init().then((result) => {
    const status = document.getElementById("twitterAuthStatus");
    if (!status || !result || result.skipped)
      return;
    if (result.ok === false) {
      status.textContent = "\u9A8C\u8BC1\u5931\u8D25\uFF1A" + (result.error || "error");
      return;
    }
    if (result.baseline) {
      status.textContent = "Cookie \u6709\u6548\uFF0C\u5DF2\u5EFA\u7ACB\u6293\u53D6\u57FA\u7EBF";
      return;
    }
    status.textContent = describeCatchupResult(result);
  }).catch((e) => {
    console.warn("[twitter-monitor] init failed:", e && e.message);
  });
  setTimeout(() => {
    try {
      const prefs = twitterMonitor.getPrefs();
      if (!prefs || !(prefs.likes || prefs.bookmarks || prefs.dm))
        return;
      libraryIndex.build({ force: true }).catch(() => {
      }).then(() => twitterMonitor.catchUp({ includeDm: true })).catch((e) => {
        console.warn("[twitter-monitor] auto catchup failed:", e && e.message);
      });
    } catch (e) {
    }
  }, 1e4);
  setupWindowState();
  startIngestBridge();
  downloader.setQualityPrefs({
    resolution: getMaxResolutionPref(),
    framerate: getMaxFrameratePref()
  });
  downloader.setThreadCount(getThreadCountPref());
  try {
    await initializeBinaries();
  } catch (e) {
    console.error("initializeBinaries failed:", e);
  }
});
eagle.onThemeChanged(() => {
  ui.updateTheme();
});
var lastLibraryPath = null;
function startLibraryWatcher() {
  try {
    lastLibraryPath = eagle.library && eagle.library.path || "";
  } catch (e) {
    lastLibraryPath = "";
  }
  setInterval(() => {
    let current = "";
    try {
      current = eagle.library && eagle.library.path || "";
    } catch (e) {
      current = "";
    }
    if (current === lastLibraryPath)
      return;
    lastLibraryPath = current;
    try {
      ui.refreshAccountFields();
    } catch (e) {
    }
    try {
      renderDownloadAccount();
    } catch (e) {
    }
    try {
      twitterMonitor.refreshForLibrary();
    } catch (e) {
    }
  }, 3e3);
}
function setupEventListeners() {
  const closeBtn = document.getElementById("closeButton");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      saveWindowSize();
      window.close();
    });
  }
  const minBtn = document.getElementById("minimizeBtn");
  if (minBtn) {
    minBtn.addEventListener("click", () => {
      try {
        if (typeof eagle !== "undefined" && eagle.window && typeof eagle.window.minimize === "function")
          eagle.window.minimize();
      } catch (e) {
      }
    });
  }
  setupPinButton();
  const getUi = () => typeof window !== "undefined" ? window.EVDUI : null;
  document.addEventListener("evd:panel", (e) => {
    const view = e.detail && e.detail.view;
    if (!view)
      return;
    if (view === "download") {
      ui.hideDepsPage();
    } else {
      openDepsPage(view);
    }
  });
  const urlInput = document.getElementById("urlInput");
  const downloadBtn = document.getElementById("downloadBtn");
  const pasteBtn = document.getElementById("pasteBtn");
  const submitUrl = (raw) => {
    const value = String(raw || "").trim();
    if (!value)
      return;
    if (!isInitialized) {
      ui.setInputBarState("error", "\u8BF7\u5148\u5728\u4F9D\u8D56\u9875\u5B89\u88C5 yt-dlp \u540E\u518D\u4E0B\u8F7D");
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
        ui.setInputBarState("error", "\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u53EF\u7528\u7684\u94FE\u63A5");
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
      ui.setInputBarState("error", "\u94FE\u63A5\u65E0\u6548\uFF0C\u9700\u8981 https \u89C6\u9891\u5730\u5740");
      return;
    }
    const status = await addToQueue(url, e.detail && e.detail.from, !!(e.detail && e.detail.scrape));
    try {
      document.dispatchEvent(new CustomEvent("evd:download-result", { detail: { url, status } }));
    } catch (err) {
    }
  });
  document.addEventListener("evd:queue-action", (e) => {
    const detail = e.detail || {};
    if (typeof detail.id !== "number")
      return;
    if (detail.action === "retry")
      retryDownload(detail.id);
    if (detail.action === "copy")
      copyUrl(detail.id);
    if (detail.action === "copyError")
      copyError(detail.id);
    if (detail.action === "remove")
      deleteDownloadItem(detail.id);
  });
  document.addEventListener("evd:queue-bulk", (e) => {
    const action = e.detail && e.detail.action;
    if (action === "start")
      resumeAllDownloads();
    if (action === "pause")
      pauseAllDownloads();
  });
  document.addEventListener("evd:theme-pick", (e) => {
    const theme = e.detail && e.detail.theme;
    if (theme)
      ui.setManualTheme(theme);
  });
  const followToggle = document.getElementById("followThemeToggle");
  if (followToggle) {
    followToggle.addEventListener("change", (e) => {
      ui.setFollowEagleTheme(!!e.target.checked);
    });
  }
  const resetWindowBtn = document.getElementById("resetWindowSize");
  if (resetWindowBtn) {
    const RESET_W = 840;
    const RESET_H = 650;
    const resetWindow = async () => {
      const windowApi = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;
      const applySize = async () => {
        if (windowApi && typeof windowApi.setSize === "function")
          await windowApi.setSize(RESET_W, RESET_H);
        else if (typeof window.resizeTo === "function")
          window.resizeTo(RESET_W, RESET_H);
      };
      try {
        await applySize();
        if (windowApi && typeof windowApi.getSize === "function") {
          for (let i = 0; i < 3; i++) {
            await new Promise((resolve) => setTimeout(resolve, 120));
            const current = await windowApi.getSize();
            const width = Number(Array.isArray(current) ? current[0] : current && current.width);
            const height = Number(Array.isArray(current) ? current[1] : current && current.height);
            if (Number.isFinite(width) && Number.isFinite(height) && Math.abs(width - RESET_W) <= 2 && Math.abs(height - RESET_H) <= 2)
              break;
            await applySize();
          }
        }
      } catch (e) {
      }
    };
    resetWindowBtn.addEventListener("click", resetWindow);
    resetWindowBtn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ")
        return;
      e.preventDefault();
      resetWindow();
    });
  }
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
        framerate: getMaxFrameratePref()
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
        framerate: getMaxFrameratePref()
      });
    });
  }
  const concurrency = document.getElementById("concurrency");
  if (concurrency) {
    concurrency.value = String(getConcurrencyPref());
    concurrency.addEventListener("change", (e) => {
      setConcurrencyPref(e.target.value);
      processQueue();
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
  const downloadSoundToggle = document.getElementById("downloadSoundToggle");
  if (downloadSoundToggle) {
    downloadSoundToggle.checked = getDownloadSoundPref();
    downloadSoundToggle.addEventListener("change", (e) => {
      setDownloadSoundPref(!!e.target.checked);
      if (e.target.checked)
        playDownloadAddedSound(true);
    });
  }
  const customSoundName = document.getElementById("customSoundName");
  function refreshCustomSoundLabel() {
    if (!customSoundName)
      return;
    const custom = getCustomSoundFile();
    customSoundName.textContent = custom ? soundFileName(custom) : "默认音效";
    customSoundName.title = custom || "敲敲.wav";
  }
  function pickCustomSoundFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,.wav,.mp3,.ogg,.m4a,.aac,.flac";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const picked = input.files && input.files[0];
      let path = "";
      if (picked) {
        try {
          const electron = require("electron");
          if (electron && electron.webUtils && typeof electron.webUtils.getPathForFile === "function")
            path = electron.webUtils.getPathForFile(picked) || "";
        } catch (e) {
        }
        if (!path)
          path = picked.path || "";
      }
      try {
        input.remove();
      } catch (e) {
      }
      let stored = "";
      if (path) {
        try {
          const fs = require("fs");
          const root = pluginRootDir();
          const extMatch = /\.([a-z0-9]+)$/i.exec(picked && picked.name || path);
          const ext = extMatch ? "." + extMatch[1].toLowerCase() : ".wav";
          const dest = root ? root + "/assets/sounds/custom" + ext : "";
          if (dest) {
            fs.copyFileSync(path, dest);
            stored = "assets/sounds/custom" + ext;
          }
        } catch (e) {
          stored = "";
        }
        if (!stored)
          stored = soundUrl(path);
      } else if (picked) {
        try {
          stored = URL.createObjectURL(picked);
        } catch (e) {
        }
      }
      if (!stored)
        return;
      setCustomSoundFile(stored);
      refreshCustomSoundLabel();
      playDownloadAddedSound(true);
    });
    input.click();
  }
  const pickSoundBtn = document.getElementById("pickSoundBtn");
  if (pickSoundBtn)
    pickSoundBtn.addEventListener("click", pickCustomSoundFile);
  const resetSoundBtn = document.getElementById("resetSoundBtn");
  if (resetSoundBtn) {
    resetSoundBtn.addEventListener("click", () => {
      setCustomSoundFile("");
      refreshCustomSoundLabel();
      playDownloadAddedSound(true);
    });
  }
  refreshCustomSoundLabel();
  setupDownloadAccountStrip();
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
  const TAG_FIELDS = ["authorId", "tweetId", "screenName", "text", "name"];
  const COLUMN_OF_FIELD = {
    name: getTwitterNamePrefs(),
    annotation: getTwitterAnnotationPrefs(),
    tags: getTwitterTagsPref()
  };
  const FIELD_OWNER = {};
  ["name", "annotation", "tags"].forEach((column) => {
    TAG_FIELDS.forEach((field) => {
      FIELD_OWNER[field + ":" + column] = true;
    });
  });
  document.addEventListener("evd:tag-check", (e) => {
    const field = e.detail && e.detail.field;
    if (!field || !e.detail.panel)
      return;
    const panel = e.detail.panel;
    const checked = !!e.detail.checked;
    if (panel === "name")
      setTwitterNamePref(field, checked);
    if (panel === "annotation")
      setTwitterAnnotationPref(field, checked);
    if (panel === "tags")
      setTwitterTagsPref(field, checked);
  });
  const persistTagLayout = (reason) => {
    const shellState = getUi() ? getUi().tagState() : null;
    if (!shellState)
      return;
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
    persistTagLayout(e.detail && e.detail.reason || "order");
  });
  const resetOrder = document.getElementById("resetOrder");
  if (resetOrder) {
    resetOrder.addEventListener("click", () => {
      const shellUi = getUi();
      if (shellUi)
        shellUi.resetLayout();
    });
  }
  const ytdlpCheck = document.getElementById("ytdlpCheck");
  if (ytdlpCheck)
    ytdlpCheck.addEventListener("click", () => loadYtdlpUpdateStatus());
  const ytdlpUninstall = document.getElementById("ytdlpUninstall");
  if (ytdlpUninstall)
    ytdlpUninstall.addEventListener("click", () => handleYtdlpAction("uninstall"));
  const ytdlpReinstall = document.getElementById("ytdlpReinstall");
  if (ytdlpReinstall) {
    ytdlpReinstall.addEventListener("click", () => handleYtdlpAction("reinstall"));
  }
  const ffmpegCheck = document.getElementById("ffmpegCheck");
  if (ffmpegCheck)
    ffmpegCheck.addEventListener("click", () => loadDepsInfo());
  const ffmpegReinstall = document.getElementById("ffmpegReinstall");
  if (ffmpegReinstall)
    ffmpegReinstall.addEventListener("click", () => openEagleFfmpegStore());
  const sankakuInput = document.getElementById("sankakuToken");
  const sankakuSave = document.getElementById("sankakuSave");
  const sankakuClear = document.getElementById("sankakuClear");
  const sankakuStatus = document.getElementById("sankakuAuthStatus");
  if (sankakuSave && sankakuInput) {
    sankakuSave.addEventListener("click", () => {
      const token = sankakuAuth.parseAccessToken(sankakuInput.value);
      if (!token) {
        if (sankakuStatus)
          sankakuStatus.textContent = "access_token \u65E0\u6548";
        return;
      }
      sankakuAuth.setStoredAuth(sankakuInput.value);
      if (sankakuStatus)
        sankakuStatus.textContent = "\u5DF2\u4FDD\u5B58";
    });
  }
  if (sankakuClear && sankakuInput) {
    sankakuClear.addEventListener("click", () => {
      sankakuAuth.setStoredAuth("");
      sankakuInput.value = "";
      if (sankakuStatus)
        sankakuStatus.textContent = "\u5DF2\u6E05\u9664";
    });
  }
  const twToken = document.getElementById("authToken");
  const twCt0 = document.getElementById("ct0");
  const twPasscode = document.getElementById("chatPasscode");
  const twStatus = document.getElementById("twitterAuthStatus");
  const twSave = document.getElementById("twitterSave");
  const twClear = document.getElementById("twitterClear");
  const twIntervals = document.getElementById("monitorInterval");
  const setTwStatus = (text) => {
    if (twStatus)
      twStatus.textContent = text;
  };
  const twLastRun = document.getElementById("monitorLastRun");
  const fmtClock = (ms) => {
    if (!ms)
      return "\u2014";
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  };
  const updateLastRunLine = () => {
    if (!twLastRun)
      return;
    const log = twitterMonitor.getFetchLog ? twitterMonitor.getFetchLog() : [];
    const timestamps = [
      twitterMonitor.getKindLastCheckAt("likes"),
      twitterMonitor.getKindLastCheckAt("bookmarks"),
      twitterMonitor.getKindLastCheckAt("dm")
    ].filter(Boolean);
    const latest = timestamps.length ? Math.max(...timestamps) : 0;
    const parts = [];
    const likeAt = twitterMonitor.getKindLastCheckAt("likes");
    const bookmarkAt = twitterMonitor.getKindLastCheckAt("bookmarks");
    const dmAt = twitterMonitor.getKindLastCheckAt("dm");
    if (likeAt)
      parts.push("\u70B9\u8D5E " + fmtClock(likeAt));
    if (bookmarkAt)
      parts.push("\u6536\u85CF " + fmtClock(bookmarkAt));
    if (dmAt)
      parts.push("\u597D\u53CB " + fmtClock(dmAt));
    twLastRun.textContent = latest ? "\u6700\u8FD1\u6293\u53D6\uFF1A" + parts.join(" / ") + (log[0] ? "\uFF08\u65B0\u589E " + log[0].newCount + "\uFF09" : "") : "\u6700\u8FD1\u6293\u53D6\uFF1A\u2014";
  };
  if (twLastRun) {
    updateLastRunLine();
    setInterval(updateLastRunLine, 1e4);
  }
  const describeInterval = (ms) => {
    if (ms % 36e5 === 0)
      return ms / 36e5 + " \u5C0F\u65F6";
    if (ms < 6e4)
      return Math.round(ms / 1e3) + " \u79D2";
    return ms / 6e4 + " \u5206\u949F";
  };
  const applyInterval = () => {
    const minutes = twIntervals ? Number(twIntervals.value) || 0 : 0;
    ui.setIntervalChoice(minutes);
    if (!minutes) {
      twitterMonitor.stop();
      setTwStatus("\u81EA\u52A8\u6293\u53D6\u5DF2\u5173\u95ED");
      return false;
    }
    if (!twitterAuth.hasAuth()) {
      setTwStatus("Cookie \u65E0\u6548\uFF0C\u65E0\u6CD5\u542F\u52A8\u81EA\u52A8\u6293\u53D6");
      return false;
    }
    const intervalMs = Math.max(twitterMonitor.MIN_INTERVAL_MS, minutes * 6e4);
    twitterMonitor.start(intervalMs);
    setTwStatus("\u81EA\u52A8\u6293\u53D6\u8FD0\u884C\u4E2D\uFF0C\u6BCF " + describeInterval(intervalMs) + " \u4E00\u6B21");
    updateLastRunLine();
    return true;
  };
  if (twSave && twToken && twCt0) {
    twSave.addEventListener("click", async () => {
      const cookie = twitterAuth.buildCookie(twToken.value, twCt0.value);
      if (!cookie) {
        setTwStatus("auth_token \u6216 ct0 \u65E0\u6548");
        return;
      }
      twitterAuth.setStoredCookie(cookie);
      twitterMonitor.setPrefs({ chatPasscode: twPasscode ? String(twPasscode.value || "").trim() : "" });
      setTwStatus("\u6B63\u5728\u4FDD\u5B58\u2026");
      const profile = await twitterMonitor.fetchProfile();
      if (profile && profile.ok) {
        setTwStatus("\u5DF2\u4FDD\u5B58\uFF0C@" + (profile.screenName || "?"));
        ui.renderTwitterProfile(profile);
      } else {
        setTwStatus("\u5DF2\u4FDD\u5B58\uFF0C\u8D26\u53F7\u8D44\u6599\u6682\u672A\u83B7\u53D6");
        ui.renderTwitterProfile();
      }
      if (ui.refreshChatList)
        ui.refreshChatList();
      applyInterval();
    });
  }
  if (twClear && twToken && twCt0) {
    twClear.addEventListener("click", () => {
      twitterAuth.setStoredCookie("");
      twToken.value = "";
      twCt0.value = "";
      twitterMonitor.setPrefs({ chatPasscode: "" });
      if (twPasscode)
        twPasscode.value = "";
      twitterMonitor.saveProfile({});
      twitterMonitor.clearConversations();
      ui.renderTwitterProfile(null);
      if (ui.renderChatList)
        ui.renderChatList();
      setTwStatus("\u5DF2\u6E05\u9664 Cookie");
      twitterMonitor.stop();
      if (twIntervals)
        twIntervals.value = "0";
    });
  }
  if (twIntervals)
    twIntervals.addEventListener("change", applyInterval);
  const dmIntervals = document.getElementById("dmMonitorInterval");
  if (dmIntervals) {
    const savedDmMs = twitterMonitor.getPrefs().dmMs;
    if (savedDmMs)
      dmIntervals.value = String(Math.round(savedDmMs / 6e4));
    dmIntervals.addEventListener("change", () => {
      const minutes = Number(dmIntervals.value) || 2;
      twitterMonitor.setPrefs({ dmMs: minutes * 6e4 });
      if (twitterMonitor.isRunning())
        twitterMonitor.startDm(minutes * 6e4);
      setTwStatus("\u597D\u53CB\u6293\u53D6\u8FD0\u884C\u4E2D\uFF0C\u6BCF " + minutes + " \u5206\u949F\u4E00\u6B21");
    });
  }
  const twLikes = document.getElementById("twitterMonitorLikes");
  const twBookmarks = document.getElementById("twitterMonitorBookmarks");
  const twDm = document.getElementById("twitterMonitorDm");
  const onSourceChange = () => {
    twitterMonitor.setPrefs({
      likes: !!(twLikes && twLikes.checked),
      bookmarks: !!(twBookmarks && twBookmarks.checked),
      dm: !!(twDm && twDm.checked)
    });
    const anySource = twLikes && twLikes.checked || twBookmarks && twBookmarks.checked || twDm && twDm.checked;
    if (!anySource) {
      twitterMonitor.stop();
      setTwStatus("\u672A\u9009\u62E9\u6293\u53D6\u5185\u5BB9\uFF0C\u81EA\u52A8\u6293\u53D6\u5DF2\u505C\u6B62");
      return;
    }
    if (!(twDm && twDm.checked))
      twitterMonitor.stopDm();
    else if (twitterMonitor.isRunning())
      twitterMonitor.startDm(twitterMonitor.getPrefs().dmMs);
    applyInterval();
  };
  const savedSourcePrefs = twitterMonitor.getPrefs();
  if (twLikes)
    twLikes.checked = savedSourcePrefs.likes !== false;
  if (twBookmarks)
    twBookmarks.checked = savedSourcePrefs.bookmarks !== false;
  if (twDm)
    twDm.checked = savedSourcePrefs.dm !== false;
  if (twLikes)
    twLikes.addEventListener("change", onSourceChange);
  if (twBookmarks)
    twBookmarks.addEventListener("change", onSourceChange);
  if (twDm)
    twDm.addEventListener("change", onSourceChange);
  const groupHeads = document.querySelectorAll(".account-group-head");
  const setGroupOpen = (head, open) => {
    head.classList.toggle("open", open);
    head.setAttribute("aria-expanded", open ? "true" : "false");
    const body = document.getElementById(head.dataset.target);
    if (body)
      body.hidden = !open;
  };
  const closeGroups = () => {
    Array.prototype.forEach.call(groupHeads, (head) => setGroupOpen(head, false));
  };
  Array.prototype.forEach.call(groupHeads, (head) => {
    setGroupOpen(head, false);
    head.addEventListener("click", () => setGroupOpen(head, !head.classList.contains("open")));
    head.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ")
        return;
      event.preventDefault();
      setGroupOpen(head, !head.classList.contains("open"));
    });
  });
  document.addEventListener("evd:panel", (event) => {
    if (!event.detail || event.detail.view !== "account")
      closeGroups();
  });
  const twTest = document.getElementById("monitorTest");
  if (twTest) {
    twTest.addEventListener("click", async () => {
      if (!twitterAuth.hasAuth()) {
        setTwStatus("Cookie \u65E0\u6548");
        return;
      }
      twTest.disabled = true;
      setTwStatus("\u6B63\u5728\u6293\u53D6\u2026");
      let result = null;
      try {
        await libraryIndex.build({ force: true });
        result = await twitterMonitor.catchUp({ includeDm: true });
      } catch (e) {
        result = { ok: false, error: e && e.message || "error" };
      }
      twTest.disabled = false;
      if (!result || result.ok === false) {
        setTwStatus("\u6293\u53D6\u5931\u8D25\uFF1A" + (result && result.error || "error"));
        return;
      }
      setTwStatus(describeCatchupResult(result));
      updateLastRunLine();
    });
  }
}
async function openEagleFfmpegStore() {
  if (typeof eagle !== "undefined" && eagle.extraModule && eagle.extraModule.ffmpeg && typeof eagle.extraModule.ffmpeg.install === "function") {
    try {
      await eagle.extraModule.ffmpeg.install();
      return;
    } catch (e) {
    }
  }
  const isZh = eagle.app.locale && eagle.app.locale.startsWith("zh");
  const url = isZh ? "https://community-cn.eagle.cool/plugin/detail/eagle-plugin-ffmpeg" : "https://community.eagle.cool/plugin/detail/eagle-plugin-ffmpeg";
  try {
    const { shell } = require("electron");
    shell.openExternal(url);
  } catch (e) {
    window.open(url, "_blank");
  }
}
async function initializeBinaries() {
  if (depsReady()) {
    isInitialized = true;
    initializeMainUI();
    loadDepsInfo();
    checkForUpdateAndNotify();
    return;
  }
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
    threadCountPref: getThreadCountPref()
  });
  ui.updateDepsBadge(true);
  loadDepsInfo();
}
function depsReady() {
  return isYtDlpInstalled() && !!getFfmpegSource();
}
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
function initializeMainUI() {
  ui.showMainUI();
  ui.setupInputBar();
  restoreErrorLog();
  const urlInput = document.getElementById("urlInput");
  if (urlInput)
    urlInput.focus();
  try {
    libraryIndex.build().catch(() => {
    });
    setInterval(() => {
      libraryIndex.build({ force: true }).catch(() => {
      });
    }, 6e4);
  } catch (e) {
  }
}
function restoreErrorLog() {
  const entries = errorLog.list();
  for (const entry of entries) {
    if (!entry || !entry.url)
      continue;
    if (downloadQueue.some((item2) => item2.url === entry.url))
      continue;
    const item = {
      id: ++queueIdCounter,
      url: entry.url,
      title: entry.title || entry.url,
      state: "error",
      progress: 0,
      speed: "",
      eta: "",
      phase: null,
      processingPercent: void 0,
      error: entry.error || "",
      from: entry.from || null
    };
    downloadQueue.push(item);
    ui.appendQueueItem(item);
  }
}
var RECENT_DOWNLOAD_KEY = "evd.recentDownloads";
var RECENT_DOWNLOAD_TTL = 24 * 60 * 60 * 1e3;
var RECENT_DOWNLOAD_LIMIT = 500;
var FAILED_DOWNLOAD_KEY = "evd.failedDownloads";
var FAILED_DOWNLOAD_LIMIT = 500;
function loadFailedDownloads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAILED_DOWNLOAD_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}
function saveFailedDownloads(map) {
  try {
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, FAILED_DOWNLOAD_LIMIT);
    localStorage.setItem(FAILED_DOWNLOAD_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (e) {
  }
}
function markDownloadFailed(url) {
  const key = downloadKey(url);
  if (!key)
    return;
  const map = loadFailedDownloads();
  map[key] = Date.now();
  saveFailedDownloads(map);
}
function clearDownloadFailed(url) {
  const key = downloadKey(url);
  if (!key)
    return;
  const map = loadFailedDownloads();
  if (!(key in map))
    return;
  delete map[key];
  saveFailedDownloads(map);
}
function isMarkedDownloadFailed(url) {
  const key = downloadKey(url);
  return !!key && key in loadFailedDownloads();
}
function describeCatchupResult(result) {
  const parts = ["\u672C\u6B21\u65B0\u589E " + (result.newCount || 0) + " \u6761"];
  if (result.duplicateCount)
    parts.push("\u68C0\u6D4B\u5230\u91CD\u590D " + result.duplicateCount + " \u6761");
  if (result.truncated)
    parts.push("\uFF08\u5DF2\u622A\u65AD\u81F3\u4E0A\u9650\uFF09");
  return parts.join(" \xB7 ");
}
function downloadKey(url) {
  const text = String(url || "");
  const tweet = text.match(/\/status\/(\d+)/);
  if (tweet)
    return "tw:" + tweet[1];
  const sankaku = text.match(/\/(?:posts?|post\/show)\/([A-Za-z0-9]+)/i);
  if (sankaku)
    return "sk:" + sankaku[1];
  const xiaohongshu = text.match(/xiaohongshu\.com\/(?:explore|discovery\/item|note)\/([0-9a-f]{24})/i);
  if (xiaohongshu)
    return "xhs:" + xiaohongshu[1].toLowerCase();
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
    const entries = Object.entries(map).filter(([, ts]) => now - ts < RECENT_DOWNLOAD_TTL).sort((a, b) => b[1] - a[1]).slice(0, RECENT_DOWNLOAD_LIMIT);
    localStorage.setItem(RECENT_DOWNLOAD_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (e) {
  }
}
var ACTIVE_QUEUE_STATES = ["waiting", "preparing", "downloading"];
async function isDuplicateDownload(url, options) {
  const key = downloadKey(url);
  if (!key)
    return false;
  // 队列里只要不是失败态，同 key 一律算重复（之前只看活跃态，完成过的又会被当新任务加进来）
  if (downloadQueue.some((item) => item.state !== "error" && downloadKey(item.url) === key))
    return true;
  // 抓取来源再看 24 小时下载记录：这条不依赖库索引，能挡住「刚下完、索引还没刷新」的窗口
  if (options && options.scrape) {
    const recent = loadRecentDownloads();
    const downloadedAt = Number(recent[key]) || 0;
    if (downloadedAt && Date.now() - downloadedAt < RECENT_DOWNLOAD_TTL)
      return true;
  }
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
  }
  try {
    // 立刻记进库索引，不用等下一次 60 秒重建
    libraryIndex.remember(url);
  } catch (e) {
  }
}
async function addToQueue(url, from, scrape) {
  if (!isInitialized)
    return "skip";
  if (scrape && isMarkedDownloadFailed(url)) {
    console.info("[queue] previously failed, skip from scrape:", url);
    return "skip";
  }

  const failed = downloadQueue.find((item2) => item2.state === "error" && item2.url === url);
  if (failed) {
    failed.state = "waiting";
    failed.progress = 0;
    failed.speed = "";
    failed.eta = "";
    failed.phase = null;
    failed.processingPercent = void 0;
    failed.error = null;
    ui.updateQueueItem(failed.id, failed);
    processQueue();
    playDownloadAddedSound();
    return "queued";
  }
  if (await isDuplicateDownload(url, { scrape })) {
    console.info("[queue] duplicate skipped:", url);
    try {
      document.dispatchEvent(new CustomEvent("evd:download-duplicate", { detail: { url } }));
    } catch (e) {
    }
    return "duplicate";
  }
  if (downloadQueue.some((entry) => ACTIVE_QUEUE_STATES.includes(entry.state) && downloadKey(entry.url) === downloadKey(url)))
    return "duplicate";
  const item = {
    id: ++queueIdCounter,
    url,
    title: url,
    state: "waiting",
    progress: 0,
    speed: "",
    eta: "",
    phase: null,
    processingPercent: void 0,
    error: null,
    from: from && (from.screenName || from.name || from.id) ? from : null
  };
  downloadQueue.push(item);
  ui.appendQueueItem(item);
  processQueue();
  playDownloadAddedSound();
  return "queued";
}
function processQueue() {
  if (queuePaused)
    return;
  while (activeCount < getConcurrencyPref()) {
    const nextItem = downloadQueue.find((item) => item.state === "waiting");
    if (!nextItem)
      break;
    activeCount++;
    executeDownload(nextItem);
  }
}
function pauseAllDownloads() {
  queuePaused = true;
  for (const item of downloadQueue) {
    if (item.state === "preparing" || item.state === "downloading") {
      item.state = "waiting";
      item.progress = 0;
      item.speed = "";
      item.eta = "";
      item.phase = null;
      item.processingPercent = void 0;
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
function resumeAllDownloads() {
  queuePaused = false;
  ui.setQueuePaused(false);
  downloadQueue.forEach((item) => {
    if (item.state !== "error")
      return;
    item.state = "waiting";
    item.progress = 0;
    item.error = null;
    item.speed = "";
    item.eta = "";
    item.phase = null;
    item.processingPercent = void 0;
    ui.updateQueueItem(item.id, item);
  });
  processQueue();
}
async function probeTweetFailure(url) {
  const matched = String(url || "").match(/\/status(?:es)?\/(\d+)/);
  if (!matched)
    return "";
  const res = await getJson("https://api.fxtwitter.com/status/" + matched[1], {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      accept: "application/json"
    },
    timeout: 4e3
  });
  if (!res || !res.status)
    return "";
  if (res.status === 404)
    return "\u63A8\u6587\u4E0D\u5B58\u5728\u6216\u5DF2\u5220\u9664";
  if (res.status === 401 || res.status === 403) {
    return "\u63A8\u6587\u53D7\u4FDD\u62A4\uFF0C\u8D26\u53F7\u6240\u6709\u8005\u9650\u5236\u4E86\u53EF\u4EE5\u67E5\u770B\u5176\u5E16\u5B50\u7684\u7528\u6237";
  }
  if (res.status === 200) {
    const tweet = res.json && res.json.tweet;
    const videos = tweet && tweet.media && Array.isArray(tweet.media.videos) ? tweet.media.videos : [];
    if (!videos.length)
      return "\u8BE5\u63A8\u6587\u6CA1\u6709\u53EF\u4E0B\u8F7D\u7684\u89C6\u9891";
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
  if ((error == null ? void 0 : error.code) === "ENETBOUNDARY") {
    return i18next.t("error.blockedAddress");
  }
  if (isNetworkError(error)) {
    return i18next.t("error.networkUnavailable");
  }
  const msg = (error == null ? void 0 : error.message) || "";
  if (/Unsupported URL/i.test(msg)) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname === "dribbble.com" || hostname.endsWith(".dribbble.com")) {
        return i18next.t("error.dribbbleProtected");
      }
    } catch {
    }
    return i18next.t("error.unsupportedUrl");
  }
  if (/Video unavailable|This video is unavailable|Unable to download video/i.test(msg)) {
    return i18next.t("error.videoUnavailable");
  }
  if (/Private video|This video is private|Sign in to confirm/i.test(msg)) {
    return i18next.t("error.privateVideo");
  }
  if (isTwitterUrl(url) && /No video formats found|not authorized|TweetTombstone|requires authentication|No video could be found/i.test(msg)) {
    const real = await probeTweetFailure(url);
    if (real)
      return real;
  }
  return msg || i18next.t("download.failed");
}
async function executeDownload(item) {
  try {
    item.state = "preparing";
    ui.updateQueueItem(item.id, item);
    const videoInfo = await downloader.getVideoInfo(item.url);
    item.title = videoInfo.title || i18next.t("error.untitledVideo");
    // 转发 / 引用转发：媒体其实来自原帖。原帖已经在库里的话直接收工，
    // 否则同一条推文会被导成两份，Eagle 里也会标成重复文件。
    if (videoInfo && videoInfo.sourceUrl && videoInfo.sourceUrl !== item.url) {
      let alreadyInLibrary = false;
      try {
        alreadyInLibrary = await libraryIndex.hasSameLink(videoInfo.sourceUrl);
      } catch (e) {
        alreadyInLibrary = false;
      }
      if (alreadyInLibrary) {
        console.info("[queue] media already in library via source:", videoInfo.sourceUrl);
        item.state = "completed";
        item.progress = 100;
        item.speed = "";
        item.eta = "";
        item.phase = null;
        item.processingPercent = void 0;
        ui.updateQueueItem(item.id, item);
        recordDownloaded(item.url);
        recordDownloaded(videoInfo.sourceUrl);
        clearDownloadFailed(item.url);
        try {
          document.dispatchEvent(new CustomEvent("evd:download-duplicate", {
            detail: { url: item.url, sourceUrl: videoInfo.sourceUrl }
          }));
        } catch (e) {
        }
        return;
      }
    }
    item.state = "downloading";
    item.phase = null;
    item.processingPercent = void 0;
    item.eta = "";
    ui.updateQueueItem(item.id, item);
    const results = await downloader.downloadVideo(
      item.url,
      (progress) => {
        if (progress.phase) {
          item.phase = progress.phase;
          item.processingPercent = void 0;
        }
        if (typeof progress.processingPercent === "number")
          item.processingPercent = progress.processingPercent;
        if (typeof progress.percent === "number" && !progress.phase)
          item.progress = progress.percent;
        if (typeof progress.currentSpeed === "string")
          item.speed = progress.currentSpeed;
        if (typeof progress.eta === "string")
          item.eta = progress.eta;
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
    item.processingPercent = void 0;
    ui.updateQueueItem(item.id, item);
    errorLog.remove(item.url);
    for (const result of results) {
      const sourceUrl = getAutoAddSourcePref() ? item.url : void 0;
      await importToEagle(result.path, result.metadata, sourceUrl, {
        index: result.partIndex,
        total: result.partTotal
      });
      downloader.cleanup(result.path);
    }
    recordDownloaded(item.url);
    // 转发 / 引用转发：媒体其实来自原帖，把原帖也记一笔，
    // 这样原帖链接再出现在点赞或抓取里时不会再导入同一批文件
    for (const result of results) {
      const resolvedSource = result && result.metadata && result.metadata.sourceUrl;
      if (typeof resolvedSource === "string" && resolvedSource && resolvedSource !== item.url) {
        recordDownloaded(resolvedSource);
        break;
      }
    }
    clearDownloadFailed(item.url);
  } catch (error) {
    if (item.state === "waiting")
      return;
    item.state = "error";
    markDownloadFailed(item.url);
    item.error = await formatDownloadError(error, item.url);
    ui.updateQueueItem(item.id, item);
    errorLog.add({ url: item.url, title: item.title, error: item.error, from: item.from });
  } finally {
    activeCount--;
    processQueue();
  }
}
function retryDownload(id) {
  const item = downloadQueue.find((item2) => item2.id === id);
  if (!item || item.state !== "error")
    return;
  item.state = "waiting";
  item.progress = 0;
  item.error = null;
  item.speed = "";
  item.eta = "";
  item.phase = null;
  item.processingPercent = void 0;
  ui.updateQueueItem(item.id, item);
  processQueue();
}
async function copyError(id) {
  const item = downloadQueue.find((item2) => item2.id === id);
  if (!item || !item.error)
    return;
  try {
    await navigator.clipboard.writeText(item.error);
    ui.showCopiedErrorFeedback(id);
  } catch (error) {
    console.error("Failed to copy error:", error);
  }
}
async function checkForUpdateAndNotify() {
  try {
    const { hasUpdate } = await getYtDlpUpdateInfo();
    ui.updateDepsBadge(hasUpdate || !depsReady());
  } catch (e) {
    ui.updateDepsBadge(!depsReady());
  }
}
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
    threadCountPref: getThreadCountPref()
  });
  loadDepsInfo();
}
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
function loadYtdlpUpdateStatus() {
  ui.updateYtdlpCard("installed", { checkingUpdate: true });
  const latestVersion = getLatestYtDlpVersion();
  getInstalledYtDlpVersion().then((installedVersion) => {
    if (!installedVersion) {
      ui.updateYtdlpCard("missing");
      return;
    }
    if (installedVersion !== latestVersion) {
      ui.updateYtdlpCard("outdated", { installedVersion, latestVersion });
    } else {
      ui.updateYtdlpCard("latest", { version: installedVersion });
    }
  }).catch(() => {
  });
}
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
    reinstall: "deps.reinstalling"
  }[action] || "deps.updating";
  const doneKey = {
    install: "deps.doneInstalled",
    update: "deps.doneUpdated",
    reinstall: "deps.doneReinstalled"
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
async function copyUrl(id) {
  const item = downloadQueue.find((item2) => item2.id === id);
  if (!item)
    return;
  try {
    await navigator.clipboard.writeText(item.url);
    ui.showCopiedFeedback(id);
  } catch (error) {
    console.error("Failed to copy URL:", error);
  }
}
function deleteDownloadItem(id) {
  const index = downloadQueue.findIndex((entry) => entry.id === id);
  if (index < 0)
    return;
  if (!ui.canDeleteQueueItem(downloadQueue[index]))
    return;
  const url = downloadQueue[index].url;
  downloadQueue.splice(index, 1);
  ui.removeQueueItem(id);
  errorLog.remove(url);
  // 删掉的链接同时记进已见集合，避免下一轮抓取又把它捞回来
  try {
    twitterMonitor.markTweetSeen(url);
  } catch (e) {
  }
}
var WINDOW_SIZE_KEY = "evd.windowSize.v2";
function getSavedWindowSize() {
  try {
    const raw = localStorage.getItem(WINDOW_SIZE_KEY);
    if (!raw)
      return null;
    const size = JSON.parse(raw);
    const width = Number(size && size.width);
    const height = Number(size && size.height);
    if (!Number.isFinite(width) || !Number.isFinite(height))
      return null;
    if (width < 320 || height < 320 || width > 4e3 || height > 4e3)
      return null;
    return { width: Math.round(width), height: Math.round(height) };
  } catch (e) {
    return null;
  }
}
function saveWindowSize() {
  if (window.__evdApplyingWindowSize)
    return;
  try {
    const api = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;
    if (api && typeof api.getSize === "function") {
      Promise.resolve(api.getSize()).then((current) => {
        if (window.__evdApplyingWindowSize)
          return;
        const width = Math.round(Number(Array.isArray(current) ? current[0] : current && current.width));
        const height = Math.round(Number(Array.isArray(current) ? current[1] : current && current.height));
        if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)
          localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify({ width, height }));
      }).catch(() => {
      });
      return;
    }
    const width = Math.round(window.innerWidth);
    const height = Math.round(window.innerHeight);
    if (width > 0 && height > 0) {
      localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify({ width, height }));
    }
  } catch (e) {
  }
}
var DOWNLOAD_CORNER_KEY = "evd.downloadCornerMode";
var DOWNLOAD_CORNER_VALUES = ["default", "account"];
function getDownloadCornerMode() {
  try {
    let value = String(localStorage.getItem(DOWNLOAD_CORNER_KEY) || "default");
    if (value === "status" || value === "none")
      value = "default";
    if (DOWNLOAD_CORNER_VALUES.indexOf(value) >= 0)
      return value;
  } catch (e) {
  }
  return "default";
}
function setDownloadCornerMode(value) {
  const next = DOWNLOAD_CORNER_VALUES.indexOf(String(value)) >= 0 ? String(value) : "default";
  try {
    localStorage.setItem(DOWNLOAD_CORNER_KEY, next);
  } catch (e) {
  }
}
var SIDEBAR_ACCOUNT_KEY = "evd.showSidebarAccount";
function getShowSidebarAccount() {
  try {
    return localStorage.getItem(SIDEBAR_ACCOUNT_KEY) !== "0";
  } catch (e) {
    return true;
  }
}
function applySidebarAccountVisibility() {
  const el = document.getElementById("downloadAccount");
  const sep = document.getElementById("sidebarAccountSep");
  if (!el)
    return;
  const visible = getShowSidebarAccount();
  el.style.display = visible ? "" : "none";
  if (sep)
    sep.style.display = visible ? "" : "none";
}
function setShowSidebarAccount(value) {
  try {
    localStorage.setItem(SIDEBAR_ACCOUNT_KEY, value ? "1" : "0");
  } catch (e) {
  }
  applySidebarAccountVisibility();
}
function formatDownloadClock(timestamp) {
  const date = new Date(Number(timestamp) || 0);
  if (Number.isNaN(date.getTime()))
    return "";
  return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
}
function currentLibraryPath() {
  try {
    if (typeof eagle !== "undefined" && eagle && eagle.library && eagle.library.path)
      return String(eagle.library.path);
  } catch (e) {
  }
  return "";
}
function readScopedRaw(baseKey) {
  try {
    const libraryPath = currentLibraryPath();
    if (libraryPath) {
      const scoped = localStorage.getItem(baseKey + "::" + libraryPath.toLowerCase());
      if (scoped != null)
        return scoped;
    }
    return localStorage.getItem(baseKey);
  } catch (e) {
    return null;
  }
}
function readScopedJson(baseKey, fallback) {
  const raw = readScopedRaw(baseKey);
  if (raw == null)
    return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function renderDownloadAccount() {
  const nameEl = document.getElementById("downloadAccountName");
  const avatarEl = document.getElementById("downloadAccountAvatar");
  const rightEl = document.getElementById("downloadAccountRight");
  if (!nameEl || !avatarEl || !rightEl)
    return;
  let profile = null;
  try {
    profile = readScopedJson("Edge-Media-Download-NEW.twitterProfile", null);
  } catch (e) {
  }
  const connected = !!(profile && profile.screenName);
  nameEl.textContent = connected ? profile.name || profile.screenName : "未连接推特账号";
  const avatarUrl = connected ? profile.avatarData || profile.avatar || "" : "";
  if (avatarUrl) {
    avatarEl.style.backgroundImage = 'url("' + String(avatarUrl).replace(/"/g, "%22") + '")';
    avatarEl.textContent = "";
  } else {
    avatarEl.style.backgroundImage = "";
    avatarEl.textContent = connected ? String(profile.name || profile.screenName || "?").slice(0, 1).toUpperCase() : "";
  }
  const rightText = connected ? "@" + profile.screenName : "";
  rightEl.textContent = rightText;
  rightEl.style.display = rightText ? "" : "none";
}
function setupDownloadAccountStrip() {
  applySidebarAccountVisibility();
  renderDownloadAccount();
  window.setInterval(renderDownloadAccount, 3000);
  const showToggle = document.getElementById("showSidebarAccountToggle");
  if (showToggle) {
    showToggle.checked = getShowSidebarAccount();
    showToggle.addEventListener("change", (e) => {
      setShowSidebarAccount(!!e.target.checked);
    });
  }
  window.addEventListener("evd:panel", renderDownloadAccount);
  const select = document.getElementById("downloadCornerMode");
  if (select) {
    select.value = getDownloadCornerMode();
    select.addEventListener("change", (e) => {
      setDownloadCornerMode(e.target.value);
      renderDownloadAccount();
    });
  }
}
function setupWindowState() {
  try {
    localStorage.removeItem(WINDOW_SIZE_KEY);
  } catch (e) {
  }
}
var INGEST_PORT = 43110;
var INGEST_ALLOWED_HOSTS = ["x.com", "twitter.com", "mobile.twitter.com", "video.twimg.com", "pbs.twimg.com", "sankaku.app", "sankakucomplex.com", "xiaohongshu.com", "xhslink.com"];
function isIngestUrlAllowed(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.protocol !== "https:")
      return false;
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
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}
var peersCache = { at: 0, list: [] };
function getLocalSubnets() {
  const subnets = /* @__PURE__ */ new Set();
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
        if (body.length > 4096)
          res.destroy();
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json && json.app === "eagle-video-downloader") {
            resolve({ ip, name: json.name || ip, ready: !!json.ready });
            return;
          }
        } catch (e) {
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
async function scanLanPeers(force) {
  const now = Date.now();
  if (!force && peersCache.list.length && now - peersCache.at < 3e4)
    return peersCache.list;
  const selfIps = /* @__PURE__ */ new Set();
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const info of interfaces[name] || []) {
        if (info.family === "IPv4" && info.address)
          selfIps.add(info.address);
      }
    }
  } catch (e) {
  }
  const targets = [];
  for (const subnet of getLocalSubnets()) {
    for (let host = 1; host <= 254; host++) {
      const ip = subnet + "." + host;
      if (!selfIps.has(ip))
        targets.push(ip);
    }
  }
  if (!targets.length)
    return [];
  const peers = [];
  const concurrency = 64;
  for (let index = 0; index < targets.length; index += concurrency) {
    const batch = targets.slice(index, index + concurrency);
    const results = await Promise.all(batch.map((ip) => probePeer(ip)));
    for (const item of results) {
      if (item)
        peers.push(item);
    }
    if (peers.length >= 20)
      break;
  }
  peersCache = { at: Date.now(), list: peers };
  return peers;
}
function startIngestBridge() {
  if (startIngestBridge.server)
    return startIngestBridge.server;
  let http;
  try {
    http = require("http");
  } catch (e) {
    return null;
  }
  if (!http || typeof http.createServer !== "function")
    return null;
  const server = http.createServer((req, res) => {
    const pathname = String(req.url || "/").split("?")[0];
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }
    if (pathname === "/ping") {
      let name = "";
      try {
        name = require("os").hostname();
      } catch (e) {
      }
      writeBridgeResponse(res, 200, { ok: true, app: "eagle-video-downloader", ready: !!isInitialized, name });
      return;
    }
    if (pathname === "/peers") {
      scanLanPeers().then((peers) => writeBridgeResponse(res, 200, { ok: true, peers })).catch(() => writeBridgeResponse(res, 200, { ok: true, peers: [] }));
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
      if (tooLarge)
        return;
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
      writeBridgeResponse(res, 200, { ok: true, url: target });
    });
    req.on("error", () => {
    });
  });
  server.on("error", (error) => {
    console.warn("[ingest] bridge error:", error && error.message);
  });
  server.listen(INGEST_PORT, "0.0.0.0");
  startIngestBridge.server = server;
  return server;
}
function setupPinButton() {
  const pinButton = document.getElementById("pinBtn");
  if (!pinButton)
    return;
  const STORAGE_KEY = "evd.alwaysOnTop";
  const api = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;
  const render = (pinned2) => {
    pinButton.classList.toggle("active", pinned2);
    pinButton.setAttribute("aria-pressed", pinned2 ? "true" : "false");
  };
  const apply = async (pinned2) => {
    try {
      if (api && typeof api.setAlwaysOnTop === "function") {
        await api.setAlwaysOnTop(pinned2);
      }
    } catch (e) {
      console.error("Failed to set always on top:", e);
      return;
    }
    render(pinned2);
    try {
      localStorage.setItem(STORAGE_KEY, pinned2 ? "1" : "0");
    } catch (e) {
    }
  };
  let pinned = false;
  try {
    pinned = localStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {
  }
  render(pinned);
  if (pinned)
    apply(true);
  pinButton.addEventListener("click", () => {
    pinned = !pinned;
    apply(pinned);
  });
}
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
  setTwitterMultiFilePref
};
