import Sidebar from '@/components/Sidebar'
import { SiteProvider } from './components/SiteContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0E0E0E' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </SiteProvider>
  )
}
