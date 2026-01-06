# nuxt-gen-emails

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A powerful Nuxt 4 module for managing email templates in your application. Build beautiful, type-safe email templates using Vue components with a seamless developer experience.

Stop wrestling with HTML email templates scattered across your codebase. `nuxt-gen-emails` brings the joy of Vue component development to email creation — complete with props, TypeScript support, and hot reloading.

## Features

- 📁 **Automatic directory scanning** — Email templates are automatically discovered from your `emails/` directory
- 🛠 **CLI scaffolding** — Quickly generate new email templates with an interactive CLI
- 🔥 **Hot reloading** — Changes to email templates are watched and reflected instantly during development
- 📝 **TypeScript support** — Full type safety for your email template props
- 🎯 **Nuxt 4 compatible** — Built specifically for Nuxt 4 with modern conventions

## Quick Setup

Install the module to your Nuxt application:

```bash
npx nuxi module add nuxt-gen-emails
```

## CLI Usage

The module includes a CLI for scaffolding new email templates.

### Add a new email template

```bash
npx nuxt-gen-emails add <name>
```

**Examples:**

```bash
# Create emails/welcome.vue
npx nuxt-gen-emails add welcome

# Create emails/auth/password-reset.vue (creates directories automatically)
npx nuxt-gen-emails add auth/password-reset

# Create emails/v1/marketing/newsletter.vue
npx nuxt-gen-emails add v1/marketing/newsletter
```

### Interactive directory selection

When you run the command without a path and existing directories are found in your `emails/` folder, the CLI will prompt you:

```bash
$ npx nuxt-gen-emails add welcome
? Would you like to select an existing directory? › Yes
? Select a directory: ›
  emails/ (root)
❯ emails/v1/
  emails/auth/
```

Use arrow keys to navigate and select the target directory for your new template.

### Generated template

Each new email template is created with a basic structure:

```vue
<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <div>
    <h1>Hello {{ name }}</h1>
    <p>This is the welcome email template.</p>
  </div>
</template>
```

## Configuration

Configure the module in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-gen-emails'],
  nuxtGenEmails: {
    // Configuration options
  },
})
```

## Directory Structure

Email templates should be placed in the `emails/` directory within your Nuxt app's source directory:

```
app/
├── emails/
│   ├── welcome.vue
│   ├── auth/
│   │   ├── password-reset.vue
│   │   └── verify-email.vue
│   └── marketing/
│       └── newsletter.vue
├── pages/
└── app.vue
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
