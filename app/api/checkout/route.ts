import { Checkout } from '@polar-sh/nextjs'

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: 'https://app.optic.sh/dashboard?upgraded=true',
  server: 'production',
  theme: 'dark',
})
