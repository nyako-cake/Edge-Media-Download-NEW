/**
 * X Chat（x.com/i/chat，端到端加密私信）：只读取会话列表（会话 id、好友资料）。
 * 消息在客户端加密，服务端接口只回密文，所以这里拿不到聊天里的推文链接。
 * 走网页端 GraphQL：GetInitialXChatPageQuery + GetInboxPageRequestQuery 翻页。
 */

const { getJson } = require("./x-http");
const thrift = require("./thrift");
const xchatCrypto = require("./xchat-crypto");

const GRAPHQL_URL = "https://x.com/i/api/graphql";
const QUERY_IDS = {
  GetInitialXChatPageQuery: "Q4Mw0C6YcnjJac21wq-5NA",
  GetInboxPageRequestQuery: "txrXftx8RcSvw9jCjwRZWA",
  GetConversationPageQuery: "GX9ZijkxG8AqRMQVD7hMnQ",
  GetPublicKeysQuery: "C-YphxeIcPLOGtFNGhkuOw",
};
const NEWEST_SEQUENCE_ID = "9223372036854775807";
const MAX_PAGES = 4;
const MAX_ITEMS = 60;

function graphqlHeaders(auth) {
  return Object.assign({}, auth.headers, {
    accept: "*/*",
    referer: "https://x.com/i/chat",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "zh-cn",
  });
}

function normalizeAvatar(user) {
  const raw =
    (user && user.avatar && user.avatar.image_url) ||
    (user && user.profile_image_url_https) ||
    (user && user.profile_image_url) ||
    "";
  return typeof raw === "string" ? raw.replace("_normal.", "_200x200.") : "";
}

/** 会话条目 → 界面用的 { id, name, screenName, avatar, isSelf, encrypted } */
function conversationOf(item, selfId) {
  const detail = (item && item.conversation_detail) || {};
  const id = String(detail.conversation_id || "");
  if (!id) return null;
  const participants = (detail.participants_results || [])
    .map((entry) => (entry && entry.result) || null)
    .filter(Boolean)
    .map((user) => ({
      id: String(user.rest_id || (user.legacy && user.legacy.id_str) || ""),
      name: (user.core && user.core.name) || (user.legacy && user.legacy.name) || "",
      screenName: (user.core && user.core.screen_name) || (user.legacy && user.legacy.screen_name) || "",
      avatar: normalizeAvatar(user),
    }));
  const peers = participants.filter((user) => !selfId || user.id !== selfId);
  const isGroup = detail.__typename === "XChatGroupConversationDetail";
  const first = peers[0] || participants[0] || { id: "", name: "", screenName: "", avatar: "" };
  const name = isGroup
    ? "群聊（" + ((detail.group_members_results || []).length || participants.length) + " 人）"
    : peers.length > 1
      ? peers.slice(0, 2).map((user) => user.name || user.screenName).filter(Boolean).join("、")
      : first.name || first.screenName || "未知聊天";
  const isSelf = !isGroup && !peers.length;
  return {
    id,
    name: isSelf ? "我自己" : name,
    screenName: isGroup ? "" : first.screenName,
    avatar: first.avatar,
    isSelf,
    encrypted: true,
    updatedAt: 0,
  };
}

/**
 * 读取 X Chat 的会话列表。返回 { ok, status, items, reason }。
 * 拿不到会话时不报错中断，主流程会继续用旧版私信的结果。
 */
