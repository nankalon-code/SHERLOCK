import type { View } from '../App'

const INCIDENTS = [
  { id: 47, service: 'auth-service', severity: 'high', status: 'active', summary: 'JWT API breaking change in PR #312', time: '14 min ago', affected: 4 },
  { id: 31, service: 'auth-service', severity: 'high', status: 'resolved', summary: 'JWT validation failure after dependency update', time: '52 days ago', affected: 2 },
  { id: 18, service: 'auth-service', severity: 'medium', status: 'resolved', summary: 'JWT API version mismatch', time: '4 months ago', affected: 1 },
]

interface Props { onNavigate: (v: View, id?: number) => void }

export default function Dashboard({ onNavigate }: Props) {
  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">🔍 Sherlock — Command Centre</div>
            <div className="page-subtitle">Elementary. Here's what broke your production and why.</div>
          </div>
          <span className="badge badge-danger">1 ACTIVE INCIDENT</span>
        </div>
      </div>

      <div className="p-6">
        {/* Live incident alert */}
        <div className="alert-banner danger mb-4">
          <span style={{ fontSize: 18 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <strong>CRITICAL — auth-service DOWN</strong>
            <div className="text-sm" style={{ marginTop: 2 }}>JWT API breaking change in PR #312 · 4 services affected · ~2,400 active sessions impacted</div>
          </div>
          <button className="btn btn-danger" onClick={() => onNavigate('incident', 47)}>
            Investigate →
          </button>
        </div>

        {/* Stats row */}
        <div className="grid-4 mb-6">
          {[
            { label: 'Active Incidents', value: '1', color: 'var(--danger)' },
            { label: 'MTTR (post-Sherlock)', value: '47m', color: 'var(--success)' },
            { label: 'Pre-Mortems Run', value: '24', color: 'var(--accent)' },
            { label: 'Incidents Prevented', value: '4', color: 'var(--cascade)' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-6">
          {/* Recent incidents */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Incident History</span>
              <span className="text-xs text-muted">Last 90 days</span>
            </div>
            {INCIDENTS.map(inc => (
              <div key={inc.id} className="incident-row" onClick={() => onNavigate('incident', inc.id)}>
                <span className={`badge ${inc.status === 'active' ? 'badge-danger' : 'badge-success'}`}>
                  {inc.status === 'active' ? 'ACTIVE' : 'RESOLVED'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>#{inc.id} {inc.service}</div>
                  <div className="text-xs text-muted">{inc.summary}</div>
                </div>
                <div className="text-xs text-muted">{inc.time}</div>
              </div>
            ))}
          </div>

          {/* Service health */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Service Health</span>
            </div>
            {[
              { name: 'auth-service', status: 'FAILED', dot: 'red', note: 'Root cause — JWT failure' },
              { name: 'api-gateway', status: 'CASCADE', dot: 'red', note: 'Blocked on auth' },
              { name: 'user-service', status: 'CASCADE', dot: 'red', note: 'Cannot validate requests' },
              { name: 'payment-service', status: 'CASCADE', dot: 'red', note: 'Auth timeout' },
              { name: 'notification-service', status: 'HEALTHY', dot: 'green', note: 'Queue buffering' },
              { name: 'data-service', status: 'HEALTHY', dot: 'green', note: 'No auth dependency' },
            ].map(svc => (
              <div key={svc.name} className="flex items-center gap-2" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span className={`status-dot ${svc.dot}`} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, flex: 1 }}>{svc.name}</span>
                <span className={`badge ${svc.status === 'HEALTHY' ? 'badge-success' : svc.status === 'CASCADE' ? 'badge-cascade' : 'badge-danger'}`} style={{ fontSize: 9 }}>
                  {svc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-title mb-4">Quick Actions</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-danger" onClick={() => onNavigate('incident', 47)}>🔥 View Active Incident</button>
            <button className="btn btn-ghost" onClick={() => onNavigate('pre-mortem')}>🔍 Run Pre-Mortem</button>
            <button className="btn btn-ghost" onClick={() => onNavigate('watch')}>👁 Watch Mode</button>
            <button className="btn btn-ghost" onClick={() => onNavigate('analytics')}>📊 Analytics</button>
          </div>
        </div>
      </div>
    </div>
  )
}
