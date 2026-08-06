# PPTist HTML 动效 MVP

## 使用

1. 运行 `pnpm install`，再执行 `pnpm dev`。
2. 在编辑器顶部工具栏点击 `</>`（HTML 动效），会插入一个空白 HTML 元素。
3. 选中元素后，在右侧面板分别编辑 HTML、CSS、JavaScript；也可以先选择转盘、呼吸球或进度条模板，再修改代码。
4. 使用 PPTist 的放映按钮进入演示；HTML 元素会在当前页的 iframe 内运行。

## 行为与边界

- HTML 元素与普通 PPT 元素一样可移动、缩放、旋转、复制、保存到 `.pptist` / JSON。
- 默认“每次进入页面重新播放”。关闭此选项后，预加载的相邻页面可能保留原有运行状态。
- 编辑器中的 iframe 不接收指针事件，以便仍能拖拽选中元素；放映模式中允许与动效交互。
- HTML 元素画布默认透明；内置模板只绘制组件本身，不附加“HTML”标签或示例外框，可以叠加到 PPT 背景和其他元素上。
- 转盘模板参考随机抽签转盘的交互：按选项数量动态绘制扇区，点击中心或转盘开始旋转，动画结束后显示中奖结果；可配置旋转时长、结果前缀、是否显示结果，以及是否将中签项从下一轮选项中移除。选项可在右侧逐行添加、编辑和删除。
- iframe 仅授予 `allow-scripts`，没有 `allow-same-origin`、弹窗、表单和顶层导航权限。动效脚本不能访问 PPTist 页面或本地演示数据。
- HTML 动效无法无损导出为原生 `.pptx` 动画；对外分发时建议用网页放映，或将关键动效录制为 MP4/GIF 后嵌入 PPTX。

## PPT 与工程文件

- 顶部菜单支持导入 PPTX；PPTX 会转换为 PPTist 支持的普通文本、图片、形状等元素，不会自动把 PPT 动画转换成 HTML 动效。
- 使用“导出文件”中的“PPTIST 文件”导出工程文件。`.pptist` 会保存每个 HTML 元素的 HTML/CSS/JavaScript；接收者在另一份 PPTist 中选择导入 `.pptist` 即可继续编辑和演示。

## 本次新增文件

- `src/types/slides.ts`：`html` 元素数据模型。
- `src/views/components/element/HtmlElement/`：编辑、缩略图和放映渲染。
- `src/views/Editor/Toolbar/ElementStylePanel/HtmlStylePanel.vue`：HTML/CSS/JS 编辑面板。
- `src/configs/htmlWidget.ts`：可直接运行的转盘示例。
