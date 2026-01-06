export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      nuxtGenEmails: {
        emailsDir: 'emails',
      },
    },
  },
  nuxtGenEmails: {
    sendEmailHtml: async (html: string, to: string, subject: string) => {
      console.log('Sending email to:', to)
      console.log('Subject:', subject)
      console.log('HTML content:', html)
      // Here you would integrate with your email sending service
    },
  },
})
