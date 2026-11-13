/**
 * UI 适配层：把插件的引擎状态投影到「Eagle 原生偏好设置样式」的界面上。
 * 界面元素本身由 Plugin/ui-shell.js 负责，这里只做状态、文案与记忆。
 * 文案与静态界面保持一致：全部中文，不随 Eagle 语言切换。
 */

const sankakuAuth = require("./sankaku-auth");
const twitterAuth = require("./twitter-auth");
const twitterMonitor = require("./twitter-monitor");
const twitterName = require("./twitter-name");
const { scopedKey } = require("./library-context");

const INTERVAL_CHOICE_KEY = "eagle-video-downloader.twitterIntervalChoice";
const THEME_FOLLOW_KEY = "eagle-video-downloader.followEagleTheme";
const THEME_KEY = "eagle-video-downloader.theme";
const THEME_NAMES = ["light", "lightgray", "gray", "dark", "blue", "purple"];

function shell() {
  return (typeof window !== "undefined" && window.EVDUI) || null;
}

function el(id) {
  return document.getElementById(id);
}

/* ---------------- 间隔与主题记忆 ---------------- */

function getIntervalChoice() {
  try {
    const raw = localStorage.getItem(scopedKey(INTERVAL_CHOICE_KEY));
    if (raw === null) return null;
    return Number(raw) || 0;
  } catch (e) {
    return null;
  }
}

function setIntervalChoice(minutes) {
  try {
    localStorage.setItem(scopedKey(INTERVAL_CHOICE_KEY), String(Number(minutes) || 0));
  } catch (e) {
    // 忽略写入失败
  }
}

function getFollowEagleTheme() {
  const value = localStorage.getItem(THEME_FOLLOW_KEY);
  return value === null ? true : value === "true";
}

function getManualTheme() {
  const value = localStorage.getItem(THEME_KEY);
  return THEME_NAMES.includes(value) ? value : "gray";
}

function eagleThemeName() {
  const support = {
    AUTO: eagle.app.isDarkColors() ? "gray" : "light",
    LIGHT: "light",
    LIGHTGRAY: "lightgray",
    GRAY: "gray",
    DARK: "dark",
    BLUE: "blue",
    PURPLE: "purple",
  };
  try {
    return support[String(eagle.app.theme).toUpperCase()] || "gray";
  } catch (e) {
    return "gray";
  }
}

function currentThemeName() {
  return getFollowEagleTheme() ? eagleThemeName() : getManualTheme();
}

function syncThemeControls(themeName) {
  const follow = getFollowEagleTheme();
  const toggle = el("followThemeToggle");
  if (toggle) toggle.checked = follow;
  Array.prototype.forEach.call(document.querySelectorAll(".themes-picker .theme"), (sw) => {
    sw.classList.toggle("active", sw.dataset.theme === (themeName || currentThemeName()));
  });
}

function setupThemeControls() {
  syncThemeControls();
}

function updateTheme() {
  const name = currentThemeName();
  const ui = shell();
  if (ui) ui.setTheme(name);
  else document.body.setAttribute("theme", name);
  syncThemeControls(name);
}

function setFollowEagleTheme(value) {
  localStorage.setItem(THEME_FOLLOW_KEY, String(!!value));
  if (!value) localStorage.setItem(THEME_KEY, eagleThemeName());
  updateTheme();
}

function setManualTheme(name) {
  if (!THEME_NAMES.includes(name)) return;
  localStorage.setItem(THEME_KEY, name);
  localStorage.setItem(THEME_FOLLOW_KEY, "false");
  updateTheme();
}

/* ---------------- 面板与门槛 ---------------- */

function showMainUI() {
  const ui = shell();
  // 带 #view 打开（本地预览/调试）时尊重指定的面板，其余情况回到下载页
  const hashView = (location.hash || "").replace("#", "");
  if (hashView && /^(download|settings|tags|dependencies|account)$/.test(hashView)) return;
  if (ui && ui.currentPanel() !== "download") ui.showPanel("download", false);
}

