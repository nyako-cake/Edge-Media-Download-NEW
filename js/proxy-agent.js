/**
 * 极简 HTTP CONNECT 代理 Agent：让插件自身的 HTTPS 请求也能走系统代理。
 * Node 的 TLS 指纹在部分网络下会被直接重置，而系统代理可正常握手。
 */
const http = require("http");
const https = require("https");
const tls = require("tls");

function parseProxy(proxyUrl) {
  try {
    const parsed = new URL(proxyUrl);
    const secure = parsed.protocol === "https:";
    return {
      host: parsed.hostname,
      port: Number(parsed.port || (secure ? 443 : 80)),
      auth: parsed.username
        ? `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password || "")}`
        : null,
    };
  } catch (e) {
    return null;
  }
}

class ConnectProxyAgent extends https.Agent {
  constructor(proxyUrl, options = {}) {
    super(options);
    this.proxy = parseProxy(proxyUrl);
  }

  createConnection(options, callback) {
    const proxy = this.proxy;
    if (!proxy) {
      callback(new Error("invalid proxy url"));
      return undefined;
    }

    const targetHost = options.hostname || options.host;
    const targetPort = Number(options.port) || 443;
    const headers = { Host: `${targetHost}:${targetPort}` };
    if (proxy.auth) headers["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64");

    const proxyReq = http.request({
      host: proxy.host,
      port: proxy.port,
      method: "CONNECT",
      path: `${targetHost}:${targetPort}`,
      headers,
    });

    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      try { proxyReq.destroy(); } catch (e) {}
      callback(error);
    };

    proxyReq.once("connect", (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        fail(new Error(`proxy CONNECT failed with ${res.statusCode}`));
        return;
      }
      const tlsSocket = tls.connect({ socket, servername: options.servername || targetHost });
      tlsSocket.once("secureConnect", () => {
        if (settled) return;
        settled = true;
        callback(null, tlsSocket);
      });
      tlsSocket.once("error", fail);
    });
    proxyReq.once("error", fail);
    proxyReq.setTimeout(15000, () => fail(new Error("proxy CONNECT timeout")));
    proxyReq.end();
    return undefined;
  }
}

module.exports = { ConnectProxyAgent, parseProxy };
