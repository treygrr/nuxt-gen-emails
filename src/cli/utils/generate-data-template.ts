import { capitalize } from './string-utils'

export function generateDataTemplate(emailName: string): string {
  const className = capitalize(emailName)
  
  return `import { reactive } from 'vue'

export interface ${className}Data {
  title: string
  message: string
}

export const ${emailName}Data = reactive<${className}Data>({
  title: 'Welcome!',
  message: 'This is the ${emailName} email template.',
})

export function update${className}Data(data: Partial<${className}Data>) {
  Object.assign(${emailName}Data, data)
}
`
}