function switchSubpageTab(tab) {
  const ui = shell();
  if (!ui) return;
  const map = { settings: "settings", tags: "tags", dependencies: "dependencies", account: "account" };
  if (map[tab]) ui.showPanel(map[tab], false);
}

function setDepsGating(gating) {
  const downloadBtn = el("downloadBtn");
  if (downloadBtn) downloadBtn.classList.toggle("disabled", !!gating);
  if (gating) switchSubpageTab("dependencies");
}

function hideDepsPage() {
  setDepsGating(false);
  const ui = shell();
  if (ui && ui.currentPanel() !== "download") ui.showPanel("download", false);
}

function updateDepsBadge(hasNotice) {
  // 新界面没有齿轮红点位置，依赖状态直接在依赖页展示，这里保持接口兼容
}

/* ---------------- 输入栏 ---------------- */

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "https:";
  } catch (e) {
    return false;
  }
}

function setupInputBar() {
  // 事件在 plugin.js 中绑定，这里保持接口兼容
}

let tipTimer = null;
function showTip(message) {
  const btn = el("downloadBtn");
  if (!btn) return;
  let tip = document.querySelector(".evd-tip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "evd-tip";
    tip.style.cssText = "position:absolute;right:12px;bottom:58px;z-index:9;max-width:360px;padding:6px 8px;" +
      "font-size:12px;line-height:16px;border-radius:6px;background:var(--color-bg-active, #2a2b2f);" +
      "color:var(--color-text-primary, #f8f9fb);box-shadow:0 2px 10px rgba(0,0,0,.28)";
    document.body.appendChild(tip);
  }
  tip.textContent = message;
  tip.hidden = false;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { if (tip) tip.hidden = true; }, 2600);
}

function setInputBarState(state, errorMessage = "") {
  if (state === "error") showTip(errorMessage || "链接无效");
}

/* ---------------- 下载队列 ---------------- */

function canDeleteQueueItem(item) {
  return !!item && item.state !== "preparing" && item.state !== "downloading";
}

function queueStatusText(item) {
  const state = item.state;
  if (state === "waiting") return "等待中";
  if (state === "preparing") return "正在获取媒体信息…";
  if (state === "completed") return "已完成";
  if (state === "error") return "下载失败";
  if (item.phase === "merge" || item.phase === "convert") {
    const label = item.phase === "merge" ? "合并中" : "转码中";
    return typeof item.processingPercent === "number"
      ? `${label} ${Math.round(item.processingPercent)}%`
      : `${label}…`;
  }
  if (state === "downloading") {
    const parts = ["下载中"];
    if (typeof item.progress === "number") parts.push(`${item.progress.toFixed(1)}%`);
    if (item.speed) parts.push(item.speed);
    return parts.join(" · ");
  }
  return "等待中";
}

function queueEtaText(item) {
  if (item.state === "error") return friendlyError(item.error || "");
  if (item.eta) return `剩余 ${item.eta}`;
  return "";
}

/** 把 yt-dlp 的长英文报错压成一行中文原因 */
function friendlyError(raw) {
  const text = String(raw || "")
    .replace(/^下载失败[：:]\s*/, "")
    .replace(/^yt-dlp\s*退出，代码\s*\d+[：:]\s*/, "")
    .replace(/^ERROR:\s*/, "")
    .trim();
  if (!text) return "";
  if (/No video formats found/i.test(text)) return "没有可下载的视频格式";
  if (/not authorized to view this protected tweet|protected account/i.test(text)) {
    return "推文受保护，需在账号页填写 Cookie";
  }
  if (/media could not be|unsupported URL|no video|There is no video/i.test(text)) {
    return "该推文没有可下载的视频";
  }
  if (/HTTP Error 404|status: 404|not found/i.test(text)) return "推文不存在或已被删除";
  if (/HTTP Error 403|HTTP Error 401/i.test(text)) return "没有访问权限，检查 Cookie";
  if (/timed out|ETIMEDOUT|socket hang up|ECONNRESET/i.test(text)) return "网络超时，可点重试";
  const cleaned = text.replace(/^\[[^\]]+\]\s*[^:]*:\s*/, "").replace(/\s+/g, " ");
  return cleaned.length > 60 ? cleaned.slice(0, 60) + "…" : cleaned;
}

