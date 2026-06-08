'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from './components/SiteContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function getProjectionConfig(
  markers: { lat: number; lng: number }[],
  containerWidth: number
): { scale: number; center: [number, number] } {
  if (markers.length === 0) return { scale: 120, center: [0, 10] }

  const lngs = markers.map(m => m.lng)
  const lats = markers.map(m => m.lat)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)

  const centerLng = (minLng + maxLng) / 2
  const centerLat = (minLat + maxLat) / 2

  // Minimum span so a single country still shows regional context
  const lngSpan = Math.max(maxLng - minLng + 20, 50)
  const latSpan = Math.max(maxLat - minLat + 15, 35)

  // d3 Mercator: scale = pixels per radian at the projection centre
  const scaleFromLng = containerWidth / (lngSpan * Math.PI / 180)
  const scaleFromLat = 300 / (latSpan * Math.PI / 180)
  const scale = Math.min(Math.max(Math.min(scaleFromLng, scaleFromLat), 80), 1200)

  return { scale, center: [centerLng, centerLat] }
}

interface StatsData {
  totalConversations: number
  hadResultsRate: number
  deadEnds: number
}

interface ChartPoint {
  date: string
  count: number
}

interface LocationMarker {
  lat: number
  lng: number
  city: string | null
  country: string | null
}

interface CountryStat {
  country: string
  count: number
}

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div style={{
    background: '#131313',
    border: '1px solid #2A2A2A',
    borderRadius: 10,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }}>
    <span style={{ fontSize: 12, color: '#707070', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{label}</span>
    <span style={{ fontSize: 56, fontWeight: 600, color: '#F1F1F1', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: '#707070' }}>{sub}</span>}
  </div>
)

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#131313', border: '1px solid #2A2A2A', borderRadius: 6, padding: '8px 12px' }}>
        <p style={{ color: '#707070', fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#F1F1F1', fontSize: 14, fontWeight: 500 }}>{payload[0].value} conversations</p>
      </div>
    )
  }
  return null
}

