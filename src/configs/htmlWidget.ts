import type { PPTHTMLElement } from '@/types/slides'

export interface WheelWidgetOptions {
  options: string[]
  removeWinner: boolean
  showResult: boolean
  resultPrefix: string
  duration: number
}

export const DEFAULT_WHEEL_OPTIONS: WheelWidgetOptions = {
  options: ['奖品 A', '奖品 B', '奖品 C', '奖品 D'],
  removeWinner: false,
  showResult: true,
  resultPrefix: '抽中：',
  duration: 4000,
}

/** 新建 HTML 动效时使用的空白模板，不预设具体动画。 */
export const HTML_WIDGET_EMPTY = {
  html: '<div class="html-widget-empty">请在右侧输入 HTML 动效代码</div>',
  css: '.html-widget-empty{height:100%;display:grid;place-items:center;color:#999;font:14px system-ui;background:#fafafa}',
  js: '',
  restartOnEnter: true,
  widgetKind: 'custom' as const,
}

export const HTML_WIDGET_EMBED = {
  html: '',
  css: '',
  js: '',
  restartOnEnter: true,
  widgetKind: 'embed' as const,
  embedUrl: 'https://example.com',
}

const WHEEL_CSS = '.wheel-widget{width:100%;height:100%;display:grid;place-items:center;background:transparent;font-family:system-ui}.wheel-wrap{width:min(86%,360px);position:relative}.wheel-pointer{position:absolute;z-index:2;top:-16px;left:50%;transform:translateX(-50%);color:#ef4444;font-size:28px;line-height:1;text-shadow:0 1px 2px #0004}.wheel-stage{width:100%;aspect-ratio:1;position:relative}.wheel-svg{width:100%;height:100%;display:block;transform-origin:50% 50%;filter:drop-shadow(0 8px 10px #0003);transition:transform var(--wheel-duration) cubic-bezier(.15,.75,.15,1);cursor:pointer}.wheel-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;width:29%;aspect-ratio:1;border:0;border-radius:50%;background:#ffffffe8;box-shadow:0 2px 6px #0003;color:#374151;font-weight:700;font-size:clamp(10px,2.2vw,15px);cursor:pointer}.wheel-center:disabled{cursor:wait;opacity:.7}.wheel-result{min-height:24px;margin-top:8px;color:#374151;text-align:center;font-size:clamp(12px,2vw,18px);font-weight:700}.wheel-reset{display:none;position:absolute;right:0;bottom:-30px;border:0;background:transparent;color:#6b7280;font-size:12px;cursor:pointer}.wheel-reset.visible{display:block}'

