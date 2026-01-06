# nuxt-gen-emails

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A powerful Nuxt 4 module for managing email templates in your application. Build beautiful, type-safe email templates using Vue components with live preview, reactive data stores, and automatic API route generation.

Stop wrestling with HTML email templates scattered across your codebase. `nuxt-gen-emails` brings the joy of Vue component development to email creation — complete with live preview, reactive stores, TypeScript support, and hot reloading.

## Features

- 🎨 **Live Preview UI** — Interactive preview with real-time data editing at `/__emails/`
- 📦 **Reactive Data Stores** — Auto-generated TypeScript stores for each template
- 🔗 **URL State Sharing** — Share preview URLs with encoded data for collaboration
- 🚀 **Auto API Routes** — Type-safe POST endpoints generated for each template
- 🧪 **Built-in API Tester** — Test email rendering directly from the preview UI
- 📁 **Automatic Discovery** — Email templates are automatically scanned and registered
- 🛠 **CLI Scaffolding** — Quickly generate new templates with an interactive CLI
- 🔥 **Hot Reloading** — Changes are watched and reflected instantly during development
- 📝 **Full TypeScript** — Complete type safety for template data and API routes
- 🎯 **Nuxt 4 Compatible** — Built specifically for Nuxt 4 with modern conventions

## Quick Setup

Install the module to your Nuxt application:

```bash
npx nuxi module add nuxt-gen-emails
```

## CLI Usage

The module includes a CLI for scaffolding new email templates with data stores and API routes.

### Add a new email template

```bash
npx nuxt-gen-emails add <name>
```

This generates:
- ✅ Email template (`.vue` file)
- ✅ Reactive data store (`.data.ts` file)
- ✅ Type-safe API route (`server/api/emails/<name>.post.ts`)

**Examples:**

```bash
# Create emails/welcome.vue + welcome.data.ts + server/api/emails/welcome.post.ts
npx nuxt-gen-emails add welcome

# Create nested structure with subdirectories
npx nuxt-gen-emails add auth/password-reset

# Create deeply nested templates
npx nuxt-gen-emails add v1/marketing/newsletter
```

### Interactive directory selection

When you run the command without a path and existing directories are found, the CLI prompts you:

```bash
$ npx nuxt-gen-emails add welcome
? Would you like to select an existing directory? › Yes
? Select a directory: ›
  emails/ (root)
❯ emails/v1/
  emails/auth/
```

### Generated files

#### Email Template (`welcome.vue`)

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { welcomeData } from './welcome.data'

defineOptions({
  name: 'WelcomeNge',
})

// Load data from URL params on mount
onMounted(() => {
  decodeUrlParamsToStore(welcomeData)
})
</script>

<template>
  <div>
    <h1>{{ welcomeData.title }}</h1>
    <p>{{ welcomeData.message }}</p>
  </div>
</template>
```

#### Data Store (`welcome.data.ts`)

```typescript
import { reactive } from 'vue'

export interface WelcomeData extends Record<string, unknown> {
  title: string
  message: string
}

export const welcomeData = reactive<WelcomeData>({
  title: 'Welcome!',
  message: 'This is the welcome email template.',
})

export function updateWelcomeData(data: Partial<WelcomeData>) {
  Object.assign(welcomeData, data)
}
```

#### API Route (`server/api/emails/welcome.post.ts`)

```typescript
import { defineEventHandler, readBody, createError } from 'h3'
import { encodeStoreToUrlParams, useRuntimeConfig } from '#imports'
import type { WelcomeData } from '~/emails/welcome.data'

export default defineEventHandler(async (event) => {
  const body = await readBody<WelcomeData>(event)

  // Generate URL with encoded store data and server flag
  const params = encodeStoreToUrlParams(body)
  const separator = params ? '&' : '?'
  const emailUrl = `/__emails/welcome${params}${separator}server=true`

  // Fetch the rendered email HTML
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fullUrl = `${baseUrl}${emailUrl}`

  try {
    const response = await fetch(fullUrl)
    const html = await response.text()

    // Call user-configured send handler if provided
    const config = useRuntimeConfig()
    const sendHandler = config.nuxtGenEmails?.sendGeneratedHtml

    if (sendHandler) {
      await sendHandler({
        html,
        data: body,
      })
    }

    return {
      success: true,
      message: 'Email rendered successfully',
      html,
    }
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to render or send email'
    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }
})
```

## Live Preview

Navigate to `/__emails/` in your browser to access the interactive preview UI:

### Features:

- 📝 **Template Selector** — Dropdown with nested folder support to switch between templates
- ✏️ **Live Data Editor** — Modify template data in real-time and see instant updates
- 🔗 **Share URL** — Generate shareable URLs with encoded data state
- 🧪 **API Tester** — Test POST requests and see rendered HTML output
- 🎨 **Modern UI** — Clean, professional interface matching Nuxt design language

### URL State Management

The preview system supports URL-based state sharing:

```bash
# Preview with custom data
http://localhost:3000/__emails/welcome?title=Hello&message=World

