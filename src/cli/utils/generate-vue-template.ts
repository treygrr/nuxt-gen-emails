import { capitalize } from './string-utils'

export function generateVueTemplate(emailName: string): string {
  const componentName = capitalize(emailName) + 'Nge'

  return `<script setup lang="ts">
import { onMounted } from 'vue'
import { ${emailName}Data } from './${emailName}.data'

defineOptions({
  name: '${componentName}',
})

// Load data from URL params on mount
onMounted(() => {
  decodeUrlParamsToStore(${emailName}Data)
})
</script>

<template>
  <div>
    <h1>{{ ${emailName}Data.title }}</h1>
    <p>{{ ${emailName}Data.message }}</p>
  </div>
</template>
`
}
