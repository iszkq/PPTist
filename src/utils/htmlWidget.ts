import type { PPTHTMLElement } from '@/types/slides'

/** 将用户的三段源码封装为独立文档。iframe 不带 allow-same-origin，脚本无法触及宿主页面。 */
export const createHTMLWidgetDocument = (element: Pick<PPTHTMLElement, 'html' | 'css' | 'js'>) => {
  const css = element.css.replace(/<\/style/gi, '<\\/style')
  const js = element.js.replace(/<\/script/gi, '<\\/script')

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>html,body{width:100%;height:100%;margin:0;overflow:hidden}*,*:before,*:after{box-sizing:border-box}${css}</style>
</head>
<body>
${element.html}
<script>${js}</script>
</body>
</html>`
}
