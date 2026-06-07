'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSite, Site } from '../components/SiteContext'

const PLAN_LIMITS: Record<string, number> = { starter: 1, pro: 5, agency: Infinity }
const PLAN_LABELS: Record<string, string> = { starter: 'Starter', pro: 'Pro', agency: 'Agency' }
const PLAN_PRICES: Record<string, string> = { starter: '$19/mo', pro: '$49/mo', agency: '$99/mo' }

function daysLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function getSiteName(site: Site, index: number) {
  return site.name ?? `Site ${index + 1}`
}

export default function SettingsPage() {
  const router = useRouter()
  const { sites, selectedSite, setSelectedSiteId, refreshSites } = useSite()
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string>('starter')
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null)
  const [llmsCopied, setLlmsCopied] = useState(false)

  async function copyLlmsTxt() {
    if (!selectedSite) return
    try {
      const res = await fetch(`https://optic-api.vercel.app/api/llms?site_id=${selectedSite.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const text = await res.text()
      await navigator.clipboard.writeText(text)
      setLlmsCopied(true)
      setTimeout(() => setLlmsCopied(false), 3000)
    } catch {
      alert('Could not copy. Make sure your knowledge base has been scanned first.')
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
    supabase
      .from('clients')
      .select('plan, trial_ends_at')
      .single()
      .then(({ data }) => {
        if (data) {
          setPlan(data.plan ?? 'starter')
          setTrialEndsAt(data.trial_ends_at ?? null)
        }
      })
  }, [])

  useEffect(() => {
    if (selectedSite) setNameInput(selectedSite.name ?? '')
  }, [selectedSite])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  async function saveSiteName() {
    if (!selectedSite) return
    await supabase.from('sites').update({ name: nameInput || null }).eq('id', selectedSite.id)
    setEditingName(false)
    await refreshSites()
  }

  async function deleteConversations() {
    if (!selectedSite) return
    const idx = sites.findIndex(s => s.id === selectedSite.id)
    const confirmed = confirm(
      `This will permanently delete all conversation data for "${getSiteName(selectedSite, idx)}". This cannot be undone. Continue?`
    )
    if (!confirmed) return
    setDeleting(true)
    await supabase.from('conversations').delete().eq('site_id', selectedSite.id)
    setDeleting(false)
    setDeleted(true)
    setTimeout(() => setDeleted(false), 3000)
  }

  async function deleteSite(site: Site, idx: number) {
    const confirmed = confirm(
      `Remove "${getSiteName(site, idx)}"? This will permanently delete all its conversation data. This cannot be undone.`
    )
    if (!confirmed) return
    setDeletingSiteId(site.id)
    await supabase.from('conversations').delete().eq('site_id', site.id)
    await supabase.from('knowledge_entries').delete().eq('site_id', site.id)
    await supabase.from('sites').delete().eq('id', site.id)
    if (selectedSite?.id === site.id) {
      const remaining = sites.filter(s => s.id !== site.id)
      if (remaining.length > 0) setSelectedSiteId(remaining[0].id)
    }
    setDeletingSiteId(null)
    await refreshSites()
  }

  const limit = PLAN_LIMITS[plan] ?? 1
  const trialDays = trialEndsAt ? daysLeft(trialEndsAt) : null
  const inTrial = trialDays !== null && trialDays > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Settings</h1>

      {/* Plan */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#F1F1F1' }}>Plan</p>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2A2A2A' }}>
          <div>
            <p style={{ fontSize: 12, color: '#707070', marginBottom: 3 }}>Current plan</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 13, color: '#F1F1F1', fontWeight: 500 }}>{PLAN_LABELS[plan] ?? plan} — {PLAN_PRICES[plan] ?? ''}</p>
              {inTrial && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#1E3A2A', color: '#4ade80', fontWeight: 500 }}>
                  Trial — {trialDays}d left
                </span>
              )}
            </div>
          </div>
          <a
            href="https://app.optic.sh/upgrade"
            style={{
              padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: '1px solid #2A2A2A', background: 'transparent', color: '#A0A0A0',
              textDecoration: 'none',
            }}
          >
            Upgrade
          </a>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: '#707070', marginBottom: 3 }}>Sites</p>
          <p style={{ fontSize: 13, color: '#F1F1F1' }}>
            {sites.length} of {limit === Infinity ? 'unlimited' : limit} site{limit === 1 ? '' : 's'} used
          </p>
        </div>
      </div>

      {/* Sites */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#F1F1F1' }}>Sites</p>
        </div>
        {sites.map((site, i) => (
          <div key={site.id} style={{
            padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: i < sites.length - 1 ? '1px solid #2A2A2A' : 'none',
            background: site.id === selectedSite?.id ? '#1E1E1E' : 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: site.id === selectedSite?.id ? '#4ade80' : '#414141', flexShrink: 0 }} />
              {editingName && site.id === selectedSite?.id ? (
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveSiteName() }}
                  autoFocus
                  placeholder={`Site ${i + 1}`}
                  style={{
                    fontSize: 13, color: '#F1F1F1', background: '#111111',
                    border: '1px solid #414141', borderRadius: 4, padding: '3px 8px', outline: 'none', flex: 1,
                  }}
                />
              ) : (
                <span style={{ fontSize: 13, color: '#F1F1F1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getSiteName(site, i)}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
              {site.id !== selectedSite?.id && (
                <>
                  <button
                    onClick={() => setSelectedSiteId(site.id)}
                    style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid #2A2A2A', background: 'transparent', color: '#A0A0A0', cursor: 'pointer' }}
                  >
                    Select
                  </button>
                  <button
                    onClick={() => deleteSite(site, i)}
                    disabled={deletingSiteId === site.id}
                    style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid #3A1A1A', background: 'transparent', color: '#E75C5C', cursor: 'pointer' }}
                  >
                    {deletingSiteId === site.id ? 'Removing…' : 'Remove'}
                  </button>
                </>
              )}
              {site.id === selectedSite?.id && (
                editingName ? (
                  <>
                    <button onClick={saveSiteName} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid #4ade80', background: 'transparent', color: '#4ade80', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingName(false)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid #2A2A2A', background: 'transparent', color: '#707070', cursor: 'pointer' }}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingName(true)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid #2A2A2A', background: 'transparent', color: '#A0A0A0', cursor: 'pointer' }}>Rename</button>
                    <button
                      onClick={() => deleteSite(site, i)}
                      disabled={deletingSiteId === site.id}
                      style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, border: '1px solid #3A1A1A', background: 'transparent', color: '#E75C5C', cursor: 'pointer' }}
                    >
                      {deletingSiteId === site.id ? 'Removing…' : 'Remove'}
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        ))}
      </div>

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
          <p style={{ fontSize: 13, color: '#A0A0A0' }}>Sign out of your account.</p>
          <button
            onClick={signOut}
            style={{
              padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: '1px solid #2A2A2A', background: 'transparent', color: '#A0A0A0', cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* AI Discoverability */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#F1F1F1' }}>AI Discoverability</p>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: 13, color: '#F1F1F1', marginBottom: 6 }}>Make your site readable by AI</p>
          <p style={{ fontSize: 12, color: '#707070', marginBottom: 16, lineHeight: 1.6 }}>
            Optic has generated an <code style={{ background: '#2A2A2A', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>llms.txt</code> file for your site. Upload it to Framer to make your site instantly readable by AI agents like ChatGPT, Perplexity, and Claude — no crawling required.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={copyLlmsTxt}
              disabled={!selectedSite}
              style={{
                padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                border: '1px solid #2A2A2A', background: llmsCopied ? '#1E3A2A' : 'transparent',
                color: llmsCopied ? '#4ade80' : '#F1F1F1', cursor: selectedSite ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              {llmsCopied ? 'Copied!' : 'Copy llms.txt'}
            </button>
            <a
              href="https://www.framer.com/help/articles/llms-txt-framer/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#707070', textDecoration: 'underline' }}
            >
              How to upload in Framer →
            </a>
          </div>
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
            <p style={{ fontSize: 12, color: '#707070' }}>Permanently removes all conversations for the selected site.</p>
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
