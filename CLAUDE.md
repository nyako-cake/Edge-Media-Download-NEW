# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five canonical triage labels. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain documentation layout. See `docs/agents/domain.md`.

## 命令

```bash
npm ci            # 按 package-lock.json 安装依赖
npm run build     # 生产构建，输出到 Plugin/dist/plugin.js
npm run dev       # 开发模式，文件变更时自动重新构建
npm test          # 单元测试（net-guard / twitter-name / 导入信息规则）
npm run package   # 构建并打包为 媒体下载器.eagleplugin
```

`Plugin/bin/` 已加入 gitignore，yt-dlp 二进制在运行时自动下载；`node_modules/` 同样不入库。

打包时直接运行 `npm run package`，会在项目根目录生成 `媒体下载器.eagleplugin`，即可上传发布。CI 另有 `.github/workflows/build.yml`：推送 `v*` tag 时自动构建并用 `package.json` 的版本号命名产物。

## 站点联调脚本

都需要真实网络与目标站点可达，按需手动运行：

- `test-urls.js` — 样例链接清单
- `test-info.js` — 只跑解析（`--dump-json`），不下载
- `test-download.js` — 跑完整下载流程
- `test-ytdlp.js` — 验证 yt-dlp 的安装、更新与校验链路
- `test-setup.js` — 上面几个共用的初始化（mock Eagle 环境）

## UI 自检脚本（PowerShell）

放在 `tools/`，均以仓库根目录为基准读写 `Plugin/`，运行时会生成临时 HTML，这些文件已 gitignore。

- `tools/_smoke.ps1` — 生成 `Plugin/_smoke-index.html` 并把渲染后的 DOM dump 到 `_smoke-dom.txt`
- `tools/_preview.ps1` — 生成可在浏览器直接打开的静态预览页
- `tools/_skin-harness.ps1` — 皮肤与主题对齐检查
- `tools/_align-replica.ps1` — 与逆向界面逐项比对尺寸

## dist 构建产物随仓库提交

`Plugin/dist/plugin.js` 是构建产物，但**已纳入版本控制**。原因：Eagle 通过 `Plugin/index.html` 的 `<script src="dist/plugin.js">` 加载主逻辑，若 clone 后未构建就直接把 `Plugin/` 导入 Eagle，该文件缺失会导致脚本不执行、`#mainContainer`/`#depsContainer` 一直隐藏，窗口空白卡死。提交 dist 后，clone 完即可直接导入。

代价：**每次改动 `js/` 后必须重新 `npm run build` 并提交更新后的 `dist/plugin.js`**。当前 `js/` 与 dist 已对齐，构建可重现（同一份源码重复构建得到相同字节）。

`index.html` 末尾有兜底：dist/plugin.js 加载失败时显示明确提示而非空白卡死。

## 架构

源码在 `js/`，esbuild 打包为 `Plugin/dist/plugin.js`。界面在 `Plugin/index.html`（内联样式）配合 `Plugin/native-skin.css`、`Plugin/window-drag.css` 与 `Plugin/ui-shell.js`。Eagle 以 `Plugin/` 为根目录加载插件，运行时 `__dirname` 指向 `Plugin/dist/`。

- `plugin.js` — 入口：Eagle 生命周期、下载队列与并发控制、设置项读写、窗口尺寸与状态、局域网 ingest 桥
- `ui-replica.js` — 逆向还原的设置界面渲染与事件绑定（侧栏、外观、账号、导入信息规则）
- `ui.js` — 下载队列条目渲染、输入栏与主题（早期界面模块）
- `downloader.js` — 调用 yt-dlp 子进程，解析实时进度，处理多视频与 Vimeo URL 规范化
- `binary.js` — yt-dlp 锁定版本下载与 SHA-256 校验，macOS 隔离属性清除，Eagle 内置 ffmpeg 路径
- `net-guard.js` — 共享网络安全模块，IP/SSRF 检测与 URL 校验
- `sites/` — 站点适配器：X、小红书、Sankaku、Pinterest、Dribbble、B 站、Vimeo、Instagram，其余站点走 yt-dlp 通用流程
- `twitter-auth.js` / `sankaku-auth.js` — 账号凭据存取（Cookie / accessToken）
- `twitter-monitor.js` — 点赞、收藏与好友私信的定时抓取与去重
- `twitter-xchat.js` / `xchat-crypto.js` / `twitter-dm.js` / `thrift.js` — X Chat 私信拉取与端到端解密
- `twitter-name.js` — 「导入信息规则」的名称 / 注释 / 标签三列逻辑
- `error-log.js` — 下载失败记录（关窗后保留）
- `library-index.js` — 库内去重索引
- `x-http.js` — 带 Cookie 与代理的 HTTP 请求封装
- `proxy-agent.js` / `system-proxy.js` — 代理探测与系统代理接入

下载流程：URL → 站点适配器（可选）→ `getVideoInfo()`（yt-dlp `--dump-json`）→ `downloadVideo()`（子进程，临时目录）→ `importToEagle()` → 清理临时文件。

## 存储键前缀

所有 localStorage 键以 `Edge-Media-Download-NEW.` 开头。旧版前缀 `eagle-video-downloader.` 由 `Plugin/index.html` 的内联脚本在页面启动时迁移到新前缀，`js/` 内不再出现旧前缀。

## 文档写作规范

文档（CHANGELOG、README 等）中禁止使用多级无序列表。有层级关系时：第一级用普通文本（不加 `-`），第二级用无序列表。

## 国际化

语言文件在 `Plugin/_locales/en.json` 和 `zh_CN.json`，使用 i18next。新增用户可见字符串时需同时更新两个文件，界面上手写的部分在 `Plugin/index.html` 与 `Plugin/ui-shell.js` 中另有硬编码文案。

## 发布注意

发布新版本前同时更新 `Plugin/manifest.json` 与 `package.json` 的 `version`（CI 用 package.json 的版本号命名产物）。插件 ID 为 `e6a9bdad-237b-4f06-a4e8-67b46fed5ad6`，不可更改，否则 Eagle 会将其识别为新插件。

### 依赖版本检查与更新规则

为符合 Eagle 插件审核安全规范，发布前必须手动检查并更新锁定的二进制版本：

1. **yt-dlp**：访问 [yt-dlp Releases](https://github.com/yt-dlp/yt-dlp/releases/latest) 查看最新发布版本。若有新版本：
   - 更新 `js/binary.js` 中 `PINNED_VERSIONS.ytdlp.version`
   - 下载该 release 附带的 `SHA2-256SUMS` 文件
   - 更新各平台二进制（`yt-dlp.exe`、`yt-dlp_macos`、`yt-dlp_linux`）的 `sha256` 摘要值

2. 重新运行 `npm run build` 打包 `Plugin/dist/plugin.js` 并随仓库提交。
