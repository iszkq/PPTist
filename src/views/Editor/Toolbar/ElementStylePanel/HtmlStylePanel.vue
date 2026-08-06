<template>
  <div class="html-style-panel">
    <div class="hint">HTML/CSS/JavaScript 会在透明的隔离 iframe 中运行。选中转盘模板后，可在这里管理选项和抽取规则。</div>
    <div class="template-section">
      <div class="label">内置模板（可直接改代码）</div>
      <div class="template-buttons">
        <Button v-for="template in templates" :key="template.key" size="small" @click="applyTemplate(template.key)">{{ template.name }}</Button>
        <Button size="small" @click="clearCode">清空</Button>
      </div>
    </div>

    <div v-if="handleHtmlElement.widgetKind === 'embed'" class="field-row">
      <span>网页链接</span>
      <input :value="handleHtmlElement.embedUrl || ''" placeholder="https://..." @change="handleEmbedUrlInput($event)" />
    </div>

    <div v-if="handleHtmlElement.widgetKind === 'wheel'" class="wheel-config">
      <div class="label">转盘选项</div>
      <div v-for="(option, index) in wheelValues" :key="`${index}-${option}`" class="option-row">
        <input :value="option" @input="handleWheelOptionInput(index, $event)" />
        <button class="delete-option" type="button" title="删除此选项" @click="removeWheelOption(index)">×</button>
      </div>
      <Button size="small" @click="addWheelOption">＋ 添加选项</Button>
      <div class="config-row">
        <span>抽中后移除</span>
        <Switch :value="wheelConfig.removeWinner" @update:value="value => updateWheelConfig({ removeWinner: value })" />
      </div>
      <div class="config-row">
        <span>显示结果</span>
        <Switch :value="wheelConfig.showResult" @update:value="value => updateWheelConfig({ showResult: value })" />
      </div>
      <div class="field-row">
        <span>结果前缀</span>
        <input :value="wheelConfig.resultPrefix" @input="handlePrefixInput($event)" />
      </div>
      <div class="field-row">
        <span>旋转时长（毫秒）</span>
        <input type="number" min="500" max="20000" step="100" :value="wheelConfig.duration" @change="handleDurationInput($event)" />
      </div>
    </div>

    <div v-if="handleHtmlElement.widgetKind === 'filmCarousel'" class="carousel-config">
      <div class="label">轮播图片</div>
      <div v-if="carouselConfig.images.length" class="image-list">
        <div v-for="(src, index) in carouselConfig.images" :key="`${index}-${src.slice(0, 24)}`" class="image-row">
          <img :src="src" :alt="`图片 ${index + 1}`" />
          <span>图片 {{ index + 1 }}</span>
          <button class="delete-option" type="button" title="删除图片" @click="removeCarouselImage(index)">×</button>
        </div>
      </div>
      <FileInput accept="image/*" multiple @change="handleCarouselFiles">
        <Button size="small">添加图片</Button>
      </FileInput>
      <div class="config-row">
        <span>循环播放</span>
        <Switch :value="carouselConfig.loop" @update:value="value => updateCarouselConfig({ loop: value })" />
      </div>
      <div class="field-row">
        <span>滚动一圈（毫秒）</span>
        <input type="number" min="500" max="60000" step="100" :value="carouselConfig.duration" @change="handleCarouselDurationInput($event)" />
      </div>
    </div>

    <div v-if="handleHtmlElement.widgetKind === 'particleGallery'" class="particle-config">
      <div class="label">粒子照片秀</div>
      <div class="field-row">
        <span>特效类型</span>
        <select :value="particleConfig.effect" @change="handleParticleEffectInput($event)">
          <option v-for="effect in PARTICLE_GALLERY_EFFECTS" :key="effect.value" :value="effect.value">{{ effect.label }}</option>
        </select>
      </div>
      <div class="label">展示照片</div>
      <div v-if="particleConfig.images.length" class="image-list">
        <div v-for="(src, index) in particleConfig.images" :key="`${index}-${src.slice(0, 24)}`" class="image-row">
          <img :src="src" :alt="`照片 ${index + 1}`" />
          <span>照片 {{ index + 1 }}</span>
          <button class="delete-option" type="button" title="删除照片" @click="removeParticleImage(index)">×</button>
        </div>
      </div>
      <FileInput accept="image/*" multiple @change="handleParticleFiles">
        <Button size="small">添加照片</Button>
      </FileInput>
      <div class="field-row">
        <span>粒子数量</span>
        <input type="number" min="8" max="80" step="1" :value="particleConfig.particleCount" @change="handleParticleCountInput($event)" />
      </div>
      <div class="field-row">
        <span>运动方向</span>
        <select :value="particleConfig.direction" @change="handleParticleDirectionInput($event)">
          <option v-for="direction in PARTICLE_DIRECTIONS" :key="direction.value" :value="direction.value">{{ direction.label }}</option>
        </select>
      </div>
      <div class="field-row">
        <span>运动速度</span>
        <input type="number" min="0.25" max="3" step="0.05" :value="particleConfig.speed" @change="handleParticleSpeedInput($event)" />
      </div>
      <div class="field-row">
        <span>单张展示（毫秒）</span>
        <input type="number" min="8000" max="30000" step="500" :value="particleConfig.photoDuration" @change="handleParticleDurationInput($event)" />
      </div>
      <div class="config-row">
        <span>循环播放</span>
        <Switch :value="particleConfig.loop" @update:value="value => updateParticleConfig({ loop: value })" />
      </div>
    </div>

    <div class="section">
      <div class="label">HTML</div>
      <TextArea :value="handleHtmlElement.html" :rows="7" resizable @update:value="value => updateHTML({ html: value, widgetKind: 'custom' })" />
    </div>
    <div class="section">
      <div class="label">CSS</div>
      <TextArea :value="handleHtmlElement.css" :rows="7" resizable @update:value="value => updateHTML({ css: value, widgetKind: 'custom' })" />
    </div>
    <div class="section">
      <div class="label">JavaScript</div>
      <TextArea :value="handleHtmlElement.js" :rows="7" resizable @update:value="value => updateHTML({ js: value, widgetKind: 'custom' })" />
    </div>
    <div class="row switch-row">
      <span>每次进入页面重新播放</span>
      <Switch :value="handleHtmlElement.restartOnEnter !== false" @update:value="value => updateHTML({ restartOnEnter: value })" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import type { PPTHTMLElement } from '@/types/slides'
