<template>
  <div class="base-element-html" :style="elementStyle">
    <div class="rotate-wrapper" :style="{ transform: `rotate(${elementInfo.rotate}deg)` }">
      <HTMLWidgetFrame :elementInfo="elementInfo" :interactive="interactive" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTHTMLElement } from '@/types/slides'
import HTMLWidgetFrame from './HTMLWidgetFrame.vue'

const props = withDefaults(defineProps<{
  elementInfo: PPTHTMLElement
  interactive?: boolean
}>(), { interactive: false })

const elementStyle = computed(() => ({
  top: props.elementInfo.top + 'px', left: props.elementInfo.left + 'px',
  width: props.elementInfo.width + 'px', height: props.elementInfo.height + 'px',
}))
</script>

<style lang="scss" scoped>
.base-element-html { position: absolute; overflow: hidden; }
.rotate-wrapper { width: 100%; height: 100%; }
</style>
