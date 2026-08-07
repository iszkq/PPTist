# PPTist Microsoft PowerPoint 插件

本目录只支持 Windows 版 Microsoft PowerPoint，不支持 WPS。

## 运行方式

安装包会安装一个独立的透明放映覆盖层，并把官方 Office Add-in 清单放到 `%LOCALAPPDATA%\PPTistPlugin\office-addin\manifest.xml`。覆盖层不会加载进 PowerPoint 进程，所以 PowerPoint 自己的动画窗格、触发器、音视频、切换和翻页仍由 PowerPoint 播放。

安装完成后：

1. 完全退出并重新打开 PowerPoint。
2. 进入“文件 → 获取加载项 → 管理我的加载项 → 上传我的加载项”。
3. 选择 `%LOCALAPPDATA%\PPTistPlugin\office-addin\manifest.xml`。
4. 在功能区打开“PPTist 动效 → 打开动效面板”。

任务窗格支持输入任意 HTML、CSS、JavaScript，也提供幸运转盘、雨滴照片和萤火虫模板。组件保存到当前文稿路径与页码，F5 放映时由独立覆盖层显示。

## 构建

开发机需要 .NET 8 SDK；普通用户只需要 GitHub Release 中的 `PPTist-Setup.exe`。构建安装包：

```powershell
powershell -ExecutionPolicy Bypass -File desktop/installer/Build-PPTistSetup.ps1
```

输出：`desktop/release/PPTist-Setup.exe`。

旧版 `PPTist.HostAddin` COM 加载项已停用，不要注册或安装旧的 `v0.1.0` 安装包。
