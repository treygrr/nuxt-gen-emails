<script setup lang="ts">
import { onMounted } from 'vue'
import { testData } from './test.data'

defineOptions({
  name: 'TestNge',
})

// Load data from URL params on mount
onMounted(() => {
  decodeUrlParamsToStore(testData)
})
</script>

<template>
  <div>
    <h1>{{ testData.title }}</h1>
    <p>{{ testData.message }}</p>
  </div>
</template>
