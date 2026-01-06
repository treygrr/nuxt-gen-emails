import { defineNuxtModule, addPlugin, createResolver, addServerHandler, extendPages } from '@nuxt/kit'
import type { NuxtPage } from '@nuxt/schema'
import { join } from 'pathe'
import fs from 'node:fs'

// Module options TypeScript interface definition
export interface ModuleOptions {
  sendEmailHtml: (html: string, to: string, subject: string) => Promise<void>
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

    // Register the emails directory in the app directory
    const emailsDir = join(nuxt.options.srcDir, 'emails')
    if (fs.existsSync(emailsDir)) {
      nuxt.options.watch.push(emailsDir)
    }

    // Expose emails directory via runtime config
    nuxt.options.runtimeConfig.nuxtGenEmails = {
      emailsDir,
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

            // Check if data store exists
            const dataStorePath = fullPath.replace('.vue', '.data.ts')
            const hasDataStore = fs.existsSync(dataStorePath)

            // Write wrapper component
            const wrapperContent = `<script setup lang="ts">
import EmailsLayout from '${resolver.resolve('./runtime/pages/__emails.vue')}'
import EmailComponent from '${fullPath}'${hasDataStore ? `
import * as emailStore from '${dataStorePath}'` : ''}

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

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugin'))
  },
})
