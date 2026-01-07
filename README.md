# nuxt-gen-emails

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> ⚠️ **Warning: Under Active Development**
> 
> This module is currently in early development and is **not production-ready**. APIs, features, and configuration options are subject to breaking changes without notice. Use at your own risk and do not deploy to production environments.

A powerful Nuxt 4 module for managing email templates in your application. Build beautiful, type-safe email templates using Vue components with live preview, reactive data stores, and automatic API route generation.

Stop wrestling with HTML email templates scattered across your codebase. `nuxt-gen-emails` brings the joy of Vue component development to email creation — complete with live preview, reactive stores, TypeScript support, and hot reloading.

## Use Case

This module is designed for applications that need to generate and send emails via API endpoints. It transforms your Vue email templates into type-safe POST endpoints that backend services can call to render HTML emails and deliver them through your email service provider (Resend, SendGrid, etc.).

**Perfect for:**
- Microservices architectures where email rendering is centralized
- Transactional emails triggered by backend events (user registration, password resets, order confirmations)
- Marketing automation systems that need on-demand email generation
- Multi-tenant applications with customizable email templates
- Teams that want to preview and test emails before deployment

Instead of maintaining HTML strings or complicated template engines in your backend, your backend services simply POST data to the email API endpoints, and the module handles rendering the Vue components into production-ready HTML.

## Features

- 🎨 **Live Preview UI** — Interactive preview with real-time data editing at `/__emails/`
- 📦 **Reactive Data Stores** — Auto-generated TypeScript stores for each template
- 🔗 **URL State Sharing** — Share preview URLs with encoded data for collaboration
- 🚀 **Auto API Routes** — Type-safe POST endpoints generated for each template
- 🔐 **API Security** — Built-in API key authentication and rate limiting
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

### Regenerate routes

If you need to manually regenerate email routes and wrappers:

```bash
npx nuxt-gen-emails regenerate
```

This command:
- ✅ Regenerates all email route wrappers
- ✅ Updates the template registry
- ✅ Rebuilds the Nuxt routes

**Note:** Routes are automatically regenerated when you:
- Add or modify `.vue` email templates
- Change `.data.ts` files
- The module watches for changes and triggers a restart automatically

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

### Sending Emails from Backend Services

The auto-generated API routes are designed to be called by external backend services, microservices, or any server that needs to render and send emails. Your backend simply makes an HTTP POST request with the email data.

```typescript
// Example: Node.js backend service
const response = await fetch('https://your-email-service.com/api/emails/welcome', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.EMAIL_SERVICE_API_KEY,
  },
  body: JSON.stringify({
    title: 'Welcome to our app!',
    message: 'Thanks for signing up.',
    email: 'user@example.com',
  }),
})

const result = await response.json()
console.log(result.html) // Rendered email HTML
```

```python
# Example: Python backend service
import requests
import os

response = requests.post(
    'https://your-email-service.com/api/emails/welcome',
    headers={
        'Content-Type': 'application/json',
        'x-api-key': os.getenv('EMAIL_SERVICE_API_KEY'),
    },
    json={
        'title': 'Welcome to our app!',
        'message': 'Thanks for signing up.',
        'email': 'user@example.com',
    }
)

result = response.json()
print(result['html'])  # Rendered email HTML
```

### Integration Example

Here's a complete example of a separate authentication service calling the email rendering service:

```typescript
// Separate backend service (e.g., user-service)
export async function registerUser(email: string, name: string) {
  // Create user in database...
  
  // Call the email rendering service
  const response = await fetch('https://email-service.yourdomain.com/api/emails/welcome', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EMAIL_SERVICE_API_KEY,
    },
    body: JSON.stringify({
      email: email,
      name: name,
      title: `Welcome ${name}!`,
      message: 'Thanks for joining us.',
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to send welcome email')
  }
  
  const { html } = await response.json()
  
  // Email is automatically sent via Nitro hook
  // Or you can use the HTML to send via your own email provider
  
  return { success: true }
}
```

**Within the same Nuxt app:**

