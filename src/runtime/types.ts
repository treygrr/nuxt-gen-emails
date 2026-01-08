import type { HookResult } from '@nuxt/schema'

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    nuxtGenEmails: {
      emailsDir: string
      apiKey: string | false
      rateLimit: {
        maxRequests: number
        windowMs: number
      } | false
    }
  }
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'nuxt-gen-emails:send': (payload: {
      html: string
      data: Record<string, unknown>
    }) => HookResult
  }
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'nuxt-gen-emails:send': (payload: {
      html: string
      data: Record<string, unknown>
    }) => void | Promise<void>
  }
}

export {}
