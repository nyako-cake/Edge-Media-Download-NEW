/**
 * 资源库链接索引：判断「本库内是否已经有同一个链接的文件」。
 *
 * 优先直接读取 Eagle 自带的资源索引（eagle.item.getAll），按当前库内容实时判断，
 * 不在本地留任何缓存记录：用户把库内文件删掉后，立刻不再算重复。
 * 只有在拿不到 eagle API 的环境（例如静态预览）才回退到扫描 images/*.info。
 */

const fs = require("fs");
const path = require("path");
const { getLibraryPath } = require("./library-context");

const SCAN_CHUNK = 200;

let keyOf = (value) => String(value || "");
let cache = { library: "", keys: new Set(), ready: false };
let scanning = false;

/** 插件启动时注入与 downloadKey 一致的归一化函数 */
function configure(options = {}) {
  if (typeof options.keyOf === "function") keyOf = options.keyOf;
}

/** 用 Eagle 自身索引取全部条目链接；拿不到 API 时返回 null */
async function collectFromEagle() {
  try {
    if (typeof eagle === "undefined" || !eagle || !eagle.item) return null;
    const api = eagle.item;
    if (typeof api.getAll !== "function") return null;
    const items = (await api.getAll()) || [];
    const keys = new Set();
    for (const item of items) {
      if (!item || item.isDeleted) continue;
      const key = keyOf(item.url || "");
      if (key) keys.add(key);
    }
    return keys;
  } catch (e) {
    return null;
  }
}

/** 同步读取单个条目 metadata.json 的 url */
function itemLink(imagesDir, dirName) {
  const file = path.join(imagesDir, dirName, "metadata.json");
  try {
    const meta = JSON.parse(fs.readFileSync(file, "utf8"));
    return meta && meta.url ? String(meta.url) : "";
  } catch (e) {
    return "";
  }
}

/** 回退方案：分片扫描库目录（不写任何缓存文件） */
function scanFiles(libraryPath) {
  const imagesDir = path.join(libraryPath, "images");
  let dirs = [];
  try {
    dirs = fs
      .readdirSync(imagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.endsWith(".info"))
      .map((entry) => entry.name);
  } catch (e) {
    return Promise.resolve(0);
  }

  const keys = new Set();
  let index = 0;
  return new Promise((resolve) => {
    const step = () => {
      const started = Date.now();
      while (index < dirs.length && Date.now() - started < 8) {
        const link = itemLink(imagesDir, dirs[index]);
        index += 1;
        if (!link) continue;
        const key = keyOf(link);
        if (key) keys.add(key);
      }
      if (index >= dirs.length) {
        cache = { library: libraryPath, keys, ready: true };
        resolve(keys.size);
        return;
      }
      setTimeout(step, 0);
    };
    step();
  });
}

/** 重建索引；force=true 时忽略旧结果重新取（每次抓取前都会调用） */
function build(options = {}) {
  const force = !!options.force;
  const libraryPath = getLibraryPath();
  if (!libraryPath) return Promise.resolve(0);
  if (!force && cache.library === libraryPath && cache.ready) return Promise.resolve(cache.keys.size);
  if (scanning) return Promise.resolve(cache.keys.size);
  scanning = true;

  return collectFromEagle().then((keys) => {
    scanning = false;
    if (keys) {
      cache = { library: libraryPath, keys, ready: true };
      return keys.size;
    }
    return scanFiles(libraryPath);
  });
}

/** 本库是否已有同一链接；命中后一律用 Eagle 实时索引复核一次（删掉的文件立刻不再算重复） */
async function hasSameLink(url) {
  const key = keyOf(url);
  if (!key) return false;
  const libraryPath = getLibraryPath();
  if (cache.library !== libraryPath || !cache.ready) {
    await build({ force: true });
  }
  if (!cache.keys.has(key)) return false;
  const fresh = await collectFromEagle();
  if (fresh) {
    cache = { library: libraryPath, keys: fresh, ready: true };
    return fresh.has(key);
  }
  return true;
}

module.exports = {
  configure,
  build,
  hasSameLink,
};
