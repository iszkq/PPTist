import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSlidesStore } from '@/store'

export default () => {
  const { slides } = storeToRefs(useSlidesStore())

  const timer = ref<ReturnType<typeof setTimeout> | null>(null)
  // 导入大型演示稿时优先渲染可见缩略图，后续缩略图分批补齐。
  const slidesLoadLimit = ref(12)

  const loadSlide = () => {
    if (slides.value.length > slidesLoadLimit.value) {
      timer.value = setTimeout(() => {
        slidesLoadLimit.value = slidesLoadLimit.value + 12
        loadSlide()
      }, 600)
    }
    else slidesLoadLimit.value = 9999
  }

  onMounted(loadSlide)

  onUnmounted(() => {
    if (timer.value) clearTimeout(timer.value)
  })

  return {
    slidesLoadLimit,
  }
}
