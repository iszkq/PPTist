export const PPTIST_OVERLAY_ENDPOINT = 'http://127.0.0.1:32147'

export async function checkPptistOverlay() {
  const response = await fetch(`${PPTIST_OVERLAY_ENDPOINT}/health`)
  if (!response.ok) throw new Error('PPTist 本地运行器未启动')
  return response.json()
}

export async function savePptistWidgets(presentationKey, widgets) {
  const response = await fetch(`${PPTIST_OVERLAY_ENDPOINT}/widgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presentationKey, widgets }),
  })
  if (!response.ok) throw new Error('无法保存本地动效组件')
  return response.json()
}