export const createWheelWidgetSource = (input: Partial<WheelWidgetOptions> = {}) => {
  const options: WheelWidgetOptions = {
    ...DEFAULT_WHEEL_OPTIONS,
    ...input,
    options: (input.options || DEFAULT_WHEEL_OPTIONS.options).filter(Boolean),
  }
  const serializedOptions = JSON.stringify(options).replace(/</g, '\\u003c')
  const html = '<div class="wheel-widget"><div class="wheel-wrap"><div class="wheel-pointer">▼</div><div class="wheel-stage"><svg class="wheel-svg" id="wheel" viewBox="0 0 100 100" aria-label="转盘"></svg><button class="wheel-center" id="spin">点击旋转</button></div><div class="wheel-result" id="result" aria-live="polite"></div><button class="wheel-reset" id="reset">重置</button></div></div>'
  const js = `(() => {
  const config = ${serializedOptions};
  let values = [...config.options];
  let spinning = false;
  let rotation = 0;
  const wheel = document.querySelector('#wheel');
  const spin = document.querySelector('#spin');
  const result = document.querySelector('#result');
  const reset = document.querySelector('#reset');
  const colors = ['#fb7185','#fbbf24','#34d399','#60a5fa','#a78bfa','#f472b6','#2dd4bf','#fb923c'];
  const NS = 'http://www.w3.org/2000/svg';
  const point = (angle, radius) => [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)];
  const render = () => {
    wheel.innerHTML = '';
    const count = Math.max(values.length, 1);
    const slice = Math.PI * 2 / count;
    values.forEach((label, index) => {
      const start = -Math.PI / 2 + index * slice;
      const end = start + slice;
      const [x1, y1] = point(start, 48);
      const [x2, y2] = point(end, 48);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', 'M50 50 L' + x1 + ' ' + y1 + ' A48 48 0 ' + (slice > Math.PI ? 1 : 0) + ' 1 ' + x2 + ' ' + y2 + ' Z');
      path.setAttribute('fill', colors[index % colors.length]);
      path.setAttribute('stroke', '#ffffff');
      path.setAttribute('stroke-width', '0.6');
      wheel.appendChild(path);
      const mid = start + slice / 2;
      const [tx, ty] = point(mid, 31);
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', String(tx)); text.setAttribute('y', String(ty));
      text.setAttribute('fill', '#ffffff'); text.setAttribute('font-size', String(Math.max(3.2, Math.min(6, 28 / count))));
      text.setAttribute('font-weight', '700'); text.setAttribute('text-anchor', 'middle'); text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('transform', 'rotate(' + (mid * 180 / Math.PI + 90) + ' ' + tx + ' ' + ty + ')');
      text.textContent = label; wheel.appendChild(text);
    });
  };
  const finish = (winnerIndex) => {
    spinning = false; spin.disabled = false; spin.textContent = '点击旋转';
    const winner = values[winnerIndex] || '';
    if (config.showResult) result.textContent = config.resultPrefix + winner;
    else result.textContent = '';
    reset.classList.add('visible');
    if (config.removeWinner && values.length > 1) { values.splice(winnerIndex, 1); render(); }
  };
  const start = () => {
    if (spinning || !values.length) return;
    spinning = true; spin.disabled = true; spin.textContent = '旋转中…'; result.textContent = '';
    const winnerIndex = Math.floor(Math.random() * values.length);
    const sliceDeg = 360 / values.length;
    // 目标是让中奖扇区的中心落在顶部指针下方；先扣除当前累计角度，避免第二轮开始偏一格。
    const currentAngle = ((rotation % 360) + 360) % 360;
    const targetAngle = (360 - (winnerIndex + .5) * sliceDeg) % 360;
    const delta = (targetAngle - currentAngle + 360) % 360;
    rotation += 360 * 5 + delta;
    wheel.style.setProperty('--wheel-duration', (config.duration / 1000) + 's');
    wheel.style.transform = 'rotate(' + rotation + 'deg)';
    window.setTimeout(() => finish(winnerIndex), config.duration + 80);
  };
  spin.addEventListener('click', start); wheel.addEventListener('click', start);
  reset.addEventListener('click', () => { values = [...config.options]; rotation = 0; wheel.style.transition = 'none'; wheel.style.transform = 'rotate(0deg)'; window.setTimeout(() => wheel.style.removeProperty('transition'), 0); result.textContent = ''; reset.classList.remove('visible'); render(); });
  render();
})();`
  return { html, css: WHEEL_CSS, js }
}

export interface CarouselWidgetOptions {
  images: string[]
  duration: number
  autoplay: boolean
  loop: boolean
}

export const DEFAULT_CAROUSEL_OPTIONS: CarouselWidgetOptions = {
  images: [],
  duration: 9000,
  autoplay: true,
  loop: true,
}

const CAROUSEL_CSS = '.film-carousel{width:100%;height:100%;display:flex;align-items:center;background:transparent;overflow:hidden}.film-window{width:100%;overflow:hidden;padding:8px 0}.film-track{display:flex;width:max-content;will-change:transform}.film-strip{display:flex;gap:0;padding:18px 0;background:#111;box-shadow:0 8px 18px #0003}.film-cell{position:relative;box-sizing:border-box;width:clamp(120px,28vw,300px);padding:16px 8px;background:#111}.film-cell:before,.film-cell:after{content:"";position:absolute;left:7px;right:7px;height:8px;background:repeating-linear-gradient(90deg,#d1d5db 0 9px,#111 9px 20px)}.film-cell:before{top:4px}.film-cell:after{bottom:4px}.film-cell img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#27272a}.film-empty{width:100%;padding:28px 16px;background:#111;color:#a1a1aa;text-align:center;font:14px system-ui}'

