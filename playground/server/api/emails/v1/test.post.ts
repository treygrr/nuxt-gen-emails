import { defineEventHandler, readBody } from 'h3'
import { encodeStoreToUrlParams } from '#imports'
import type { TestData } from '~/emails/v1/test.data'

export default defineEventHandler(async (event) => {
  const body = await readBody<TestData>(event)

  // Generate URL with encoded store data
  const params = encodeStoreToUrlParams(body)
  const emailUrl = `/__emails/v1/test${params}`

  // Fetch the rendered email HTML
  const baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fullUrl = `${baseUrl}${emailUrl}`

  const response = await fetch(fullUrl)
  const html = await response.text()

  // TODO: Implement your email sending logic here
  // Example:
  // await sendEmail({
  //   to: body.email,
  //   subject: body.title,
  //   html,
  // })

  return {
    success: true,
    message: 'Email rendered successfully',
    html, // Return the rendered HTML for preview/testing
  }
})