async function fetchChatConversations(auth, selfId) {
  const headers = graphqlHeaders(auth);
  const attempts = [];
  let items = [];
  let status = 0;
  try {
    const variables = {
      include_user_public_keys: true,
      include_juicebox_tokens: false,
      message_pull_version: 1,
    };
    const url = GRAPHQL_URL + "/" + QUERY_IDS.GetInitialXChatPageQuery + "/GetInitialXChatPageQuery?variables=" + encodeURIComponent(JSON.stringify(variables));
    let result = await getJson(url, { headers, timeout: 20000 });
    status = result.status;
    attempts.push({ step: "initial", status: result.status });
    const page = result && result.json && result.json.data && result.json.data.get_initial_chat_page;
    if (result.status !== 200 || !page) {
      return { ok: false, status, items: [], attempts, reason: result.status === 403 ? "需要重新登录 X" : "HTTP " + result.status };
    }

    const collect = (list) => {
      for (const item of list || []) {
        const conversation = conversationOf(item, selfId);
        if (conversation) items.push(conversation);
      }
    };
collect(page.items);
    let cursor = page.inboxCursor;
    for (let index = 0; index < MAX_PAGES - 1 && items.length < MAX_ITEMS; index++) {
      if (!cursor || cursor.__typename !== "XChatGetInboxPageContinueCursor") break;
      const nextUrl =
        GRAPHQL_URL +
        "/" +
        QUERY_IDS.GetInboxPageRequestQuery +
        "/GetInboxPageRequestQuery?variables=" +
        encodeURIComponent(
          JSON.stringify({ continue_cursor: { cursor_id: cursor.cursor_id, graph_snapshot_id: cursor.graph_snapshot_id } })
        );
      const next = await getJson(nextUrl, { headers, timeout: 20000 });
      attempts.push({ step: "page" + (index + 1), status: next.status });
      const nextPage = next && next.json && next.json.data && next.json.data.get_inbox_page;
      if (next.status !== 200 || !nextPage) break;
      collect(nextPage.items);
      cursor = nextPage.inboxCursor;
    }
    // 接口按最近活动排序，这里给个递减时间戳，保证列表顺序与网页一致
    const now = Date.now();
    items.forEach((item, index) => {
      item.updatedAt = now - index * 1000;
    });
    return { ok: items.length > 0, status, items: items.slice(0, MAX_ITEMS), attempts };
  } catch (error) {
    return { ok: false, status, items: [], attempts, reason: (error && error.message) || "error" };
  }
}

/** 取当前账号的 Juicebox 配置与 realm token（密钥备份的参数） */
async function fetchPublicKeys(auth, userId) {
  const url =
    GRAPHQL_URL +
    "/" +
    QUERY_IDS.GetPublicKeysQuery +
    "/GetPublicKeysQuery?variables=" +
    encodeURIComponent(JSON.stringify({ ids: [String(userId)], include_juicebox_tokens: true }));
  const result = await getJson(url, { headers: graphqlHeaders(auth), timeout: 20000 });
  const entries = result && result.json && result.json.data && result.json.data.user_results_by_rest_ids;
  if (result.status !== 200 || !Array.isArray(entries) || !entries.length) {
    return { ok: false, status: result.status, reason: "HTTP " + result.status };
  }
  const versions = ((entries[0].result || {}).get_public_keys || {}).public_keys_with_token_map || [];
  if (!versions.length) return { ok: false, status: 200, reason: "账号没有 X Chat 密钥" };
  const newest = versions.slice().sort((a, b) => Number((b.public_key_with_metadata || {}).version || 0) - Number((a.public_key_with_metadata || {}).version || 0))[0];
  const tokenMap = newest.token_map || {};
  let config = null;
  try {
    config = JSON.parse(tokenMap.key_store_token_map_json || "{}");
  } catch (error) {
    return { ok: false, status: 200, reason: "密钥配置解析失败" };
  }
  const tokens = {};
  for (const entry of tokenMap.token_map || []) {
    if (entry && entry.key && entry.value && entry.value.token) tokens[String(entry.key)] = String(entry.value.token);
  }
  return { ok: true, status: 200, config, tokens, version: (newest.public_key_with_metadata || {}).version };
}

