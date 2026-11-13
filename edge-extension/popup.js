/* 媒体下载器 — 弹窗状态 */

/* 当前标签页属于哪个网站 */
const SITE_MAP = [
  { sel: "#siteTwitter", test: /(^|\.)(x\.com|twitter\.com)$/i },
  { sel: "#siteSankaku", test: /sankaku(?:complex)?\.(?:app|com)$/i },
  { sel: "#siteXhs", test: /(^|\.)(xiaohongshu\.com|xhslink\.com)$/i },
];

function detectCurrentSite() {
  SITE_MAP.forEach((item) => {
    const el = document.querySelector(item.sel);
    if (el) el.classList.remove("current");
  });

  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs && tabs[0] && tabs[0].url ? tabs[0].url : "";
      if (!url) return;
      let host = "";
      try {
        host = new URL(url).hostname.toLowerCase();
      } catch (e) {
        return;
      }
      const hit = SITE_MAP.find((item) => item.test.test(host));
      if (!hit) return;
      const el = document.querySelector(hit.sel);
      if (el) el.classList.add("current");
    });
  } catch (e) {
    // ignore
  }
}

async function refresh() {
  const dot = document.getElementById("pluginDot");
  const text = document.getElementById("pluginText");
  if (!dot || !text) return;
  dot.className = "dot";
  text.textContent = "检测中";

  let result = null;
  try {
    result = await chrome.runtime.sendMessage({ type: "ping" });
  } catch (e) {
    result = null;
  }

  if (result && result.plugin && result.plugin.ok) {
    if (result.plugin.ready) {
      dot.className = "dot ok";
      text.textContent = "已连接";
    } else {
      dot.className = "dot warn";
      text.textContent = "依赖未就绪";
    }
    return;
  }
  dot.className = "dot err";
  text.textContent = "未连接";
}

/* 点赞 / 收藏推送开关 */
const likePush = document.getElementById("likePush");
const bookmarkPush = document.getElementById("bookmarkPush");

function loadSwitches() {
  try {
    chrome.storage.local.get({ evdLikePush: true, evdBookmarkPush: true }, (values) => {
      if (likePush) likePush.checked = values.evdLikePush !== false;
      if (bookmarkPush) bookmarkPush.checked = values.evdBookmarkPush !== false;
    });
  } catch (e) {
    // ignore
  }
}

if (likePush) {
  likePush.addEventListener("change", () => {
    chrome.storage.local.set({ evdLikePush: likePush.checked });
  });
}

if (bookmarkPush) {
  bookmarkPush.addEventListener("change", () => {
    chrome.storage.local.set({ evdBookmarkPush: bookmarkPush.checked });
  });
}

/* 局域网发送：只把链接发给同网段设备，不在本机下载 */
const lanDevices = document.getElementById("lanDevices");
const lanStatus = document.getElementById("lanStatus");
const lanCount = document.getElementById("lanCount");
const lanSend = document.getElementById("lanSend");
const lanRefresh = document.getElementById("lanRefresh");

function setLanStatus(text) {
  if (lanStatus) lanStatus.textContent = text || "";
}

function renderLanPeers(peers, selectedIp) {
  if (!lanDevices) return;
  lanDevices.innerHTML = "";
  if (!peers.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "尚未发现设备";
    lanDevices.appendChild(option);
    if (lanCount) lanCount.textContent = "0 台";
    setLanStatus("没有发现同网段设备，请确认目标设备已打开 Eagle 插件");
    return;
  }
  for (const peer of peers) {
    const option = document.createElement("option");
    option.value = peer.ip;
    option.textContent = (peer.name ? peer.name + " · " : "") + peer.ip;
    lanDevices.appendChild(option);
  }
  const preferred = selectedIp && peers.some((peer) => peer.ip === selectedIp) ? selectedIp : peers[0].ip;
  lanDevices.value = preferred;
  chrome.storage.local.set({ evdLanDevice: preferred });
  if (lanCount) lanCount.textContent = peers.length + " 台";
  setLanStatus("已记住设备，直接点发送即可");
}

/** 先用已保存的设备列表，点「扫描」才重新扫描 */
function loadLanPeers(force) {
  chrome.storage.local.get({ evdLanPeers: [], evdLanDevice: "" }, (values) => {
    const cached = Array.isArray(values.evdLanPeers) ? values.evdLanPeers : [];
    if (!force && cached.length) {
      renderLanPeers(cached, values.evdLanDevice);
      return;
    }
    scanLanPeers(values.evdLanDevice, cached);
  });
}

function scanLanPeers(selectedIp, fallbackPeers) {
  setLanStatus("正在扫描同网段设备…");
  if (lanCount) lanCount.textContent = "扫描中";
  chrome.runtime.sendMessage({ type: "lan-peers" }, (result) => {
    if (!result || !result.ok) {
      if (fallbackPeers && fallbackPeers.length) {
        renderLanPeers(fallbackPeers, selectedIp);
        setLanStatus((result && result.error) || "扫描失败，正在使用已保存的设备");
        return;
      }
      if (lanCount) lanCount.textContent = "未扫描";
      setLanStatus((result && result.error) || "扫描失败");
      return;
    }
    const peers = result.peers || [];
    chrome.storage.local.set({ evdLanPeers: peers, evdLanPeersAt: Date.now() });
    renderLanPeers(peers, selectedIp);
  });
}

if (lanRefresh) lanRefresh.addEventListener("click", () => loadLanPeers(true));

if (lanDevices) {
  lanDevices.addEventListener("change", () => {
    chrome.storage.local.set({ evdLanDevice: lanDevices.value });
  });
}

if (lanSend) {
  lanSend.addEventListener("click", () => {
    const ip = lanDevices.value;
    if (!ip) {
      setLanStatus("请先选择局域网设备");
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs && tabs[0] && tabs[0].url ? tabs[0].url : "";
      if (!url) {
        setLanStatus("无法读取当前页面地址");
        return;
      }
      setLanStatus("正在发送…");
      chrome.runtime.sendMessage({ type: "lan-send", url, ip }, (result) => {
        if (result && result.ok) {
          setLanStatus("已发送到 " + ip + "（本机未下载）");
        } else {
          setLanStatus((result && result.error) || "发送失败");
        }
      });
    });
  });
}

const refreshBtn = document.getElementById("refresh");
if (refreshBtn) refreshBtn.addEventListener("click", refresh);

detectCurrentSite();
loadSwitches();
refresh();
loadLanPeers(false);
