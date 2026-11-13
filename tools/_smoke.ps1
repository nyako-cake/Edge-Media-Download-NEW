$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$p = Join-Path $root "Plugin"
$src = [IO.File]::ReadAllText((Join-Path $p "index.html"))

$stub = @'
<script>
window.__errs = [];
window.addEventListener("error", function (e) { window.__errs.push(String(e.message)); });
window.addEventListener("unhandledrejection", function (e) { window.__errs.push("rej:" + String((e.reason && e.reason.message) || e.reason)); });
window.require = function (m) {
  if (m === "path") return { join: function () { return Array.prototype.slice.call(arguments).join("/"); }, resolve: function () { return Array.prototype.slice.call(arguments).join("/"); }, dirname: function () { return ""; }, basename: function (v) { return String(v).split("/").pop(); }, extname: function (v) { var b = String(v); var i = b.lastIndexOf("."); return i < 0 ? "" : b.slice(i); }, sep: "/" };
  if (m === "fs") return { existsSync: function () { return true; }, mkdirSync: function () {}, readFileSync: function () { return ""; }, writeFileSync: function () {}, chmodSync: function () {}, unlinkSync: function () {}, createWriteStream: function () { return { on: function () {}, end: function () {} }; }, promises: {} };
  if (m === "http") return { createServer: function () { return { on: function () { return this; }, listen: function (a, b, cb) { if (typeof cb === "function") cb(); return this; }, close: function () {}, address: function () { return { port: 0 }; } }; } };
  if (m === "os") return { platform: function () { return "win32"; }, arch: function () { return "x64"; }, homedir: function () { return "C:\\\\Users\\\\Nyako"; }, tmpdir: function () { return "C:\\\\Temp"; }, EOL: "\r\n" };
  if (m === "child_process") return { spawn: function () { var h = { on: function () { return h; }, stdout: { on: function () {} }, stderr: { on: function () {} }, kill: function () {} }; return h; }, execFile: function (a, b, c, cb) { if (typeof cb === "function") cb(new Error("stub")); }, exec: function () {} };
  if (m === "electron") return { shell: { openExternal: function () {} }, ipcRenderer: { invoke: function () { return Promise.resolve(null); } } };
  return {};
};
window.module = window.module || { exports: {} };
window.global = window;
window.__dirname = "";
window.__filename = "";
window.process = window.process || { platform: "win32", env: {}, argv: [], versions: { node: "16" }, cwd: function () { return ""; } };
window.Buffer = window.Buffer || function () {};
var noop = function () {};
window.eagle = {
  app: { isDarkColors: function () { return true; }, theme: "GRAY", platform: "win32", version: "4.0.0", locale: "zh_CN" },
  onPluginCreate: function (cb) { window.__created = (window.__created || 0) + 1; setTimeout(function () { try { cb({}); window.__ran = 1; } catch (e) { window.__errs.push("create:" + e.message); } }, 0); },
  onThemeChanged: noop,
  notification: { show: noop },
  clipboard: { readText: function () { return "https://www.youtube.com/watch?v=demo123"; } },
  window: { setAlwaysOnTop: noop },
  os: { openExternal: noop },
  library: { info: function () { return Promise.resolve({ name: "test", path: "/tmp" }); }, path: "/tmp" },
  item: { addFromURL: function () { return Promise.resolve({ id: "1" }); } }
};
</script>
'@ -replace "`r`n", "`n"

