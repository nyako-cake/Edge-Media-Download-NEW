$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$p = Join-Path $root "Plugin"
$src = [IO.File]::ReadAllText((Join-Path $p "index.html"))

$stub = @'
<script>
window.__errs = [];
window.addEventListener("error", function (e) { window.__errs.push(String(e.message)); });
window.addEventListener("unhandledrejection", function (e) { window.__errs.push("rej:" + String(e.reason && e.reason.message || e.reason)); });
window.require = function (m) {
  if (m === "path") return { join: function () { return Array.prototype.slice.call(arguments).join("/"); }, resolve: function () { return Array.prototype.slice.call(arguments).join("/"); }, dirname: function () { return ""; }, basename: function (v) { return String(v).split("/").pop(); }, extname: function (v) { var b = String(v); var i = b.lastIndexOf("."); return i < 0 ? "" : b.slice(i); }, sep: "/" };
  if (m === "fs") return { existsSync: function () { return false; }, mkdirSync: function () {}, readFileSync: function () { return ""; }, writeFileSync: function () {}, chmodSync: function () {}, unlinkSync: function () {}, createWriteStream: function () { return { on: function () {} }; }, promises: {} };
  if (m === "electron") return { shell: { openExternal: function () {} } };
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
  app: { isDarkColors: function () { return true; }, theme: "GRAY", platform: "win32", version: "4.0.0" },
  onPluginCreate: function (cb) { setTimeout(function () { try { cb({}); } catch (e) { window.__errs.push("create:" + e.message); } }, 0); },
  onThemeChanged: noop,
  notification: { show: noop },
  clipboard: { readText: function () { return ""; } },
  window: { setAlwaysOnTop: noop },
  os: { openExternal: noop },
  library: { info: function () { return Promise.resolve({ name: "test", path: "/tmp" }); }, path: "/tmp" },
  item: { addFromURL: function () { return Promise.resolve({ id: "1" }); } },
};
</script>
'@ -replace "`r`n", "`n"

$tail = @'
<script>
setTimeout(function () {
  var target = (location.hash || "").replace("#", "") || "download";
  var titles = { download: "下载", settings: "通用", tags: "导入信息", dependencies: "依赖", account: "账号" };
  var map = { settings: "settingsPanel", tags: "tagsPanel", dependencies: "depsPanel", account: "accountPanel" };
  var main = document.getElementById("mainContainer");
  if (main) main.classList.remove("hidden");
  var dv = document.getElementById("downloadView");
  var sv = document.getElementById("settingsView");
  if (dv) dv.classList.add("hidden");
  if (sv) sv.classList.add("hidden");
  if (location.search.indexOf("collapse=1") >= 0) document.documentElement.classList.add("sidebar-collapsed");
  if (location.search.indexOf("empty=1") >= 0) { var l = document.querySelector(".download-list"); if (l) l.innerHTML = ""; }
  if (target === "download") {
    if (dv) dv.classList.remove("hidden");
  } else {
    if (sv) sv.classList.remove("hidden");
    ["settingsPanel", "tagsPanel", "depsPanel", "accountPanel"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    var want = document.getElementById(map[target]);
    if (want) want.classList.remove("hidden");
    var notice = document.getElementById("depsNotice");
    if (notice) notice.classList.add("hidden");
  }
  var title = document.getElementById("currentPanelTitle");
  if (title) title.textContent = titles[target] || "下载";
  if (location.search.indexOf("collapse=1") >= 0) document.documentElement.classList.add("sidebar-collapsed");
  if (location.search.indexOf("empty=1") >= 0) { var l = document.querySelector(".download-list"); if (l) l.innerHTML = ""; }
  if (target === "download" && location.search.indexOf("empty=1") < 0) {
    var list = document.querySelector(".download-list");
    if (list) {
      var demo = [
        ["waiting", "等待中 · x.com/i/status/1234567890", "排队中", 0],
        ["downloading", "【原创】夏日的海边写真 vol.03", "1080p · 24.6 MB / 68.1 MB · 剩余 12 秒", 36],
        ["completed", "抖音 · 一段很好看的舞蹈视频", "1080p · 42.8 MB · 已完成", 100],
        ["error", "Instagram · reel 视频", "下载失败：HTTP 403", 0]
      ];
      demo.forEach(function (d) {
        var el = document.createElement("div");
        el.className = "download-item " + d[0];
        el.innerHTML = '<button class="item-delete" title="移除">&#215;</button><div class="item-title">' + d[1] + '</div><div class="item-progress-bar"><div class="item-progress-fill" style="width:' + d[3] + '%"></div></div><div class="item-footer"><span class="item-meta">' + d[2] + '</span><div class="item-actions' + (d[0] === "error" ? "" : " hidden") + '"><button class="item-action-btn">重试</button><button class="item-action-btn">复制链接</button><button class="item-action-btn">删除记录</button></div></div>';
        list.appendChild(el);
      });
    }
  }
  Array.prototype.forEach.call(document.querySelectorAll(".app-nav-item"), function (b) {
    b.classList.toggle("active", b.dataset.view === target);
  });
  var diag = document.createElement("div");
  diag.id = "diag2";
  diag.style.cssText = "position:fixed;left:-9999px";
  diag.textContent = "errs=" + JSON.stringify(window.__errs.slice(0, 6));
  document.body.appendChild(diag);
}, 2600);
</script>
'@ -replace "`r`n", "`n"

$src = $src.Replace('<script>window.__pluginScriptLoadFailed = false;</script>', $stub + "`n  <script>window.__pluginScriptLoadFailed = false;</script>")
$src = $src.Replace('</body>', $tail + "</body>")
[IO.File]::WriteAllText((Join-Path $p "_skin-test.html"), $src, (New-Object Text.UTF8Encoding $false))
"harness written"
