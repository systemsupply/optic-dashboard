'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from '../components/SiteContext'

interface KnowledgeEntry {
  id: string
  title: string | null
  content: string | null
  type: string | null
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  text:    { bg: '#1E3A2A', color: '#4ade80' },
  faq:     { bg: '#1E2A3A', color: '#60a5fa' },
  product: { bg: '#2A1E3A', color: '#c084fc' },
  page:    { bg: '#3A2A1E', color: '#fb923c' },
}

function TypeBadge({ type }: { type: string | null }) {
  const t = type ?? 'text'
  const style = TYPE_COLORS[t] ?? { bg: '#2A2A2A', color: '#A0A0A0' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
      background: style.bg, color: style.color,
    }}>
      {t}
    </span>
  )
}

export default function KnowledgePage() {
  const { selectedSite } = useSite()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { if (selectedSite) fetchEntries() }, [selectedSite])

  async function fetchEntries() {
    if (!selectedSite) return
    setLoading(true)
    const { data } = await supabase
      .from('knowledge_entries')
      .select('id, title, content, type, created_at')
      .eq('site_id', selectedSite.id)
      .order('created_at', { ascending: false })
    setEntries(data ?? [])
    setLoading(false)
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this knowledge entry?')) return
    setDeleting(id)
    await supabase.from('knowledge_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Knowledge Base</h1>
          <p style={{ fontSize: 13, color: '#707070', marginTop: 4 }}>
            Content added via the Optic plugin. {entries.length > 0 && `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}.`}
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#707070', fontSize: 14 }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{
          background: '#171717', border: '1px solid #2A2A2A', borderRadius: 10,
          padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <p style={{ color: '#F1F1F1', fontSize: 14, fontWeight: 500 }}>No knowledge entries yet.</p>
          <p style={{ color: '#707070', fontSize: 13 }}>Add content from the Optic plugin in Framer.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(entry => (
            <div key={entry.id} style={{
              background: '#171717', border: '1px solid #2A2A2A', borderRadius: 10,
              padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <TypeBadge type={entry.type} />
                  <span style={{ fontSize: 12, color: '#707070' }}>{formatDate(entry.created_at)}</span>
                </div>
                {entry.title && (
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#F1F1F1', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.title}
                  </p>
                )}
                {entry.content && (
                  <p style={{ fontSize: 13, color: '#707070', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {entry.content}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                disabled={deleting === entry.id}
                style={{
                  background: 'transparent', border: '1px solid #2A2A2A', borderRadius: 6,
                  padding: '5px 12px', fontSize: 12, color: deleting === entry.id ? '#3A3A3A' : '#E75C5C',
                  cursor: deleting === entry.id ? 'not-allowed' : 'pointer', flexShrink: 0,
                  transition: 'border-color 0.1s',
                }}
              >
                {deleting === entry.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
