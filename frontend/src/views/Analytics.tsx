import { useEffect, useState } from 'react'

const MTTR_DATA = [
  { month: 'Jan', val: 3.1, phase: 'before' },
  { month: 'Feb', val: 3.4, phase: 'before' },
  { month: 'Mar', val: 3.4, phase: 'before' },
  { month: 'Apr', val: 2.1, phase: 'transition' },
  { month: 'May', val: 0.9, phase: 'after' },
  { month: 'Jun', val: 0.78, phase: 'after' },
]

const ROOT_CAUSES = [
  { cat: 'Dependency API change', count: 14, pct: 30 },
  { cat: 'Config drift',          count: 9,  pct: 19 },
  { cat: 'Resource exhaustion',   count: 8,  pct: 17 },
  { cat: 'Network timeout',       count: 7,  pct: 15 },
  { cat: 'Schema migration',      count: 5,  pct: 11 },
  { cat: 'Race condition',        count: 4,  pct: 8  },
]

const SERVICES = [
  { name: 'auth-service',          incidents: 12, mttr: 23, rel: 98.7, risk: 'HIGH' },
  { name: 'api-gateway',           incidents: 8,  mttr: 15, rel: 99.1, risk: 'MEDIUM' },
  { name: 'payment-service',       incidents: 5,  mttr: 31, rel: 99.4, risk: 'MEDIUM' },
  { name: 'user-service',          incidents: 4,  mttr: 12, rel: 99.6, risk: 'LOW' },
  { name: 'notification-service',  incidents: 2,  mttr: 8,  rel: 99.9, risk: 'LOW' },
  { name: 'data-service',          incidents: 1,  mttr: 5,  rel: 99.98, risk: 'LOW' },
]

export default function Analytics() {
  const [animated, setAnimated] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t) }, [])

  const maxVal = Math.max(...MTTR_DATA.map(d => d.val))

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Incident Intelligence</div>
            <div className="page-subtitle">Powered by Microsoft Fabric IQ — derived from real incident history</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid-4 mb-6">
          {[
            { label: 'MTTR Reduction', value: '77%', color: 'var(--success)', sub: '3.4h down to 47min' },
            { label: 'Hours Saved (90d)', value: '140h', color: 'var(--accent)', sub: '47 incidents resolved' },
            { label: 'Cost Avoided', value: '$10.5k', color: 'var(--cascade)', sub: 'at $75/hr senior rate' },
            { label: 'Incidents Prevented', value: '4', color: 'var(--warning)', sub: 'via pre-mortem flags' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid-2 mb-6">
          {/* MTTR chart */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="card-title">Mean Time to Resolution</div>
              <span className="badge badge-info" style={{ fontSize: 9 }}>Sherlock deployed Apr 2026</span>
            </div>
            <div className="chart-area">
              {MTTR_DATA.map((d, i) => {
                const h = animated ? (d.val / maxVal) * 110 : 0
                const color = d.phase === 'before' ? 'var(--danger)' : d.phase === 'transition' ? 'var(--warning)' : 'var(--success)'
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4, position: 'relative' }}
                    onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                    {hoveredBar === i && (
                      <div style={{ position: 'absolute', bottom: h + 30, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '3px 7px', fontSize: 11, color: 'var(--text-primary)', whiteSpace: 'nowrap', zIndex: 5 }}>
                        {d.val}h
                      </div>
                    )}
                    <div className="chart-bar" style={{ height: h, background: color, width: '100%' }} />
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.month}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
              <span><span style={{ color: 'var(--danger)' }}>—</span> Before Sherlock</span>
              <span><span style={{ color: 'var(--warning)' }}>—</span> Transition</span>
              <span><span style={{ color: 'var(--success)' }}>—</span> After Sherlock</span>
            </div>
          </div>

          {/* Root cause */}
          <div className="card">
            <div className="card-title mb-4">Root Cause Distribution</div>
            {ROOT_CAUSES.map((rc, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className="flex justify-between text-xs" style={{ marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{rc.cat}</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{rc.count} · {rc.pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 99 }}>
                  <div style={{
                    height: '100%',
                    width: animated ? `${rc.pct}%` : '0%',
                    background: `linear-gradient(90deg, var(--accent), var(--cascade))`,
                    borderRadius: 99,
                    transition: `width ${0.6 + i * 0.08}s cubic-bezier(0.4,0,0.2,1)`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service table */}
        <div className="card">
          <div className="card-title mb-4">Service Reliability Rankings</div>
          <table className="data-table">
            <thead>
              <tr>
                {['Service', 'Incidents', 'Avg MTTR', 'Reliability', 'Risk'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {SERVICES.map(s => (
                <tr key={s.name} id={`svc-row-${s.name}`}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: s.incidents > 8 ? 'var(--danger)' : 'var(--text-secondary)' }}>{s.incidents}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{s.mttr}min</td>
                  <td style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{s.rel}%</td>
                  <td>
                    <span className={`badge ${s.risk === 'HIGH' ? 'badge-danger' : s.risk === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: 9 }}>
                      {s.risk}
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
