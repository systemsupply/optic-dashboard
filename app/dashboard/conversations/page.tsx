'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from '../components/SiteContext'

interface Message {
  query: string
  response: any
  had_results: boolean
  timestamp: string
}

interface Conversation {
  id: string
  messages: Message[]
  message_count: number
  had_results: boolean
  country: string | null
  city: string | null
  created_at: string
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ConversationsPage() {
  const { selectedSite } = useSite()
  const [rows, setRows] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<'all' | 'found' | 'none'>('all')
  const PAGE_SIZE = 25

  useEffect(() => { setPage(0) }, [filter, selectedSite])
  useEffect(() => { if (selectedSite) fetchRows() }, [page, filter, selectedSite])

  async function fetchRows() {
    if (!selectedSite) return
    setLoading(true)
    let query = supabase
      .from('conversations')
      .select('id, messages, message_count, had_results, country, city, created_at', { count: 'exact' })
      .eq('site_id', selectedSite.id)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filter === 'found') query = query.eq('had_results', true)
    if (filter === 'none') query = query.eq('had_results', false)

    const { data, count } = await query
    setRows((data ?? []) as Conversation[])
    setTotal(count ?? 0)
    setLoading(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Conversations</h1>
        <div style={{ display: 'flex', gap: 4, background: '#171717', border: '1px solid #2A2A2A', borderRadius: 8, padding: 3 }}>
          {(['all', 'found', 'none'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: filter === f ? '#2A2A2A' : 'transparent',
                color: filter === f ? '#F1F1F1' : '#707070',
              }}
            >
              {f === 'all' ? 'All' : f === 'found' ? 'Results found' : 'Dead ends'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px', padding: '10px 20px', borderBottom: '1px solid #2A2A2A' }}>
          {['First query', 'Time', 'Location', 'Result'].map(h => (
            <span key={h} style={{ fontSize: 11, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#707070', fontSize: 14 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#707070', fontSize: 14 }}>No conversations yet.</div>
        ) : rows.map((row, i) => {
          const firstQuery = row.messages?.[0]?.query ?? '—'
          const msgCount = row.message_count ?? row.messages?.length ?? 1
          const isExpanded = expanded === row.id

          return (
            <div key={row.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid #1E1E1E' : 'none' }}>
              {/* Row */}
              <div
                onClick={() => setExpanded(isExpanded ? null : row.id)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px',
                  padding: '12px 20px', alignItems: 'center', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: '#F1F1F1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {firstQuery}
                  </span>
                  {msgCount > 1 && (
                    <span style={{ fontSize: 11, color: '#707070', background: '#2A2A2A', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                      {msgCount} messages
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: '#707070' }}>{timeAgo(row.created_at)}</span>
                <span style={{ fontSize: 13, color: '#A0A0A0' }}>
                  {row.city ?? row.country ?? '—'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: row.had_results ? '#4ade80' : '#E75C5C', fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.had_results ? '#4ade80' : '#E75C5C', flexShrink: 0 }} />
                  {row.had_results ? 'Found' : 'None'}
                </span>
              </div>

              {/* Expanded thread */}
              {isExpanded && row.messages?.length > 0 && (
                <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {row.messages.map((msg, mi) => (
                    <div key={mi} style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 12, borderLeft: '2px solid #2A2A2A' }}>
                      <span style={{ fontSize: 12, color: '#F1F1F1', fontWeight: 500 }}>{msg.query}</span>
                      <span style={{ fontSize: 12, color: '#707070' }}>
                        {msg.response?.type === 'text'
                          ? msg.response.answer
                          : msg.response?.intro ?? msg.response?.type ?? '—'}
                      </span>
                      <span style={{ fontSize: 11, color: msg.had_results ? '#4ade80' : '#E75C5C' }}>
                        {msg.had_results ? 'Results found' : 'No results'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#707070' }}>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, border: '1px solid #2A2A2A', background: '#171717', color: page === 0 ? '#3A3A3A' : '#A0A0A0', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              style={{ padding: '6px 14px', borderRadius: 6, fontSize: 13, border: '1px solid #2A2A2A', background: '#171717', color: page >= totalPages - 1 ? '#3A3A3A' : '#A0A0A0', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
