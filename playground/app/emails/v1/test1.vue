<script setup lang="ts">
import { onMounted } from 'vue'
import { test1Data } from './test1.data'

defineOptions({
  name: 'Test1Nge',
})

// Load data from URL params on mount
onMounted(() => {
  decodeUrlParamsToStore(test1Data)
})
</script>

<template>
  <div>
    <h1>{{ test1Data.title }}</h1>
    <p>{{ test1Data.message }}</p>
  </div>
</template>
