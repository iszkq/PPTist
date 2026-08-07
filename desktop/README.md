# PPTist 本地 Office / WPS 插件

这是 Windows 本地插件，不是网页端的“单文件同步工具”。安装一次后，当前 Windows 用户在 PowerPoint 或 WPS 演示中打开任何 PPT/PPTX，都可以直接使用 PPTist 动效入口。

## 工作方式

- PowerPoint：在功能区显示 **PPTist 动效** 选项卡，点击“插入或编辑动效”。
- WPS 演示：后台运行器检测到 WPS 后自动加载同一个 COM 插件；支持功能区的版本会显示同名入口。
- 组件保存到本机 `%LOCALAPPDATA%\PPTistPlugin\widgets.json`，以“演示文件完整路径 + 页码”区分，所以不同 PPT 互不影响。
- 放映时，透明 WebView2 覆盖层只渲染 HTML 动效；原 PPT 的动画窗格、触发器、音视频、切换效果仍由 Office/WPS 原生播放。

## 安装

从源码安装需要：

1. Windows x64。
2. .NET 8 SDK（用于构建）；运行插件需要 .NET 8 Desktop Runtime。
3. Microsoft Edge WebView2 Runtime（Windows 10/11 通常已内置）。

在仓库根目录的 PowerShell 中运行：

```powershell
powershell -ExecutionPolicy Bypass -File desktop/installer/Build-PPTistPlugin.ps1 -Install -StartNow
```

安装器会同时生成 x64 与 x86 宿主组件，按 PowerPoint/WPS 实际位数自动注册，因此 Office x64 与 WPS x86 可以共存使用。安装只写入当前用户注册表，不要求管理员权限。

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

WPS 的功能区兼容性会随版本和授权类型不同而变化；若其版本未显示功能区入口，后台运行器仍会加载组件和跟随放映窗口。这个情况需要基于具体 WPS 版本继续适配其专有插件 API。
