'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSite } from '@/app/dashboard/components/SiteContext'
import { supabase } from '@/lib/supabase'

const nav = [
  {
    label: 'Overview', href: '/dashboard',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
  },
  {
    label: 'Conversations', href: '/dashboard/conversations',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2.5C2 1.67 2.67 1 3.5 1h8c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H5l-3 2.5V2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  },
  {
    label: 'Top Queries', href: '/dashboard/top-queries',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: 'Content Performance', href: '/dashboard/content-performance',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 11l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    label: 'Dead Ends', href: '/dashboard/dead-ends',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L13 13H2L7.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7.5 6v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7.5" cy="10.5" r="0.75" fill="currentColor"/></svg>,
  },
  {
    label: 'Knowledge Base', href: '/dashboard/knowledge',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h5M5 8h5M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    label: 'Settings', href: '/dashboard/settings',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  },
]

function siteName(site: { id: string; name: string | null }, index: number) {
  return site.name ?? `Site ${index + 1}`
}

export default function Sidebar() {
  const pathname = usePathname()
  const { sites, selectedSite, setSelectedSiteId } = useSite()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportClosing, setSupportClosing] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function closeSupport() {
    setSupportClosing(true)
    setTimeout(() => {
      setSupportOpen(false)
      setSupportClosing(false)
    }, 320)
  }

  async function sendSupport() {
    if (!message.trim()) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userEmail: user?.email }),
      })
      if (!res.ok) throw new Error('Failed')
      setSent(true)
      setTimeout(() => {
        setSent(false)
        setMessage('')
        closeSupport()
      }, 1500)
    } catch {
      // silently fail for now — could add error state later
    } finally {
      setSending(false)
    }
  }

  const selectedIndex = sites.findIndex(s => s.id === selectedSite?.id)

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: '#0E0E0E',
      borderRight: '1px solid #2A2A2A',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 24px' }}>
        <svg width="28" height="28" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M40 0C62.0914 0 80 17.9086 80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0ZM21.3333 9.33333C14.7059 9.33333 9.33333 14.7059 9.33333 21.3333V58.6667C9.33333 65.2941 14.7059 70.6667 21.3333 70.6667H58.6667C65.2941 70.6667 70.6667 65.2941 70.6667 58.6667V21.3333C70.6667 14.7059 65.2941 9.33333 58.6667 9.33333H21.3333Z" fill="#F1F1F1"/>
        </svg>
      </div>

      {/* Site switcher */}
      {sites.length > 0 && (
        <div style={{ padding: '0 12px 20px', position: 'relative' }}>
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 6,
              background: '#131313',
              border: '1px solid #2A2A2A',
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#F1F1F1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedSite ? siteName(selectedSite, selectedIndex) : '—'}
              </span>
            </div>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="#707070" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {switcherOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 12,
              right: 12,
              background: '#131313',
              border: '1px solid #2A2A2A',
              borderRadius: 8,
              overflow: 'hidden',
              zIndex: 50,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {sites.map((site, i) => (
                <button
                  key={site.id}
                  onClick={() => { setSelectedSiteId(site.id); setSwitcherOpen(false) }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    background: site.id === selectedSite?.id ? '#2A2A2A' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: i < sites.length - 1 ? '1px solid #222' : 'none',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: site.id === selectedSite?.id ? '#4ade80' : '#404040', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#F1F1F1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {siteName(site, i)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 16px' }}>
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '7px 10px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                color: active ? '#F1F1F1' : '#606060',
                background: active ? '#131313' : 'transparent',
                textDecoration: 'none',
                transition: 'color 0.1s, background 0.1s',
              }}
            >
              <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div style={{ marginTop: 'auto', padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button
          onClick={() => setSupportOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
            borderRadius: 6, fontSize: 14, fontWeight: 400, color: '#606060',
            background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
          }}
        >
          <span style={{ flexShrink: 0, display: 'flex' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2.5C2 1.67 2.67 1 3.5 1h8c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H5l-3 2.5V2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7.5 4.5a1.25 1.25 0 1 1 0 2.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7.5" cy="9.5" r="0.65" fill="currentColor"/></svg>
          </span>
          Support
        </button>
        <a
          href="https://optic.sh/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
            borderRadius: 6, fontSize: 14, fontWeight: 400, color: '#606060',
            textDecoration: 'none',
          }}
        >
          <span style={{ flexShrink: 0, display: 'flex' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h5M5 8h5M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </span>
          Documentation
        </a>
      </div>

      {/* Support slide-in panel */}
      {supportOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeSupport}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 100,
              animation: `${supportClosing ? 'fadeOut' : 'fadeIn'} 0.35s cubic-bezier(0.4,0,0.2,1) forwards`,
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
            background: '#131313', borderLeft: '1px solid #2A2A2A',
            zIndex: 101, display: 'flex', flexDirection: 'column',
            animation: `${supportClosing ? 'slideOut' : 'slideIn'} 0.35s cubic-bezier(0.4,0,0.2,1) forwards`,
          }}>
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
              @keyframes slideOut { from { transform: translateX(0) } to { transform: translateX(100%) } }
              @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
              @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
            `}</style>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#F1F1F1' }}>Support</h2>
              <button
                onClick={closeSupport}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#606060', display: 'flex' }}
              >
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M2 2l11 11M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <p style={{ fontSize: 14, color: '#707070', lineHeight: 1.6 }}>
                Describe your issue or question and we'll get back to you at your account email.
              </p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What can we help you with?"
                rows={8}
                style={{
                  background: '#131313', border: '1px solid #2A2A2A', borderRadius: 8,
                  padding: '12px 16px', fontSize: 14, color: '#F1F1F1', outline: 'none',
                  resize: 'none', lineHeight: 1.6, fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #2A2A2A', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={closeSupport}
                style={{
                  padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: '1px solid #2A2A2A', background: 'transparent', color: '#A0A0A0', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendSupport}
                disabled={!message.trim() || sending || sent}
                style={{
                  padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: 'none', background: sent ? '#1E3A2A' : '#F1F1F1',
                  color: sent ? '#4ade80' : '#131313', cursor: message.trim() ? 'pointer' : 'not-allowed',
                  opacity: !message.trim() ? 0.4 : 1,
                }}
              >
                {sent ? 'Sent!' : sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
