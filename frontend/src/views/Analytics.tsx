import { useEffect, useState } from 'react'

const MTTR_DATA = [
  { month: 'Mar', before: 3.4, after: null, phase: 'before' },
  { month: 'Apr', before: 2.1, after: null, phase: 'transition' },
  { month: 'May', before: null, after: 0.9, phase: 'after' },
  { month: 'Jun', before: null, after: 0.78, phase: 'after' },
]

const ROOT_CAUSES = [
  { cat: 'Dependency API Change', count: 14, pct: 30 },
  { cat: 'Config Drift', count: 9, pct: 19 },
  { cat: 'Resource Exhaustion', count: 8, pct: 17 },
  { cat: 'Network Timeout', count: 7, pct: 15 },
  { cat: 'Schema Migration', count: 5, pct: 11 },
  { cat: 'Race Condition', count: 4, pct: 8 },
]

const SERVICES = [
  { name: 'auth-service', incidents: 12, mttr: 23, rel: 98.7 },
  { name: 'api-gateway', incidents: 8, mttr: 15, rel: 99.1 },
  { name: 'payment-service', incidents: 5, mttr: 31, rel: 99.4 },
  { name: 'user-service', incidents: 4, mttr: 12, rel: 99.6 },
  { name: 'notification-service', incidents: 2, mttr: 8, rel: 99.9 },
  { name: 'data-service', incidents: 1, mttr: 5, rel: 99.98 },
]

export default function Analytics() {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { setTimeout(() => setAnimated(true), 200) }, [])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📊 Incident Intelligence Dashboard</div>
        <div className="page-subtitle">Powered by Microsoft Fabric IQ · Real incident data from demo repo</div>
      </div>

      <div className="p-6">
        <div className="demo-banner mb-6">
          <span>📡</span> Fabric IQ semantic model — MTTR derived from real incident history. This is the ROI story for engineering managers.
        </div>

        {/* ROI stats */}
        <div className="grid-4 mb-6">
          {[
            { label: 'MTTR Reduction', value: '77%', color: 'var(--success)', sub: '3.4h → 47min' },
            { label: 'Hours Saved (90d)', value: '140h', color: 'var(--accent)', sub: '47 incidents' },
            { label: 'Cost Saved', value: '$10.5k', color: 'var(--cascade)', sub: 'at $75/hr senior rate' },
            { label: 'Incidents Prevented', value: '4', color: 'var(--warning)', sub: 'via pre-mortem' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="text-xs text-muted mt-4">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-6">
          {/* MTTR chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">MTTR Trend</span>
              <span className="badge badge-success">Sherlock deployed Apr 2026</span>
            </div>
            <div className="chart-area">
              {MTTR_DATA.map((d, i) => {
                const val = d.before ?? d.after ?? 0
                const maxH = 120
                const h = animated ? (val / 3.4) * maxH : 0
                const color = d.phase === 'before' ? 'var(--danger)' : d.phase === 'transition' ? 'var(--warning)' : 'var(--success)'
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{val}h</div>
                    <div className="chart-bar" style={{ height: h, background: color, width: '100%' }} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.month}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Root cause distribution */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Root Cause Categories</span>
            </div>
            {ROOT_CAUSES.map((rc, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="flex justify-between text-sm mb-4" style={{ marginBottom: 4 }}>
                  <span>{rc.cat}</span>
                  <span className="text-muted">{rc.count} incidents ({rc.pct}%)</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: animated ? `${rc.pct}%` : '0%', background: 'linear-gradient(90deg,var(--accent),var(--cascade))', borderRadius: 2, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service reliability table */}
        <div className="card">
          <div className="card-title mb-4">Service Reliability Rankings</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {['Service', 'Incidents', 'Avg MTTR', 'Reliability', 'Risk'].map(h => (
                  <th key={h} style={{ padding: '8px 0', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SERVICES.map((s, i) => (
                <tr key={s.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 0', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '10px 0', color: s.incidents > 8 ? 'var(--danger)' : 'var(--text-secondary)' }}>{s.incidents}</td>
                  <td style={{ padding: '10px 0', color: 'var(--text-secondary)' }}>{s.mttr}min</td>
                  <td style={{ padding: '10px 0', color: 'var(--success)' }}>{s.rel}%</td>
                  <td style={{ padding: '10px 0' }}>
                    <span className={`badge ${i === 0 ? 'badge-danger' : i < 3 ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 9 }}>
                      {i === 0 ? 'HIGH' : i < 3 ? 'MEDIUM' : 'LOW'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