import useHistorySnapshot from '@/hooks/useHistorySnapshot'
import TextArea from '@/components/TextArea.vue'
import Switch from '@/components/Switch.vue'
import Button from '@/components/Button.vue'
import FileInput from '@/components/FileInput.vue'
import { getImageDataURL } from '@/utils/image'
import {
  DEFAULT_CAROUSEL_OPTIONS,
  DEFAULT_PARTICLE_GALLERY_OPTIONS,
  DEFAULT_WHEEL_OPTIONS,
  HTML_WIDGET_EMPTY,
  HTML_WIDGET_EMBED,
  PARTICLE_DIRECTIONS,
  HTML_WIDGET_TEMPLATES,
  PARTICLE_GALLERY_EFFECTS,
  createCarouselWidgetSource,
  createParticleGallerySource,
  createWheelWidgetSource,
  type ParticleGalleryEffect,
  type ParticleDirection,
} from '@/configs/htmlWidget'

const templates = Object.entries(HTML_WIDGET_TEMPLATES)
  .filter(([key]) => !['pulse', 'progress'].includes(key))
  .map(([key, template]) => ({ key, ...template }))
const slidesStore = useSlidesStore()
const { handleElement } = storeToRefs(useMainStore())
const handleHtmlElement = handleElement as Ref<PPTHTMLElement>
const { addHistorySnapshot } = useHistorySnapshot()

const wheelConfig = computed(() => ({
  options: handleHtmlElement.value.wheelOptions?.filter(Boolean) || [...DEFAULT_WHEEL_OPTIONS.options],
  removeWinner: handleHtmlElement.value.wheelRemoveWinner ?? DEFAULT_WHEEL_OPTIONS.removeWinner,
  showResult: handleHtmlElement.value.wheelShowResult ?? DEFAULT_WHEEL_OPTIONS.showResult,
  resultPrefix: handleHtmlElement.value.wheelResultPrefix ?? DEFAULT_WHEEL_OPTIONS.resultPrefix,
  duration: handleHtmlElement.value.wheelDuration ?? DEFAULT_WHEEL_OPTIONS.duration,
}))
const wheelValues = computed(() => wheelConfig.value.options)
const carouselConfig = computed(() => ({
  images: handleHtmlElement.value.carouselImages || [...DEFAULT_CAROUSEL_OPTIONS.images],
  duration: handleHtmlElement.value.carouselDuration ?? DEFAULT_CAROUSEL_OPTIONS.duration,
  autoplay: handleHtmlElement.value.carouselAutoplay ?? DEFAULT_CAROUSEL_OPTIONS.autoplay,
  loop: handleHtmlElement.value.carouselLoop ?? DEFAULT_CAROUSEL_OPTIONS.loop,
}))
const particleConfig = computed(() => ({
  effect: handleHtmlElement.value.particleEffect ?? DEFAULT_PARTICLE_GALLERY_OPTIONS.effect,
  images: handleHtmlElement.value.particleImages || [...DEFAULT_PARTICLE_GALLERY_OPTIONS.images],
  particleCount: handleHtmlElement.value.particleCount ?? DEFAULT_PARTICLE_GALLERY_OPTIONS.particleCount,
  direction: handleHtmlElement.value.particleDirection ?? DEFAULT_PARTICLE_GALLERY_OPTIONS.direction,
  speed: handleHtmlElement.value.particleSpeed ?? DEFAULT_PARTICLE_GALLERY_OPTIONS.speed,
  photoDuration: handleHtmlElement.value.particlePhotoDuration ?? DEFAULT_PARTICLE_GALLERY_OPTIONS.photoDuration,
  loop: handleHtmlElement.value.particleLoop ?? DEFAULT_PARTICLE_GALLERY_OPTIONS.loop,
}))

