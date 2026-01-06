import { capitalize } from './string-utils'

export function generateApiRoute(emailName: string, emailPath: string): string {
  const className = capitalize(emailName)

  return `import { defineEventHandler, readBody } from 'h3'
import { encodeStoreToUrlParams } from '#imports'
import type { ${className}Data } from '~/emails/${emailPath}.data'

export default defineEventHandler(async (event) => {
  const body = await readBody<${className}Data>(event)

  // Generate URL with encoded store data and server flag
  const params = encodeStoreToUrlParams(body)
  const separator = params ? '&' : '?'
  const emailUrl = \`/__emails/${emailPath}\${params}\${separator}server=true\`

  // Fetch the rendered email HTML
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fullUrl = \`\${baseUrl}\${emailUrl}\`

  try {
    const response = await fetch(fullUrl)
    const html = await response.text()

    // Call user-configured send handler if provided
    const config = useRuntimeConfig()
    const sendHandler = (config.nuxtGenEmails as any)?.sendGeneratedHtml

    if (sendHandler) {
      await sendHandler({
        html,
        data: body,
        templatePath: '${emailPath}',
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
`
}
