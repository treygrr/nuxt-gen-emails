import { defineNuxtModule, createResolver, extendPages, addImports, addServerImports, addTypeTemplate, addServerPlugin } from '@nuxt/kit'
import { join } from 'pathe'
import fs from 'node:fs'
import { generateWrapperComponent } from './module-utils/generate-wrapper-component'
import { generateServerRoutes } from './module-utils/generate-server-routes'
import { collectTemplates } from './module-utils/collect-templates'
import { addEmailPages } from './module-utils/add-email-pages'

// Module options TypeScript interface definition
export interface ModuleOptions {
  /** Directory containing email templates; resolved from srcDir when relative. */
  emailDir?: string
  /**
   * API key for authenticating email generation requests.
   * If not provided, a random key will be generated and logged.
   * Set to false to disable authentication (not recommended for production).
   */
  apiKey?: string | boolean
  /**
   * Rate limiting configuration for email API endpoints.
   * @default { maxRequests: 10, windowMs: 60000 }
   */
  rateLimit?: {
    /** Maximum number of requests per time window */
    maxRequests: number
    /** Time window in milliseconds */
    windowMs: number
  } | false
  sendGenEmails?: (html: string, data: Record<string, unknown>) => Promise<void> | void
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-gen-emails',
    configKey: 'nuxtGenEmails',
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '>=4.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {
    emailDir: 'emails',
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    },
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Generate or validate API key
    let apiKey: string | false = false
    if (options.apiKey === false) {
      console.warn('[nuxt-gen-emails] API authentication is disabled. This is not recommended for production!')
      apiKey = false
    }
    else if (options.apiKey && typeof options.apiKey === 'string') {
      apiKey = options.apiKey
    }
    else {
      // Generate a random API key
      apiKey = `nge_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      console.log(`[nuxt-gen-emails] Generated API Key: ${apiKey}`)
      console.log('[nuxt-gen-emails] Set this in your nuxt.config.ts to persist it across restarts')
    }

    // Add auto-imports for URL params utilities
    addImports([
      {
        name: 'encodeStoreToUrlParams',
        from: resolver.resolve('./runtime/utils/url-params'),
      },
      {
        name: 'decodeUrlParamsToStore',
        from: resolver.resolve('./runtime/utils/url-params'),
      },
      {
        name: 'generateShareableUrl',
        from: resolver.resolve('./runtime/utils/url-params'),
      },
    ])

    // Add server-side imports for URL params utilities
    addServerImports([
      {
        name: 'encodeStoreToUrlParams',
        from: resolver.resolve('./runtime/utils/url-params'),
      },
      {
        name: 'getSendGenEmailsHandler',
        from: resolver.resolve('./runtime/server/utils/send-gen-emails'),
      },
    ])

    // Register the emails directory in the app directory
    const configuredEmailDir = options.emailDir ?? 'emails'

    const emailsDir = join(nuxt.options.srcDir, configuredEmailDir)

    // Expose emails directory and security config via runtime config
    nuxt.options.runtimeConfig.nuxtGenEmails = {
      emailsDir,
      apiKey,
      rateLimit:
        options.rateLimit === false
          ? false
          : options.rateLimit ?? {
            maxRequests: 10,
            windowMs: 60000,
          },
      sendGenEmails: options.sendGenEmails,
    }

    if (fs.existsSync(emailsDir)) {
      nuxt.options.watch.push(emailsDir)
    }

    // Watch for email file changes and trigger restart
    nuxt.hook('builder:watch', async (event, path) => {
      // Watch for .vue file changes (new templates or modifications)
      if (path.startsWith(emailsDir) && path.endsWith('.vue')) {
        console.log('[nuxt-gen-emails] Email template change detected, generating routes...')
        generateServerRoutes(emailsDir, nuxt.options.rootDir)
        await nuxt.callHook('restart')
      }
      // Watch for .data.ts file changes (data store modifications)
      else if (path.startsWith(emailsDir) && path.endsWith('.data.ts')) {
        console.log('[nuxt-gen-emails] Email data store change detected, generating routes...')
        generateServerRoutes(emailsDir, nuxt.options.rootDir)
        await nuxt.callHook('restart')
      }
    })

    // Collect email template paths for the selector
    const emailTemplates = collectTemplates(emailsDir)

    // Expose email templates via runtime config
    nuxt.options.runtimeConfig.public.nuxtGenEmails = {
      templates: emailTemplates,
    }

    // Register email preview pages under /__emails/
    extendPages((pages) => {
      if (!fs.existsSync(emailsDir)) {
        return
      }

      addEmailPages(emailsDir, pages, {
        emailsDir,
        buildDir: nuxt.options.buildDir,
        emailTemplateComponentPath: resolver.resolve('./runtime/pages/__emails.vue'),
      })
    })

    // Generate initial server routes on module setup
    generateServerRoutes(emailsDir, nuxt.options.rootDir)
  },
})