/** 队列标题：把裸链接 / twitter video #id 这类占位标题换成可读文案 */
function displayTitle(item) {
  const raw = String((item && item.title) || "").trim();
  const url = String((item && item.url) || "");
  const idMatch = (raw + " " + url).match(/\/status(?:es)?\/(\d+)|\b(twitter\s*video)\s*#(\d+)/i);
  const id = idMatch ? (idMatch[1] || idMatch[3] || "") : "";
  const isPlaceholder = !raw || /^https?:\/\//i.test(raw) || /^twitter\s*video\s*#?\d*/i.test(raw) || /^x\.com\/i\/status/i.test(raw);
  if (isPlaceholder && id) return `推文 #${id}`;
  if (isPlaceholder && raw) {
    const short = raw.replace(/^https?:\/\//i, "");
    return short.length > 60 ? short.slice(0, 60) + "…" : short;
  }
  return raw;
}

function queueProgress(item) {
  const isProcessing = item.state === "downloading" && (item.phase === "merge" || item.phase === "convert");
  if (isProcessing) return typeof item.processingPercent === "number" ? item.processingPercent : 100;
  return item.progress || 0;
}

function toRowData(item) {
  return {
    id: item.id,
    title: displayTitle(item),
    state: item.state,
    status: queueStatusText(item),
    eta: queueEtaText(item),
    progress: queueProgress(item),
    from: item.from || null,
  };
}

function appendQueueItem(item) {
  const ui = shell();
  if (ui) ui.addQueueItem(toRowData(item));
}

function updateQueueItem(id, data) {
  const ui = shell();
  if (ui) ui.updateQueueItem(id, toRowData(data));
}

function removeQueueItem(id) {
  const ui = shell();
  if (ui) ui.removeQueueItem(id);
}

function setQueuePaused(paused) {
  const ui = shell();
  if (ui && typeof ui.setQueuePaused === "function") ui.setQueuePaused(paused);
}

function findQueueButton(id, action) {
  const row = document.querySelector(`.download-item[data-id="${id}"]`);
  if (!row) return null;
  return row.querySelector(`.link-btn[data-act="${action}"]`);
}

function showCopiedFeedback(id) {
  const ui = shell();
  const btn = findQueueButton(id, "copy");
  if (ui && btn) ui.flashButton(btn, "已复制");
}

function showCopiedErrorFeedback(id) {
  const ui = shell();
  const btn = findQueueButton(id, "copyError");
  if (ui && btn) ui.flashButton(btn, "已复制");
}

/* ---------------- 依赖 ---------------- */

function depEls(prefix) {
  return {
    state: el(prefix + "State"),
    progress: el(prefix + "Progress"),
    bar: el(prefix + "Bar"),
    check: el(prefix + "Check"),
    reinstall: el(prefix + "Reinstall"),
    uninstall: el(prefix + "Uninstall"),
  };
}

function setDepState(node, text, tone) {
  if (!node) return;
  node.textContent = text;
  node.className = "value dep-state" + (tone ? " " + tone : "");
}

function setDepButtons(prefix, { check, reinstall, uninstall, reinstallLabel }) {
  // 按依赖状态显示/隐藏按钮：未安装时只剩「安装」，运行中全部隐藏，
  // 与旧版下载器的 dep-actions 行为保持一致。
  const d = depEls(prefix);
  const toggle = (node, visible) => {
    if (!node) return;
    node.hidden = !visible;
    node.style.display = visible ? "" : "none";
  };

  toggle(d.check, check);
  toggle(d.reinstall, reinstall);
  toggle(d.uninstall, uninstall);

  if (d.reinstall && reinstall) {
    d.reinstall.textContent = reinstallLabel || (prefix === "ffmpeg" ? "安装 FFmpeg 依赖" : "重新安装");
  }

  const container = (d.reinstall || d.check || d.uninstall || {}).parentElement;
  if (container) {
    const anyVisible = [d.check, d.reinstall, d.uninstall].some((node) => node && !node.hidden);
    container.style.display = anyVisible ? "" : "none";
  }
}

function updateYtdlpCard(state, data = {}) {
  const d = depEls("ytdlp");
  if (!d.state) return;
  if (d.progress) d.progress.hidden = true;
  if (d.bar) d.bar.style.width = "0%";

  switch (state) {
    case "checking":
      setDepState(d.state, "检查中…", "");
      setDepButtons("ytdlp", { check: false, reinstall: false, uninstall: false });
      break;
    case "installed":
    case "latest":
      setDepState(d.state, "已是最新版", "ok");
      setDepButtons("ytdlp", { check: true, reinstall: true, uninstall: true });
      break;
    case "outdated":
      setDepState(d.state, `有新版本 ${data.latestVersion || ""}`.trim(), "warn");
      setDepButtons("ytdlp", { check: true, reinstall: true, uninstall: true });
      break;
    case "missing":
      setDepState(d.state, "未安装", "warn");
      setDepButtons("ytdlp", { check: false, reinstall: true, uninstall: false, reinstallLabel: "安装" });
      break;
    case "busy": {
      const pct = Math.round(data.percent || 0);
      setDepState(d.state, data.statusText || "更新中…", "");
      if (d.progress) d.progress.hidden = false;
      if (d.bar) d.bar.style.width = pct + "%";
      setDepButtons("ytdlp", { check: false, reinstall: false, uninstall: false });
      break;
    }
    case "done":
      setDepState(d.state, data.statusText || "已安装", "ok");
      setDepButtons("ytdlp", { check: true, reinstall: true, uninstall: true, reinstallLabel: "重新安装" });
      break;
    case "error":
    default:
      setDepState(d.state, "安装失败", "warn");
      setDepButtons("ytdlp", { check: false, reinstall: true, uninstall: false, reinstallLabel: "重试" });
      break;
  }
}

function updateFfmpegCard(state, data = {}) {
  const d = depEls("ffmpeg");
  if (!d.state) return;
  if (d.progress) d.progress.hidden = true;

  if (state === "checking") {
    setDepState(d.state, "检查中…", "");
  } else if (state === "eagle") {
    setDepState(d.state, "Eagle 内置", "ok");
    setDepButtons("ffmpeg", { check: false, reinstall: false });
  } else {
    setDepState(d.state, "未找到", "warn");
    setDepButtons("ffmpeg", { check: false, reinstall: true });
  }
}

/* ---------------- 推特三列规则 ---------------- */

let tagJoinState = [];

function applyTwitterNameOrder(order) {
  const ui = shell();
  if (ui) ui.applyOrder("name", twitterName.normalizeOrder(order));
}

function applyTwitterAnnotationOrder(order) {
  const ui = shell();
  if (ui) ui.applyOrder("annotation", twitterName.normalizeOrder(order));
}

function applyTwitterTagsOrder(order, join) {
  const ui = shell();
  if (!ui) return;
  ui.applyOrder("tags", twitterName.normalizeOrder(order));
  if (Array.isArray(join)) tagJoinState = twitterName.normalizeJoin(join);
  ui.applyJoin(tagJoinState);
}

function refreshTwitterTagJoins(join) {
  if (Array.isArray(join)) tagJoinState = twitterName.normalizeJoin(join);
  const ui = shell();
  if (ui) ui.applyJoin(tagJoinState);
}

/* ---------------- 账号 ---------------- */

/* ---------------- 账号卡：Cookie 输入收纳 ---------------- */

const ACCOUNT_EDITOR_KEY = "eagle-video-downloader.twitterEditorExpanded";
let accountEditorExpanded = readAccountEditorPref();
let lastAccountConnected = null;

function readAccountEditorPref() {
  try {
    const raw = localStorage.getItem(scopedKey(ACCOUNT_EDITOR_KEY));
    return raw === null ? null : raw === "1";
  } catch (e) {
    return null;
  }
}

function writeAccountEditorPref(expanded) {
  try {
    localStorage.setItem(scopedKey(ACCOUNT_EDITOR_KEY), expanded ? "1" : "0");
  } catch (e) {
    /* 忽略存储失败 */
  }
}

function applyAccountEditor(connected) {
  const editor = el("cookieEditor");
  const toggle = el("accountToggle");
  if (!editor) return;
  if (!connected) {
    accountEditorExpanded = true;
  } else if (lastAccountConnected !== connected) {
    /* 首次进入已连接状态（含刚保存 Cookie 成功）：自动收起输入框 */
    accountEditorExpanded = false;
  } else if (accountEditorExpanded === null) {
    accountEditorExpanded = false;
  }
  lastAccountConnected = connected;
  editor.hidden = !accountEditorExpanded;
  const logout = el("twitterClear");
  if (logout) logout.hidden = !connected;
  if (toggle) {
    toggle.classList.toggle("is-expanded", !!accountEditorExpanded);
    toggle.setAttribute("aria-expanded", String(!!accountEditorExpanded));
    toggle.setAttribute("title", accountEditorExpanded ? "收起 Cookie 输入" : "展开 Cookie 输入");
  }
}

function setupAccountToggle() {
  const toggle = el("accountToggle");
  if (!toggle || toggle.dataset.bound === "1") return;
  toggle.dataset.bound = "1";
  const flip = () => {
    const editor = el("cookieEditor");
    if (!editor) return;
    const willExpand = !!editor.hidden;
    accountEditorExpanded = willExpand;
    writeAccountEditorPref(willExpand);
    applyAccountEditor(lastAccountConnected === true);
  };
  toggle.addEventListener("click", flip);
  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flip();
    }
  });
}

