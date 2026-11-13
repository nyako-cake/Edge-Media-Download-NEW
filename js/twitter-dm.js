/**
 * X（推特）私信 / 聊天：抓取好友发来的推文链接，并带上发送者资料（头像）。
 * 走网页端 v1.1 私信收件箱接口，用本地保存的 auth_token + ct0 认证。
 * 注意：带 filter_low_quality / include_quality 查询参数现在会返回 500，必须用不带参数的地址。
 */

const { getJson, getRaw } = require("./x-http");
const { fetchChatConversations, fetchChatShares } = require("./twitter-xchat");

const INBOX_URL = "https://x.com/i/api/1.1/dm/inbox_initial_state.json";
const MAX_ITEMS = 30;

/** 把一次会话刷新的结构摘要写到临时目录，便于排查「只识别到一个聊天」（不含消息正文） */
function writeInboxDebug(info) {
  try {
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    info.at = new Date().toISOString();
    fs.writeFileSync(path.join(os.tmpdir(), "evd_dm_debug.json"), JSON.stringify(info, null, 2), "utf8");
  } catch (e) {
    // 调试文件写失败不影响刷新
  }
}

function describeError(result) {
  if (result.status === 401 || result.status === 403) return "cookie 无效或已过期";
  if (result.status === 404) return "X 私信接口已更新";
  if (result.status === 429) return "请求过于频繁（429）";
  if (result.status === 0) return "网络错误（可能需要代理）" + (result.error ? "：" + result.error : "");
  return "HTTP " + result.status;
}

function statusIdOf(url) {
  const matched = String(url || "").match(/\/status(?:es)?\/(\d+)/);
  return matched ? matched[1] : "";
}

