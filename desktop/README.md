# PPTist Office / WPS 原生放映助手

这是网页编辑器的 Windows 配套运行器。它不再把 PPTX 转成网页放映，而是让 PowerPoint 或 WPS 继续打开原来的 PPTX；运行器只在放映窗口上方叠加需要的 HTML 组件。

因此，原文件中的动画窗格、触发方式、音视频和切换效果继续由 Office/WPS 执行，不会在导入时丢失。

## 自动识别

安装时会检测本机的 PowerPoint 和 WPS 演示：

- 只安装了一个：自动支持已安装的软件。
- 两个都安装：两个都支持，不需要选择。
- 放映时运行器自动跟随当前打开的 PowerPoint/WPS 放映窗口和页码。

## 安装

从源码安装需要 .NET 8 SDK。在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File desktop/installer/Build-PPTistPlugin.ps1 -Install -StartNow
```

脚本会发布一个自包含的 Windows x64 运行器、安装到当前用户目录，并写入开机自启。安装文件位于：

```text
%LOCALAPPDATA%\PPTistPlugin
```

安装后可在浏览器中访问 <http://127.0.0.1:32147/health>；看到 `{"status":"ok"}` 就表示运行器已就绪。

## 使用流程

1. 用 PowerPoint 或 WPS 正常打开你的原 PPTX，不需要导入到网页编辑器来播放。
2. 在 PPTist 网页编辑器制作或调整 HTML 组件（转盘、粒子、照片秀、自定义 HTML、嵌入网页等）。
3. 点击左上角菜单的“同步到 Office / WPS 原生放映”。
4. 填入该原 PPTX 的**完整路径**，例如 `C:\演示\汇报.pptx`，点击“同步组件”。路径必须和 Office/WPS 实际打开的文件一致。
5. 回到 PowerPoint 或 WPS，按 F5 放映。HTML 组件会按页面和位置透明叠加；空白区域鼠标会穿透给原生放映窗口。

网页编辑器中的第 1、2、3… 页会对应原 PPTX 的第 1、2、3… 页。修改组件后重新同步一次即可。

## 技术边界

当前首版通过 Windows COM 自动识别放映窗口，并使用 WPF + WebView2 透明覆盖层。它是一个“原生放映助手”，不把控件嵌进 Office/WPS 的功能区或任务窗格；这样无需分别维护 Office 和 WPS 两套插件包，也能同时支持两者并避免干扰放映动画。

若后续要做正式的功能区/任务窗格插件，Office 和 WPS 仍需各自的签名、注册和安装包；它们可以复用本目录的本地桥接协议和渲染器。
