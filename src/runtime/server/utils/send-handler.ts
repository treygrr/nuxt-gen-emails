import { useRuntimeConfig } from '#imports'

/**
 * Get the user-configured send handler from module options
 */
export function getSendHandler() {
  const config = useRuntimeConfig()
  const moduleOptions = config.nuxtGenEmails as any
  
  return moduleOptions?.sendGeneratedHtml as ((params: {
    html: string
    data: Record<string, unknown>
    templatePath: string
  }) => void | Promise<void>) | undefined
}
