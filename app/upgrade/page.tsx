'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PricingCards from '@/components/PricingCards'

export default function UpgradePage() {
  const router = useRouter()
  const [plan, setPlan] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth')
        return
      }
      supabase
        .from('clients')
        .select('plan')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setPlan(data?.plan ?? 'basic')
          setLoading(false)
        })
    })
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0E0E0E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#707070', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0E0E0E', padding: '64px 24px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 500, color: '#F1F1F1', marginBottom: 8, letterSpacing: '-0.3px' }}>
            Upgrade your plan
          </h1>
          <p style={{ fontSize: 14, color: '#707070' }}>
            Choose the plan that fits your sites.
          </p>
        </div>
        <PricingCards currentPlan={plan} />
      </div>
    </div>
  )
}
