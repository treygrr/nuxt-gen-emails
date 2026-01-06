import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { join } from 'pathe'
import { existsSync } from 'node:fs'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  // Get the path after /nge/
  const emailPath = getRouterParam(event, '_')

  if (!emailPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email path is required',
    })
  }

  // Get the emails directory from runtime config
  const config = useRuntimeConfig()
  const emailsDir = config.nuxtGenEmails?.emailsDir as string

  if (!emailsDir) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Emails directory not configured',
    })
  }

  // Check if the email template exists (with .vue extension)
  const emailFile = join(emailsDir, `${emailPath}.vue`)

  if (!existsSync(emailFile)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Email template not found: ${emailPath}`,
    })
  }

  // Read the request body
  const body = await readBody(event)

  // Get the current request URL to build the fetch URL
  const requestUrl = event.node.req.headers.host
  const protocol = event.node.req.headers['x-forwarded-proto'] || 'http'
  const fetchUrl = `${protocol}://${requestUrl}/${emailPath}`

  try {
    // Make a POST request to the email path with the body
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Failed to render email: ${response.statusText}`,
      })
    }

    const result = await response.text()

    return {
      success: true,
      emailPath,
      html: result,
    }
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to process email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
})