If you need to send emails from within the same Nuxt application, you can call the API routes internally:

```typescript
// server/api/auth/register.post.ts
export default defineEventHandler(async (event) => {
  const { email, name } = await readBody(event)
  
  // Create user...
  
  // Call internal email API
  const { html } = await $fetch('/api/emails/welcome', {
    method: 'POST',
    headers: {
      'x-api-key': useRuntimeConfig().nuxtGenEmails.apiKey as string,
    },
    body: {
      email,
      name,
      title: `Welcome ${name}!`,
      message: 'Thanks for joining us.',
    },
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
    // Optional: Set a custom email directory (default: 'emails')
    emailDir: 'emails',
    
    // Optional: Configure API key for authentication
    apiKey: 'your-secret-key-here',
    
    // Optional: Configure rate limiting
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    },
  },
  
  // Hook into email sending via Nitro hooks
  nitro: {
    hooks: {
      'nuxt-gen-emails:send': async ({ html, data }) => {
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
  },
})
```

### Module Options

#### `emailDir`

**Type:** `string`  
**Default:** `'emails'`

The directory where email templates are stored. Can be relative to your app's source directory or an absolute path.

```typescript
export default defineNuxtConfig({
  nuxtGenEmails: {
    emailDir: 'app/email-templates', // Custom directory
  },
})
```

#### `apiKey`

**Type:** `string | false`  
**Default:** Auto-generated on first run

API key for authenticating requests to email generation endpoints. This secures your API routes from unauthorized access.

- If not provided, a random key is generated and logged on startup
- Set to `false` to disable authentication (**not recommended for production**)
- Copy the generated key from console and add to your config to persist it

```typescript
export default defineNuxtConfig({
  nuxtGenEmails: {
    apiKey: process.env.NUXT_GEN_EMAILS_API_KEY, // Recommended: use environment variable
    // apiKey: false, // Disable authentication (NOT recommended for production)
  },
})
```

**Making authenticated requests:**

```typescript
// Include API key in request header
await $fetch('/api/emails/welcome', {
  method: 'POST',
  headers: {
    'x-api-key': 'your-api-key-here',
    // Or use Authorization header
    // 'Authorization': 'Bearer your-api-key-here',
  },
  body: {
    title: 'Welcome!',
    message: 'Hello World',
  },
})
```

#### `rateLimit`

**Type:** `{ maxRequests: number; windowMs: number } | false`  
**Default:** `{ maxRequests: 10, windowMs: 60000 }`

Rate limiting configuration to prevent abuse of email generation endpoints. Limits are tracked per IP address.

- `maxRequests` - Maximum number of requests allowed per time window
- `windowMs` - Time window in milliseconds
- Set to `false` to disable rate limiting

```typescript
export default defineNuxtConfig({
  nuxtGenEmails: {
    rateLimit: {
      maxRequests: 20,  // Allow 20 requests
      windowMs: 60000,  // Per 1 minute
    },
    // rateLimit: false, // Disable rate limiting
  },
})
```

### Sending Emails via Nitro Hooks

The module uses Nitro hooks for email sending integration. Hook into the `nuxt-gen-emails:send` event to integrate with your email service provider.

**Example with Resend:**

```typescript
export default defineNuxtConfig({
  nitro: {
    hooks: {
      'nuxt-gen-emails:send': async ({ html, data }) => {
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
  },
})
```

**Example with SendGrid:**

```typescript
export default defineNuxtConfig({
  nitro: {
    hooks: {
      'nuxt-gen-emails:send': async ({ html, data }) => {
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
  },
})
```

**Example with custom logging:**

```typescript
export default defineNuxtConfig({
  nitro: {
    hooks: {
      'nuxt-gen-emails:send': async ({ html, data }) => {
        console.log(`📧 Email rendered successfully`)
        console.log(`📊 Data:`, data)
        console.log(`📄 HTML length: ${html.length} chars`)
        
        // Your sending logic here...
      },
    },
  },
})
```

The generated API routes automatically call this hook after rendering the email HTML, making it seamless to integrate with any email service.

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