export const createCarouselWidgetSource = (input: Partial<CarouselWidgetOptions> = {}) => {
  const options: CarouselWidgetOptions = { ...DEFAULT_CAROUSEL_OPTIONS, ...input, images: input.images || [] }
  const serialized = JSON.stringify(options).replace(/</g, '\\u003c')
  const continuousFilmHtml = '<div class="film-carousel"><div class="film-window"><div class="film-track" id="film-track"></div><div class="film-empty" id="film-empty">请在右侧添加图片</div></div></div>'
  const continuousFilmJs = `(() => {
  const config = ${serialized};
  const images = [...config.images];
  const track = document.querySelector('#film-track');
  const empty = document.querySelector('#film-empty');
  if (!images.length) return;
  empty.hidden = true;
  const cells = images.map((src, index) => '<div class="film-cell"><img src="' + src.replace(/"/g, '&quot;') + '" alt="图片 ' + (index + 1) + '"></div>').join('');
  track.innerHTML = '<div class="film-strip">' + cells + '</div>' + (config.loop ? '<div class="film-strip" aria-hidden="true">' + cells + '</div>' : '');
  const firstStrip = track.firstElementChild;
  let offset = 0;
  let previous = performance.now();
  const animate = now => {
    const width = firstStrip.getBoundingClientRect().width;
    if (!width) return requestAnimationFrame(animate);
    offset -= (now - previous) * width / Math.max(config.duration, 500);
    previous = now;
    if (config.loop && -offset >= width) offset += width;
    if (!config.loop && -offset >= width) { track.style.transform = 'translateX(' + (-width) + 'px)'; return; }
    track.style.transform = 'translateX(' + offset + 'px)';
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
})();`
  return { html: continuousFilmHtml, css: CAROUSEL_CSS, js: continuousFilmJs }
}

export type ParticleGalleryEffect = 'rain' | 'snow' | 'sakura' | 'stars' | 'leaves' | 'bubbles' | 'fireflies'
export type ParticleDirection = 'down' | 'up' | 'left' | 'right' | 'downLeft' | 'downRight' | 'random'

export interface ParticleGalleryOptions {
  effect: ParticleGalleryEffect
  images: string[]
  particleCount: number
  direction: ParticleDirection
  speed: number
  photoDuration: number
  loop: boolean
}

export const PARTICLE_GALLERY_EFFECTS: { value: ParticleGalleryEffect; label: string }[] = [
  { value: 'rain', label: '雨滴' },
  { value: 'snow', label: '雪花' },
  { value: 'sakura', label: '樱花' },
  { value: 'stars', label: '星星' },
  { value: 'leaves', label: '落叶' },
  { value: 'bubbles', label: '气泡' },
  { value: 'fireflies', label: '萤火虫' },
]

export const PARTICLE_DIRECTIONS: { value: ParticleDirection; label: string }[] = [
  { value: 'down', label: '从上到下' },
  { value: 'up', label: '从下到上' },
  { value: 'left', label: '从右到左' },
  { value: 'right', label: '从左到右' },
  { value: 'downLeft', label: '右上到左下' },
  { value: 'downRight', label: '左上到右下' },
  { value: 'random', label: '随机方向' },
]

export const DEFAULT_PARTICLE_GALLERY_OPTIONS: ParticleGalleryOptions = {
  effect: 'rain',
  images: [],
  particleCount: 34,
  direction: 'down',
  speed: 1,
  photoDuration: 8000,
  loop: true,
}

