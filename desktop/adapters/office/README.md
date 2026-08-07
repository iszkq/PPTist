# Microsoft PowerPoint 加载项

PPTist 使用 PowerPoint 官方 Office Add-in（任务窗格）作为编辑入口。它不会把 .NET、WPF 或 WebView2 注入 `POWERPNT.EXE`，因此不会影响原生动画、动画窗格、触发器、音视频和翻页。

安装后在 PowerPoint 中选择“文件 → 获取加载项 → 管理我的加载项 → 上传我的加载项”，上传 `office-addin/manifest.xml`。加载项任务窗格通过本地 companion 的 `http://127.0.0.1:32147` 保存组件，放映时由独立覆盖层渲染透明 HTML。