const updateHTML = (props: Partial<PPTHTMLElement>) => {
  if (!handleElement.value) return
  slidesStore.updateElement({ id: handleElement.value.id, props })
  addHistorySnapshot()
}

const updateWheelConfig = (patch: Partial<typeof DEFAULT_WHEEL_OPTIONS>) => {
  const next = { ...wheelConfig.value, ...patch }
  const source = createWheelWidgetSource(next)
  updateHTML({
    ...source,
    widgetKind: 'wheel',
    wheelOptions: next.options,
    wheelRemoveWinner: next.removeWinner,
    wheelShowResult: next.showResult,
    wheelResultPrefix: next.resultPrefix,
    wheelDuration: next.duration,
  })
}

const updateWheelOption = (index: number, value: string) => {
  const options = [...wheelConfig.value.options]
  options[index] = value
  updateWheelConfig({ options })
}

const handleWheelOptionInput = (index: number, event: Event) => updateWheelOption(index, (event.target as HTMLInputElement).value)
const handlePrefixInput = (event: Event) => updateWheelConfig({ resultPrefix: (event.target as HTMLInputElement).value })
const handleDurationInput = (event: Event) => updateWheelConfig({ duration: Number((event.target as HTMLInputElement).value) || 4000 })

const addWheelOption = () => updateWheelConfig({ options: [...wheelConfig.value.options, `选项 ${wheelConfig.value.options.length + 1}`] })
const removeWheelOption = (index: number) => {
  if (wheelConfig.value.options.length <= 2) return
  updateWheelConfig({ options: wheelConfig.value.options.filter((_, i) => i !== index) })
}

const updateCarouselConfig = (patch: Partial<typeof DEFAULT_CAROUSEL_OPTIONS>) => {
  const next = { ...carouselConfig.value, ...patch }
  const source = createCarouselWidgetSource(next)
  updateHTML({
    ...source,
    widgetKind: 'filmCarousel',
    carouselImages: next.images,
    carouselDuration: next.duration,
    carouselAutoplay: next.autoplay,
    carouselLoop: next.loop,
  })
}

const handleCarouselFiles = async (files: FileList) => {
  const images = await Promise.all(Array.from(files).map(file => getImageDataURL(file)))
  updateCarouselConfig({ images: [...carouselConfig.value.images, ...images] })
}
const removeCarouselImage = (index: number) => {
  updateCarouselConfig({ images: carouselConfig.value.images.filter((_, i) => i !== index) })
}
const handleCarouselDurationInput = (event: Event) => {
  updateCarouselConfig({ duration: Number((event.target as HTMLInputElement).value) || DEFAULT_CAROUSEL_OPTIONS.duration })
}

const updateParticleConfig = (patch: Partial<typeof DEFAULT_PARTICLE_GALLERY_OPTIONS>) => {
  const next = { ...particleConfig.value, ...patch }
  const source = createParticleGallerySource(next)
  updateHTML({
    ...source,
    widgetKind: 'particleGallery',
    particleEffect: next.effect,
    particleImages: next.images,
    particleCount: next.particleCount,
    particleDirection: next.direction,
    particleSpeed: next.speed,
    particlePhotoDuration: next.photoDuration,
    particleLoop: next.loop,
  })
}

const handleParticleFiles = async (files: FileList) => {
  const images = await Promise.all(Array.from(files).map(file => getImageDataURL(file)))
  updateParticleConfig({ images: [...particleConfig.value.images, ...images] })
}
const removeParticleImage = (index: number) => {
  updateParticleConfig({ images: particleConfig.value.images.filter((_, i) => i !== index) })
}
const handleParticleEffectInput = (event: Event) => {
  updateParticleConfig({ effect: (event.target as HTMLSelectElement).value as ParticleGalleryEffect })
}
const handleParticleCountInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  updateParticleConfig({ particleCount: Math.min(80, Math.max(8, value || DEFAULT_PARTICLE_GALLERY_OPTIONS.particleCount)) })
}
const handleParticleDirectionInput = (event: Event) => {
  updateParticleConfig({ direction: (event.target as HTMLSelectElement).value as ParticleDirection })
}
const handleParticleSpeedInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  updateParticleConfig({ speed: Math.min(3, Math.max(.25, value || DEFAULT_PARTICLE_GALLERY_OPTIONS.speed)) })
}
const handleEmbedUrlInput = (event: Event) => {
  updateHTML({ widgetKind: 'embed', embedUrl: (event.target as HTMLInputElement).value.trim() })
}
const handleParticleDurationInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value)
  updateParticleConfig({ photoDuration: Math.min(30000, Math.max(8000, value || DEFAULT_PARTICLE_GALLERY_OPTIONS.photoDuration)) })
}

