'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const POLAR_ORIGINS = ['https://polar.sh', 'https://sandbox.polar.sh']

// Self-contained re-implementation of @polar-sh/checkout's embedded overlay.
// We avoid loading it from a CDN (cdn.jsdelivr.net is blocked on some
// networks, which silently broke the overlay and fell back to a full
// redirect). This opens the Polar checkout in a fixed-position iframe
// overlay and listens for postMessage events to know when it's loaded,
// closed, or completed.
function openPolarCheckoutOverlay(checkoutUrl: string, theme: 'light' | 'dark' = 'dark') {
  const style = document.createElement('style')
  style.innerText = `
    .polar-loader-spinner {
      width: 20px; aspect-ratio: 1; border-radius: 50%;
      background: ${theme === 'dark' ? '#000' : '#fff'};
      box-shadow: 0 0 0 0 ${theme === 'dark' ? '#fff' : '#000'};
      animation: polar-loader-spinner-animation 1s infinite;
    }
    @keyframes polar-loader-spinner-animation { 100% { box-shadow: 0 0 0 30px #0000 } }
    body.polar-no-scroll { overflow: hidden; }
  `
  document.head.appendChild(style)

  const loader = document.createElement('div')
  loader.style.position = 'absolute'
  loader.style.top = '50%'
  loader.style.left = '50%'
  loader.style.transform = 'translate(-50%, -50%)'
  loader.style.zIndex = '2147483647'
  const spinner = document.createElement('div')
  spinner.className = 'polar-loader-spinner'
  loader.appendChild(spinner)
  document.body.classList.add('polar-no-scroll')
  document.body.appendChild(loader)

  const u = new URL(checkoutUrl)
  u.searchParams.set('embed', 'true')
  u.searchParams.set('embed_origin', window.location.origin)
  u.searchParams.set('theme', theme)

  const iframe = document.createElement('iframe')
  iframe.src = u.toString()
  Object.assign(iframe.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    border: 'none',
    zIndex: '2147483647',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  })
  const allowOrigins = POLAR_ORIGINS.join(' ')
  iframe.allow = `payment 'self' ${allowOrigins}; publickey-credentials-get 'self' ${allowOrigins};`

  let loaded = false

  function cleanup() {
    window.removeEventListener('message', onMessage)
    document.body.classList.remove('polar-no-scroll')
    if (document.body.contains(iframe)) document.body.removeChild(iframe)
    if (document.body.contains(loader)) document.body.removeChild(loader)
    if (document.head.contains(style)) document.head.removeChild(style)
  }

  function onMessage(event: MessageEvent) {
    if (!POLAR_ORIGINS.includes(event.origin)) return
    const data = event.data
    if (!data || data.type !== 'POLAR_CHECKOUT') return
    switch (data.event) {
      case 'loaded':
        if (!loaded) {
          loaded = true
          if (document.body.contains(loader)) document.body.removeChild(loader)
        }
        break
      case 'close':
        cleanup()
        break
      case 'success':
        cleanup()
        if (data.redirect && data.successURL) {
          window.location.href = data.successURL
        }
        break
    }
  }

  window.addEventListener('message', onMessage)
  document.body.appendChild(iframe)
}

const PRODUCT_IDS: Record<string, string> = {
  pro: 'ce334a96-7bbe-4f88-9bc4-0c08384757a1',
  max: '6db25977-65ab-4e58-bd2e-fdc55e18bb86',
}

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: 'Free',
    period: '',
    description: 'Add the AI chat widget to your site.',
    features: [
      '1 site',
      'AI chat widget via plugin/component',
      'No dashboard access',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/mo',
    description: 'Full dashboard access for growing sites.',
    features: [
      'Up to 5 sites',
      'Dashboard access',
      'Conversations & insights',
      'Knowledge base',
    ],
  },
  {
    key: 'max',
    name: 'Max',
    price: '$49',
    period: '/mo',
    description: 'For agencies managing multiple sites.',
    features: [
      'Unlimited sites',
      'Dashboard access',
      'Conversations & insights',
      'Knowledge base',
      'Priority support',
    ],
  },
]

export default function PricingCards({ currentPlan }: { currentPlan?: string }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      setEmail(user?.email ?? null)
    })
  }, [])

  async function openCheckout(planKey: string) {
    if (loadingPlan) return
    setLoadingPlan(planKey)
    try {
      const productId = PRODUCT_IDS[planKey]
      const params = new URLSearchParams({ products: productId })
      if (userId) params.set('customerExternalId', userId)
      if (email) params.set('customerEmail', email)

      const res = await fetch(`/api/checkout?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to create checkout')
      const { url } = await res.json()

      if (!url) throw new Error('No checkout url returned')
      openPolarCheckoutOverlay(url, 'dark')
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Could not start checkout. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {PLANS.map(plan => {
        const isCurrent = currentPlan === plan.key
        return (
          <div
            key={plan.key}
            style={{
              background: '#131313',
              border: plan.key === 'pro' ? '1px solid #4ade80' : '1px solid #2A2A2A',
              borderRadius: 10,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <p style={{ fontSize: 16, fontWeight: 500, color: '#F1F1F1', marginBottom: 4 }}>{plan.name}</p>
              <p style={{ fontSize: 12, color: '#707070' }}>{plan.description}</p>
            </div>
            <div>
              <span style={{ fontSize: 28, fontWeight: 500, color: '#F1F1F1' }}>{plan.price}</span>
              <span style={{ fontSize: 14, color: '#707070' }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: 13, color: '#A0A0A0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2.5 8L6 11.5L12.5 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            {isCurrent ? (
              <div style={{
                padding: '9px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                border: '1px solid #2A2A2A', background: 'transparent', color: '#707070',
                textAlign: 'center',
              }}>
                Current plan
              </div>
            ) : plan.key === 'basic' ? (
              <div style={{
                padding: '9px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                border: '1px solid #2A2A2A', background: 'transparent', color: '#707070',
                textAlign: 'center',
              }}>
                Free
              </div>
            ) : (
              <button
                onClick={() => openCheckout(plan.key)}
                disabled={loadingPlan === plan.key}
                style={{
                  padding: '9px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', background: '#F1F1F1', color: '#131313',
                  textAlign: 'center', cursor: 'pointer',
                }}
              >
                {loadingPlan === plan.key ? 'Loading…' : 'Upgrade'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
