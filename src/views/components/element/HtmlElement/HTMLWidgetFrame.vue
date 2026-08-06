<template>
  <iframe
    class="html-widget-frame"
    :src="isEmbed ? elementInfo.embedUrl : undefined"
    :srcdoc="isEmbed ? undefined : document"
    sandbox="allow-scripts"
    referrerpolicy="no-referrer"
    :style="{ pointerEvents: interactive ? 'auto' : 'none' }"
    :title="isEmbed ? '嵌入网页' : 'HTML 动效'"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { PPTHTMLElement } from '@/types/slides'
import { createHTMLWidgetDocument } from '@/configs/htmlWidget'

const props = withDefaults(defineProps<{
  elementInfo: PPTHTMLElement
  interactive?: boolean
}>(), {
  interactive: false,
})

const document = computed(() => createHTMLWidgetDocument(props.elementInfo))
const isEmbed = computed(() => props.elementInfo.widgetKind === 'embed' && Boolean(props.elementInfo.embedUrl))
</script>

<style lang="scss" scoped>
.html-widget-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
}
</style>
