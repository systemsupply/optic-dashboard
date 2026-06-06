'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Conversations', href: '/dashboard/conversations' },
  { label: 'Top Queries', href: '/dashboard/top-queries' },
  { label: 'Content Performance', href: '/dashboard/content-performance' },
  { label: 'Dead Ends', href: '/dashboard/dead-ends' },
  { label: 'Knowledge Base', href: '/dashboard/knowledge' },
  { label: 'Locations', href: '/dashboard/locations' },
  { label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

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
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="#F1F1F1" strokeWidth="2"/>
          <circle cx="16" cy="16" r="6" stroke="#F1F1F1" strokeWidth="2"/>
          <circle cx="16" cy="16" r="2" fill="#F1F1F1"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#F1F1F1', letterSpacing: '-0.2px' }}>
          Optic
        </span>
      </div>

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
