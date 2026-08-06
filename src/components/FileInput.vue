<template>
  <div class="file-input" @click="handleClick()">
    <slot></slot>
    <input 
      class="input"
      type="file" 
      name="upload" 
      ref="inputRef" 
      :accept="accept" 
      :multiple="multiple"
      @change="$event => handleChange($event)"
      @click.stop
    >
  </div>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue'

withDefaults(defineProps<{
  accept?: string
  multiple?: boolean
}>(), {
  accept: 'image/*',
  multiple: false,
})

const emit = defineEmits<{
  (event: 'change', payload: FileList): void
}>()

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

const handleClick = () => {
  if (!inputRef.value) return
  inputRef.value.value = ''
  inputRef.value.click()
}
const handleChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files) emit('change', files)
}
</script>

<style lang="scss" scoped>
.input {
  display: none;
}
</style>