export default function OverviewPage() {
  const { selectedSite, loading: siteLoading } = useSite()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [markers, setMarkers] = useState<LocationMarker[]>([])
  const [countries, setCountries] = useState<CountryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<7 | 30>(30)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapWidth, setMapWidth] = useState(700)

  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setMapWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (selectedSite) {
      fetchData()
    } else if (!siteLoading) {
      setLoading(false)
    }
  }, [range, selectedSite, siteLoading])

  async function fetchData() {
    if (!selectedSite) return
    setLoading(true)

    const since = new Date()
    since.setDate(since.getDate() - range)
    const sinceIso = since.toISOString()

    const { data: convs } = await supabase
      .from('conversations')
      .select('id, had_results, messages, country, created_at')
      .eq('site_id', selectedSite.id)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })

    if (!convs) { setLoading(false); return }

    const total = convs.length

    // Count individual messages across all conversations
    const allMessages = convs.flatMap(c => c.messages ?? [])
    const totalMessages = allMessages.length
    const foundMessages = allMessages.filter((m: any) => m.had_results).length
    const rate = totalMessages > 0 ? Math.round((foundMessages / totalMessages) * 100) : 0
    const deadEnds = allMessages.filter((m: any) => !m.had_results).length

    setStats({ totalConversations: total, hadResultsRate: rate, deadEnds })

    // Chart — group by day
    const dayMap: Record<string, number> = {}
    for (let i = 0; i < range; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (range - 1 - i))
      dayMap[d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })] = 0
    }
    convs.forEach(c => {
      const key = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      if (dayMap[key] !== undefined) dayMap[key]++
    })
    setChartData(Object.entries(dayMap).map(([date, count]) => ({ date, count })))

    // Location data — all time
    const { data: locData } = await supabase
      .from('conversations')
      .select('country, city, latitude, longitude')
      .eq('site_id', selectedSite.id)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    const locRows = locData ?? []
    setMarkers(locRows.map(r => ({ lat: r.latitude!, lng: r.longitude!, city: r.city, country: r.country })))

    const locCountryCounts: Record<string, number> = {}
    locRows.forEach(r => {
      if (r.country) locCountryCounts[r.country] = (locCountryCounts[r.country] || 0) + 1
    })
    setCountries(
      Object.entries(locCountryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
    )

    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Overview</h1>
        <div style={{ display: 'flex', gap: 4, background: '#131313', border: '1px solid #2A2A2A', borderRadius: 8, padding: 3 }}>
          {([7, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: range === r ? '#2A2A2A' : 'transparent',
                color: range === r ? '#F1F1F1' : '#707070',
                transition: 'all 0.1s',
              }}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#707070', fontSize: 14 }}>Loading…</div>
      ) : !selectedSite ? (
        <div style={{
          background: '#131313', border: '1px solid #2A2A2A', borderRadius: 10,
          padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <p style={{ color: '#F1F1F1', fontSize: 14, fontWeight: 500 }}>No sites connected yet.</p>
          <p style={{ color: '#707070', fontSize: 14 }}>Install the Optic plugin in Framer to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>

          {/* Row 1 — stat cards */}
          <StatCard label="Conversations" value={stats?.totalConversations.toLocaleString() ?? '0'} sub={`Last ${range} days`} />
          <StatCard label="Results found" value={`${stats?.hadResultsRate ?? 0}%`} sub="Had matching content" />
          <StatCard label="Dead ends" value={stats?.deadEnds.toLocaleString() ?? '0'} sub="No results returned" />

          {/* Row 2 — chart, full width */}
          <div style={{
            gridColumn: 'span 3',
            background: '#131313',
            border: '1px solid #2A2A2A',
            borderRadius: 10,
            padding: '24px 24px 16px',
          }}>
            <p style={{ fontSize: 12, color: '#707070', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Conversation volume
            </p>
            {chartData.length === 0 || chartData.every(d => d.count === 0) ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#707070', fontSize: 14 }}>
                No conversations yet in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 0, right: 24, bottom: 10, left: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: '#707070', fontSize: 12 }} axisLine={false} tickLine={false} interval={range === 7 ? 0 : 4} tickMargin={10} />
                  <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax, 4)]} tickCount={5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="linear" dataKey="count" stroke="#4ade80" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#4ade80', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Row 3 — map (2 cols) */}
          <div
            ref={mapContainerRef}
            style={{
              gridColumn: 'span 2',
              background: '#131313',
              border: '1px solid #2A2A2A',
              borderRadius: 10,
              padding: '20px 24px 0',
              overflow: 'hidden',
            }}
          >
            <p style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
              Visitor locations
            </p>
            {markers.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#707070', fontSize: 14 }}>
                No location data yet.
              </div>
            ) : (() => {
              const proj = getProjectionConfig(markers, mapWidth)
              return (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ scale: proj.scale, center: proj.center }}
                  style={{ width: '100%', height: 300, display: 'block', marginBottom: -6 }}
                >
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) =>
                      geographies.map(geo => (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          style={{
                            default: { fill: '#2A2A2A', stroke: '#131313', strokeWidth: 0.5, outline: 'none' },
                            hover: { fill: '#2A2A2A', outline: 'none' },
                            pressed: { fill: '#2A2A2A', outline: 'none' },
                          }}
                        />
                      ))
                    }
                  </Geographies>
                  {markers.map((m, i) => (
                    <Marker key={i} coordinates={[m.lng, m.lat]}>
                      <circle r={5} fill="#4ade80" fillOpacity={0.9} stroke="#131313" strokeWidth={1} />
                    </Marker>
                  ))}
                </ComposableMap>
              )
            })()}
          </div>

          {/* Row 3 — countries (1 col) */}
          <div style={{
            background: '#131313',
            border: '1px solid #2A2A2A',
            borderRadius: 10,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <p style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
              By country
            </p>
            {countries.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#707070', fontSize: 14 }}>
                No data yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px', paddingBottom: 8, borderBottom: '1px solid #2A2A2A', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Country</span>
                  <span style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Chats</span>
                </div>
                {countries.map((c, i) => (
                  <div key={c.country} style={{
                    display: 'grid', gridTemplateColumns: '1fr 40px',
                    padding: '9px 0', alignItems: 'center',
                    borderBottom: i < countries.length - 1 ? '1px solid #2A2A2A' : 'none',
                  }}>
                    <span style={{ fontSize: 14, color: '#F1F1F1' }}>{c.country}</span>
                    <span style={{ fontSize: 14, color: '#A0A0A0', textAlign: 'right' }}>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
