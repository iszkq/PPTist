<template>
  <div class="native-overlay-dialog">
    <div class="configs">
      <h3>同步到 Office / WPS 原生放映</h3>
      <p>原 PPTX 仍由 PowerPoint 或 WPS 打开和放映；这里只同步 HTML 组件。原生动画、音视频和切换效果不会被转换或替换。</p>

      <div class="row">
        <label>原 PPTX 的完整路径</label>
        <Input v-model:value="presentationKey" placeholder="例如：C:\\演示\\汇报.pptx" />
      </div>

      <div class="summary">将同步 {{ widgetCount }} 个 HTML 组件，按当前编辑器的第 1、2、3… 页对应原 PPTX 的页码。</div>
      <div class="status" :class="statusType">{{ status }}</div>
    </div>

    <div class="btns">
      <Button class="btn" :disabled="loading" @click="checkRuntime">检查运行器</Button>
      <Button class="btn sync" type="primary" :disabled="loading || !presentationKey.trim()" @click="sync">{{ loading ? '正在同步…' : '同步组件' }}</Button>
      <Button class="btn" @click="emit('close')">关闭</Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'
import { checkOverlayRuntime, createOverlayWidgets, syncOverlayWidgets } from '@/services/overlayBridge'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'

const emit = defineEmits<{ (event: 'close'): void }>()
const { slides } = storeToRefs(useSlidesStore())
const presentationKey = ref(localStorage.getItem('pptist-native-presentation-path') || '')
const loading = ref(false)
const status = ref('请先确认本机运行器已安装并启动。')
const statusType = ref('')
const widgets = computed(() => createOverlayWidgets(slides.value))
const widgetCount = computed(() => widgets.value.length)

watch(presentationKey, value => localStorage.setItem('pptist-native-presentation-path', value.trim()))

const checkRuntime = async () => {
  loading.value = true
  try {
    await checkOverlayRuntime()
    status.value = '运行器已就绪，可以同步并开始原生放映。'
    statusType.value = 'success'
  }
  catch (error) {
    status.value = error instanceof Error ? error.message : '无法连接本机运行器。'
    statusType.value = 'error'
  }
  finally { loading.value = false }
}

const sync = async () => {
  loading.value = true
  try {
    await syncOverlayWidgets(presentationKey.value.trim(), widgets.value)
    status.value = `已同步 ${widgetCount.value} 个组件。现在用 PowerPoint 或 WPS 打开该 PPTX 并进入放映即可。`
    statusType.value = 'success'
  }
  catch (error) {
    status.value = error instanceof Error ? error.message : '同步失败。'
    statusType.value = 'error'
  }
  finally { loading.value = false }
}
</script>

<style lang="scss" scoped>
.native-overlay-dialog { height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
.configs { max-width: 460px; margin: 40px auto 0; line-height: 1.7; }
h3 { margin: 0 0 12px; font-size: 18px; }
p { color: #666; margin: 0 0 22px; }
.row label { display: block; margin-bottom: 7px; font-weight: 600; }
.summary, .status { margin-top: 18px; padding: 10px 12px; border-radius: $borderRadius; background: #f7f8fa; color: #666; }
.status.success { color: #2e7d32; background: #edf8ef; }
.status.error { color: #c62828; background: #fff0f0; }
.btns { display: flex; justify-content: flex-end; gap: 10px; padding: 18px 4px 4px; }
.sync { min-width: 110px; }
</style>