function walkMessages(node, out, depth) {
  if (!node || depth > 12) return;
  if (Array.isArray(node)) {
    for (const item of node) walkMessages(item, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  if (node.message_data && typeof node.message_data === "object") out.push(node);
  for (const key of Object.keys(node)) {
    if (key === "message_data") continue;
    walkMessages(node[key], out, depth + 1);
  }
}

function findUsers(node, out, depth) {
  if (!node || depth > 10) return;
  if (Array.isArray(node)) {
    for (const item of node) findUsers(item, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const id = node.id_str || (typeof node.rest_id === "string" ? node.rest_id : "");
  const screenName = node.screen_name || node.screenName;
  if (id && screenName) out[id] = node;
  for (const key of Object.keys(node)) findUsers(node[key], out, depth + 1);
}

function senderOf(user, senderId) {
  const avatar = user && (user.profile_image_url_https || user.profile_image_url);
  return {
    id: String(senderId || (user && (user.id_str || user.rest_id)) || ""),
    name: (user && user.name) || "",
    screenName: (user && (user.screen_name || user.screenName)) || "",
    avatar: typeof avatar === "string" ? avatar.replace("_normal.", "_200x200.") : "",
  };
}

/**
 * 从收件箱响应里取出「消息中带有推文链接」的条目。
 * conversationIds 非空时只保留这些会话里的消息，并且只保留好友发来的（options.selfId 自己的消息剔除）。
 * 返回 [{ id, conversationId, sender, text, createdAt }]，按推文 id 去重。
 */
function extractSharedTweets(json, conversationIds, options) {
  const messages = [];
  walkMessages(json, messages, 0);

  const users = {};
  findUsers(json, users, 0);

  // X Chat 的会话 id 用「self:peer」，旧版私信用「self-peer」，比较前统一分隔符
  const normId = (id) => String(id || "").replace(/[:]/g, "-");
  const allowed = Array.isArray(conversationIds) && conversationIds.length ? new Set(conversationIds.map((id) => normId(id))) : null;
  const selfId = options && options.selfId ? String(options.selfId) : "";

  const seen = new Set();
  const items = [];
  for (const message of messages) {
    const conversationId = String(
      message.conversation_id ||
        (message.message_data && message.message_data.conversation_id) ||
        ""
    );
    if (allowed && !allowed.has(normId(conversationId))) continue;

    const data = message.message_data || {};
    const senderId = String(data.sender_id || "");
    // 选了聊天之后只认好友发来的链接，自己发出的消息跳过
    if (allowed && selfId && senderId === selfId) continue;
    const urls = (data.entities && data.entities.urls) || [];
    const text = data.text || "";
    let tweetId = "";
    for (const url of urls) {
      const id = statusIdOf(url && (url.expanded_url || url.url));
      if (id) {
        tweetId = id;
        break;
      }
    }
    if (!tweetId) tweetId = statusIdOf(text);
    if (!tweetId || seen.has(tweetId)) continue;
    seen.add(tweetId);

    const user = users[senderId] || null;
    const createdAt = message.created_at ? Date.parse(message.created_at) : Number(data.time || 0);
    items.push({
      id: tweetId,
      conversationId,
      text,
      createdAt: Number.isFinite(createdAt) ? createdAt : 0,
      sender: senderOf(user, senderId),
    });
  }

  return items.slice(0, MAX_ITEMS);
}

/** 会话参与者 id：兼容数组、对象字典、纯字符串三种写法 */
function participantIds(node) {
  const raw = node && node.participants;
  const out = [];
  const push = (value) => {
    const id = String(value || "").trim();
    if (/^\d+$/.test(id) && !out.includes(id)) out.push(id);
  };
  if (Array.isArray(raw)) {
    raw.forEach((participant) => {
      if (typeof participant === "string") return push(participant);
      if (participant && participant.user_id) return push(participant.user_id);
      if (participant && participant.id) return push(participant.id);
      if (participant && participant.id_str) return push(participant.id_str);
    });
  } else if (raw && typeof raw === "object") {
    // 有些响应把 participants 写成 { "<user_id>": {...} } 或 { <user_id>: { user_id } }
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "string") push(value);
      else if (value && (value.user_id || value.id || value.id_str)) push(value.user_id || value.id || value.id_str);
      else push(key);
    }
  } else if (typeof raw === "string") {
    push(raw);
  }
  return out;
}

/** 会话 id 形如 "<自己id>-<对方id>"，participants 缺失时用它兜底拆出对方 */
function idsFromConversationId(conversationId) {
  return String(conversationId || "")
    .split("-")
    .map((part) => part.trim())
    .filter((part) => /^\d{5,}$/.test(part));
}

/** 把收件箱响应里的会话整理成「好友资料 + 会话 id」列表，用于界面选择 */
function extractConversations(json, selfId) {
  const users = {};
  findUsers(json, users, 0);
  let self = String(selfId || "");

  // 会话来源一：带 conversation_id 的会话对象
  // 会话来源二：conversations 字典（键就是会话 id，值里可能没有 conversation_id / participants）
  const seenNodes = new Map();
  const remember = (id, node) => {
    const key = String(id || "");
    if (!key) return;
    const previous = seenNodes.get(key);
    if (!previous || (!previous.node.participants && node && node.participants)) {
      seenNodes.set(key, { node: node || {}, senders: previous ? previous.senders : new Set() });
    }
  };
  const CONVERSATION_KEY_RE = /^\d{5,}(-\d{5,})+$/;

  const walk = (node, depth) => {
    if (!node || depth > 10) return;
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, depth + 1));
      return;
    }
    if (typeof node === "string") {
      // 任何形如 "<自己id>-<对方id>" 的字符串都可能是会话 id（排序索引里常见）
      if (CONVERSATION_KEY_RE.test(node)) remember(node, null);
      return;
    }
    if (typeof node !== "object") return;
    if (node.conversation_id) remember(node.conversation_id, node);
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (CONVERSATION_KEY_RE.test(key) && value && typeof value === "object") {
        remember(key, value);
      }
      walk(value, depth + 1);
    }
  };
  walk(json, 0);

  // 会话来源三：消息里出现过的会话 id（顺便记下各会话的发送者，用于兜底取名）
  const messages = [];
  walkMessages(json, messages, 0);
  for (const message of messages) {
    const conversationId = String(
      message.conversation_id || (message.message_data && message.message_data.conversation_id) || ""
    );
    if (!conversationId) continue;
    const entry = seenNodes.get(conversationId) || { node: {}, senders: new Set() };
    const senderId = String((message.message_data && message.message_data.sender_id) || "");
    if (senderId) entry.senders.add(senderId);
    seenNodes.set(conversationId, entry);
  }

  // 没拿到自己账号 id 时：会话 id 里所有会话都出现的那个 id 就是自己；
  // 再退一步，消息里出现最多的发送者通常也是自己。
  if (!self) {
    const counts = {};
    for (const conversationId of seenNodes.keys()) {
      for (const part of idsFromConversationId(conversationId)) {
        counts[part] = (counts[part] || 0) + 1;
      }
    }
    const shared = Object.keys(counts).filter((id) => counts[id] > 1).sort((a, b) => counts[b] - counts[a])[0];
    let senderCounts = {};
    for (const entry of seenNodes.values()) {
      for (const id of entry.senders) senderCounts[id] = (senderCounts[id] || 0) + 1;
    }
    const busiestSender = Object.keys(senderCounts).sort((a, b) => senderCounts[b] - senderCounts[a])[0];
    // 只有一个会话时，会话 id 的第一段就是自己（X 的会话 id 以自己开头）
    const onlyOne = seenNodes.size === 1 ? idsFromConversationId(Array.from(seenNodes.keys())[0])[0] : "";
    self = String(shared || onlyOne || busiestSender || "");
  }

  const selfProfile = senderOf(users[self], self);

  const conversations = [];
  for (const [conversationId, entry] of seenNodes) {
    const node = entry.node || {};
    let ids = participantIds(node);
    if (!ids.length) ids = idsFromConversationId(conversationId);
    const peers = ids.filter((id) => id && (!self || id !== self));
    const senders = Array.from(entry.senders).filter((id) => id && (!self || id !== self));
    const peerIds = peers.length ? peers : senders;
    const other = peerIds.map((id) => users[id]).filter(Boolean);
    const fallbackProfile = peerIds[0] ? senderOf(users[peerIds[0]], peerIds[0]) : null;
    const profile = other.length ? senderOf(other[0], peerIds[0]) : fallbackProfile;
    const isSelf = !peerIds.length && (!self || ids.includes(self) || ids.length === 0);
    const name = other.length
      ? other
          .slice(0, 2)
          .map((user) => user.name || user.screen_name || "")
          .filter(Boolean)
          .join("、")
      : isSelf
        ? "我自己"
        : (profile && (profile.name || profile.screenName)) || (peerIds[0] ? "好友 " + String(peerIds[0]).slice(-6) : "未知聊天");
    conversations.push({
      id: conversationId,
      name: name || "未知聊天",
      screenName: isSelf ? selfProfile.screenName : (profile && profile.screenName) || "",
      avatar: isSelf ? selfProfile.avatar : (profile && profile.avatar) || "",
      isSelf,
      updatedAt: Number(node.sort_timestamp || node.last_message_time || 0) || 0,
    });
  }

  const seen = new Set();
  return conversations
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/** 把发送者头像抓成 data URL（渲染层直连 pbs.twimg.com 常失败） */
async function withSenderAvatar(sender) {
  if (!sender || !sender.avatar) return sender;
  try {
    const result = await getRaw(sender.avatar, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        accept: "image/*",
      },
    });
    if (result.status === 200 && result.buffer && result.buffer.length) {
      const type = String(result.contentType || "image/jpeg").split(";")[0];
      const dataUrl = "data:" + type + ";base64," + result.buffer.toString("base64");
      if (dataUrl.length < 400000) sender.avatarData = dataUrl;
    }
  } catch (e) {
    // 头像失败不影响抓取
  }
  return sender;
}

