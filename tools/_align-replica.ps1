$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$f = Join-Path $root "Plugin\index.html"
$t = [IO.File]::ReadAllText($f)

$oldBar = @'
    <div class="bottom-bar" id="bottomBar">
      <div class="input-bar">
        <button id="pasteButton" type="button" class="no-drag" title="Paste from clipboard"><span class="btn-label">粘贴</span>
'@

$newBar = @'
    <div class="bottom-bar" id="bottomBar">
      <div class="input-bar">
        <div class="input-field">
          <span class="input-search-icon" aria-hidden="true"></span>
          <input type="text" id="urlInput" class="no-drag" placeholder="粘贴视频链接…" autocomplete="off" spellcheck="false" />
        </div>
        <button id="pasteButton" type="button" class="no-drag" title="Paste from clipboard">
'@

# 找到整个底栏块并替换
$start = $t.IndexOf('    <div class="bottom-bar" id="bottomBar">')
if ($start -lt 0) { throw "bottomBar start not found" }
$endMarker = '        </button>' + "`n" + '      </div>' + "`n" + '    </div>'
$end = $t.IndexOf($endMarker, $start)
if ($end -lt 0) { throw "bottomBar end not found" }
$barEnd = $end + $endMarker.Length

$bar = @'
    <div class="bottom-bar" id="bottomBar">
      <div class="input-bar">
        <div class="input-field">
          <span class="input-search-icon" aria-hidden="true"></span>
          <input type="text" id="urlInput" class="no-drag" placeholder="粘贴视频链接…" autocomplete="off" spellcheck="false" />
        </div>
        <button id="pasteButton" type="button" class="no-drag" title="Paste from clipboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
            <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
            <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            <path d="M16 4h2a2 2 0 0 1 2 2v4" />
            <path d="M21 14H11" />
            <path d="m15 10-4 4 4 4" />
          </svg>
          <span class="btn-label">粘贴</span>
        </button>
        <button id="addButton" class="no-drag disabled">
          <img src="assets/icon_download.svg" width="16" height="16" alt="Download" />
          <span class="btn-label">下载</span>
          <div class="error-tooltip"></div>
        </button>
      </div>
    </div>
'@
$t = $t.Substring(0, $start) + ($bar -replace "`r`n", "`n").TrimEnd() + "`n" + $t.Substring($barEnd)

# 侧栏底部收纳按钮：插到 </nav> 前
$navEnd = $t.IndexOf('</nav>')
if ($navEnd -lt 0) { throw "nav end not found" }
$footer = '        <div class="sidebar-footer">' + "`n" +
          '          <button id="sidebarCollapseBtn" type="button" class="sidebar-collapse-btn no-drag" title="收起侧栏">' + "`n" +
          '            <span class="collapse-icon" aria-hidden="true"></span>' + "`n" +
          '          </button>' + "`n" +
          '        </div>' + "`n" + '      '
$t = $t.Insert($navEnd, $footer)

# 三列标题后的圈问号
$marks = @(
  @{ old = '<div class="setting-check-title" id="twNameColumnTitle">Name</div>'; new = '<div class="setting-check-title" id="twNameColumnTitle">Name<span class="hint-q" data-tip="左列组成素材名称；未勾选任何项时保留「推文正文 - @用户名」">?</span></div>' },
  @{ old = '<div class="setting-check-title" id="twAnColumnTitle">Annotation</div>'; new = '<div class="setting-check-title" id="twAnColumnTitle">Annotation<span class="hint-q" data-tip="中列写入素材注释；未勾选任何项时保留纯推文正文">?</span></div>' },
  @{ old = '<div class="setting-check-title" id="twTagColumnTitle">Tags</div>'; new = '<div class="setting-check-title" id="twTagColumnTitle">Tags<span class="hint-q" data-tip="右列追加为 Eagle 标签，多个标签按顺序拼接">?</span></div>' }
)
foreach ($m in $marks) {
  if ($t.Contains($m.old)) { $t = $t.Replace($m.old, $m.new) } else { Write-Output ("miss: " + $m.old) }
}

# 收纳按钮点击脚本（纯界面，不改 js/）
$script = '  <script>' + "`n" +
          '    (function () {' + "`n" +
          '      var btn = document.getElementById("sidebarCollapseBtn");' + "`n" +
          '      if (!btn) return;' + "`n" +
          '      btn.addEventListener("click", function () {' + "`n" +
          '        var collapsed = document.documentElement.classList.toggle("sidebar-collapsed");' + "`n" +
          '        btn.title = collapsed ? "展开侧栏" : "收起侧栏";' + "`n" +
          '      });' + "`n" +
          '    })();' + "`n" +
          '  </script>' + "`n"
$t = $t.Replace('</body>', $script + '</body>')

if (-not $t.Contains('id="sidebarCollapseBtn"')) { throw "collapse button missing" }
[IO.File]::WriteAllText($f, $t, (New-Object Text.UTF8Encoding $false))
"html updated; hintQ=" + ([regex]::Matches($t, 'hint-q')).Count
