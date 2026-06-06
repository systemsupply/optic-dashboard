'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useSite } from '@/app/dashboard/components/SiteContext'

const nav = [
  { label: 'Overview',            href: '/dashboard' },
  { label: 'Conversations',       href: '/dashboard/conversations' },
  { label: 'Top Queries',         href: '/dashboard/top-queries' },
  { label: 'Content Performance', href: '/dashboard/content-performance' },
  { label: 'Dead Ends',           href: '/dashboard/dead-ends' },
  { label: 'Knowledge Base',      href: '/dashboard/knowledge' },
  { label: 'Locations',           href: '/dashboard/locations' },
  { label: 'Settings',            href: '/dashboard/settings' },
]

function siteName(site: { id: string; name: string | null }, index: number) {
  return site.name ?? `Site ${index + 1}`
}

export default function Sidebar() {
  const pathname = usePathname()
  const { sites, selectedSite, setSelectedSiteId } = useSite()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const selectedIndex = sites.findIndex(s => s.id === selectedSite?.id)

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: '#111111',
      borderRight: '1px solid #1E1E1E',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="#F1F1F1" strokeWidth="2"/>
          <circle cx="16" cy="16" r="6" stroke="#F1F1F1" strokeWidth="2"/>
          <circle cx="16" cy="16" r="2" fill="#F1F1F1"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#F1F1F1', letterSpacing: '-0.2px' }}>
          Optic
        </span>
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
              background: '#1A1A1A',
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
              background: '#1A1A1A',
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
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: site.id === selectedSite?.id ? '#4ade80' : '#414141', flexShrink: 0 }} />
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
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '7px 10px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? '#F1F1F1' : '#707070',
                background: active ? '#1E1E1E' : 'transparent',
                textDecoration: 'none',
                transition: 'color 0.1s, background 0.1s',
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
