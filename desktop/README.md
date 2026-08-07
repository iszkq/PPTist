# PPTist 本地 Office / WPS 插件

这是 Windows 本地插件，不是网页端的“单文件同步工具”。当前版本支持在任意 PowerPoint PPT/PPTX 中直接使用 PPTist 动效入口；WPS 365 需通过其官方签名插件渠道适配。

## 工作方式

- PowerPoint：在功能区显示 **PPTist 动效** 选项卡，点击“插入或编辑动效”。
- WPS：不同版本的第三方插件机制不兼容。WPS 365 当前采用带签名校验的内部插件系统，不能通过通用 COM Add-in 注入功能区。
- 组件保存到本机 `%LOCALAPPDATA%\PPTistPlugin\widgets.json`，以“演示文件完整路径 + 页码”区分，所以不同 PPT 互不影响。
- 放映时，透明 WebView2 覆盖层只渲染 HTML 动效；原 PPT 的动画窗格、触发器、音视频、切换效果仍由 Office/WPS 原生播放。

## 安装

普通用户请直接从项目的 GitHub Release 下载 `PPTist-Setup.exe` 并双击运行；不需要 Node.js、pnpm、.NET SDK 或 PowerShell。

从源码构建安装包才需要：

1. Windows x64。
2. .NET 8 SDK（用于构建）；运行插件需要 .NET 8 Desktop Runtime。
3. Microsoft Edge WebView2 Runtime（Windows 10/11 通常已内置）。

在仓库根目录的 PowerShell 中运行：

```powershell
powershell -ExecutionPolicy Bypass -File desktop/installer/Build-PPTistPlugin.ps1 -Install -StartNow
```

如需生成供他人分发的单文件安装包：

```powershell
powershell -ExecutionPolicy Bypass -File desktop/installer/Build-PPTistSetup.ps1
```

生成结果为 `desktop/release/PPTist-Setup.exe`。该文件内置插件、x64/x86 .NET Desktop Runtime，体积约 266 MB。

安装器会同时生成 x64 与 x86 PowerPoint 宿主组件，安装只写入当前用户注册表，不要求管理员权限。

安装完成后，请完全退出再重新打开 PowerPoint/WPS；可在 `文件 → 选项 → 加载项 → COM 加载项` 查看 `PPTist.HostAddin`。

## 使用

1. 打开任意演示文件，切到要添加效果的那一页。
2. 在功能区点击 **PPTist 动效 → 插入或编辑动效**。
3. 左侧新建或选择组件；上方可选“幸运转盘、雨滴、萤火虫”，也可直接输入任意 HTML、CSS、JavaScript。
4. 设置位置和尺寸并保存。
5. 正常按 F5 放映。该页的 HTML 组件会自动叠加在原生放映窗口中。

坐标采用 1000 × 562.5 画布。组件默认保存在本机，不修改原 PPTX 文件本体；把 PPTX 交给他人时，对方也需安装插件并导入/配置对应组件工程，后续会补充可携带的组件包导入导出。

## 当前范围

本地首版已提供任意文稿的插件入口、当前页组件管理、三种内置组件与自定义 HTML/CSS/JS、PowerPoint/WPS 自动宿主加载及原生放映覆盖层。

WPS 365 的本机插件需要走其官方开发者插件渠道及签名机制；在没有该渠道的情况下，不能承诺会出现自定义功能区入口。当前安装包应视为 PowerPoint 本地插件安装包，而不是通用 WPS 365 插件。
