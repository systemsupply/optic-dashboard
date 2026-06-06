'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
}

const SiteContext = createContext<SiteContextValue>({
  sites: [],
  selectedSite: null,
  setSelectedSiteId: () => {},
  loading: true,
})

export function SiteProvider({ children }: { children: ReactNode }) {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSites() {
      const { data } = await supabase
        .from('sites')
        .select('id, name, created_at')
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setSites(data)
        // Restore last selected site from localStorage, fallback to first
        const stored = localStorage.getItem('optic_selected_site')
        const validStored = stored && data.find(s => s.id === stored)
        setSelectedSiteIdState(validStored ? stored : data[0].id)
      }
      setLoading(false)
    }
    fetchSites()
  }, [])

  function setSelectedSiteId(id: string) {
    setSelectedSiteIdState(id)
    localStorage.setItem('optic_selected_site', id)
  }

  const selectedSite = sites.find(s => s.id === selectedSiteId) ?? null

  return (
    <SiteContext.Provider value={{ sites, selectedSite, setSelectedSiteId, loading }}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  return useContext(SiteContext)
}
