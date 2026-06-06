'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  async function deleteConversations() {
    const confirmed = confirm(
      'This will permanently delete all conversation data for your site. This cannot be undone. Continue?'
    )
    if (!confirmed) return

    setDeleting(true)

    // Get the current user's site_id via clients table
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) { setDeleting(false); return }

    const { data: client } = await supabase
      .from('clients')
      .select('site_id')
      .eq('user_id', userId)
      .single()

    if (client?.site_id) {
      await supabase
        .from('conversations')
        .delete()
        .eq('site_id', client.site_id)
    }

    setDeleting(false)
    setDeleted(true)
    setTimeout(() => setDeleted(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Settings</h1>

      {/* Account */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#F1F1F1' }}>Account</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2A2A2A' }}>
          <div>
            <p style={{ fontSize: 12, color: '#707070', marginBottom: 3 }}>Email</p>
            <p style={{ fontSize: 13, color: '#F1F1F1' }}>{email ?? '—'}</p>
          </div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: '#A0A0A0' }}>Sign out of your account.</p>
          </div>
          <button
            onClick={signOut}
            style={{
              padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: '1px solid #2A2A2A', background: 'transparent', color: '#A0A0A0',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: '#1A1A1A', border: '1px solid #3A1A1A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #3A1A1A' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#E75C5C' }}>Danger zone</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: '#F1F1F1', marginBottom: 3 }}>Delete all conversation data</p>
            <p style={{ fontSize: 12, color: '#707070' }}>Permanently removes all conversations logged for your site.</p>
          </div>
          <button
            onClick={deleteConversations}
            disabled={deleting || deleted}
            style={{
              padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: '1px solid #E75C5C', background: 'transparent',
              color: deleted ? '#4ade80' : deleting ? '#707070' : '#E75C5C',
              cursor: deleting || deleted ? 'not-allowed' : 'pointer',
              transition: 'all 0.1s', flexShrink: 0, marginLeft: 24,
            }}
          >
            {deleted ? 'Deleted' : deleting ? 'Deleting…' : 'Delete conversations'}
          </button>
        </div>
      </div>
    </div>
  )
}
