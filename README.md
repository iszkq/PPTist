# PPTist

PPTist 是一个基于 Vue 3 和 TypeScript 的网页端 PPT 编辑与放映工具。本版本在 PPTist 的基础上增加了透明 HTML 动效组件、粒子照片秀、网页嵌入、PPTX 动画兼容导入和工程文件共享能力。

## 快速开始

环境要求：Node.js 18 或更高版本，推荐使用 Node.js 20；包管理器推荐 pnpm。

```bash
git clone https://github.com/iszkq/PPTist.git
cd PPTist
pnpm install
pnpm dev
```

打开终端显示的地址，默认是：<http://127.0.0.1:5173>

生产构建：

```bash
pnpm type-check
pnpm build-only
pnpm preview
```

如果本机没有 pnpm，也可以使用 `npm install` 和 `npm run dev`。

## 基本使用

1. 在编辑器中创建或导入页面。
2. 使用顶部的导入功能选择 `.pptx`、`.json` 或 `.pptist` 文件。
3. 导入 PPTX 后，导入内容会替换默认示例页面。
4. 点击放映进入演示。鼠标左键、滚轮、方向键、空格和回车都可以控制播放。
5. 点击“导出工程文件”保存 `.pptist` 文件，其他人导入这个文件即可继续编辑和放映。

## HTML 动效

选中 HTML 元素后，在右侧面板编辑 HTML、CSS 和 JavaScript。代码会在隔离 iframe 中运行，画布上的组件默认透明，可以与普通 PPT 元素叠加。

内置模板包括：

- 转盘：可编辑选项、删除中签项、显示结果、设置旋转时间。
- 电影胶卷：上传多张图片，自动连续播放胶卷照片带。
- 粒子照片秀：支持雨滴、雪花、樱花、星星、枫叶、气泡和萤火虫。
- 嵌入网页：输入 `https://` 网页地址，直接以 iframe 方式放入页面。

粒子照片秀支持设置：

- 粒子数量。
- 运动方向：上、下、左、右、斜向或随机。
- 运动速度。
- 照片展示时长和是否循环。

### 自定义 HTML

点击 HTML 元素的代码面板，直接输入三段代码。例如：

```html
<div class="counter">0</div>
```

```css
.counter { color: #36cfc9; font-size: 64px; text-align: center; }
```

```js
let value = 0;
setInterval(() => {
  value += 1;
  document.querySelector('.counter').textContent = value;
}, 1000);
```

演示模式下 HTML 组件允许交互；编辑模式下 iframe 默认不接收鼠标事件，避免影响元素拖动和选中。

## PPTX 动画说明

导入器会读取 PowerPoint 的 OOXML timing 信息，兼容常见的淡入、缩放、飞入、上升、下降、缩放、旋转、颜色强调、与前一动画同时播放和上一动画结束后自动播放等效果，并根据 PPTist 的动画模型转换。

由于 Office 动画包含复杂运动路径、组合行为、触发器和厂商扩展，不能保证所有高级动画像 PowerPoint 一样逐帧还原。导入后可以在动画面板中检查和调整效果。静态元素、布局和常用样式与动画时序是本项目的主要兼容范围。

## 网页嵌入限制

目标网站如果设置了 `X-Frame-Options` 或 Content Security Policy，浏览器会拒绝 iframe 嵌入；这属于目标网站的安全策略，PPTist 无法绕过。需要交互的网页建议先确认该地址允许被 iframe 加载。

## 工程文件

`.pptist` 是 PPTist 的工程文件，包含页面、元素、动画和 HTML/CSS/JavaScript 源码。它适合团队之间共享和继续编辑，不等同于 PowerPoint 的 `.pptx` 格式。

## 目录说明

- `src/configs/htmlWidget.ts`：HTML 模板和粒子动效源码。
- `src/utils/pptxAnimation.ts`：PPTX 动画解析和转换。
- `src/hooks/useImport.ts`：PPTX、JSON 和工程文件导入。
- `src/views/Screen`：放映、翻页和动画执行。
- `src/views/Editor/Toolbar/ElementStylePanel/HtmlStylePanel.vue`：HTML 组件属性面板。

## 许可证

项目基于 AGPL-3.0 开源。使用、修改或提供网络服务时，请阅读并遵守 [LICENSE](LICENSE) 中的许可证要求。