# Server-only mode (no UI, just email HTML)
http://localhost:3000/__emails/welcome?server=true
```

### Auto-Imported Utilities

The module provides auto-imported utilities for working with URL parameters:

```typescript
// Encode store data to URL params
const params = encodeStoreToUrlParams(welcomeData)
// Returns: "?title=Hello&message=World"

// Decode URL params and update store
decodeUrlParamsToStore(welcomeData)
// Reads current URL and updates store with query params

// Generate shareable URL
const url = generateShareableUrl(welcomeData)
// Returns: "http://localhost:3000/__emails/welcome?title=Hello&message=World"
```

## API Integration

### Sending Emails

Use the auto-generated API routes to render and send emails:

```typescript
// POST to the email endpoint with your data
const response = await $fetch('/api/emails/welcome', {
  method: 'POST',
  body: {
    title: 'Welcome to our app!',
    message: 'Thanks for signing up.',
  },
})

// Response includes rendered HTML
console.log(response.html) // Rendered email HTML
```

### Integration Example

```typescript
// server/api/auth/register.post.ts
export default defineEventHandler(async (event) => {
  const { email, name } = await readBody(event)
  
  // Create user...
  
  // Render and send welcome email
  const { html } = await $fetch('/api/emails/welcome', {
    method: 'POST',
    body: {
      title: `Welcome ${name}!`,
      message: 'Thanks for joining us.',
    },
  })
  
  // Send the email using your email service
  await sendEmail({
    to: email,
    subject: 'Welcome!',
    html,
  })
  
  return { success: true }
})
```

## Configuration

Configure the module in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-gen-emails'],
  nuxtGenEmails: {
    // Optional: Configure a custom email sending handler
    // This function is automatically called in all generated API routes after rendering
    sendGeneratedHtml: async ({ html, data }) => {
      // Example: Send via Resend
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@example.com',
          to: data.email,
          subject: data.title,
          html: html,
        }),
      })
    },
  },
})
```

### Module Options

#### `sendGeneratedHtml`

**Type:** `(params: { html: string; data: Record<string, unknown> }) => void | Promise<void>`  
**Optional**

A function that gets called automatically in all generated API routes after the email HTML is rendered. Use this to integrate with your email service provider (Resend, SendGrid, Postmark, etc.).

**Parameters:**
- `html` - The rendered email HTML string
- `data` - The typed data object sent to the API route

**Example with Resend:**

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-gen-emails'],
  nuxtGenEmails: {
    sendGeneratedHtml: async ({ html, data }) => {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to: data.email as string,
        subject: data.title as string,
        html,
      })
    },
  },
})
```

**Example with SendGrid:**

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-gen-emails'],
  nuxtGenEmails: {
    sendGeneratedHtml: async ({ html, data }) => {
      const sgMail = await import('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
      
      await sgMail.send({
        to: data.email as string,
        from: 'noreply@yourdomain.com',
        subject: data.title as string,
        html,
      })
    },
  },
})
```

**Example with custom logging:**

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-gen-emails'],
  nuxtGenEmails: {
    sendGeneratedHtml: async ({ html, data }) => {
      console.log(`📧 Email rendered successfully`)
      console.log(`📊 Data:`, data)
      console.log(`📄 HTML length: ${html.length} chars`)
      
      // Your sending logic here...
    },
  },
})
```

When configured, the generated API routes automatically call this function after rendering the email HTML, making it seamless to integrate with any email service.

## Directory Structure

Email templates should be placed in the `emails/` directory within your Nuxt app's source directory:

```
app/
├── emails/
│   ├── welcome.vue
│   ├── welcome.data.ts
│   ├── auth/
│   │   ├── password-reset.vue
│   │   ├── password-reset.data.ts
│   │   ├── verify-email.vue
│   │   └── verify-email.data.ts
│   └── marketing/
│       ├── newsletter.vue
│       └── newsletter.data.ts
├── pages/
├── server/
│   └── api/
│       └── emails/
│           ├── welcome.post.ts
│           ├── auth/
│           │   ├── password-reset.post.ts
│           │   └── verify-email.post.ts
│           └── marketing/
│               └── newsletter.post.ts
└── app.vue
```

## Development

```bash
# Install dependencies
pnpm install

# Generate type stubs
pnpm dev:prepare

# Develop with the playground
pnpm dev

# Build the module
pnpm prepack

# Run ESLint
pnpm lint
```

## License

[MIT License](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-gen-emails/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-gen-emails

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-gen-emails.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-gen-emails

[license-src]: https://img.shields.io/npm/l/nuxt-gen-emails.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-gen-emails

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
