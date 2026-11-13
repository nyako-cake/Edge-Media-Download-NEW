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
  if (m === "os") return { platform: function () { return "win32"; }, arch: function () { return "x64"; }, homedir: function () { return "C:\\Users\\Nyako"; }, hostname: function () { return "nyako"; }, tmpdir: function () { return "C:\\Temp"; }, EOL: "\r\n" };
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
  onPluginCreate: function (cb) { setTimeout(function () { try { cb({}); } catch (e) { window.__errs.push("create:" + e.message); } }, 0); },
  onThemeChanged: noop,
  notification: { show: noop },
  clipboard: { readText: function () { return ""; } },
  window: { setAlwaysOnTop: noop },
  os: { openExternal: noop },
  library: { info: function () { return Promise.resolve({ name: "test", path: "/tmp" }); }, path: "/tmp" },
  item: { addFromURL: function () { return Promise.resolve({ id: "1" }); } }
};
</script>
'@ -replace "`r`n", "`n"

$bodyIdx = $src.IndexOf('<body')
$bodyTagEnd = $src.IndexOf('>', $bodyIdx) + 1
$out = $src.Substring(0, $bodyTagEnd) + "`n" + $stub + $src.Substring($bodyTagEnd)
[IO.File]::WriteAllText((Join-Path $p "_preview-index.html"), $out, (New-Object Text.UTF8Encoding $false))

$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "file:///" + (Join-Path $p "_preview-index.html") -replace '\\', '/'
$shots = @(
  @("download", "check-download.png"),
  @("tags", "check-tags.png"),
  @("account", "check-account.png"),
  @("dependencies", "check-dependencies.png"),
  @("settings", "check-settings.png")
)
foreach ($s in $shots) {
  $tmp = "C:\Users\Nyako\AppData\Local\Temp\edge-evd-$($s[0])-$([guid]::NewGuid().ToString('N').Substring(0,6))"
  $png = Join-Path $root $s[1]
  & $edge --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$tmp" --window-size=900,680 --screenshot="$png" --virtual-time-budget=6000 --run-all-compositor-stages-before-draw "$url#$($s[0])" 2>$null | Out-Null
  if (Test-Path -LiteralPath $png) { Write-Output "$($s[1]) = $((Get-Item -LiteralPath $png).Length) bytes" } else { Write-Output "$($s[1]) MISSING" }
}

Remove-Item -LiteralPath (Join-Path $p "_preview-index.html") -Force -ErrorAction SilentlyContinue