const PARTICLE_GALLERY_CSS = '.particle-gallery{position:relative;width:100%;height:100%;overflow:hidden;background:transparent;isolation:isolate}.particle-field{position:absolute;inset:0;overflow:hidden;pointer-events:none}.particle{position:absolute;top:-70px;left:var(--left);opacity:var(--opacity);animation:particleFall var(--fall-duration) linear var(--delay) infinite;will-change:transform}.particle.rain{width:3px;height:29px;border-radius:99px;background:#7dd3fc;box-shadow:0 0 7px #7dd3fc;transform:rotate(18deg)}.particle.snow{width:var(--size);height:var(--size);border-radius:50%;background:#fff;box-shadow:0 0 8px #fff}.particle.sakura{color:#fb7185;font-size:var(--size);line-height:1;text-shadow:0 2px 5px #be123c55}.particle.stars{color:#fde68a;font-size:var(--size);line-height:1;text-shadow:0 0 9px #facc15}.particle.leaves{color:#fb923c;font-size:var(--size);line-height:1;text-shadow:0 2px 5px #c2410c66}.particle.bubbles{width:var(--size);height:var(--size);border:2px solid #a5f3fc;border-radius:50%;box-shadow:inset 3px 3px 5px #fff9,0 0 9px #67e8f9}.particle.fireflies{top:var(--firefly-top);width:var(--size);height:var(--size);border-radius:50%;background:#fef08a;box-shadow:0 0 7px #fef08a,0 0 17px #facc15;animation:fireflyFloat var(--fall-duration) ease-in-out var(--delay) infinite}.photo-card{position:absolute;z-index:3;top:0;left:var(--photo-left);width:clamp(150px,37vw,380px);aspect-ratio:4/3;overflow:hidden;opacity:0;transform-origin:center;animation:photoJourney var(--photo-duration) cubic-bezier(.2,.72,.22,1) both;box-shadow:0 16px 35px #0f172a66;will-change:transform,opacity,border-radius}.photo-card:before{content:"";position:absolute;inset:0;z-index:1;border:clamp(3px,.6vw,8px) solid #fff;box-shadow:inset 0 0 0 1px #0f172a22;pointer-events:none}.photo-card img{display:block;width:100%;height:100%;object-fit:cover}.photo-card.effect-rain{border-radius:55% 55% 55% 0}.photo-card.effect-snow{border-radius:50%}.photo-card.effect-sakura{border-radius:48% 12% 48% 12%}.photo-card.effect-stars{clip-path:polygon(50% 0,61% 36%,100% 36%,68% 57%,79% 100%,50% 73%,21% 100%,32% 57%,0 36%,39% 36%)}.photo-card.effect-leaves{border-radius:52% 4% 52% 4%}.photo-card.effect-bubbles,.photo-card.effect-fireflies{border-radius:50%;border:2px solid #a5f3fc}.photo-card.effect-rain:before,.photo-card.effect-snow:before,.photo-card.effect-sakura:before,.photo-card.effect-leaves:before{border-radius:inherit}@keyframes particleFall{0%{transform:translate3d(0,-70px,0) rotate(0deg)}100%{transform:translate3d(var(--drift),var(--travel-y),0) rotate(300deg)}}@keyframes fireflyFloat{0%,100%{transform:translate3d(0,0,0);opacity:.25}45%{transform:translate3d(var(--drift),calc(var(--travel-y) * -.12),0);opacity:1}}@keyframes photoJourney{0%{opacity:0;transform:translate(-50%,-9vh) scale(.08) rotate(-12deg)}14%{opacity:1;transform:translate(-50%,20vh) scale(.35) rotate(5deg)}35%{opacity:1;transform:translate(-50%,6vh) scale(1.48) rotate(0deg);border-radius:5px;clip-path:inset(0)}73%{opacity:1;transform:translate(-50%,6vh) scale(1.48) rotate(0deg);border-radius:5px;clip-path:inset(0)}100%{opacity:0;transform:translate(calc(-50% + var(--exit-x)),118vh) scale(.26) rotate(18deg);border-radius:50%}}'

