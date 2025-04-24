// eslint-disable-next-line @typescript-eslint/no-unused-vars
/* eslint-disable @typescript-eslint/no-unused-vars */
// convex/auth.config.ts

export default {
    providers: [
      {
        // This domain is specific to your Clerk instance
        // Found under "API Keys" > "Advanced" > "JWKS URL"
        // or in your .env file as VITE_CLERK_PUBLISHABLE_KEY after pk_test_
        domain: "https://fluent-yeti-6.clerk.accounts.dev",
        applicationID: "convex",
      },
    ]
  };