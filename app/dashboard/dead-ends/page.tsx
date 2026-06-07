'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from '../components/SiteContext'

interface DeadEnd {
  query: string
  count: number
  lastSeen: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function DeadEndsPage() {
  const { selectedSite } = useSite()
  const [rows, setRows] = useState<DeadEnd[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<7 | 30>(30)

  useEffect(() => { if (selectedSite) fetchData() }, [range, selectedSite])

  async function fetchData() {
    if (!selectedSite) return
    setLoading(true)

    const since = new Date()
    since.setDate(since.getDate() - range)

    const { data } = await supabase
      .from('conversations')
      .select('visitor_query, created_at')
      .eq('site_id', selectedSite.id)
      .eq('had_results', false)
      .gte('created_at', since.toISOString())
      .not('visitor_query', 'is', null)

    if (!data) { setLoading(false); return }

    const map: Record<string, { count: number; lastSeen: string }> = {}
    data.forEach(row => {
      const q = row.visitor_query?.toLowerCase().trim()
      if (!q) return
      if (!map[q]) map[q] = { count: 0, lastSeen: row.created_at }
      map[q].count++
      if (row.created_at > map[q].lastSeen) map[q].lastSeen = row.created_at
    })

    const sorted = Object.entries(map)
      .map(([query, { count, lastSeen }]) => ({ query, count, lastSeen }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    setRows(sorted)
    setLoading(false)
  }

  const maxCount = rows[0]?.count ?? 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Dead Ends</h1>
          <p style={{ fontSize: 13, color: '#707070' }}>Queries where Optic found no matching content.</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#171717', border: '1px solid #2A2A2A', borderRadius: 8, padding: 3 }}>
          {([7, 30] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: range === r ? '#2A2A2A' : 'transparent',
              color: range === r ? '#F1F1F1' : '#707070',
            }}>{r}d</button>
          ))}
        </div>
      </div>

      <div style={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', padding: '10px 20px', borderBottom: '1px solid #2A2A2A' }}>
          {['Query', 'Times', 'Last seen'].map(h => (
            <span key={h} style={{ fontSize: 11, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h !== 'Query' ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#707070', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#4ade80', fontSize: 14, fontWeight: 500 }}>No dead ends in this period.</p>
            <p style={{ color: '#707070', fontSize: 13, marginTop: 6 }}>Optic found results for every query.</p>
          </div>
        ) : rows.map((row, i) => (
          <div key={row.query} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 120px',
            padding: '11px 20px', alignItems: 'center',
            borderBottom: i < rows.length - 1 ? '1px solid #1E1E1E' : 'none',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${(row.count / maxCount) * 60}%`,
              background: '#E75C5C08',
            }} />
            <span style={{ fontSize: 13, color: '#F1F1F1', position: 'relative', paddingRight: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.query}
            </span>
            <span style={{ fontSize: 13, color: '#E75C5C', textAlign: 'right', position: 'relative', fontWeight: 500 }}>
              {row.count}×
            </span>
            <span style={{ fontSize: 13, color: '#707070', textAlign: 'right', position: 'relative' }}>
              {timeAgo(row.lastSeen)}
            </span>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <p style={{ fontSize: 12, color: '#707070' }}>
          Add content to your Knowledge Base to resolve these queries.
        </p>
      )}
    </div>
  )
}
