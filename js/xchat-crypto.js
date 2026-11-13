/**
 * X Chat（端到端加密私信）解密：PIN 密钥恢复、会话密钥解包、消息正文解密。
 * 密钥来自 X 的 Juicebox（PIN 加密备份），恢复后用 cookie 会话向各个 realm 取回。
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const nacl = require("tweetnacl");

let wasmReady = null;

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest();
}

/** 服务端把这个字段当 string 编码，thrift 解出来是 base64 文本，这里剥掉这一层 */
function toRawBlob(wrapped) {
  let blob = Buffer.isBuffer(wrapped) ? wrapped : Buffer.from(String(wrapped || ""), "base64");
  const asText = blob.toString("latin1");
  if (/^[A-Za-z0-9+/=\s]+$/.test(asText) && asText.length >= 44) {
    blob = Buffer.from(asText.replace(/\s+/g, ""), "base64");
  }
  return blob;
}

/** ECIES：ephemeral pub(65) || AES-128-GCM 密文，密钥与 IV 来自 SHA-256(shared || 00000001 || ephemeral) */
function unwrapConversationKey(identityPrivate, wrapped) {
  const blob = toRawBlob(wrapped);
  const ephemeral = blob.subarray(0, 65);
  const ciphertext = blob.subarray(65);
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(identityPrivate);
  const shared = ecdh.computeSecret(ephemeral);
  const derived = sha256(Buffer.concat([shared, Buffer.from([0, 0, 0, 1]), ephemeral]));
  const decipher = crypto.createDecipheriv("aes-128-gcm", derived.subarray(0, 16), derived.subarray(16, 32));
  decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  return Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
}

/** 会话密钥加密的正文：nonce(24) || XSalsa20-Poly1305 密文 */
function openSealed(conversationKey, sealed) {
  const nonce = sealed.subarray(0, 24);
  const body = sealed.subarray(24);
  const plain = nacl.secretbox.open(body, nonce, conversationKey);
  if (!plain) throw new Error("secretbox open failed");
  return Buffer.from(plain);
}

/** 从收件箱条目里取出各版本的会话密钥（只取包给自己身份公钥的那份） */
function conversationKeysFromItem(item, identityPrivate, userId) {
  const keys = {};
  const events = item && item.latest_conversation_key_change_events;
  if (!Array.isArray(events)) return keys;
  for (const eventBase64 of events) {
    let event;
    try {
      event = require("./thrift").decode(eventBase64);
    } catch (error) {
      continue;
    }
    const change = event && event[7] && event[7][3];
    if (!change) continue;
    const version = require("./thrift").text(change[1]);
    const participants = change[2] || [];
    for (const participant of participants || []) {
      const participantId = require("./thrift").text(participant[1]);
      const wrapped = participant[2];
      if (!participantId || !wrapped) continue;
      if (userId && participantId !== String(userId)) continue;
      try {
        keys[version] = unwrapConversationKey(identityPrivate, wrapped);
      } catch (error) {
        /* 不是给自己的那份 */
      }
      break;
    }
  }
  return keys;
}

/** 把一条 create 事件解成 { sequenceId, senderId, text } */
function decryptEvent(event, keys, viewerId) {
  const thrift = require("./thrift");
  const detail = event[7] || {};
  const create = detail[1];
  if (!create) return null;
  const plain = create[101] === undefined;
  const version = thrift.text(create[101]) || "";
  const key = keys[version];
  let holder = null;
  try {
    const contents = create[100];
    holder = plain ? thrift.decode(contents.toString("base64")) : thrift.decode(openSealed(key, contents).toString("base64"));
  } catch (error) {
    return null;
  }
  const entry = holder && holder[1];
  if (!entry) {
    // 非消息事件（已读回执、表情等）
    lastShape = "no-entry " + shapeOf(holder);
    return null;
  }
  lastShape = shapeOf(holder);
  const text = pickText(holder, entry);
  if (!text && !lastShapeFull) lastShapeFull = shapeOf(holder, 5);
  return {
    sequenceId: thrift.text(event[1]) || "",
    senderId: thrift.text(event[3]) || "",
    text,
    time: readTime(event) || findTime(event),
    own: throttleSafeBoolean(event, viewerId),
  };
}

let lastShape = "";
let lastShapeFull = "";

/** 事件时间：明文用 event[6]/event[2]，加密消息的 event[2] 是消息 uuid，只能用 event[6] */
function readTime(event) {
  const candidates = [event && event[6], event && event[2], event && event[7] && event[7][12] && event[7][12][2]];
  for (const candidate of candidates) {
    const number = Number(typeof candidate === "string" ? candidate.trim() : candidate);
    if (/^\d{13}$/.test(String(typeof candidate === "string" ? candidate.trim() : candidate)) &&
        number >= 1.2e12 && number <= 1.9e12) {
      return number;
    }
  }
  return 0;
}

