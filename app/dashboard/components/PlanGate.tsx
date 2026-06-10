'use client'

import { useEffect, useState, ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import PricingCards from '@/components/PricingCards'
import { supabase } from '@/lib/supabase'

export default function PlanGate({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
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
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0E0E0E', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#707070', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  if (plan === 'basic') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0E0E0E' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '64px 48px', overflowY: 'scroll', height: '100vh' }}>
          <div style={{ maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 28, fontWeight: 500, color: '#F1F1F1', marginBottom: 8, letterSpacing: '-0.3px' }}>
                Upgrade to access your dashboard
              </h1>
              <p style={{ fontSize: 14, color: '#707070' }}>
                Your AI chat widget is live. Upgrade to view conversations, insights, and more.
              </p>
            </div>
            <PricingCards currentPlan={plan} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0E0E0E' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px 48px', overflowY: 'scroll', height: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
