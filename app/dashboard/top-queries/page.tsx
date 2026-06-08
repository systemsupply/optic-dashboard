'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from '../components/SiteContext'

interface QueryStat {
  query: string
  count: number
  foundCount: number
  rate: number
}

export default function TopQueriesPage() {
  const { selectedSite } = useSite()
  const [rows, setRows] = useState<QueryStat[]>([])
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
      .select('messages')
      .eq('site_id', selectedSite.id)
      .gte('created_at', since.toISOString())

    if (!data) { setLoading(false); return }

    const map: Record<string, { count: number; found: number }> = {}
    data.forEach(row => {
      const msgs: { query: string; had_results: boolean }[] = row.messages ?? []
      msgs.forEach(msg => {
        const q = msg.query?.toLowerCase().trim()
        if (!q) return
        if (!map[q]) map[q] = { count: 0, found: 0 }
        map[q].count++
        if (msg.had_results) map[q].found++
      })
    })

    const sorted = Object.entries(map)
      .map(([query, { count, found }]) => ({
        query,
        count,
        foundCount: found,
        rate: Math.round((found / count) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50)

    setRows(sorted)
    setLoading(false)
  }

  const maxCount = rows[0]?.count ?? 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Top Queries</h1>
        <div style={{ display: 'flex', gap: 4, background: '#131313', border: '1px solid #2A2A2A', borderRadius: 8, padding: 3 }}>
          {([7, 30] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 14, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: range === r ? '#2A2A2A' : 'transparent',
              color: range === r ? '#F1F1F1' : '#707070',
            }}>{r}d</button>
          ))}
        </div>
      </div>

      <div style={{ background: '#131313', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', padding: '10px 20px', borderBottom: '1px solid #2A2A2A' }}>
          {['Query', 'Count', 'Found'].map(h => (
            <span key={h} style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: h !== 'Query' ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#707070', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#707070', fontSize: 14 }}>No queries yet in this period.</div>
        ) : rows.map((row, i) => (
          <div key={row.query} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 80px',
            padding: '11px 20px', alignItems: 'center',
            borderBottom: i < rows.length - 1 ? '1px solid #2A2A2A' : 'none',
            position: 'relative',
          }}>
            {/* Frequency bar */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${(row.count / maxCount) * 60}%`,
              background: '#4ade8008',
            }} />
            <span style={{ fontSize: 16, color: '#F1F1F1', position: 'relative', paddingRight: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.query}
            </span>
            <span style={{ fontSize: 14, color: '#A0A0A0', textAlign: 'right', position: 'relative' }}>{row.count}</span>
            <span style={{
              fontSize: 12, fontWeight: 500, textAlign: 'right', position: 'relative',
              color: row.rate >= 70 ? '#4ade80' : row.rate >= 40 ? '#facc15' : '#E75C5C',
            }}>
              {row.rate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
