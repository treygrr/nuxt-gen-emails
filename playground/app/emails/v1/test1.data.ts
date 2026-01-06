import { reactive } from 'vue'

export interface Test1Data extends Record<string, unknown> {
  title: string
  message: string
}

export const test1Data = reactive<Test1Data>({
  title: 'Welcome!',
  message: 'This is the test1 email template.',
})

export function updateTest1Data(data: Partial<Test1Data>) {
  Object.assign(test1Data, data)
}
