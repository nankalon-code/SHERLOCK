import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './views/Dashboard'
import IncidentView from './views/IncidentView'
import WatchMode from './views/WatchMode'
import Analytics from './views/Analytics'
import PreMortem from './views/PreMortem'

export type View = 'dashboard' | 'incident' | 'watch' | 'analytics' | 'pre-mortem'

export default function App() {
  const [view, setView] = useState<View>('incident')
  const [activeIncidentId, setActiveIncidentId] = useState<number>(47)

  const navigateTo = (v: View, incidentId?: number) => {
    setView(v)
    if (incidentId) setActiveIncidentId(incidentId)
  }

  return (
    <div className="app flex-col">
      <Navbar currentView={view} onNavigate={navigateTo} />
      <main className="main-content flex-1">
        {view === 'dashboard' && <Dashboard onNavigate={navigateTo} />}
        {view === 'incident' && <IncidentView incidentId={activeIncidentId} />}
        {view === 'watch' && <WatchMode />}
        {view === 'analytics' && <Analytics />}
        {view === 'pre-mortem' && <PreMortem />}
      </main>
    </div>
  )
}
