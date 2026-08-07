# PowerPoint 适配器

PowerPoint 适配器与 WPS 适配器共享 `../host-bridge.js`。它负责把当前演示文稿路径、页码与 HTML 小组件发送给本机的 PPTist Overlay。

放映时 Overlay 通过 PowerPoint COM 运行对象表读取原生放映窗口和当前页码，不接管 PowerPoint 的动画、翻页或媒体播放。

生产安装包应把本目录的任务窗格页面注册为 PowerPoint Add-in，并将保存操作转发到 `savePptistWidgets()`。宿主适配器只保存配置，实际渲染统一由本地 Overlay 负责。
