import { capitalize } from './string-utils'

export function generateApiRoute(emailName: string, emailPath: string): string {
  // Capitalize because TypeScript interfaces are fancy and deserve capital letters
  const className = capitalize(emailName)

  // Return a generated API route that handles POST requests
  // This is code generation inception: code that writes code that handles HTTP requests
  // My therapist says this is "normal" in web development. I don't believe them.
  return `import { defineEventHandler, readBody, createError } from 'h3'
import { encodeStoreToUrlParams, useRuntimeConfig } from '#imports'
import type { ${className}Data } from '~/emails/${emailPath}.data'

export default defineEventHandler(async (event) => {
  // Read the POST body as typed data. Type safety in JavaScript? What a time to be alive.
  const body = await readBody<${className}Data>(event)

  // Generate URL with encoded store data and server flag
  // We're encoding data into URL params then immediately fetching it back
  // Efficiency? Never heard of her.
  const params = encodeStoreToUrlParams(body)
  const separator = params ? '&' : '?'  // Ternary operators: the spice of life
  const emailUrl = \`/__emails/${emailPath}\${params}\${separator}server=true\`

  // Fetch the rendered email HTML
  // We're making an HTTP request to ourselves. This is fine. Everything is fine.
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fullUrl = \`\${baseUrl}\${emailUrl}\`

  try {
    // Fetch the HTML from our own server because apparently direct rendering is too mainstream
    const response = await fetch(fullUrl)
    const html = await response.text()

    // Call user-configured send handler if provided
    // This is where users can hook in their Resend/SendGrid/carrier pigeon integration
    const config = useRuntimeConfig()
    const sendHandler = config.nuxtGenEmails?.sendGeneratedHtml

    if (sendHandler) {
      // Call the handler and pray it doesn't throw. Spoiler: it will.
      await sendHandler({
        html,
        data: body,
        templatePath: '~/emails/${emailPath}.vue',
      })
    }

    return {
      success: true,
      message: 'Email rendered successfully',  // "Successfully" is doing a lot of work here
      html,  // Return the HTML because why not, we already have it
    }
  }
  catch (error: unknown) {
    // Error handling: where we pretend we know what went wrong
    // Check instanceof Error because JavaScript lets you throw ANYTHING. Strings, numbers, objects, your dignity.
    const message = error instanceof Error ? error.message : 'Failed to render or send email'
    throw createError({
      statusCode: 500,  // The universal "something broke" code
      statusMessage: message,
    })
  }
})
`
}