function findTime(node, depth = 0) {
  if (depth > 4 || node === undefined || node === null) return 0;
  if (typeof node === "number" || typeof node === "bigint") {
    const value = Number(node);
    return value >= 1.2e12 && value <= 1.9e12 ? value : 0;
  }
  if (typeof node === "string") {
    const value = Number(node);
    return /^\d{13}$/.test(node) && value >= 1.2e12 && value <= 1.9e12 ? value : 0;
  }
  if (typeof node !== "object") return 0;
  for (const value of Object.values(node)) {
    const found = findTime(value, depth + 1);
    if (found) return found;
  }
  return 0;
}

function getLastShape() {
  return { short: lastShape, full: lastShapeFull };
}

function shapeOf(node, depth = 2) {
  if (node === undefined || node === null) return "nil";
  if (Buffer.isBuffer(node)) return "buf:" + node.length;
  if (typeof node === "string") return "str:" + node.length;
  if (typeof node !== "object") return typeof node;
  if (depth <= 0) return "obj";
  const parts = [];
  for (const key of Object.keys(node).slice(0, 6)) {
    parts.push(key + "=" + shapeOf(node[key], depth - 1));
  }
  return "{" + parts.join(",") + "}";
}

/** 正文在不同版本里嵌的层级不一样：在 holder[1] 里按深度找最长的可读文本 */
function pickText(holder, entry) {
  const thrift = require("./thrift");
  const found = [];
  const walk = (node, depth) => {
    if (depth > 8 || node === undefined || node === null) return;
    if (Buffer.isBuffer(node)) {
      const value = node.toString("utf8");
      if (value && !value.includes("\uFFFD") && value.trim()) found.push(value);
      return;
    }
    if (typeof node !== "object") return;
    for (const value of Object.values(node)) walk(value, depth + 1);
  };
  walk(entry, 0);
  if (!found.length) return "";
  // 最长的那段基本就是正文，短的通常是 id 或表情代码
  return found.sort((a, b) => b.length - a.length)[0];
}

function throttleSafeBoolean(event, viewerId) {
  const sender = require("./thrift").text(event[3]);
  return !!viewerId && sender === String(viewerId);
}

/** 从文本里挑出推文链接 */
function tweetLinksIn(text) {
  const links = [];
  const pattern = /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/(?:#!\/)?([A-Za-z0-9_]+)\/status\/(\d+)/g;
  let match;
  while ((match = pattern.exec(String(text || ""))) !== null) {
    links.push({ screenName: match[1], tweetId: match[2] });
  }
  return links;
}

/** 载入 juicebox 的 wasm，返回可用的 SDK 导出 */
async function loadJuicebox() {
  if (!wasmReady) {
    wasmReady = (async () => {
      const glue = require("juicebox-sdk/juicebox-sdk_bg.js");
      const bytes = fs.readFileSync(resolveWasmPath());
      const { instance } = await WebAssembly.instantiate(bytes, { "./juicebox-sdk_bg.js": glue });
      glue.__wbg_set_wasm(instance.exports);
      return glue;
    })();
  }
  return wasmReady;
}

/** 打包后 __dirname 可能落在插件根目录而不是 dist，这里把常见位置都试一遍 */
function resolveWasmPath() {
  const name = "juicebox-sdk_bg.wasm";
  const candidates = [];
  const push = (dir) => {
    if (dir) candidates.push(path.join(dir, name));
  };
  push(path.join(__dirname, "..", "assets"));
  push(path.join(__dirname, "assets"));
  try {
    if (typeof location !== "undefined" && location.href) {
      const raw = decodeURIComponent(new URL(location.href).pathname);
      const normalized = /^\/[A-Za-z]:/.test(raw) ? raw.slice(1) : raw;
      push(path.join(path.dirname(normalized), "assets"));
    }
  } catch (error) {
    /* 没有 location 就算了 */
  }
  push(path.join(process.cwd(), "assets"));
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("找不到 juicebox wasm：" + candidates.join(" | "));
}

/** 用 PIN + realm token 恢复身份密钥（64 字节：前 32 身份私钥，后 32 签名私钥） */
async function recoverSecret(pin, config, tokens) {
  const glue = await loadJuicebox();
  const { Client, Configuration } = glue;
  const encoder = new TextEncoder();
  globalThis.JuiceboxGetAuthToken = async (realmId) => {
    const raw = Buffer.from(realmId);
    const token =
      tokens[raw.toString("hex")] ||
      tokens[raw.toString("base64")] ||
      tokens[raw.toString("utf8")] ||
      // 只有一个 realm 时不再纠结 id 的编码形式
      (Object.keys(tokens).length === 1 ? tokens[Object.keys(tokens)[0]] : null);
    if (!token) throw new Error("unknown realm " + raw.toString("hex"));
    return token;
  };
  for (const realm of config.realms || []) {
    if (!tokens[realm.id]) throw new Error("no auth token for realm " + realm.id);
  }
  const client = new Client(new Configuration(config), []);
  const secret = await client.recover(encoder.encode(String(pin)), new Uint8Array());
  return Buffer.from(secret);
}

module.exports = {
  recoverSecret,
  unwrapConversationKey,
  openSealed,
  conversationKeysFromItem,
  decryptEvent,
  getLastShape,
  tweetLinksIn,
  sha256,
};