/** 恢复（或读缓存）身份密钥；密码错误时 X 会扣减剩余尝试次数 */
async function ensureSecret(auth, userId, passcode) {
  const cacheKey = "evd.xchatSecret." + String(userId);
  const failKey = "evd.xchatKeyFail." + String(userId);
  const pinHash = xchatCrypto.sha256(Buffer.from(String(passcode || ""))).toString("hex").slice(0, 16);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached && cached.length >= 64) return { ok: true, secret: Buffer.from(cached, "hex"), cached: true };
    // 同一个密码已经失败过就不再打接口，避免一次次消耗 X 的恢复次数
    const failed = localStorage.getItem(failKey);
    if (failed && failed.startsWith(pinHash + "|")) {
      return { ok: false, reason: failed.slice(pinHash.length + 1), blocked: true };
    }
  } catch (error) {
    /* 忽略 */
  }
  if (!passcode) return { ok: false, reason: "未填写聊天密码" };
  const keys = await fetchPublicKeys(auth, userId);
  if (!keys.ok) return keys;
  try {
    const secret = await xchatCrypto.recoverSecret(passcode, keys.config, keys.tokens);
    if (!secret || secret.length < 64) return { ok: false, reason: "恢复出的密钥长度异常" };
    try {
      localStorage.setItem(cacheKey, secret.toString("hex"));
      localStorage.removeItem(failKey);
    } catch (error) {
      /* 存不下就只用这一次 */
    }
    return { ok: true, secret, cached: false };
  } catch (error) {
    const reasonNumber = error && typeof error.reason === "number" ? error.reason : null;
    const guesses = error && typeof error.guesses_remaining === "number" ? error.guesses_remaining : null;
    const known = {
      0: "聊天密码不正确" + (guesses !== null ? "（剩余 " + guesses + " 次）" : ""),
      1: "这个账号没有注册过 X Chat 密钥备份",
      2: "X 拒绝了这次密钥恢复的授权（Cookie 可能已过期）",
      3: "密钥恢复需要更新版本的客户端",
      4: "密钥恢复请求被限流，稍后再试",
      5: "密钥恢复内部出错，参数可能不对",
      6: "连接密钥服务器失败，稍后重试",
    };
    const text = known[reasonNumber] || "密钥恢复失败（reason=" + String(reasonNumber) + "）";
    const detail = {
      reason: reasonNumber,
      guesses,
      realms: (keys.config && (keys.config.realms || []).length) || 0,
      tokens: Object.keys(keys.tokens || {}).length,
      version: keys.version,
      message: String((error && (error.message || error)) || "").slice(0, 200),
      errorName: (error && error.constructor && error.constructor.name) || typeof error,
    };
    try {
      // 只有确定性的失败才记住；限流/网络抖动下次还能再试
      if ([0, 1, 2, 3, 5].indexOf(reasonNumber) !== -1) localStorage.setItem(failKey, pinHash + "|" + text);
    } catch (error2) {
      /* 忽略 */
    }
    return { ok: false, reason: text, detail };
  }
}