const PARTICLE_GALLERY_CSS_RUNTIME = PARTICLE_GALLERY_CSS
  .replace('calc(var(--travel-y) * -.12)', 'var(--float-y)')
  .replace('.particle.rain{width:3px;height:29px;border-radius:99px;background:#7dd3fc;box-shadow:0 0 7px #7dd3fc;transform:rotate(18deg)}', '.particle.rain{width:9px;height:27px;border-radius:65% 65% 65% 0;background:linear-gradient(135deg,#e0f2fe 0 18%,#38bdf8 46%,#0284c7);box-shadow:inset 2px 2px 3px #fff9,0 0 8px #38bdf8;transform:rotate(45deg);animation-name:rainFall}')
  .replace('.particle.snow{width:var(--size);height:var(--size);border-radius:50%;background:#fff;box-shadow:0 0 8px #fff}', '.particle.snow{width:auto;height:auto;border-radius:0;background:transparent;box-shadow:none;color:#fff;font-size:calc(var(--size) + 7px);font-family:serif;line-height:1;text-shadow:0 0 5px #fff,0 0 12px #bae6fd}')
  .replace('.particle.leaves{color:#fb923c;font-size:var(--size);line-height:1;text-shadow:0 2px 5px #c2410c66}', '.particle.leaves{width:18px;height:28px;border-radius:100% 0 100% 0;background:linear-gradient(135deg,#fde047 0 22%,#f97316 48%,#b45309);box-shadow:inset 2px 2px 3px #fff8,0 2px 5px #9a341266}.particle.leaves:after{content:"";position:absolute;top:4px;left:8px;width:1px;height:23px;background:#92400e;transform:rotate(-36deg);transform-origin:top}')
  .replace('@keyframes fireflyFloat', '@keyframes rainFall{0%{transform:translate3d(0,-70px,0) rotate(45deg)}100%{transform:translate3d(var(--drift),var(--travel-y),0) rotate(45deg)}}@keyframes fireflyFloat')

