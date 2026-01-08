import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitroApp) => {
  // Register hook handler for nuxt-gen-emails:send
  // Users can hook into this event to process/send emails
  nitroApp.hooks.hook('nuxt-gen-emails:send', async (payload) => {
    // Default hook handler - does nothing by default
    // Users can create their own server plugins or configure this in nuxt.config.ts
    console.log('[nuxt-gen-emails] Email generated', {
      htmlLength: payload.html.length,
      dataKeys: Object.keys(payload.data),
    })
  })
})
