import { NextRequest, NextResponse } from 'next/server'

// Creates a Polar checkout session configured for embedding, and returns
// the checkout URL so the client can open it in an inline overlay via
// PolarEmbedCheckout instead of redirecting away from the dashboard.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const products = searchParams.get('products')
  const customerExternalId = searchParams.get('customerExternalId') ?? undefined
  const customerEmail = searchParams.get('customerEmail') ?? undefined

  if (!products) {
    return NextResponse.json({ error: 'Missing products parameter' }, { status: 400 })
  }

  const res = await fetch('https://api.polar.sh/v1/checkouts/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      products: [products],
      customer_external_id: customerExternalId,
      customer_email: customerEmail,
      success_url: 'https://app.optic.sh/dashboard?upgraded=true',
      embed_origin: 'https://app.optic.sh',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: text }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ url: data.url })
}
