# WPS 演示适配器

WPS 适配器与 PowerPoint 适配器共享 `../host-bridge.js`。它负责把当前演示文稿路径、页码与 HTML 小组件发送给本机的 PPTist Overlay。

放映时 Overlay 通过 WPS 演示程序的 `KWPP.Application` COM 对象读取原生放映窗口和当前页码，因此 WPS 内原有动画仍由 WPS 自身播放。

不同 WPS 发布渠道的插件目录和签名策略可能不同，生产安装包应根据检测到的 WPS 安装路径注册本目录的插件入口；组件数据协议与 PowerPoint 完全相同。
