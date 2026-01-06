import { defineEventHandler, readBody, createError } from 'h3'
import { encodeStoreToUrlParams, useRuntimeConfig } from '#imports'
import type { Test1Data } from '~/emails/v1/test1.data'

export default defineEventHandler(async (event) => {
  const body = await readBody<Test1Data>(event)

  // Generate URL with encoded store data and server flag
  const params = encodeStoreToUrlParams(body)
  const separator = params ? '&' : '?'
  const emailUrl = `/__emails/v1/test1${params}${separator}server=true`

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
        templatePath: '~/emails/v1/test1.vue',
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
