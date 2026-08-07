import type { PPTHTMLElement, Slide } from '@/types/slides'

const endpoint = 'http://127.0.0.1:32147'

export interface OverlayWidget {
  id: string
  slideIndex: number
  left: number
  top: number
  width: number
  height: number
  html: string
  css: string
  javaScript: string
  embedUrl?: string
}

const isHtmlWidget = (element: Slide['elements'][number]): element is PPTHTMLElement => element.type === 'html'

export const createOverlayWidgets = (slides: Slide[]): OverlayWidget[] => slides.flatMap((slide, index) =>
  slide.elements.filter(isHtmlWidget).map(element => ({
    id: element.id,
    slideIndex: index + 1,
    left: element.left,
    top: element.top,
    width: element.width,
    height: element.height,
    html: element.html,
    css: element.css,
    javaScript: element.js,
    embedUrl: element.widgetKind === 'embed' ? element.embedUrl : undefined,
  })),
)

export const checkOverlayRuntime = async () => {
  const response = await fetch(`${endpoint}/health`)
  if (!response.ok) throw new Error('本机放映运行器未启动')
  return response.json() as Promise<{ status: string }>
}

export const syncOverlayWidgets = async (presentationKey: string, widgets: OverlayWidget[]) => {
  const response = await fetch(`${endpoint}/widgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presentationKey, widgets }),
  })
  if (!response.ok) throw new Error('同步失败，请确认本机放映运行器已启动')
  return response.json() as Promise<{ status: string }>
}