const PARTICLE_GALLERY_CSS_V2 = '.particle-gallery{position:relative;width:100%;height:100%;overflow:hidden;background:transparent;isolation:isolate}.particle-field{position:absolute;inset:0;overflow:hidden;pointer-events:none}.particle{position:absolute;left:var(--start-x);top:var(--start-y);opacity:var(--opacity);animation:particleDrift var(--fall-duration) linear var(--delay) infinite;will-change:transform}.particle.rain{width:8px;height:22px;border-radius:80% 18% 80% 80%;background:radial-gradient(circle at 30% 22%,#fff 0 9%,#d9f5ff 11% 23%,transparent 25%),linear-gradient(135deg,#b9eaff 0 24%,#38bdf8 52%,#0369a1);box-shadow:inset -2px -2px 4px #07598566,0 1px 5px #38bdf899;filter:drop-shadow(0 2px 2px #0c4a6e44);animation-name:rainDrift}.particle.rain:after{content:"";position:absolute;left:1px;top:3px;width:2px;height:7px;border-radius:50%;background:#fff9;transform:rotate(-26deg)}.particle.leaves{width:18px;height:28px;border-radius:100% 0 100% 0;background:linear-gradient(135deg,#fef08a 0 15%,#f59e0b 37%,#dc2626 72%,#7f1d1d);box-shadow:inset 2px 2px 4px #fff8,inset -2px -2px 3px #7c2d1266,0 4px 7px #451a1a66;animation-name:leafDrift}.particle.leaves:before{content:"";position:absolute;top:3px;left:8px;width:1px;height:23px;background:#7c2d12;transform:rotate(-37deg);transform-origin:top}.particle.leaves:after{content:"";position:absolute;top:-5px;left:1px;width:8px;height:2px;background:#7c2d12;border-radius:2px;transform:rotate(-37deg);transform-origin:right}.particle.snow{width:auto;height:auto;color:#fff;font-family:serif;font-size:calc(var(--size) + 8px);line-height:1;text-shadow:0 0 4px #fff,0 0 11px #bae6fd}.particle.sakura{color:#fb7185;font-size:var(--size);line-height:1;text-shadow:0 2px 5px #9f123955}.particle.stars{color:#fde68a;font-size:var(--size);line-height:1;text-shadow:0 0 9px #facc15}.particle.bubbles{width:var(--size);height:var(--size);border:2px solid #a5f3fc;border-radius:50%;box-shadow:inset 3px 3px 5px #fff9,0 0 9px #67e8f9}.particle.fireflies{width:var(--size);height:var(--size);border-radius:50%;background:#fef08a;box-shadow:0 0 7px #fef08a,0 0 17px #facc15;animation:fireflyDrift var(--fall-duration) ease-in-out var(--delay) infinite}.photo-card{position:absolute;z-index:3;top:0;left:var(--photo-left);width:clamp(150px,37vw,380px);aspect-ratio:4/3;overflow:hidden;opacity:0;transform-origin:center;animation:photoJourney var(--photo-duration) cubic-bezier(.2,.72,.22,1) both;box-shadow:0 16px 35px #0f172a66;will-change:transform,opacity,border-radius}.photo-card:before{content:"";position:absolute;inset:0;z-index:1;border:clamp(3px,.6vw,8px) solid #fff;box-shadow:inset 0 0 0 1px #0f172a22;pointer-events:none}.photo-card img{display:block;width:100%;height:100%;object-fit:cover}.photo-card.effect-rain{border-radius:55% 55% 55% 0}.photo-card.effect-snow{border-radius:50%}.photo-card.effect-sakura{border-radius:48% 12% 48% 12%}.photo-card.effect-stars{clip-path:polygon(50% 0,61% 36%,100% 36%,68% 57%,79% 100%,50% 73%,21% 100%,32% 57%,0 36%,39% 36%)}.photo-card.effect-leaves{border-radius:52% 4% 52% 4%}.photo-card.effect-bubbles,.photo-card.effect-fireflies{border-radius:50%;border:2px solid #a5f3fc}.photo-card.effect-rain:before,.photo-card.effect-snow:before,.photo-card.effect-sakura:before,.photo-card.effect-leaves:before{border-radius:inherit}@keyframes particleDrift{0%{transform:translate3d(0,0,0) rotate(0deg)}100%{transform:translate3d(var(--travel-x),var(--travel-y),0) rotate(var(--turn))}}@keyframes rainDrift{0%{transform:translate3d(0,0,0) rotate(45deg) scaleY(.78)}72%{transform:translate3d(calc(var(--travel-x) * .72),calc(var(--travel-y) * .72),0) rotate(45deg) scaleY(1)}100%{transform:translate3d(var(--travel-x),var(--travel-y),0) rotate(45deg) scaleY(.9)}}@keyframes leafDrift{0%{transform:translate3d(0,0,0) rotate(-26deg)}25%{transform:translate3d(calc(var(--travel-x) * .22),calc(var(--travel-y) * .25),0) rotate(58deg)}54%{transform:translate3d(calc(var(--travel-x) * .62),calc(var(--travel-y) * .55),0) rotate(-94deg)}100%{transform:translate3d(var(--travel-x),var(--travel-y),0) rotate(146deg)}}@keyframes fireflyDrift{0%,100%{transform:translate3d(0,0,0);opacity:.28}42%{transform:translate3d(calc(var(--travel-x) * .48),calc(var(--travel-y) * .28),0);opacity:1}75%{transform:translate3d(calc(var(--travel-x) * .76),calc(var(--travel-y) * .54),0);opacity:.46}}@keyframes photoJourney{0%{opacity:0;transform:translate(-50%,-9vh) scale(.08) rotate(-12deg)}14%{opacity:1;transform:translate(-50%,20vh) scale(.35) rotate(5deg)}35%{opacity:1;transform:translate(-50%,6vh) scale(1.48) rotate(0deg);border-radius:5px;clip-path:inset(0)}73%{opacity:1;transform:translate(-50%,6vh) scale(1.48) rotate(0deg);border-radius:5px;clip-path:inset(0)}100%{opacity:0;transform:translate(calc(-50% + var(--exit-x)),118vh) scale(.26) rotate(18deg);border-radius:50%}}'