async function fetchDmShares(auth, options = {}) {
  const result = await fetchChatShares(auth, {
    conversationIds: options.conversationIds || [],
    selfId: options.selfId || "",
    passcode: options.passcode || "",
  });
  if (!result.ok) {
    return { ok: false, status: result.status || 0, error: result.error || "读取聊天失败", items: [] };
  }
  const prepared = [];
  for (const item of result.items || []) {
    prepared.push({
      id: item.tweetId,
      conversationId: item.conversationId,
      text: item.text,
      createdAt: 0,
      sender: await withSenderAvatar(item.sender),
    });
  }
  return { ok: true, items: prepared };
}

/** 拉取会话列表（用于界面选择要监控的聊天）：只走 X Chat，旧版私信收件箱接口已移除 */
async function fetchConversations(auth, selfId) {
  let xchat = { ok: false, items: [], attempts: [], status: 0, reason: "" };
  try {
    xchat = await fetchChatConversations(auth, selfId);
  } catch (error) {
    xchat = { ok: false, items: [], attempts: [], status: 0, reason: (error && error.message) || "error" };
  }
  const items = (xchat.items || []).slice(0, 40);

  writeInboxDebug({
    ok: items.length > 0,
    source: "xchat",
    xchatAttempts: xchat.attempts,
    xchatCount: items.length,
    xchatReason: xchat.reason || "",
    selfId: String(selfId || ""),
    itemCount: items.length,
    items: items.map((item) => ({ id: item.id, name: item.name, screenName: item.screenName, isSelf: item.isSelf, encrypted: !!item.encrypted })),
    status: xchat.status || 0,
  });

  if (!items.length) {
    return {
      ok: false,
      status: xchat.status || 0,
      error: xchat.reason || describeError({ status: xchat.status || 0 }),
      items: [],
    };
  }

  for (let index = 0; index < items.length; index++) {
    // 只为前若干个会话取头像，避免一次刷新打太多图片请求
    if (index >= 24) break;
    await withSenderAvatar(items[index]);
  }
  return { ok: true, items };
}

module.exports = {
  fetchDmShares,
  fetchConversations,
  extractSharedTweets,
  extractConversations,
  describeError,
  MAX_ITEMS,
};
