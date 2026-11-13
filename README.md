# Edge Media Download NEW

把网页里的视频、图片直接抓进 [Eagle](https://eagle.cool) 的下载器：一个 Eagle 插件（中文名「媒体下载器」）+ 一个 Edge 扩展。

本项目是在本地项目中重新构建的独立版本：界面与功能按本机使用需求重构，与上游 `eagle-video-downloader` 不构成 fork 关系、不跟随其更新，版本从 **1.0.0** 重新起算。

## 界面

<table><tr><td><img src="docs/images/intro.png" width="620" alt="插件界面"></td><td><img src="docs/images/popup.png" width="230" alt="扩展弹窗"></td></tr></table>

## 功能

**Eagle 插件（媒体下载器）**

下载与站点

- 粘贴任意视频链接加入下载队列，基于 `yt-dlp` 抓取原片并入库，自动写入标题、作者、来源链接等元数据
- X / Twitter、Sankaku、小红书、Pinterest、Dribbble、B 站、Vimeo、Instagram 有独立解析适配，除下载外还能拿到正文、话题、作者等信息；其余站点走 `yt-dlp` 通用流程，覆盖 YouTube、TikTok 等
- 纯图片内容同样支持：Pinterest Pin（自动取高清原图）、X 多图推文、Sankaku 投稿图、小红书笔记图；一条内容含多个文件时逐个下载

下载列表

- 每项显示进度百分比、速度与剩余时间；合并 / 转码阶段显示阶段状态与估算进度
- 筛选按钮（全部 / 下载中 / 完成 / 下载失败）带实时条目计数，工具条固定不随列表滚动
- 全部开始会连失败项一起重试，全部暂停停止所有进行中的任务；失败项可单项重试或删除
- 下载失败的记录写入本地，关窗重开后仍在，成功或手动删除后消失；库内素材已不存在时可重新下载
- 扩展推送与定时抓取进来的链接默认静默入队，不弹窗打断

界面与交互

- 一比一还原 Eagle 原生偏好设置：侧栏六页导航（下载列表 / 下载设置 / 外观 / 导入信息 / 依赖 / 账号）、折叠动画、固定工具条
- 六套主题（浅色、浅灰、灰色、深色、深蓝、紫色）或「跟随 Eagle 主题」；可切换左上角是否显示 X 账号卡片，并可一键恢复默认窗口大小
- 窗口可拖动、置顶、最小化，缩放后记住尺寸与位置
- 下载设置包含清晰度 / 帧率上限、同时下载数量（3 / 6 / 9 / 16 / 32）、下载线程数（自动 / 8 / 16 / 32 / 64 / 128，作用于 HLS / DASH 分片流）
- 加入下载列表时播放提示音，可在设置里开关或换成自定义音效

账号与自动抓取

- X / Twitter 填入 Cookie 中的 `auth_token` 与 `ct0` 即可连接，支持保存并测试、登出；X Chat 私信为端到端加密，需额外填入 4 位聊天密码才能解密
- 点赞与收藏可分别开启定时抓取，间隔从 30 秒到 3 小时，每轮每类最多 100 条
- 好友抓取：定时检查私信里分享的链接，可只抓所选聊天，间隔 2 / 4 / 6 / 8 / 10 分钟；同一链接只抓一次，与点赞收藏共用一套去重规则
- 账号资料、抓取开关与记录按 Eagle 资源库隔离，切换资源库自动跟随

导入信息规则

- 推特规则分「名称」「注释」「标签」三列，每列可勾选推特 ID、推文 ID、用户名、正文、全名五个字段，并各自调整顺序
- 名称按顺序用「 - 」连接，超 150 字符截断；注释上限 5000 字符；每个勾选的标签字段各自成为一条独立标签，单条超 100 字符截断，相邻两条可点锁链按钮合并
- 小红书话题标签开关、多文件区分开关（是否在名称末尾追加「 (1/N)」）都集中在这一页

局域网

- 插件在 `0.0.0.0:43110` 提供 `GET /ping`、`GET /peers` 与 `POST /ingest`，同网段设备可互发链接
- 只接受 https 且域名在白名单内的链接，请求体上限 16 KB

**Edge 扩展**

- 页面内推送：X 推文操作栏的保存按钮、Sankaku 与小红书右下角浮动按钮
- 自动推送：点赞 / 收藏时自动把该推文加入 Eagle，可在弹窗分别开关
- 局域网发送：把当前页面链接发给同网段另一台运行本插件的设备
- 插件未运行时尝试唤醒插件后重试；插件不可用时回退到 Eagle 本地 API（`41595`），仅支持 mp4 直链

## 安装

### Eagle 插件

1. 下载 Release 里的 `Edge-Media-Download-NEW-v<版本>.eagleplugin`
2. Eagle 中双击安装，或解压到 `Eagle/Plugins/<插件 id>`
3. 首次使用会引导安装 `yt-dlp`；音视频合并依赖 Eagle 内置 `ffmpeg`

也可以克隆仓库后直接导入 `Plugin/` 目录——`Plugin/dist/plugin.js` 已随仓库提交，无需先构建。

### Edge 扩展

1. 下载 Release 里的 `Edge-Media-Download-NEW-extension-v<版本>.zip` 并解压
2. Edge 打开 `edge://extensions`，开启「开发人员模式」
3. 点「加载解压缩的扩展」，选择解压后的目录

## 构建

```bash
npm install
npm run build     # 打包 js/ → Plugin/dist/plugin.js
npm run dev       # 监听文件变化持续构建
npm run package   # 构建并打包为 媒体下载器.eagleplugin
```

改完 `js/` 后请重新 `npm run build` 并一并提交更新后的 `Plugin/dist/plugin.js`，否则仓库内的构建产物会与源码不同步。

## CI

打包工作流位于 `.github/workflows/build.yml`：推送 `v*` tag 或手动触发后，自动构建插件与扩展，产物上传为 artifact，并在打 tag 时附加到对应的 Release。

如果只想保留一份模板而不启用，可以把该文件移到 `docs/ci/build.yml`，需要时再复制回 `.github/workflows/`。

## 目录

```
js/              插件源码（下载器、站点适配、X 私信抓取、UI）
Plugin/          Eagle 插件成品目录（index.html、dist、assets、_locales）
edge-extension/  Edge 扩展（popup、content script、background）
docs/            界面截图、CI 模板
```

## 数据与端口

- 存储键前缀 `Edge-Media-Download-NEW.`（旧版 `eagle-video-downloader.` 首次启动自动迁移）
- 桥接端口 `43110`：`/ping`、`/ingest`、`/peers`
- 插件 ID `e6a9bdad-237b-4f06-a4e8-67b46fed5ad6`

## 致谢

- 最初版本来自 [fansanqiu](https://github.com/fansanqiu) 的 Eagle 视频下载器，其前身为 [OlivierEstevez/eagle-twitter-video-downloader](https://github.com/OlivierEstevez/eagle-twitter-video-downloader)
- 下载核心使用 [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- 音视频合并与转码使用 [FFmpeg](https://ffmpeg.org)

## License

MIT
