/**
 * 读取系统代理设置。
 * 优先环境变量；Windows 其次读 HKCU\...\Internet Settings，
 * 让插件自身的 HTTPS 请求与 yt-dlp 子进程行为保持一致。
 */
const os = require("os");
const { execFileSync } = require("child_process");

let cached;

function getSystemProxyUrl() {
  if (cached !== undefined) return cached;

  const envProxy = process.env.HTTPS_PROXY || process.env.https_proxy
    || process.env.HTTP_PROXY || process.env.http_proxy
    || process.env.ALL_PROXY || process.env.all_proxy;
  if (envProxy) {
    cached = envProxy;
    return envProxy;
  }

  if (os.platform() === "win32") {
    try {
      const out = execFileSync(
        "reg",
        ["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"],
        { encoding: "utf8", windowsHide: true }
      );
      const enabled = /ProxyEnable\s+REG_DWORD\s+0x[1-9a-f]/i.test(out);
      const match = out.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/i);
      if (enabled && match) {
        let server = match[1].trim();
        // 形如 http=127.0.0.1:7890;https=127.0.0.1:7890
        if (server.includes("=")) {
          const parts = server.split(";").filter(Boolean).map((entry) => entry.split("="));
          const httpsPart = parts.find(([key]) => /https/i.test(key || ""));
          server = (httpsPart && httpsPart[1]) || (parts[0] && parts[0][1]) || "";
        }
        server = server.trim();
        if (server && !/^(http|socks)/i.test(server)) server = "http://" + server;
        if (server) {
          cached = server;
          return server;
        }
      }
    } catch (e) {}
  }

  cached = null;
  return null;
}

module.exports = { getSystemProxyUrl };
