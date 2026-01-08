import { defineNuxtModule, createResolver, extendPages, addImports, addServerImports, addTypeTemplate, addServerPlugin } from '@nuxt/kit'
import { join } from 'pathe'
import fs from 'node:fs'
import { generateWrapperComponent } from './module-utils/generate-wrapper-component'
import { generateApiRoute } from './cli/utils/generate-api-route'

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
    ])


    // Register the Nitro plugin for handling email send events
    addServerPlugin(resolver.resolve('./runtime/server/plugins/email-send'))

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
    }

    if (fs.existsSync(emailsDir)) {
      nuxt.options.watch.push(emailsDir)
    }

    // Function to generate server routes for all email templates
    function generateServerRoutes() {
      if (!fs.existsSync(emailsDir)) return

      const serverApiDir = join(nuxt.options.rootDir, 'server', 'api', 'emails')

      // Ensure the server API directory exists
      if (!fs.existsSync(serverApiDir)) {
        fs.mkdirSync(serverApiDir, { recursive: true })
      }

      // Recursively collect and generate routes for all email templates
      function processEmailDirectory(dirPath: string, routePrefix: string = '') {
        const entries = fs.readdirSync(dirPath)

        for (const entry of entries) {
          const fullPath = join(dirPath, entry)
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory()) {
            processEmailDirectory(fullPath, `${routePrefix}/${entry}`)
          }
          else if (entry.endsWith('.vue')) {
            const emailName = entry.replace('.vue', '')
            const emailPath = `${routePrefix}/${emailName}`.replace(/^\//, '')

            // Create the API route file
            const apiRouteDir = routePrefix
              ? join(serverApiDir, routePrefix.replace(/^\//, ''))
              : serverApiDir

            if (!fs.existsSync(apiRouteDir)) {
              fs.mkdirSync(apiRouteDir, { recursive: true })
            }

            const apiFileName = `${emailName}.post.ts`
            const apiFilePath = join(apiRouteDir, apiFileName)
            const apiTemplate = generateApiRoute(emailName, emailPath)

            fs.writeFileSync(apiFilePath, apiTemplate, 'utf-8')
            console.log(`[nuxt-gen-emails] Generated API route: ${apiFilePath}`)
          }
        }
      }

      processEmailDirectory(emailsDir)
    }

    // Watch for email file changes and trigger restart
    nuxt.hook('builder:watch', async (event, path) => {
      // Watch for .vue file changes (new templates or modifications)
      if (path.startsWith(emailsDir) && path.endsWith('.vue')) {
        console.log('[nuxt-gen-emails] Email template change detected, generating routes...')
        generateServerRoutes()
        await nuxt.callHook('restart')
      }
      // Watch for .data.ts file changes (data store modifications)
      else if (path.startsWith(emailsDir) && path.endsWith('.data.ts')) {
        console.log('[nuxt-gen-emails] Email data store change detected, generating routes...')
        generateServerRoutes()
        await nuxt.callHook('restart')
      }
    })

    // Collect email template paths for the selector
    const emailTemplates: string[] = []

    function collectTemplates(dirPath: string, routePrefix: string = '') {
      // If the path doesn't exist, we're done here. No templates, no problem. Just me and the void.
      if (!fs.existsSync(dirPath)) return

      const entries = fs.readdirSync(dirPath)
      // Oh boy, time to iterate through filesystem entries like we're playing filesystem roulette
      for (const entry of entries) {
        const fullPath = join(dirPath, entry)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          // IT'S A DIRECTORY?! RECURSION TIME. I love/hate recursion. Mostly hate. Who am I kidding.
          collectTemplates(fullPath, `${routePrefix}/${entry}`)
        }
        else if (entry.endsWith('.vue')) {
          // Found a Vue file! Adding it to the pile of templates we'll inevitably need to debug later
          const name = entry.replace('.vue', '')
          // Regex to strip leading slashes because paths are a beautiful nightmare
          emailTemplates.push(`${routePrefix}/${name}`.replace(/^\//, ''))
        }
      }
    }

    collectTemplates(emailsDir)

    // Expose email templates via runtime config
    nuxt.options.runtimeConfig.public.nuxtGenEmails = {
      templates: emailTemplates,
    }

    // Register email preview pages under /__emails/
    extendPages((pages) => {
      if (!fs.existsSync(emailsDir)) {
        return
      }

      // Add email templates as separate pages
      function addEmailPages(dirPath: string, routePrefix: string = '') {
        const entries = fs.readdirSync(dirPath)

        for (const entry of entries) {
          const fullPath = join(dirPath, entry)
          const stat = fs.statSync(fullPath)

          if (stat.isDirectory()) {
            addEmailPages(fullPath, `${routePrefix}/${entry}`)
          }
          else if (entry.endsWith('.vue')) {
            const name = entry.replace('.vue', '')
            const routePath = `/__emails${routePrefix}/${name}`

            // Create a wrapper page that includes both the toolbar and the email component
            const wrapperPath = join(nuxt.options.buildDir, 'email-wrappers', `${routePrefix}/${name}.vue`.replace(/^\//, ''))

            // Ensure directory exists
            const wrapperDir = join(nuxt.options.buildDir, 'email-wrappers', routePrefix.replace(/^\//, ''))
            if (!fs.existsSync(wrapperDir)) {
              fs.mkdirSync(wrapperDir, { recursive: true })
            }

            // Check if data store file exists
            const dataFilePath = fullPath.replace('.vue', '.data.ts')
            const hasDataStore = fs.existsSync(dataFilePath)

            // Generate wrapper component
            const wrapperContent = generateWrapperComponent(
              resolver.resolve('./runtime/pages/__emails.vue'),
              fullPath,
              hasDataStore ? dataFilePath : undefined,
            )

            fs.writeFileSync(wrapperPath, wrapperContent, 'utf-8')

            const pageName = `email${routePrefix.replace(/\//g, '-')}-${name}`.replace(/^-+/, '')
            pages.push({
              name: pageName,
              path: routePath,
              file: wrapperPath,
            })
          }
        }
      }

      addEmailPages(emailsDir)
    })

    // Generate initial server routes on module setup
    generateServerRoutes()
  },
})