/** 拉一个会话的消息页并解出正文（尽量往前翻到没有更多消息） */
async function conversationMessages(auth, item, secret, selfId) {
  const identity = secret.subarray(0, 32);
  const detail = item.conversation_detail || {};
  const conversationId = String(detail.conversation_id || "");
  const keys = xchatCrypto.conversationKeysFromItem(item, identity, selfId);
  const stats = { page: false, status: 0, eventCount: 0, thriftFailed: 0, nullResult: 0, msgCount: 0, keyVersions: [], pages: [], pageKeys: [] };
  const messages = [];
  const seen = new Set();
  let cursor = { min_local_sequence_id: NEWEST_SEQUENCE_ID, min_conversation_key_version: "0" };
  for (let round = 0; round < 6; round += 1) {
    const url =
      GRAPHQL_URL +
      "/" +
      QUERY_IDS.GetConversationPageQuery +
      "/GetConversationPageQuery?variables=" +
      encodeURIComponent(JSON.stringify(Object.assign({ conversation_id: conversationId }, cursor)));
    const result = await getJson(url, { headers: graphqlHeaders(auth), timeout: 20000 });
    const page = result && result.json && result.json.data && result.json.data.get_conversation_page;
    const errors = (result && result.json && result.json.errors) || [];
    stats.status = result.status;
    if (result.status !== 200 || !page) {
      stats.error = (errors[0] && errors[0].message) || "会话页为空";
      break;
    }
    stats.page = true;
    if (page.message_request_state) stats.requestState = page.message_request_state;

    // 页内可能带着缺的密钥变更事件
    for (const encoded of page.missing_conversation_key_change_events || []) {
      try {
        const event = thrift.decode(encoded);
        const change = event[7] && event[7][3];
        if (!change) continue;
        const version = thrift.text(change[1]);
        for (const participant of change[2] || []) {
          if (String(thrift.text(participant[1]) || "") !== String(selfId)) continue;
          keys[version] = xchatCrypto.unwrapConversationKey(identity, participant[2]);
          break;
        }
      } catch (error) {
        /* 跳过无法解包的密钥事件 */
      }
    }
    if (!stats.pageKeys.length) stats.pageKeys = Object.keys(page).filter((key) => page[key] !== null && !/encoded_message_events|missing_conversation_key/.test(key));

    const events = page.encoded_message_events || [];
    let pageMessageCount = 0;
    let oldest = null;
    for (const encoded of events) {
      stats.eventCount += 1;
      let event;
      try {
        event = thrift.decode(encoded);
      } catch (error) {
        stats.thriftFailed += 1;
        continue;
      }
      const sequenceId = thrift.text(event[1]) || "";
      if (!stats.eventProbe) {
        const probe = {};
        const walk = (node, path, depth) => {
          if (depth > 3 || node === null || node === undefined) return;
          if (typeof node === "number" || typeof node === "bigint") {
            if (Number(node) >= 1e12) probe[path] = String(node);
            return;
          }
          if (typeof node === "string") {
            if (/^\d{10,}$/.test(node)) probe[path] = node;
            return;
          }
          if (typeof node !== "object" || Buffer.isBuffer(node)) return;
          for (const key of Object.keys(node)) walk(node[key], path + "." + key, depth + 1);
        };
        walk(event, "e", 0);
        stats.eventProbe = probe;
      }
      if (sequenceId && (!oldest || sequenceId.length < oldest.length || (sequenceId.length === oldest.length && sequenceId < oldest))) oldest = sequenceId;
      if (seen.has(sequenceId)) {
        stats.nullResult += 1;
        continue;
      }
      const message = xchatCrypto.decryptEvent(event, keys, selfId);
      if (!message) {
        stats.nullResult += 1;
        continue;
      }
      seen.add(sequenceId);
      pageMessageCount += 1;
      stats.msgCount += 1;
      messages.push(message);
    }
    stats.pages.push({ round, events: events.length, messages: pageMessageCount, cursor: String(cursor.min_local_sequence_id || cursor.max_local_sequence_id || "") });
    // 本页没有新消息、或拿不到更早的序号就停
    if (!pageMessageCount || !oldest || pageMessageCount >= events.length) break;
    if (stats.msgCount >= 400) break;
    // 往前翻只带单一游标：上一页最老序号减一
    let upper = oldest;
    try {
      upper = (BigInt(oldest) - 1n).toString();
    } catch (error) {
      upper = oldest;
    }
    cursor = { min_local_sequence_id: upper, min_conversation_key_version: "0" };
  }
  stats.keyVersions = Object.keys(keys);
  stats.httpCount = messages.filter((message) => /http|status\//.test(message.text || "")).length;
  stats.emptyText = messages.filter((message) => !String(message.text || "").trim()).length;
  stats.times = messages.slice(0, 8).map((message) => ({
    time: message.time ? new Date(message.time).toLocaleString("zh-CN", { hour12: false }).slice(5) : "",
    link: /http|status\//.test(message.text || ""),
  }));
  // 今天 17:16 前后各 10 分钟内的消息，单独计数，方便核对
  stats.around1716 = messages.filter((message) => {
    if (!message.time) return false;
    const local = new Date(message.time);
    const minutes = local.getHours() * 60 + local.getMinutes();
    return Math.abs(minutes - (17 * 60 + 16)) <= 10;
  }).map((message) => ({
    time: new Date(message.time).toLocaleString("zh-CN", { hour12: false }),
    fromPeer: selfId ? message.senderId !== selfId : true,
    link: xchatCrypto.tweetLinksIn(message.text).map((entry) => entry.tweetId),
  }));
  return { ok: true, status: stats.status, items: messages, conversationId, participants: detail.participants_results || [], stats };
}

/**
 * 从选中的聊天里抓好友发来的推文链接。
 * 返回 [{ tweetId, screenName, conversationId, sender, text }]
 */
async function fetchChatShares(auth, options = {}) {
  const selfId = String(options.selfId || "");
  const passcode = String(options.passcode || "");
  const since = Number(options.since || 0);
  const selected = (options.conversationIds || []).map(String);
  const norm = (id) => String(id || "").replace(/[:]/g, "-");

  const initial = await fetchChatConversations(auth, selfId);
  if (!initial.ok || !initial.items.length) {
    writeXchatDebug({ ok: false, at: new Date().toISOString(), stage: "inbox", status: initial.status, reason: initial.reason || "" });
    return { ok: false, status: initial.status, error: initial.reason || "读取聊天列表失败", items: [] };
  }

  const secretResult = await ensureSecret(auth, selfId, passcode);
  if (!secretResult.ok) {
    writeXchatDebug({
      ok: false,
      at: new Date().toISOString(),
      stage: "key",
      reason: secretResult.reason || "",
      detail: secretResult.detail || null,
      blocked: !!secretResult.blocked,
      hasPasscode: !!passcode,
    });
    return { ok: false, status: 0, error: secretResult.reason || "密钥恢复失败", items: [] };
  }
  const secret = secretResult.secret;

  // 需要原始条目里的密钥变更事件，重新取一次初始页
  const raw = await getJson(
    GRAPHQL_URL +
      "/" +
      QUERY_IDS.GetInitialXChatPageQuery +
      "/GetInitialXChatPageQuery?variables=" +
      encodeURIComponent(JSON.stringify({ include_user_public_keys: true, include_juicebox_tokens: false, message_pull_version: 1 })),
    { headers: graphqlHeaders(auth), timeout: 20000 }
  );
  const rawItems = (raw.json && raw.json.data && raw.json.data.get_initial_chat_page && raw.json.data.get_initial_chat_page.items) || [];
  const wanted = rawItems.filter((item) => {
    const id = String((item.conversation_detail || {}).conversation_id || "");
    return !selected.length || selected.some((sid) => norm(sid) === norm(id));
  });

  const shares = [];
  const filters = [];
  let totalMessages = 0;
  let totalFromPeer = 0;
  let totalLinks = 0;
  for (const item of wanted) {
    const detail = item.conversation_detail || {};
    const participants = (detail.participants_results || []).map((entry) => (entry && entry.result) || {});
    const parts = String(detail.conversation_id || "").split(":");
    // 会话 id 是 self:peer，两端相同说明只有自己，没有别人发的消息
    if (parts.length === 2 && parts[0] === parts[1]) {
      filters.push({ conversationId: String(detail.conversation_id || ""), status: 0, messages: 0, links: 0, skipped: "只有自己" });
      continue;
    }
    const names = {};
    for (const user of participants) {
      const id = String(user.rest_id || (user.legacy && user.legacy.id_str) || "");
      names[id] = {
        id,
        name: (user.core && user.core.name) || (user.legacy && user.legacy.name) || "",
        screenName: (user.core && user.core.screen_name) || (user.legacy && user.legacy.screen_name) || "",
        avatar: normalizeAvatar(user),
      };
    }
    const page = await conversationMessages(auth, item, secret, selfId);
    if (!page.ok) {
      filters.push({
        conversationId: String(detail.conversation_id || ""),
        status: page.status,
        messages: 0,
        links: 0,
        stats: page.stats || null,
        error: page.error || "",
      });
      continue;
    }
    let linkCount = 0;
    let fromPeer = 0;
    const peerLinkIds = [];
    for (const message of page.items) {
      // 只抓好友发来的
      if (selfId && message.senderId === selfId) continue;
      // 按上次检测时间做增量，和点赞/收藏同一套规则；拿不到时间的消息照常参与
      if (since && message.time && message.time < since) continue;
      fromPeer += 1;
      const links = xchatCrypto.tweetLinksIn(message.text);
      if (!links.length) continue;
      linkCount += links.length;
      for (const link of links) {
        peerLinkIds.push(link.tweetId);
        shares.push({
          tweetId: link.tweetId,
          screenName: link.screenName,
          conversationId: page.conversationId,
          sender: names[message.senderId] || { id: message.senderId, name: "", screenName: "", avatar: "" },
          text: message.text,
        });
      }
    }
    totalMessages += page.items.length;
    totalFromPeer += fromPeer;
    totalLinks += peerLinkIds.length;
    filters.push({
      conversationId: page.conversationId,
      status: 200,
      peer: (names[Object.keys(names).find((id) => id !== selfId)] || {}).screenName || "",
      messages: page.items.length,
      fromPeer,
      links: linkCount,
      uniqueLinks: new Set(peerLinkIds).size,
      stats: page.stats || null,
    });
  }

  // 同一条推文只留一份
  const seen = new Set();
  const unique = shares.filter((share) => {
    if (seen.has(share.tweetId)) return false;
    seen.add(share.tweetId);
    return true;
  });
  writeXchatDebug({
    ok: true,
    at: new Date().toISOString(),
    cachedKey: !!secretResult.cached,
    conversationsAsked: wanted.length,
    conversationsRead: filters.filter((entry) => entry.status === 200).length,
    totalMessages,
    totalFromPeer,
    totalLinks,
    shareCount: unique.length,
    filters,
  });
  return { ok: true, items: unique, filters, cached: secretResult.cached };
}

/** 解密链路的诊断摘要：只落状态与数量，不落消息正文和密钥 */
function writeXchatDebug(info) {
  try {
    require("fs").writeFileSync(
      require("path").join(process.env.TEMP || require("os").tmpdir(), "evd_xchat_debug.json"),
      JSON.stringify(info, null, 2)
    );
  } catch (error) {
    /* 诊断写不进去不影响功能 */
  }
}

module.exports = {
  fetchChatConversations,
  fetchChatShares,
  conversationOf,
  ensureSecret,
};
