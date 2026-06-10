'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { supabase } from '@/lib/supabase'

declare global {
  interface Window {
    PolarEmbedCheckout?: {
      create: (url: string, options: { theme?: string }) => Promise<unknown>
    }
  }
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

      if (window.PolarEmbedCheckout && url) {
        await window.PolarEmbedCheckout.create(url, { theme: 'dark' })
      } else if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Could not start checkout. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <>
    <Script
      src="https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0.3.0/dist/embed.global.js"
      strategy="afterInteractive"
    />
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
                  textAlign: 'center', cursor: loadingPlan === plan.key ? 'not-allowed' : 'pointer',
                }}
              >
                {loadingPlan === plan.key ? 'Loading…' : 'Upgrade'}
              </button>
            )}
          </div>
        )
      })}
    </div>
    </>
  )
}
