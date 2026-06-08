'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSite } from '../components/SiteContext'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface LocationRow {
  country: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

interface CountryStat {
  country: string
  count: number
}

export default function LocationsPage() {
  const { selectedSite } = useSite()
  const [markers, setMarkers] = useState<{ lat: number; lng: number; city: string | null; country: string | null }[]>([])
  const [countries, setCountries] = useState<CountryStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedSite) return
    async function fetch() {
      const { data } = await supabase
        .from('conversations')
        .select('country, city, latitude, longitude')
        .eq('site_id', selectedSite!.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      const rows: LocationRow[] = data ?? []

      // Markers for map
      setMarkers(rows
        .filter(r => r.latitude != null && r.longitude != null)
        .map(r => ({ lat: r.latitude!, lng: r.longitude!, city: r.city, country: r.country }))
      )

      // Country breakdown
      const counts: Record<string, number> = {}
      rows.forEach(r => {
        if (r.country) counts[r.country] = (counts[r.country] || 0) + 1
      })
      setCountries(
        Object.entries(counts)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
      )

      setLoading(false)
    }
    fetch()
  }, [selectedSite])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: '#F1F1F1', letterSpacing: '-0.3px' }}>Locations</h1>

      {loading ? (
        <div style={{ color: '#707070', fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          {/* World map */}
          <div style={{ background: '#131313', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden', padding: '8px 0 0' }}>
            <p style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 20px 12px' }}>
              Visitor locations
            </p>
            {markers.length === 0 ? (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#707070', fontSize: 14 }}>
                No location data yet.
              </div>
            ) : (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 140, center: [0, 20] }}
                style={{ width: '100%', height: 380 }}
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
                    <circle r={4} fill="#4ade80" fillOpacity={0.8} stroke="#131313" strokeWidth={1} />
                  </Marker>
                ))}
              </ComposableMap>
            )}
          </div>

          {/* Country breakdown */}
          {countries.length > 0 && (
            <div style={{ background: '#131313', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '10px 20px', borderBottom: '1px solid #2A2A2A' }}>
                <span style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Country</span>
                <span style={{ fontSize: 12, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Conversations</span>
              </div>
              {countries.map((c, i) => {
                const max = countries[0].count
                return (
                  <div key={c.country} style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px',
                    padding: '11px 20px', alignItems: 'center',
                    borderBottom: i < countries.length - 1 ? '1px solid #2A2A2A' : 'none',
                    position: 'relative',
                  }}>
                    {/* Bar background */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${(c.count / max) * 100}%`,
                      background: '#4ade8010',
                      borderRadius: i === 0 ? '10px 0 0 0' : 0,
                    }} />
                    <span style={{ fontSize: 14, color: '#F1F1F1', position: 'relative' }}>{c.country}</span>
                    <span style={{ fontSize: 14, color: '#A0A0A0', textAlign: 'right', position: 'relative' }}>{c.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