export const createParticleGallerySource = (input: Partial<ParticleGalleryOptions> = {}) => {
  const options: ParticleGalleryOptions = {
    ...DEFAULT_PARTICLE_GALLERY_OPTIONS,
    ...input,
    images: input.images || [],
  }
  const serialized = JSON.stringify(options).replace(/</g, '\\u003c')
  const html = '<div class="particle-gallery" id="particle-gallery"><div class="particle-field" id="particle-field"></div></div>'
  const js = `(() => {
  const config = ${serialized};
  const stage = document.querySelector('#particle-gallery');
  const field = document.querySelector('#particle-field');
  const marks = { rain: '', snow: '❄', sakura: '✿', stars: '✦', leaves: '', bubbles: '', fireflies: '' };
  const random = (min, max) => min + Math.random() * (max - min);
  const getMotion = (width, height) => {
    const direction = config.direction === 'random' ? ['down','up','left','right','downLeft','downRight'][Math.floor(random(0, 6))] : config.direction;
    if (direction === 'up') return { x: random(0, width), y: height + 48, dx: random(-width * .12, width * .12), dy: -height - 116 };
    if (direction === 'left') return { x: width + 48, y: random(0, height), dx: -width - 116, dy: random(-height * .12, height * .12) };
    if (direction === 'right') return { x: -48, y: random(0, height), dx: width + 116, dy: random(-height * .12, height * .12) };
    if (direction === 'downLeft') return { x: width + 48, y: -48, dx: -width - 116, dy: height + 116 };
    if (direction === 'downRight') return { x: -48, y: -48, dx: width + 116, dy: height + 116 };
    return { x: random(0, width), y: -48, dx: random(-width * .12, width * .12), dy: height + 116 };
  };
  const makeParticle = (index, rect) => {
    const motion = getMotion(rect.width, rect.height);
    const particle = document.createElement('i');
    particle.className = 'particle ' + config.effect;
    particle.textContent = marks[config.effect] || '';
    particle.style.setProperty('--start-x', motion.x + 'px');
    particle.style.setProperty('--start-y', motion.y + 'px');
    particle.style.setProperty('--travel-x', motion.dx + 'px');
    particle.style.setProperty('--travel-y', motion.dy + 'px');
    particle.style.setProperty('--delay', (-random(0, 9)) + 's');
    particle.style.setProperty('--fall-duration', (random(5.6, 11.8) / Math.max(.25, config.speed || 1)) + 's');
    particle.style.setProperty('--turn', random(-260, 320) + 'deg');
    particle.style.setProperty('--opacity', String(random(.36, .92)));
    particle.style.setProperty('--size', random(10, 24) + 'px');
    field.appendChild(particle);
  };
  const renderParticles = () => {
    const rect = stage.getBoundingClientRect();
    const density = Math.max(1, rect.height / Math.max(rect.width, 1) / .56);
    const count = Math.max(8, Math.min(Math.round(config.particleCount * density), 120));
    field.innerHTML = '';
    for (let i = 0; i < count; i++) makeParticle(i, rect);
  };
  renderParticles();
  new ResizeObserver(renderParticles).observe(stage);
  const showPhoto = index => {
    const card = document.createElement('article');
    card.className = 'photo-card effect-' + config.effect;
    card.style.setProperty('--photo-left', random(18, 82) + '%');
    card.style.setProperty('--exit-x', random(-22, 22) + 'vw');
    card.style.setProperty('--photo-duration', Math.max(config.photoDuration, 8000) + 'ms');
    const image = document.createElement('img');
    image.src = config.images[index];
    image.alt = '照片 ' + (index + 1);
    card.appendChild(image);
    stage.appendChild(card);
    window.setTimeout(() => card.remove(), Math.max(config.photoDuration, 8000) + 80);
  };
  const playPhotos = index => {
    if (!config.images.length) return;
    showPhoto(index);
    const next = index + 1;
    const delay = Math.max(config.photoDuration, 8000) + 360;
    if (next < config.images.length) window.setTimeout(() => playPhotos(next), delay);
    else if (config.loop) window.setTimeout(() => playPhotos(0), delay + 900);
  };
  if (config.images.length) window.setTimeout(() => playPhotos(0), 850);
})();`
  return { html, css: PARTICLE_GALLERY_CSS_V2, js }
}

export const HTML_WIDGET_TEMPLATES = {
  embed: { name: '嵌入网页', ...HTML_WIDGET_EMBED },
  wheel: { name: '转盘', ...createWheelWidgetSource() },
  filmCarousel: { name: '电影胶卷', ...createCarouselWidgetSource() },
  particleGallery: { name: '粒子照片秀', ...createParticleGallerySource() },
} as const

export const createHTMLWidgetDocument = (element: Pick<PPTHTMLElement, 'html' | 'css' | 'js'>) => {
  const css = element.css.replace(/<\/style/gi, '<\\/style')
  const js = element.js.replace(/<\/script/gi, '<\\/script')
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><style>html,body{width:100%;height:100%;margin:0;overflow:hidden;background:transparent}*,*:before,*:after{box-sizing:border-box}${css}</style></head><body>${element.html}<script>${js}</script></body></html>`
}
