# 维护说明

给后续维护者的备忘，记录项目身份、开发方式与发布清单。技术细节见 `CLAUDE.md`。

## 项目身份

| 项 | 值 |
|---|---|
| 插件 ID | `e6a9bdad-237b-4f06-a4e8-67b46fed5ad6` |
| 中文名 / 英文名 | 媒体下载器 / Media Downloader |
| 仓库 | https://github.com/nyako-cake/Edge-Media-Download-NEW |
| 当前发布版本 | 1.0.0 |
| 存储键前缀 | `Edge-Media-Download-NEW.`（旧前缀启动时自动迁移）|
| 桥接端口 | `43110`（`/ping`、`/ingest`、`/peers`）|
| 已装目录 | `%APPDATA%\Eagle\Plugins\e6a9bdad-237b-4f06-a4e8-67b46fed5ad6` |

本项目是在本地项目中重新构建的独立版本，与上游 `eagle-video-downloader` 不构成 fork 关系、不跟随其更新。

## 开发方式

以仓库为准：改 `js/` 或 `Plugin/index.html` → `npm run build` → 连同 `Plugin/dist/plugin.js` 一起提交。

历史上有一段时期采用「直接修改已安装插件、不重新打包」的方式迭代，导致音效、同时下载数量、失败记录等功能只存在于构建产物里，`js/` 落后约 480 行。2026-11-14 已把这些功能回填进源码并验证构建可重现，此后不再直接改产物。

界面改动仍然建议先在浏览器里看预览（`tools/_preview.ps1` 可生成静态预览页），确认后再落到 `Plugin/index.html`。

## 版本与发布

版本号规则：每次修 bug 递增 0.0.1，发布文件名带版本号。

发布清单：

1. 同时改 `Plugin/manifest.json` 与 `package.json` 的 `version`
2. `npm ci && npm test && npm run build`，确认 dist 与源码同步
3. 提交并推送 `main`
4. 打 tag（`git tag v1.0.1 && git push origin v1.0.1`），CI 会自动构建并附加到 Release
5. 需要手动发时：`npm run package` 生成 `媒体下载器.eagleplugin`

插件 ID 一旦变更，Eagle 会视为新插件，已装数据不会迁移，务必保持不变。

## 注意事项

自定义音效存放在 `Plugin/assets/sounds/custom.*`，已被 gitignore。音效路径同时记在 localStorage 里，因此换机器或换目录重装后自定义音效会失效，需重新选择；默认音效 `Plugin/assets/sounds/notify.wav` 随仓库分发。

`tools/` 下的 PowerShell 脚本以仓库根目录为基准，运行时会生成 `Plugin/_*.html` 临时文件（已 gitignore）。

`bin/yt-dlp.exe` 不入库，首次运行自动下载；调试时若需要固定版本，可手动放入 `Plugin/bin/`。