const applyTemplate = (key: string) => {
  if (key === 'wheel') {
    const source = createWheelWidgetSource(DEFAULT_WHEEL_OPTIONS)
    updateHTML({
      ...source,
      widgetKind: 'wheel',
      wheelOptions: [...DEFAULT_WHEEL_OPTIONS.options],
      wheelRemoveWinner: DEFAULT_WHEEL_OPTIONS.removeWinner,
      wheelShowResult: DEFAULT_WHEEL_OPTIONS.showResult,
      wheelResultPrefix: DEFAULT_WHEEL_OPTIONS.resultPrefix,
      wheelDuration: DEFAULT_WHEEL_OPTIONS.duration,
    })
    return
  }
  if (key === 'filmCarousel') {
    const source = createCarouselWidgetSource(DEFAULT_CAROUSEL_OPTIONS)
    updateHTML({
      ...source,
      widgetKind: 'filmCarousel',
      carouselImages: [],
      carouselDuration: DEFAULT_CAROUSEL_OPTIONS.duration,
      carouselAutoplay: DEFAULT_CAROUSEL_OPTIONS.autoplay,
      carouselLoop: DEFAULT_CAROUSEL_OPTIONS.loop,
    })
    return
  }
  if (key === 'particleGallery') {
    const source = createParticleGallerySource(DEFAULT_PARTICLE_GALLERY_OPTIONS)
    updateHTML({
      ...source,
      widgetKind: 'particleGallery',
      particleEffect: DEFAULT_PARTICLE_GALLERY_OPTIONS.effect,
      particleImages: [],
      particleCount: DEFAULT_PARTICLE_GALLERY_OPTIONS.particleCount,
      particleDirection: DEFAULT_PARTICLE_GALLERY_OPTIONS.direction,
      particleSpeed: DEFAULT_PARTICLE_GALLERY_OPTIONS.speed,
      particlePhotoDuration: DEFAULT_PARTICLE_GALLERY_OPTIONS.photoDuration,
      particleLoop: DEFAULT_PARTICLE_GALLERY_OPTIONS.loop,
    })
    return
  }
  if (key === 'embed') {
    updateHTML({ ...HTML_WIDGET_EMBED })
    return
  }
  const template = HTML_WIDGET_TEMPLATES[key as keyof typeof HTML_WIDGET_TEMPLATES]
  if (template) updateHTML({ html: template.html, css: template.css, js: template.js, widgetKind: 'custom' })
}

const clearCode = () => updateHTML({ ...HTML_WIDGET_EMPTY })
</script>

<style lang="scss" scoped>
.html-style-panel { padding-bottom: 20px; }
.hint { margin-bottom: 12px; padding: 8px; color: #666; background: #f5f7fa; border-radius: $borderRadius; font-size: 12px; line-height: 1.6; }
.template-section, .wheel-config, .carousel-config, .particle-config, .section { margin-bottom: 14px; }
.template-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
.label { margin-bottom: 5px; font-size: 13px; font-weight: 600; }
.section :deep(textarea) { font-family: Consolas, 'Courier New', monospace; font-size: 12px; }
.wheel-config, .carousel-config, .particle-config { padding: 10px; border: 1px solid $borderColor; border-radius: $borderRadius; background: #fafafa; }
.image-list { display: grid; gap: 6px; margin-bottom: 8px; max-height: 164px; overflow-y: auto; }
.image-row { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 4px; border: 1px solid #e5e7eb; border-radius: $borderRadius; background: #fff; font-size: 12px; }
.image-row img { width: 42px; height: 28px; flex: 0 0 auto; object-fit: cover; border-radius: 2px; }
.image-row span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.option-row, .field-row, .config-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.option-row input, .field-row input, .field-row select { min-width: 0; flex: 1; height: 28px; padding: 4px 7px; border: 1px solid $borderColor; border-radius: $borderRadius; background: #fff; }
.field-row span, .config-row span { flex: 1; font-size: 12px; }
.delete-option { width: 26px; height: 26px; border: 0; border-radius: $borderRadius; color: #ef4444; background: transparent; cursor: pointer; font-size: 18px; }
.delete-option:hover { background: #fee2e2; }
.row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.switch-row { height: 30px; }
</style>
