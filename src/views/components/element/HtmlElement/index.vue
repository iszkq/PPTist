<template>
  <div
    class="editable-element-html"
    :class="{ lock: elementInfo.lock }"
    :style="elementStyle"
  >
    <div class="rotate-wrapper" :style="{ transform: `rotate(${elementInfo.rotate}deg)` }">
      <div
        class="element-content"
        v-contextmenu="contextmenus"
        @mousedown="handleSelectElement"
        @touchstart="handleSelectElement"
      >
        <HTMLWidgetFrame :elementInfo="elementInfo" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTHTMLElement } from '@/types/slides'
import type { ContextmenuItem } from '@/components/Contextmenu/types'
import HTMLWidgetFrame from './HTMLWidgetFrame.vue'

const props = defineProps<{
  elementInfo: PPTHTMLElement
  selectElement: (e: MouseEvent | TouchEvent, element: PPTHTMLElement, canMove?: boolean) => void
  contextmenus: () => ContextmenuItem[] | null
}>()

const elementStyle = computed(() => ({
  top: props.elementInfo.top + 'px',
  left: props.elementInfo.left + 'px',
  width: props.elementInfo.width + 'px',
  height: props.elementInfo.height + 'px',
}))

const handleSelectElement = (e: MouseEvent | TouchEvent) => {
  if (props.elementInfo.lock) return
  e.stopPropagation()
  props.selectElement(e, props.elementInfo)
}
</script>

<style lang="scss" scoped>
.editable-element-html { position: absolute; }
.rotate-wrapper, .element-content { width: 100%; height: 100%; }
.element-content { position: relative; overflow: hidden; cursor: move; }
.lock .element-content { cursor: default; }
</style>
