/**
 * Encode a data store object into URL search parameters
 */
export function encodeStoreToUrlParams(store: Record<string, unknown>): string {
  const params = new URLSearchParams()

  Object.entries(store).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      // Only include primitive types (string, number, boolean)
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        params.set(key, String(value))
      }
    }
  })

  const paramsString = params.toString()
  return paramsString ? `?${paramsString}` : ''
}

/**
 * Decode URL search parameters and update a reactive store
 */
export function decodeUrlParamsToStore(store: Record<string, unknown>): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)

  params.forEach((value, key) => {
    if (key in store) {
      const currentValue = store[key]

      // Type coercion based on the current store value type
      if (typeof currentValue === 'number') {
        const numValue = Number(value)
        if (!isNaN(numValue)) {
          store[key] = numValue
        }
      }
      else if (typeof currentValue === 'boolean') {
        store[key] = value === 'true'
      }
      else {
        store[key] = value
      }
    }
  })
}

/**
 * Generate a shareable URL for the current template with encoded data
 */
export function generateShareableUrl(store: Record<string, unknown>): string {
  if (typeof window === 'undefined') return ''

  const baseUrl = `${window.location.origin}${window.location.pathname}`
  const params = encodeStoreToUrlParams(store)

  return `${baseUrl}${params}`
}
