import type { View } from '../App'

interface Props {
  currentView: View
  onNavigate: (v: View) => void
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡', dot: 'red' },
  { id: 'incident', label: 'Active Incident', icon: '🔥', dot: 'red' },
  { id: 'pre-mortem', label: 'Pre-Mortem', icon: '🔍', dot: null },
  { id: 'watch', label: 'Watch Mode', icon: '👁', dot: 'yellow' },
  { id: 'analytics', label: 'Analytics', icon: '📊', dot: null },
] as const

export default function Sidebar({ currentView, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">S</div>
        <div>
          <div className="logo-text">Sherlock</div>
          <div className="logo-tag">Elementary.</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id as View)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
            {item.dot && <span className={`status-dot ${item.dot}`} />}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>System</div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="icon">🔗</span>
          <span style={{ fontSize: 11 }}>Foundry IQ</span>
          <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 5px' }}>LIVE</span>
        </div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="icon">📡</span>
          <span style={{ fontSize: 11 }}>Supabase</span>
          <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 5px' }}>OK</span>
        </div>
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="icon">💬</span>
          <span style={{ fontSize: 11 }}>Work IQ</span>
          <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 5px' }}>LIVE</span>
        </div>
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
        <div>Built by a first-year CS student</div>
        <div style={{ marginTop: 4 }}>Microsoft AI Agents Hackathon 2026</div>
        <div style={{ marginTop: 4, color: 'var(--accent)' }}>Sherlock v1.0.0</div>
      </div>
    </aside>
  )
}
