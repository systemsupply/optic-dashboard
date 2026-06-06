'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export interface Site {
  id: string
  name: string | null
  created_at: string
}

interface SiteContextValue {
  sites: Site[]
  selectedSite: Site | null
  setSelectedSiteId: (id: string) => void
  loading: boolean
  refreshSites: () => Promise<void>
}

const SiteContext = createContext<SiteContextValue>({
  sites: [],
  selectedSite: null,
  setSelectedSiteId: () => {},
  loading: true,
  refreshSites: async () => {},
})

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function fetchSites() {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, created_at')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data) {
        setSites(data)
        if (data.length > 0) {
          const stored = localStorage.getItem('optic_selected_site')
          const validStored = stored && data.find(s => s.id === stored)
          setSelectedSiteIdState(validStored ? stored : data[0].id)
        } else {
          setSelectedSiteIdState(null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch sites:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchSites()
      } else {
        setLoading(false)
        router.push('/auth')
      }
    })
  }, [router])

  function setSelectedSiteId(id: string) {
    setSelectedSiteIdState(id)
    localStorage.setItem('optic_selected_site', id)
  }

  const selectedSite = sites.find(s => s.id === selectedSiteId) ?? null

  return (
    <SiteContext.Provider value={{ sites, selectedSite, setSelectedSiteId, loading, refreshSites }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  return useContext(SiteContext)
}
