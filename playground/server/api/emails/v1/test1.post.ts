import { defineEventHandler, readBody, createError, getHeader } from 'h3'
import { encodeStoreToUrlParams, useRuntimeConfig } from '#imports'
import type { Test1Data } from '~/emails/v1/test1.data'

// Simple in-memory rate limiter (resets on server restart)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>()

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Authentication check
  if (config.nuxtGenEmails.apiKey !== false) {
    const apiKey = config.nuxtGenEmails.apiKey as unknown as string
    const providedKey = getHeader(event, 'x-api-key') || getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!providedKey || providedKey !== apiKey) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Invalid or missing API key',
      })
    }
  }

  // Rate limiting check
  if (config.nuxtGenEmails.rateLimit) {
    const clientIp = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const limit = config.nuxtGenEmails.rateLimit

    const clientData = rateLimitStore.get(clientIp) || { count: 0, resetTime: now + limit.windowMs }

    // Reset if window expired
    if (now > clientData.resetTime) {
      clientData.count = 0
      clientData.resetTime = now + limit.windowMs
    }

    // Check limit
    if (clientData.count >= limit.maxRequests) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests: Rate limit exceeded',
      })
    }

    // Increment counter
    clientData.count++
    rateLimitStore.set(clientIp, clientData)
  }

  // Read the POST body as typed data. Type safety in JavaScript? What a time to be alive.
  const body = await readBody<Test1Data>(event)

  // Generate URL with encoded store data and server flag
  // We're encoding data into URL params then immediately fetching it back
  // Efficiency? Never heard of her.
  const params = encodeStoreToUrlParams(body)
  const separator = params ? '&' : '?' // Ternary operators: the spice of life
  const emailUrl = `/__emails/v1/test1${params}${separator}server=true`

  // Fetch the rendered email HTML
  // We're making an HTTP request to ourselves. This is fine. Everything is fine.
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fullUrl = `${baseUrl}${emailUrl}`

  try {
    // Fetch the HTML from our own server because apparently direct rendering is too mainstream
    const response = await fetch(fullUrl)
    const html = await response.text()

    // Store the email send data in context for potential middleware/hooks
    // Users can create a plugin to handle email sending
    event.context.nuxtGenEmails = {
      html,
      data: body,
    }

    return {
      success: true,
      message: 'Email rendered successfully', // "Successfully" is doing a lot of work here
      html, // Return the HTML because why not, we already have it
    }
  }
  catch (error: unknown) {
    // Error handling: where we pretend we know what went wrong
    // Check instanceof Error because JavaScript lets you throw ANYTHING. Strings, numbers, objects, your dignity.
    const message = error instanceof Error ? error.message : 'Failed to render or send email'
    throw createError({
      statusCode: 500, // The universal "something broke" code
      statusMessage: message,
    })
  }
})
