export function generateWrapperComponent(
  emailsLayoutPath: string,
  emailComponentPath: string,
  dataStorePath?: string,
): string {
  const hasDataStore = !!dataStorePath

  return `<script setup lang="ts">
import EmailsLayout from '${emailsLayoutPath}'
import EmailComponent from '${emailComponentPath}'${hasDataStore
  ? `
import * as emailStore from '${dataStorePath}'`
  : ''}

definePageMeta({
  layout: false,
})
</script>

<template>
  <EmailsLayout${hasDataStore ? ' :email-store="emailStore"' : ''}>
    <EmailComponent />
  </EmailsLayout>
</template>
`
}