$probe = @'
<script>
window.__probe = [];
function log(k, v) { window.__probe.push(k + "=" + v); }
function byId(id) { return document.getElementById(id); }
window.addEventListener("load", function () {
  setTimeout(function () {
    try {
      log("errs", window.__errs.join("|"));
      log("boot-ok", !!window.EVDUI);
      log("created", window.__created || 0);
      log("ran", window.__ran || 0);
      log("se", (window.__se || 0) + "/" + (window.__seErr || ""));
      log("ib", (window.__ib || 0) + "/" + (window.__ibErr || ""));
      log("steps", (window.__steps || []).join(","));
      log("ph", (byId("urlInput") || {}).placeholder || "");
      log("active-nav", Array.prototype.map.call(document.querySelectorAll(".sidebar-item.active"), function (n) { return n.dataset.view; }).join(","));
      log("panels-visible", Array.prototype.filter.call(document.querySelectorAll(".panel-content"), function (p) { return !p.hidden; }).map(function (p) { return p.dataset.panel; }).join(","));
      log("hash", location.hash);
      log("panel", (byId("panelTitle") || {}).textContent);
      log("theme", document.body.getAttribute("theme"));
      log("deps-state", (byId("ytdlpState") || {}).textContent);
      log("ytdlp-btns", [byId("ytdlpReinstall"), byId("ytdlpUninstall")].map(function (b) { return b ? (b.hidden ? "hidden" : (b.textContent || "").trim()) : "none"; }).join("/"));

      // 提交链接 -> 队列
      var input = byId("urlInput");
      input.value = "https://www.youtube.com/watch?v=demo123";
      byId("downloadBtn").click();
      setTimeout(function () {
        log("queue-rows", document.querySelectorAll("#downloadList .download-item").length);
        log("queue-status", (document.querySelector("#downloadList .item-status") || {}).textContent || "");
        log("empty-hidden", byId("downloadEmpty") ? byId("downloadEmpty").hidden : "none");

        // 面板切换
        document.querySelector('.sidebar-item[data-view="tags"]').click();
        log("tags-panel-title", (byId("panelTitle") || {}).textContent);
        log("fields", document.querySelectorAll("#twTagFields .checkbox-item[data-field]").length);
        log("logo", !!document.querySelector('.sidebar-item[data-view="download"]'));

        // 主题色块
        document.querySelector('.themes-picker .theme[data-theme="purple"]').click();
        log("theme-after", document.body.getAttribute("theme"));
        log("theme-store", localStorage.getItem("eagle-video-downloader.theme"));

        // 标签勾选 -> 偏好写入
        var item = document.querySelector('#twTagFields .checkbox-item[data-field="screenName"] input');
        item.checked = true; item.dispatchEvent(new Event("change", { bubbles: true }));
        log("tag-pref-keys", Object.keys(localStorage).filter(function (k) { return k.indexOf("twitter") >= 0 || k.indexOf("Twitter") >= 0; }).length);

        // 账号面板
        document.querySelector('.sidebar-item[data-view="account"]').click();
        log("account-title", (byId("panelTitle") || {}).textContent);
        log("avatar-box", (byId("twitterAvatar") || {}).className);
        log("acc-fields", (byId("authToken") ? "token-ok" : "missing") + "/" + (byId("monitorInterval") ? byId("monitorInterval").value : "none"));
      }, 1600);
    } catch (e) {
      window.__probe.push("throw=" + e.message);
    }
    setTimeout(function () {
      window.__probe.push("errs-late=" + window.__errs.join("|"));
      window.__probe.push("ib-late=" + ((window.__ib || 0) + "/" + (window.__ibErr || "")));
      var t = document.createElement("div");
      t.id = "probe-out";
      t.textContent = window.__probe.join("\n");
      t.style.display = "none";
      document.body.appendChild(t);
    }, 4200);
  }, 900);
});
</script>
'@ -replace "`r`n", "`n"

$bodyIdx = $src.IndexOf('<body')
if ($bodyIdx -lt 0) { throw "body not found" }
$bodyTagEnd = $src.IndexOf('>', $bodyIdx) + 1
$tools = $src.Substring(0, $bodyTagEnd) + "`n" + $stub + $src.Substring($bodyTagEnd)
$tools = $tools.Replace('</body>', $probe + '</body>')

$harness = Join-Path $p "_smoke-index.html"
[IO.File]::WriteAllText($harness, $tools, (New-Object Text.UTF8Encoding $false))

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$out = Join-Path $root "_smoke-dom.txt"
& $edge --headless=new --disable-gpu --user-data-dir="C:\Users\Nyako\AppData\Local\Temp\edge-evd-smoke" --dump-dom --virtual-time-budget=12000 --run-all-compositor-stages-before-draw "file:///$($harness -replace '\\','/')" 2>$null | Out-File -LiteralPath $out -Encoding utf8
$dom = [IO.File]::ReadAllText($out)
$m = [regex]::Match($dom, 'id="probe-out"[^>]*>(?<x>[\s\S]*?)</div>')
if ($m.Success) {
  $text = $m.Groups['x'].Value -replace '&quot;', '"'
  Write-Output "---- probe ----"
  Write-Output $text.Trim()
} else {
  Write-Output "probe not found; dom bytes=$($dom.Length)"
  $e = [regex]::Match($dom, 'id="__errs"')
  Write-Output $dom.Substring(0, [Math]::Min(3000, $dom.Length))
}