function renderTwitterProfile(profile) {
  const avatarEl = el("twitterAvatar");
  const nameEl = el("twitterName");
  const handleEl = el("twitterHandle");
  if (!avatarEl && !nameEl) return;
  const data = profile || twitterMonitor.getSavedProfile();
  if (!data || (!data.screenName && !data.name)) {
    if (nameEl) nameEl.textContent = "未连接账号";
    if (handleEl) handleEl.textContent = "未连接 · 保存 Cookie 后显示真实头像与名称";
    if (avatarEl) avatarEl.style.backgroundImage = "";
    applyAccountEditor(false);
    return;
  }
  const src = data.avatarData || data.avatar;
  if (avatarEl) {
    if (src) {
      avatarEl.style.backgroundImage = `url("${src}")`;
      avatarEl.style.backgroundSize = "cover";
    } else {
      avatarEl.style.backgroundImage = "";
    }
  }
  if (nameEl) nameEl.textContent = data.name || (data.screenName ? "@" + data.screenName : "已连接");
  if (handleEl) handleEl.textContent = data.screenName ? "@" + data.screenName : "已连接";
  applyAccountEditor(true);
}

function applySourceCheckboxes() {
  const likes = el("twitterMonitorLikes");
  const bookmarks = el("twitterMonitorBookmarks");
  const dm = el("twitterMonitorDm");
  const prefs = twitterMonitor.getPrefs();
  if (likes) likes.checked = prefs.likes !== false;
  if (bookmarks) bookmarks.checked = prefs.bookmarks !== false;
  if (dm) dm.checked = prefs.dm !== false;
}

