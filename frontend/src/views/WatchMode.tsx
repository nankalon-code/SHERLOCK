import { useState } from 'react'

const FEED = [
  { id: 1, service: 'auth-service', type: 'anomaly',
    message: 'Response time has increased 34% over the last 4 hours — from 82ms to 109ms. Still within SLA but the trend is consistent and accelerating. Last time this pattern appeared it preceded a full service failure by around 6 hours.',
    action: 'Worth investigating before it pages someone.',
    metric: 'response_time_ms', current: 109, baseline: 82, change: 33, time: '4h trend' },
  { id: 2, service: 'api-gateway', type: 'warning',
    message: 'Error rate trending up: 0.12% to 0.31% over 2 hours. Below the alert threshold (1%) but the direction is concerning.',
    metric: 'error_rate_pct', current: 0.31, baseline: 0.12, change: 158, time: '2h trend' },
  { id: 3, service: 'payment-service', type: 'healthy',
    message: 'All metrics within normal range. No anomalies detected in the last scan.', time: 'Just now' },
  { id: 4, service: 'user-service', type: 'healthy',
    message: 'All metrics within normal range.', time: '15 min ago' },
]

const SERVICES = [
  { name: 'auth-service',         status: 'degraded', health: 87, anomalies: 1, dot: 'yellow' },
  { name: 'api-gateway',          status: 'watching', health: 95, anomalies: 1, dot: 'yellow' },
  { name: 'payment-service',      status: 'healthy',  health: 100, anomalies: 0, dot: 'green' },
  { name: 'user-service',         status: 'healthy',  health: 99, anomalies: 0,  dot: 'green' },
  { name: 'notification-service', status: 'healthy',  health: 100, anomalies: 0, dot: 'green' },
  { name: 'data-service',         status: 'healthy',  health: 100, anomalies: 0, dot: 'green' },
]

export default function WatchMode() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Watch Mode</div>
            <div className="page-subtitle">Proactive anomaly detection — scans every 15 minutes, alerts before things break</div>
          </div>
          <span className="badge badge-info">Continuous</span>
        </div>
      </div>

      <div className="p-6">
        <div className="demo-banner">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, flexShrink: 0, marginTop: 2, color: 'var(--accent)' }}>
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
          </svg>
          <span>Nothing is alerting. But Sherlock is watching sub-threshold patterns that historically precede failures.</span>
        </div>

        <div className="grid-3 mb-6">
          {[
            { label: 'Services Monitored', value: '6',   color: 'var(--accent)' },
            { label: 'Open Anomalies',     value: '2',   color: 'var(--warning)' },
            { label: 'Next Scan',          value: '8m',  color: 'var(--text-secondary)' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-6">
          {/* Service health summary */}
          <div className="card">
            <div className="card-title mb-3">Service Status</div>
            {SERVICES.map(svc => (
              <div key={svc.name} className="service-row">
                <span className={`svc-dot ${svc.dot}`} />
                <span className="svc-name">{svc.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{svc.health}%</span>
                {svc.anomalies > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: 9, marginLeft: 4 }}>{svc.anomalies} anomaly</span>
                )}
              </div>
            ))}
          </div>

          {/* Feed */}
          <div>
            <div className="card-title mb-3">Watch Feed</div>
            {FEED.map(item => (
              <div
                key={item.id}
                className={`watch-item ${item.type}`}
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{item.service}</span>
                  {item.change && (
                    <span className="badge badge-warning" style={{ fontSize: 9 }}>+{item.change}% {item.metric}</span>
                  )}
                  <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{item.time}</span>
                </div>
                <div className="text-sm text-muted" style={{ lineHeight: 1.6 }}>
                  {expandedItem === item.id ? item.message : item.message.substring(0, 80) + (item.message.length > 80 ? '...' : '')}
                </div>
                {item.action && expandedItem === item.id && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warning)', fontWeight: 500 }}>
                    {item.action}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
