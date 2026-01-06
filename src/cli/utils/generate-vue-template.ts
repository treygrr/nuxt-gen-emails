import { capitalize } from './string-utils'

export function generateVueTemplate(emailName: string): string {
  const componentName = capitalize(emailName) + 'Nge'

  return `<script setup lang="ts">
import { ${emailName}Data } from './${emailName}.data'

defineOptions({
  name: '${componentName}',
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
