/**
 * 下载失败记录持久化。
 * 失败的队列条目写进 localStorage，关窗重开仍在；成功下载或手动删除后移除。
 */

const STORAGE_KEY = "Edge-Media-Download-NEW.downloadErrors";
const LIMIT = 80;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.url === "string" && entry.url);
  } catch (e) {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-LIMIT)));
  } catch (e) {
    // 存储超限时退化为只保留最近几条
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-12)));
    } catch (inner) {
      // 彻底写不进去时静默放弃，不影响下载流程
    }
  }
}

/** 头像转成 data URL 时可能很大，超过 60KB 就不再随失败记录保存，避免撑爆存储 */
function slimFrom(from) {
  if (!from || typeof from !== "object") return null;
  const out = {
    id: from.id || "",
    name: from.name || "",
    screenName: from.screenName || "",
    avatar: from.avatar || "",
  };
  if (typeof from.avatarData === "string" && from.avatarData.length <= 60000) {
    out.avatarData = from.avatarData;
  }
  if (!out.id && !out.name && !out.screenName) return null;
  return out;
}

/** 记录一条失败（同一链接只保留最新一次） */
function add(entry) {
  const url = String((entry && entry.url) || "");
  if (!url) return;
  const list = readAll().filter((item) => item.url !== url);
  list.push({
    url,
    title: String((entry && entry.title) || url),
    error: String((entry && entry.error) || ""),
    from: slimFrom(entry && entry.from),
    time: Date.now(),
  });
  writeAll(list);
}

/** 成功下载或手动删除后移除对应记录 */
function remove(url) {
  const text = String(url || "");
  if (!text) return;
  const list = readAll().filter((item) => item.url !== text);
  writeAll(list);
}

function list() {
  return readAll();
}

function clear() {
  writeAll([]);
}

module.exports = {
  STORAGE_KEY,
  add,
  remove,
  list,
  clear,
};