function updateChatHint(count, total, encrypted) {
  const hint = el("chatHint");
  if (!hint) return;
  const totalText = typeof total === "number" && total > 0 ? "共 " + total + " 个聊天；" : "";
  const encryptedText =
    typeof encrypted === "number" && encrypted > 0 ? "其中 " + encrypted + " 个是加密聊天（仅能显示，读不到里面的链接）；" : "";
  hint.textContent = count
    ? totalText + encryptedText + "已选择 " + count + " 个聊天，只抓取这些聊天里好友发来的链接"
    : totalText + encryptedText + "未选择时抓取所有聊天；勾选后只抓取所选聊天里好友发来的链接";
}

function persistChatSelection() {
  const list = el("chatList");
  if (!list) return;
  const ids = Array.from(list.querySelectorAll('input[type="checkbox"]'))
    .filter((input) => input.checked)
    .map((input) => input.value);
  twitterMonitor.setPrefs({ dmChats: ids });
  const chats = twitterMonitor.getCachedConversations();
  updateChatHint(ids.length, chats.length, chats.filter((chat) => chat.encrypted).length);
}

function renderChatList() {
  const list = el("chatList");
  if (!list) return;
  const prefs = twitterMonitor.getPrefs();
  const selected = new Set((prefs.dmChats || []).map(String));
  const chats = twitterMonitor.getCachedConversations();
  const connected = twitterAuth.hasAuth();

  list.textContent = "";
  if (!chats.length) {
    const empty = document.createElement("div");
    empty.className = "chat-empty";
    empty.textContent = connected ? "点「刷新列表」获取聊天" : "保存 Cookie 后可选择聊天";
    list.appendChild(empty);
    updateChatHint(selected.size, chats.length);
    return;
  }

  chats.forEach((chat) => {
    const row = document.createElement("label");
    row.className = "chat-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = String(chat.id);
    input.checked = selected.has(String(chat.id));
    input.addEventListener("change", persistChatSelection);
    row.appendChild(input);

    const check = document.createElement("span");
    check.className = "chat-check";
    row.appendChild(check);

    const avatar = document.createElement("img");
    if (chat.avatarData) avatar.src = chat.avatarData;
    else avatar.style.display = "none";
    row.appendChild(avatar);

    const name = document.createElement("span");
    name.className = "chat-name";
    name.textContent = chat.name || chat.screenName || "未知聊天";
    row.appendChild(name);

    const handle = document.createElement("span");
    handle.className = "chat-handle";
    handle.textContent = (chat.screenName ? "@" + chat.screenName : "") + (chat.encrypted ? " · 加密" : "");
    row.appendChild(handle);

    list.appendChild(row);
  });
  updateChatHint(selected.size, chats.length, chats.filter((chat) => chat.encrypted).length);
}

