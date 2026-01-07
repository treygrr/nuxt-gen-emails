export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  app: {
    cdnURL: 'https://localhost:3000',
  },

  // Hook into email sending via Nitro hooks
  nitro: {
    hooks: {
      'nuxt-gen-emails:send': async ({ html, data }) => {
        console.log('📧 Sending email...')
        console.log('📊 Data:', data)
        console.log('📄 HTML length:', html.length, 'chars')
        // Here you would integrate with your email sending service (Resend, SendGrid, etc.)
      },
    },
  },
  nuxtGenEmails: {
    // Optional: Set custom email directory (default: 'emails')
    emailDir: 'emails',

    // Optional: Set API key for authentication (auto-generated if not provided)
    // apiKey: 'your-secret-key-here',

    // Optional: Disable API authentication (not recommended for production)
    apiKey: false,

    // Optional: Configure rate limiting
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    },
    // Or disable rate limiting
    // rateLimit: false,
  },
})
