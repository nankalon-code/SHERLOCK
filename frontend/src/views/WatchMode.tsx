export default function WatchMode() {
  const feed = [
    { id: 1, service: 'auth-service', type: 'anomaly', icon: '⚠️', severity: 'warning',
      message: "Response time has increased 34% over the last 4 hours — from 82ms to 109ms. Still within SLA but the trend is consistent and accelerating. Last time I saw this pattern it preceded a full service failure by ~6 hours.",
      action: 'Worth investigating before it pages someone.', metric: 'response_time_ms', current: 109, baseline: 82, change: 33, time: '4h trend' },
    { id: 2, service: 'api-gateway', type: 'watch', icon: '👁', severity: 'watch',
      message: 'Error rate trending up: 0.12% → 0.31% over 2 hours. Below alert threshold (1%) but worth monitoring.',
      metric: 'error_rate_pct', current: 0.31, baseline: 0.12, change: 158, time: '2h trend' },
    { id: 3, service: 'payment-service', type: 'normal', icon: '✅', severity: 'healthy',
      message: 'All metrics within normal range. No anomalies detected.', time: 'Just now' },
    { id: 4, service: 'user-service', type: 'normal', icon: '✅', severity: 'healthy',
      message: 'All metrics within normal range.', time: '15min ago' },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">👁 Watch Mode — Proactive Anomaly Detection</div>
            <div className="page-subtitle">Scans every 15 minutes · Catches patterns before they trigger alerts</div>
          </div>
          <span className="badge badge-info">CONTINUOUS</span>
        </div>
      </div>

      <div className="p-6">
        <div className="demo-banner">
          <span>🔎</span>
          Nothing is alerting. But Sherlock is watching sub-threshold patterns that precede failures.
        </div>

        <div className="grid-3 mb-6">
          {[
            { label: 'Services Monitored', value: '6', color: 'var(--accent)' },
            { label: 'Open Anomalies', value: '2', color: 'var(--warning)' },
            { label: 'Next Scan', value: '8m', color: 'var(--text-secondary)' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card-title mb-4">Watch Feed</div>
        {feed.map(item => (
          <div key={item.id} className={`watch-item ${item.type === 'anomaly' ? 'anomaly' : item.type === 'watch' ? 'warning' : 'healthy'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{item.icon}</span>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: 13 }}>{item.service}</span>
              {item.change && (
                <span className="badge badge-warning" style={{ fontSize: 9 }}>+{item.change}% {item.metric}</span>
              )}
              <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{item.time}</span>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.message}</div>
            {item.action && (
              <div style={{ marginTop: 8, color: 'var(--warning)', fontSize: 12, fontWeight: 600 }}>→ {item.action}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