async function refreshChatList() {
  const hint = el("chatHint");
  const button = el("chatRefresh");
  if (!twitterAuth.hasAuth()) {
    if (hint) hint.textContent = "保存 Cookie 后才能读取聊天列表";
    return;
  }
  if (button) button.classList.add("is-loading");
  if (hint) hint.textContent = "正在读取聊天列表…";
  let result = null;
  try {
    result = await twitterMonitor.refreshConversations();
  } catch (error) {
    result = { ok: false, error: (error && error.message) || "error", items: [] };
  }
  if (button) button.classList.remove("is-loading");
  if (!result || result.ok === false) {
    const errorText = (result && result.error) === "no-cookie" ? "保存 Cookie 后才能读取聊天列表" : "读取失败：" + ((result && result.error) || "error");
    renderChatList();
    if (hint) hint.textContent = errorText;
    return;
  }
  renderChatList();
}

function setupChatPicker() {
  const button = el("chatRefresh");
  if (button && !button.dataset.bound) {
    button.dataset.bound = "1";
    button.addEventListener("click", refreshChatList);
  }
}

function applyIntervalSelect() {
  const select = el("monitorInterval");
  if (!select) return;
  const prefs = twitterMonitor.getPrefs();
  const savedChoice = getIntervalChoice();
  const minutes = savedChoice === null
    ? (prefs.enabled ? Math.max(2, Math.round((prefs.ms || 600000) / 60000)) : 0)
    : savedChoice;
  const values = Array.from(select.options).map((option) => Number(option.value));
  let chosen = values.includes(minutes) ? minutes : 0;
  if (!chosen && minutes) {
    const positives = values.filter((value) => value > 0);
    chosen = positives.reduce((best, value) => (Math.abs(value - minutes) < Math.abs(best - minutes) ? value : best), positives[0]);
  }
  select.value = String(chosen || 0);
}

