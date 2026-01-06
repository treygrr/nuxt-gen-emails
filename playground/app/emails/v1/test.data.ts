import { reactive } from 'vue'

export interface TestData {
  title: string
  message: string
}

export const testData = reactive<TestData>({
  title: 'Welcome!',
  message: 'This is the test email template.',
})

export function updateTestData(data: Partial<TestData>) {
  Object.assign(testData, data)
}
