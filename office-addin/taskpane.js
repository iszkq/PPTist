/* global Office, PowerPoint */
(function () {
  'use strict';
  const bridge = 'http://127.0.0.1:32147';
  let presentationKey = '';
  let widgets = [];
  let selectedId = null;

  const $ = id => document.getElementById(id);
  const setStatus = (message, type = '') => { const node = $('status'); node.textContent = message; node.className = `status ${type}`; };
  const fieldIds = ['widgetName', 'left', 'top', 'width', 'height', 'html', 'css', 'javascript', 'embedUrl'];

  function currentSlide() { return Math.max(1, Number.parseInt($('slideIndex').value, 10) || 1); }
  function keyFromOffice() {
    const url = Office.context && Office.context.document && Office.context.document.url;
    return url || `untitled:${document.title}`;
  }
  function showWidget(widget) {
    selectedId = widget ? widget.id : null;
    $('editor').hidden = !widget;
    fieldIds.forEach(id => {
      const el = $(id);
      if (!widget) { if (id === 'widgetName') el.value = 'HTML 动效'; return; }
      const value = id === 'widgetName' ? (widget.name || widget.Name) : id === 'javascript' ? (widget.javaScript || widget.JavaScript) : (widget[id] ?? widget[id[0].toUpperCase() + id.slice(1)]);
      el.value = value ?? '';
    });
  }
  function renderList() {
    const current = currentSlide();
    const list = widgets.filter(w => Number(w.slideIndex) === current);
    $('widgetList').innerHTML = list.length ? list.map(w => `<button type="button" class="widget ${w.id === selectedId ? 'selected' : ''}" data-id="${w.id}"><b>${escapeHtml(w.name || 'HTML 动效')}</b><span>第 ${w.slideIndex} 页 · ${Math.round(w.width)} × ${Math.round(w.height)}</span></button>`).join('') : '<p class="muted">这一页还没有 HTML 动效。</p>';
    $('widgetList').querySelectorAll('[data-id]').forEach(node => node.addEventListener('click', () => showWidget(widgets.find(w => w.id === node.dataset.id))));
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  async function checkBridge() {
    try { const response = await fetch(`${bridge}/health`); if (!response.ok) throw new Error(); setStatus('本地放映服务已连接', 'ok'); }
    catch { setStatus('未连接本地放映服务。请确认 PPTist 放映服务正在运行。', 'error'); }
  }
  async function loadWidgets() {
    try {
      const response = await fetch(`${bridge}/widgets?presentationKey=${encodeURIComponent(presentationKey)}`);
      if (!response.ok) throw new Error();
      widgets = await response.json();
      renderList();
    } catch { widgets = []; renderList(); }
  }
  async function saveWidgets() {
    const response = await fetch(`${bridge}/widgets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presentationKey, widgets }) });
    if (!response.ok) throw new Error('保存失败');
    setStatus('已保存。按 F5 放映即可看到透明 HTML 动效。', 'ok');
  }
  function formWidget() {
    return { id: selectedId || crypto.randomUUID().replaceAll('-', ''), presentationKey, slideIndex: currentSlide(), left: Number($('left').value) || 0, top: Number($('top').value) || 0, width: Number($('width').value) || 320, height: Number($('height').value) || 180, name: $('widgetName').value || 'HTML 动效', html: $('html').value, css: $('css').value, javaScript: $('javascript').value, embedUrl: $('embedUrl').value || null };
  }
  const templates = {
    blank: { html: '<div class="stage">编辑你的 HTML 动效</div>', css: '.stage{color:#fff;font-size:24px;text-align:center;padding-top:80px;}', javaScript: '' },
    wheel: { html: '<div class="wheel-wrap"><div class="pointer">▼</div><div class="wheel" id="wheel"></div><button id="spin">开始</button><div id="result"></div></div>', css: '.wheel-wrap{color:#fff;text-align:center}.wheel{width:220px;height:220px;margin:0 auto 10px;border-radius:50%;background:conic-gradient(#ef4444 0 45deg,#f59e0b 45deg 90deg,#10b981 90deg 135deg,#3b82f6 135deg 180deg,#8b5cf6 180deg 225deg,#ec4899 225deg 270deg,#06b6d4 270deg 315deg,#84cc16 315deg 360deg);transition:transform 3s cubic-bezier(.15,.8,.2,1)}.pointer{color:#fbbf24;font-size:24px}.wheel-wrap button{padding:6px 18px}.wheel-wrap #result{margin-top:7px}', javaScript: "let angle=0;document.getElementById('spin').onclick=()=>{angle+=1440+Math.random()*360;document.getElementById('wheel').style.transform='rotate('+angle+'deg)';setTimeout(()=>document.getElementById('result').textContent='抽中：'+['奖品 A','奖品 B','奖品 C','奖品 D'][Math.floor(Math.random()*4)],3000)}" },
    rain: { html: '<div class="rain-stage"><span class="photo">照片 1</span><span class="photo">照片 2</span><span class="photo">照片 3</span></div>', css: '.rain-stage{position:relative;width:100%;height:240px;overflow:hidden}.photo{position:absolute;top:-70px;padding:25px 18px;background:#fff;color:#111;box-shadow:0 8px 22px #0008;animation:fall 5s infinite ease-in}.photo:nth-child(1){left:15%;animation-delay:0s}.photo:nth-child(2){left:48%;animation-delay:1.7s}.photo:nth-child(3){left:78%;animation-delay:3.2s}@keyframes fall{0%{transform:translateY(0) rotate(-6deg);opacity:0}15%,70%{opacity:1}100%{transform:translateY(330px) rotate(8deg);opacity:0}}', javaScript: '' },
    firefly: { html: '<div class="fireflies"><i></i><i></i><i></i><i></i><i></i></div>', css: '.fireflies{position:relative;width:100%;height:240px;background:linear-gradient(#07152b,#102e29);overflow:hidden}.fireflies i{position:absolute;width:8px;height:8px;border-radius:50%;background:#fde68a;box-shadow:0 0 22px 8px #facc15;animation:float 4s infinite ease-in-out}.fireflies i:nth-child(1){left:16%;top:70%;animation-delay:-.5s}.fireflies i:nth-child(2){left:35%;top:35%;animation-delay:-2s}.fireflies i:nth-child(3){left:56%;top:65%;animation-delay:-1s}.fireflies i:nth-child(4){left:73%;top:25%;animation-delay:-3s}.fireflies i:nth-child(5){left:86%;top:55%;animation-delay:-1.5s}@keyframes float{50%{transform:translate(24px,-32px) scale(1.5);opacity:.65}}', javaScript: '' }
  };
  function applyTemplate(name) { const template = templates[name]; if (!template) return; $('html').value = template.html; $('css').value = template.css; $('javascript').value = template.javaScript; $('widgetName').value = name === 'blank' ? 'HTML 动效' : ({ wheel: '幸运转盘', rain: '雨滴照片', firefly: '萤火虫' }[name]); }
  async function readSelection() {
    if (!window.PowerPoint || !Office.context.requirements.isSetSupported('PowerPointApi', '1.5')) { setStatus('当前版本不支持自动读取页码，请手动填写页码。'); return; }
    try { await PowerPoint.run(async context => { const slides = context.presentation.getSelectedSlides(); slides.load('items'); await context.sync(); if (slides.items.length) $('slideIndex').value = slides.items[0].slideIndex; }); await loadWidgets(); setStatus(`已切换到第 ${currentSlide()} 页`, 'ok'); }
    catch { setStatus('无法读取当前页，请手动填写页码。', 'error'); }
  }
  Office.onReady(async () => { presentationKey = keyFromOffice(); $('documentName').textContent = presentationKey; await checkBridge(); await loadWidgets(); });
  $('slideIndex').addEventListener('change', loadWidgets); $('readSelection').addEventListener('click', readSelection); $('newWidget').addEventListener('click', () => showWidget(null));
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => applyTemplate(button.dataset.preset)));
  $('save').addEventListener('click', async () => { try { const widget = formWidget(); const index = widgets.findIndex(w => w.id === widget.id); if (index >= 0) widgets[index] = widget; else widgets.push(widget); await saveWidgets(); selectedId = widget.id; renderList(); } catch { setStatus('保存失败，请确认 PPTist 放映服务已启动。', 'error'); } });
  $('remove').addEventListener('click', async () => { if (!selectedId) return; widgets = widgets.filter(w => w.id !== selectedId); selectedId = null; showWidget(null); try { await saveWidgets(); renderList(); } catch { setStatus('删除失败，请确认本地服务已启动。', 'error'); } });
})();
