import { SiteProvider } from './components/SiteContext'
import PlanGate from './components/PlanGate'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteProvider>
      <PlanGate>{children}</PlanGate>
    </SiteProvider>
  )
}
