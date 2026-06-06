'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendCode() {
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
  }

  async function verifyCode() {
    if (!code) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111111',
    }}>
      <div style={{
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
      }}>
        {/* Logo */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="#F1F1F1" strokeWidth="2"/>
          <circle cx="16" cy="16" r="6" stroke="#F1F1F1" strokeWidth="2"/>
          <circle cx="16" cy="16" r="2" fill="#F1F1F1"/>
        </svg>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.4px' }}>
            {step === 'email' ? 'Sign in to Optic' : 'Check your email'}
          </h1>
          <p style={{ fontSize: 14, color: '#707070' }}>
            {step === 'email'
              ? 'Enter your email to receive a sign-in code.'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {step === 'email' ? (
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendCode()}
              style={{
                width: '100%',
                height: 42,
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                padding: '0 14px',
                color: '#F1F1F1',
                fontSize: 14,
                outline: 'none',
              }}
            />
          ) : (
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyCode()}
              maxLength={6}
              style={{
                width: '100%',
                height: 42,
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: 8,
                padding: '0 14px',
                color: '#F1F1F1',
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '0.2em',
                textAlign: 'center',
                outline: 'none',
              }}
            />
          )}

          {error && (
            <p style={{ fontSize: 12, color: '#E75C5C', textAlign: 'center' }}>{error}</p>
          )}

          <button
            onClick={step === 'email' ? sendCode : verifyCode}
            disabled={loading || (step === 'email' ? !email : code.length < 6)}
            style={{
              width: '100%',
              height: 42,
              background: loading || (step === 'email' ? !email : code.length < 6) ? '#202020' : '#F1F1F1',
              color: loading || (step === 'email' ? !email : code.length < 6) ? '#707070' : '#111111',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {loading ? 'Loading...' : step === 'email' ? 'Send code' : 'Sign in'}
          </button>

          {step === 'code' && (
            <button
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                color: '#707070',
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Use a different email
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