function refreshAccountFields() {
  const sankakuInput = el("sankakuToken");
  if (sankakuInput) sankakuInput.value = sankakuAuth.getStoredAuth() || "";
  const sankakuStatus = el("sankakuAuthStatus");
  if (sankakuStatus) sankakuStatus.textContent = "";

  const token = el("authToken");
  const ct0 = el("ct0");
  if (token || ct0) {
    const parts = twitterAuth.splitCookie();
    if (token) token.value = parts.authToken;
    if (ct0) ct0.value = parts.ct0;
  }
  const passcode = el("chatPasscode");
  if (passcode) passcode.value = twitterMonitor.getPrefs().chatPasscode || "";

  applyIntervalSelect();
  applySourceCheckboxes();
  renderChatList();
  setupChatPicker();

  const status = el("twitterAuthStatus");
  if (status) status.textContent = twitterAuth.hasAuth() ? "Cookie 已保存" : "";
  setupAccountToggle();
  renderTwitterProfile();
}

function autoGrowTextarea() {
  // 新界面使用单行输入，保留接口兼容
}

/* ---------------- 偏好页填充 ---------------- */

const RULE_FIELDS = ["authorId", "tweetId", "screenName", "text", "name"];

function hydrateColumns(opts) {
  const columns = {
    name: opts.twitterNamePref,
    annotation: opts.twitterAnnotationPref,
    tags: opts.twitterTagsPref,
  };
  Object.keys(columns).forEach((key) => {
    const pref = columns[key];
    if (!pref) return;
    RULE_FIELDS.forEach((field) => {
      if (typeof pref[field] !== "boolean") return;
      const ui = shell();
      if (ui) ui.setColumnChecked(key, field, pref[field]);
    });
    const ui = shell();
    if (!ui) return;
    if (Array.isArray(pref.order)) ui.applyOrder(key, pref.order);
    if (key === "tags" && Array.isArray(pref.join)) ui.applyJoin(pref.join);
  });
}

function hydrateControls(opts) {
  const bindCheck = (id, value) => {
    const node = el(id);
    if (node && typeof value === "boolean") node.checked = value;
  };
  const bindSelect = (id, value) => {
    const node = el(id);
    if (node && value != null) node.value = String(value);
  };

  bindCheck("autoAddSourceToggle", opts.autoAddSourcePref);
  bindCheck("xhsTagsToggle", opts.xhsTagsPref);
  bindCheck("xhsMultiFileToggle", opts.xhsMultiFilePref);
  bindCheck("twMultiFileToggle", opts.twitterMultiFilePref);
  bindSelect("maxResolution", opts.maxResolutionPref);
  bindSelect("maxFramerate", opts.maxFrameratePref);
  bindSelect("threadCount", opts.threadCountPref);
}

function showDepsPage(options = {}) {
  const { tab = "settings", gating = false } = options;
  hydrateControls(options);
  hydrateColumns(options);
  applyIntervalSelect();
  refreshAccountFields();
  setupThemeControls();
  switchSubpageTab(gating ? "dependencies" : tab);
  setDepsGating(gating);
}

module.exports = {
  updateTheme,
  showMainUI,
  showTip,
  isValidUrl,
  setupInputBar,
  setInputBarState,
  appendQueueItem,
  updateQueueItem,
  setQueuePaused,
  showCopiedFeedback,
  showCopiedErrorFeedback,
  canDeleteQueueItem,
  removeQueueItem,
  showDepsPage,
  hideDepsPage,
  setDepsGating,
  switchSubpageTab,
  autoGrowTextarea,
  applyTwitterNameOrder,
  applyTwitterAnnotationOrder,
  applyTwitterTagsOrder,
  refreshTwitterTagJoins,
  refreshAccountFields,
  applyIntervalSelect,
  getIntervalChoice,
  setIntervalChoice,
  applySourceCheckboxes,
  renderTwitterProfile,
  renderChatList,
  refreshChatList,
  friendlyError,
  displayTitle,
  updateDepsBadge,
  updateYtdlpCard,
  updateFfmpegCard,
  setupThemeControls,
  getFollowEagleTheme,
  setFollowEagleTheme,
  setManualTheme,
};
