<script setup lang="ts">
import { testData } from './test.data'

defineOptions({
  name: 'TestNge',
})
</script>

<template>
  <div>
    <h1>{{ testData.title }}</h1>
    <p>{{ testData.message }}</p>
  </div>
</template>
