import type { View } from '../App'

// Clean SVG icons — no emoji
const Icons = {
  grid: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>,
  fire: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 14s-5-3.5-5-7.5A5 5 0 0 1 8 1a5 5 0 0 1 5 5.5C13 10.5 8 14 8 14z"/><path d="M8 10s-2-1.5-2-3.5A2 2 0 0 1 8 5a2 2 0 0 1 2 1.5C10 8.5 8 10 8 10z"/></svg>,
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l3 3"/></svg>,
  eye: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>,
  chart: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12l4-4 3 3 4-5 3 2"/></svg>,
  link: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 4h2a3 3 0 0 1 0 6H9M7 12H5A3 3 0 0 1 5 6h2M5.5 8h5"/></svg>,
  db: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="8" cy="4" rx="5" ry="2"/><path d="M3 4v4c0 1.1 2.2 2 5 2s5-.9 5-2V4"/><path d="M3 8v4c0 1.1 2.2 2 5 2s5-.9 5-2V8"/></svg>,
  chat: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2l3 3 3-3h2a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/></svg>,
  sherlock: <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5"><circle cx="6" cy="6" r="3.5"/><path d="M9 9.5l4.5 4.5"/><path d="M4.5 5l1 1.5 1.5-2"/></svg>,
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: 'grid',   dot: null },
  { id: 'incident',   label: 'Active Incident', icon: 'fire',   dot: 'red' },
  { id: 'pre-mortem', label: 'Pre-Mortem',      icon: 'search', dot: null },
  { id: 'watch',      label: 'Watch Mode',      icon: 'eye',    dot: 'yellow' },
  { id: 'analytics',  label: 'Analytics',       icon: 'chart',  dot: null },
] as const

const SYSTEM_ITEMS = [
  { label: 'Foundry IQ',  icon: 'link', status: 'LIVE',  statusClass: 'badge-success' },
  { label: 'Supabase',    icon: 'db',   status: 'OK',    statusClass: 'badge-info' },
  { label: 'Work IQ',     icon: 'chat', status: 'LIVE',  statusClass: 'badge-success' },
]

interface Props {
  currentView: View
  onNavigate: (v: View) => void
}

export default function Sidebar({ currentView, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          {Icons.sherlock}
        </div>
        <div>
          <div className="logo-wordmark">Sherlock</div>
          <div className="logo-sub">Incident intelligence</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id as View)}
          >
            <span className="nav-icon">{Icons[item.icon as keyof typeof Icons]}</span>
            {item.label}
            {item.dot && <span className={`live-dot ${item.dot}`} style={{ marginLeft: 'auto' }} />}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>System</div>
        {SYSTEM_ITEMS.map(item => (
          <div key={item.label} className="nav-item" style={{ cursor: 'default' }}>
            <span className="nav-icon">{Icons[item.icon as keyof typeof Icons]}</span>
            <span style={{ fontSize: 12 }}>{item.label}</span>
            <span className={`badge ${item.statusClass}`} style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 5px' }}>
              {item.status}
            </span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>Sherlock v1.0</div>
        <div>First-year CS student</div>
        <div>Microsoft AI Agents Hackathon 2026</div>
      </div>
    </aside>
  )
}
