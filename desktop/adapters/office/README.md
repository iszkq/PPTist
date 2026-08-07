# PowerPoint 适配

PowerPoint 使用 `PPTist.HostAddin` COM Add-in。安装器在当前用户注册表中注册插件，并写入 PowerPoint 的 Addins 配置；重新打开 PowerPoint 后会出现“PPTist 动效”功能区选项卡。

插件从当前 PowerPoint 文稿和当前页读取上下文，组件配置直接写入本机组件库。放映则交给 `PPTist.Overlay` 跟随原生放映窗口完成，不接管 PowerPoint 的动画和翻页。
