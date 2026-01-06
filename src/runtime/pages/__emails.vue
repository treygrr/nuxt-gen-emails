<script setup lang="ts">
definePageMeta({
  layout: false,
})
</script>

<template>
  <div class="nge-email-preview">
    <div class="nge-email-preview__toolbar">
      <div class="nge-email-preview__title">
        Email Template
      </div>
    </div>
    <div class="nge-email-preview__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.nge-email-preview {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.nge-email-preview__toolbar {
  background: #1a1a2e;
  color: white;
  padding: 12px 20px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nge-email-preview__title {
  font-weight: 600;
}

.nge-email-preview__content {
  flex: 1;
}
</style>
