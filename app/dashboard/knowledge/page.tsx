'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from '../components/SiteContext'

interface KnowledgeContent {
  name: string
  text: string
}

interface KnowledgeFile {
  site_name: string
  generated_at: string
  pages: { path: string }[]
  content: KnowledgeContent[]
  collections: string[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function KnowledgePage() {
  const { selectedSite } = useSite()
  const [knowledge, setKnowledge] = useState<KnowledgeFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => { if (selectedSite) fetchKnowledge() }, [selectedSite])

  async function fetchKnowledge() {
    if (!selectedSite) return
    setLoading(true)
    setError(null)

    const { data: { publicUrl } } = supabase.storage
      .from('knowledge')
      .getPublicUrl(`${selectedSite.id}/knowledge.json`)

    let knowledge: KnowledgeFile
    try {
      const res = await fetch(`${publicUrl}?t=${Date.now()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      knowledge = await res.json()
    } catch (e: any) {
      setError(`No knowledge file found. (${e.message}) — Run Analyse in the Optic plugin to generate one.`)
      setLoading(false)
      return
    }

    setKnowledge(knowledge)

    setLoading(false)
  }

  const filtered = knowledge?.content.filter(entry =>
    !search || entry.text.toLowerCase().includes(search.toLowerCase()) || entry.name.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Knowledge Base</h1>
          <p style={{ fontSize: 13, color: '#707070', marginTop: 4 }}>
            {knowledge ? `Last generated ${formatDate(knowledge.generated_at)}` : 'Content read by Optic from your site.'}
          </p>
        </div>
        {knowledge && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#F1F1F1' }}>{knowledge.pages.length}</div>
              <div style={{ fontSize: 11, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pages</div>
            </div>
            <div style={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 500, color: '#F1F1F1' }}>{knowledge.content.length}</div>
              <div style={{ fontSize: 11, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entries</div>
            </div>
            {knowledge.collections.length > 0 && (
              <div style={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: 8, padding: '8px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 500, color: '#F1F1F1' }}>{knowledge.collections.length}</div>
                <div style={{ fontSize: 11, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Collections</div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#707070', fontSize: 14 }}>Loading…</div>
      ) : error ? (
        <div style={{
          background: '#171717', border: '1px solid #2A2A2A', borderRadius: 10,
          padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <p style={{ color: '#F1F1F1', fontSize: 14, fontWeight: 500 }}>No knowledge base yet.</p>
          <p style={{ color: '#707070', fontSize: 13 }}>{error}</p>
        </div>
      ) : knowledge && (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries…"
            style={{
              background: '#171717', border: '1px solid #2A2A2A', borderRadius: 8,
              padding: '10px 16px', fontSize: 13, color: '#F1F1F1', outline: 'none', width: '100%',
            }}
          />

          <div style={{ background: '#171717', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: '10px 20px', borderBottom: '1px solid #2A2A2A' }}>
              {['Source', 'Content'].map(h => (
                <span key={h} style={{ fontSize: 11, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#707070', fontSize: 13 }}>No entries match your search.</div>
            ) : filtered.map((entry, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '160px 1fr',
                padding: '12px 20px', alignItems: 'start',
                borderBottom: i < filtered.length - 1 ? '1px solid #1E1E1E' : 'none',
              }}>
                <span style={{ fontSize: 12, color: '#707070', paddingRight: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.name}
                </span>
                <span style={{ fontSize: 13, color: '#A0A0A0', lineHeight: 1.5 }}>
                  {entry.text}
                </span>
              </div>
            ))}
          </div>

          {filtered.length > 0 && (
            <p style={{ fontSize: 12, color: '#3A3A3A' }}>
              {filtered.length} of {knowledge.content.length} entries
            </p>
          )}
        </>
      )}
    </div>
  )
}
