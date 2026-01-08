import type { ModuleOptions } from '../module'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    /**
     * Configuration for nuxt-gen-emails module
     * @see https://github.com/treygrr/nuxt-gen-emails
     */
    nuxtGenEmails?: ModuleOptions
  }

  interface RuntimeConfig {
    nuxtGenEmails: {
      emailsDir: string
      apiKey: string | false
      rateLimit: {
        maxRequests: number
        windowMs: number
      } | false
      sendGenEmails?: (html: string, data: Record<string, unknown>) => Promise<void> | void
    }
  }

  interface PublicRuntimeConfig {
    nuxtGenEmails: {
      templates: string[]
    }
  }
}
