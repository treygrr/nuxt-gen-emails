import { defineNuxtModule, createResolver, addServerHandler, extendPages, addImports, addServerImports } from '@nuxt/kit'
import { join } from 'pathe'
import fs from 'node:fs'
import { generateWrapperComponent } from './module-utils/generate-wrapper-component'

// Module options TypeScript interface definition
export interface ModuleOptions {
  /**
   * Optional function to send generated email HTML.
   * Called in generated API routes after rendering the email.
   * Can be sync or async.
   */
  sendGeneratedHtml?: (params: {
    html: string
    data: Record<string, unknown>
  }) => void | Promise<void>
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
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Expose module options to runtime config for use in generated API routes
    nuxt.options.runtimeConfig.nuxtGenEmails = nuxt.options.runtimeConfig.nuxtGenEmails || {}

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

    // Register the emails directory in the app directory
    const emailsDir = join(nuxt.options.srcDir, 'emails')
    if (fs.existsSync(emailsDir)) {
      nuxt.options.watch.push(emailsDir)
    }

    // Watch for new email files and trigger restart
    nuxt.hook('builder:watch', async (event, path) => {
      if (path.startsWith(emailsDir) && path.endsWith('.vue')) {
        console.log('New email template detected, restarting...')
        await nuxt.callHook('restart')
      }
    })

    // Expose emails directory via runtime config
    nuxt.options.runtimeConfig.nuxtGenEmails = {
      emailsDir,
      sendGeneratedHtml: _options.sendGeneratedHtml,
    }

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

    // Add the server route handler for /api/nge/*
    addServerHandler({
      route: '/api/nge/**',
      handler: resolver.resolve('./runtime/server/nge/[...].post'),
    })

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

    // find emails in the emails directory and list all files and subdirectories

    function getAllEmailFiles(dirPath: string, arrayOfFiles: string[] = []) {
      if (!fs.existsSync(dirPath)) {
        return arrayOfFiles
      }

      const files = fs.readdirSync(dirPath)

      files.forEach((file: string) => {
        const filePath = join(dirPath, file)
        if (fs.statSync(filePath).isDirectory()) {
          arrayOfFiles = getAllEmailFiles(filePath, arrayOfFiles)
        }
        else {
          arrayOfFiles.push(filePath)
        }
      })

      return arrayOfFiles
    }

    const emailFiles = getAllEmailFiles(emailsDir)
    if (emailFiles.length > 0) {
      console.log('Email files:', emailFiles)
    }
  },
})
