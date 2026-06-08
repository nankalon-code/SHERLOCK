import { useState } from 'react'
import type { View } from '../App'

const INCIDENTS = [
  { id: 47, service: 'auth-service', severity: 'high', status: 'active', summary: 'JWT API breaking change in PR #312', time: '14 min ago', affected: 4 },
  { id: 31, service: 'auth-service', severity: 'high', status: 'resolved', summary: 'JWT validation failure after dependency update', time: '52 days ago', affected: 2 },
  { id: 18, service: 'auth-service', severity: 'medium', status: 'resolved', summary: 'JWT API version mismatch after library upgrade', time: '4 months ago', affected: 1 },
]

const SERVICES = [
  { name: 'auth-service',          dot: 'red',   badge: 'danger',  label: 'FAILED',  note: 'Root cause — JWT failure' },
  { name: 'api-gateway',           dot: 'red',   badge: 'cascade', label: 'CASCADE', note: 'Blocked on auth, 503' },
  { name: 'user-service',          dot: 'red',   badge: 'cascade', label: 'CASCADE', note: 'Cannot validate requests' },
  { name: 'payment-service',       dot: 'red',   badge: 'cascade', label: 'CASCADE', note: 'Auth dependency timeout' },
  { name: 'notification-service',  dot: 'green', badge: 'success', label: 'HEALTHY', note: 'Queue buffering' },
  { name: 'data-service',          dot: 'green', badge: 'success', label: 'HEALTHY', note: 'No auth dependency' },
]

interface Props { onNavigate: (v: View, id?: number) => void }

export default function Dashboard({ onNavigate }: Props) {
  const [expandedService, setExpandedService] = useState<string | null>(null)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Command Centre</div>
            <div className="page-subtitle">Real-time incident overview — Foundry IQ reasoning active</div>
          </div>
          <span className="badge badge-danger" id="active-incident-badge">1 Active Incident</span>
        </div>
      </div>

      <div className="p-6">
        {/* Live incident banner */}
        <div
          className="alert-banner danger"
          style={{ cursor: 'pointer', transition: 'opacity 150ms' }}
          onClick={() => onNavigate('incident', 47)}
          id="live-incident-banner"
        >
          <svg className="alert-banner-icon" viewBox="0 0 16 16" fill="none" stroke="var(--danger)" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v.5"/>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>auth-service is down — 4 services affected</div>
            <div className="text-sm text-muted" style={{ marginTop: 2 }}>
              JWT API breaking change in PR #312 · ~2,400 active sessions impacted · 14 min ago
            </div>
          </div>
          <button className="btn btn-danger btn-sm">Investigate</button>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-6">
          {[
            { label: 'Active Incidents', value: '1',    color: 'var(--danger)',  sub: 'auth-service' },
            { label: 'MTTR (post-Sherlock)', value: '47m',  color: 'var(--success)', sub: 'down from 3.4h' },
            { label: 'Pre-Mortems Run', value: '24',   color: 'var(--accent)',   sub: 'last 90 days' },
            { label: 'Incidents Prevented', value: '4', color: 'var(--cascade)', sub: 'via pre-mortem scoring' },
          ].map(s => (
            <div key={s.label} className="card" style={{ cursor: 'default' }}>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-6">
          {/* Incident history */}
          <div className="card">
            <div className="card-title mb-4">Incident History</div>
            {INCIDENTS.map(inc => (
              <div
                key={inc.id}
                id={`incident-row-${inc.id}`}
                className="incident-row"
                onClick={() => onNavigate('incident', inc.id)}
              >
                <span className={`badge ${inc.status === 'active' ? 'badge-danger' : 'badge-success'}`}>
                  {inc.status === 'active' ? 'ACTIVE' : 'RESOLVED'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>#{inc.id}</span>
                    <span className="truncate">{inc.service}</span>
                  </div>
                  <div className="text-xs text-muted truncate">{inc.summary}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{inc.time}</div>
              </div>
            ))}
          </div>

          {/* Service health — interactive expand */}
          <div className="card">
            <div className="card-title mb-3">Service Health</div>
            {SERVICES.map(svc => (
              <div key={svc.name}>
                <div
                  id={`service-${svc.name}`}
                  className="service-row"
                  onClick={() => setExpandedService(expandedService === svc.name ? null : svc.name)}
                  style={{ borderRadius: '6px' }}
                >
                  <span className={`svc-dot ${svc.dot}`} />
                  <span className="svc-name">{svc.name}</span>
                  <span className={`badge badge-${svc.badge}`} style={{ fontSize: 9 }}>{svc.label}</span>
                  <svg
                    viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ width: 10, color: 'var(--text-muted)', transform: expandedService === svc.name ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
                  >
                    <path d="M1 1l4 4 4-4"/>
                  </svg>
                </div>
                {expandedService === svc.name && (
                  <div style={{
                    marginLeft: 18, padding: '6px 10px 8px',
                    fontSize: 11, color: 'var(--text-secondary)',
                    borderLeft: '2px solid var(--border)', lineHeight: 1.6,
                    animation: 'step-in 0.2s ease'
                  }}>
                    {svc.note}
                    {svc.badge === 'danger' && (
                      <div style={{ marginTop: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, height: 24, padding: '0 8px' }}
                          onClick={() => onNavigate('incident', 47)}>
                          View diagnosis
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-title mb-4">Quick Actions</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button id="qa-incident" className="btn btn-danger" onClick={() => onNavigate('incident', 47)}>View active incident</button>
            <button id="qa-premortem" className="btn btn-ghost" onClick={() => onNavigate('pre-mortem')}>Run pre-mortem</button>
            <button id="qa-watch" className="btn btn-ghost" onClick={() => onNavigate('watch')}>Watch mode</button>
            <button id="qa-analytics" className="btn btn-ghost" onClick={() => onNavigate('analytics')}>Analytics</button>
          </div>
        </div>
      </div>
    </div>
  )
}
