/**
 * 诊断日志
 *
 * 默认关闭，开启后把关键决策（入队 / 判重命中 / 下载成败 / 抓取结果 / 索引重建）
 * 追加写入 Plugin/logs/evd-YYYYMMDD.log。按天分文件，保留 7 天，单文件超过 2MB 时
 * 改名为 .1 并重新开始，避免无限增长。
 *
 * 日志只记录链接、ID、行数与错误信息，不写入 Cookie、Cookie 内容或聊天正文。
 */

const fs = require("fs");
const path = require("path");

const ENABLED_KEY = "Edge-Media-Download-NEW.debugLog";
const MAX_BYTES = 2 * 1024 * 1024;
const KEEP_DAYS = 7;

let prunedToday = "";

function logDir() {
  // __dirname 在运行时是 Plugin/dist
  return path.join(__dirname, "..", "logs");
}

function isEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function setEnabled(value) {
  try {
    localStorage.setItem(ENABLED_KEY, value ? "1" : "0");
  } catch (e) {
  }
  if (value) info("logger", "日志已开启", { dir: logDir() });
}

function stamp(date) {
  const d = date || new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
}

function currentPath(date) {
  return path.join(logDir(), "evd-" + stamp(date) + ".log");
}

/** 清理超过保留天数的日志，每天最多执行一次 */
function pruneOldFiles() {
  const today = stamp();
  if (prunedToday === today) return;
  prunedToday = today;
  try {
    const dir = logDir();
    if (!fs.existsSync(dir)) return;
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    for (const name of fs.readdirSync(dir)) {
      if (!/^evd-\d{8}\.log(\.1)?$/.test(name)) continue;
      const full = path.join(dir, name);
      try {
        if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full);
      } catch (e) {
      }
    }
  } catch (e) {
  }
}

/** 单文件超限时轮转一次 */
function rotateIfNeeded(file) {
  try {
    if (!fs.existsSync(file)) return;
    const size = fs.statSync(file).size;
    if (size < MAX_BYTES) return;
    const backup = file + ".1";
    try {
      if (fs.existsSync(backup)) fs.unlinkSync(backup);
    } catch (e) {
    }
    fs.renameSync(file, backup);
  } catch (e) {
  }
}

function formatData(data) {
  if (data === undefined || data === null) return "";
  try {
    if (typeof data === "string") return data;
    return JSON.stringify(data);
  } catch (e) {
    return "";
  }
}

function write(level, tag, message, data) {
  const text = formatData(data);
  try {
    console.log("[evd][" + tag + "]", message, text || "");
  } catch (e) {
  }
  if (!isEnabled()) return;
  try {
    const dir = logDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    pruneOldFiles();
    const file = currentPath();
    rotateIfNeeded(file);
    const line = [
      new Date().toISOString(),
      String(level || "info").toUpperCase().padEnd(5),
      "[" + tag + "]",
      String(message || ""),
      text,
    ].join(" ");
    fs.appendFileSync(file, line + "\n");
  } catch (e) {
  }
}

function info(tag, message, data) {
  write("info", tag, message, data);
}
function warn(tag, message, data) {
  write("warn", tag, message, data);
}
function error(tag, message, data) {
  write("error", tag, message, data);
}

/** 打开日志目录（供界面按钮用），返回目录路径 */
function dir() {
  try {
    if (!fs.existsSync(logDir())) fs.mkdirSync(logDir(), { recursive: true });
  } catch (e) {
  }
  return logDir();
}

/** 删除全部日志文件（保留目录） */
function clear() {
  try {
    const d = logDir();
    if (!fs.existsSync(d)) return 0;
    let removed = 0;
    for (const name of fs.readdirSync(d)) {
      if (!/^evd-\d{8}\.log(\.1)?$/.test(name)) continue;
      try {
        fs.unlinkSync(path.join(d, name));
        removed++;
      } catch (e) {
      }
    }
    info("logger", "日志已清空", { removed });
    return removed;
  } catch (e) {
    return 0;
  }
}

module.exports = {
  ENABLED_KEY,
  isEnabled,
  setEnabled,
  info,
  warn,
  error,
  dir,
  clear,
  currentPath,
};
