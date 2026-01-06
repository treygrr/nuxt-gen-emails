export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}
