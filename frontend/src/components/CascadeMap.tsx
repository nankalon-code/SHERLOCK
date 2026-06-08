interface CascadeData {
  origin_service: string
  cascade_services: { name: string; reason: string; status: string }[]
  healthy_services: { name: string; reason: string }[]
  fix_recommendation: string
  do_not_restart: string[]
}

const NODE_LAYOUT = [
  { name: 'auth-service', x: 300, y: 60, type: 'origin' },
  { name: 'api-gateway', x: 300, y: 170, type: 'cascade' },
  { name: 'user-service', x: 160, y: 280, type: 'cascade' },
  { name: 'payment-service', x: 440, y: 280, type: 'cascade' },
  { name: 'notification-service', x: 440, y: 390, type: 'healthy' },
  { name: 'data-service', x: 100, y: 390, type: 'healthy' },
]

const EDGES = [
  ['auth-service', 'api-gateway'],
  ['api-gateway', 'user-service'],
  ['api-gateway', 'payment-service'],
  ['payment-service', 'notification-service'],
]

function getNode(name: string) { return NODE_LAYOUT.find(n => n.name === name)! }

const COLORS = { origin: '#f85149', cascade: '#bc8cff', healthy: '#3fb950' }
const LABELS = { origin: 'ORIGIN', cascade: 'CASCADE', healthy: 'HEALTHY' }

export default function CascadeMap({ data }: { data: CascadeData }) {
  return (
    <div className="grid-2" style={{ gap: 20 }}>
      <div className="card">
        <div className="card-title mb-4">Failure Cascade Map</div>
        <svg viewBox="0 0 600 460" className="cascade-svg" style={{ background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
          {/* Edges */}
          {EDGES.map(([from, to], i) => {
            const f = getNode(from), t = getNode(to)
            return <line key={i} x1={f.x} y1={f.y + 24} x2={t.x} y2={t.y - 24}
              stroke="var(--border)" strokeWidth={2} strokeDasharray={to === 'user-service' || to === 'notification-service' ? '4,4' : undefined} />
          })}

          {/* Nodes */}
          {NODE_LAYOUT.map(node => {
            const color = COLORS[node.type as keyof typeof COLORS]
            const label = LABELS[node.type as keyof typeof LABELS]
            return (
              <g key={node.name} className="cascade-node">
                <rect x={node.x - 90} y={node.y - 24} width={180} height={48}
                  rx={8} fill="var(--bg-card)" stroke={color} strokeWidth={node.type === 'origin' ? 2.5 : 1.5}
                  filter={node.type === 'origin' ? `drop-shadow(0 0 8px ${color}44)` : undefined} />
                <text x={node.x} y={node.y - 2} textAnchor="middle" fill="var(--text-primary)" fontSize={12} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                  {node.name}
                </text>
                <text x={node.x} y={node.y + 14} textAnchor="middle" fill={color} fontSize={10} fontWeight={700}>
                  {label}
                </text>
              </g>
            )
          })}

          {/* Arrow markers */}
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-muted)" />
            </marker>
          </defs>
        </svg>

        <div className="cascade-legend mt-4">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#f85149' }} /> Origin (root cause)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#bc8cff' }} /> Cascade (secondary)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#3fb950' }} /> Healthy (unaffected)</div>
        </div>
      </div>

      <div className="space-y">
        <div className="card">
          <div className="card-title mb-4">Fix Recommendation</div>
          <div className="font-mono text-sm" style={{ color: 'var(--success)', lineHeight: 2 }}>
            ✓ Fix auth-service only.<br />Everything else recovers automatically.
          </div>
        </div>

        <div className="card" style={{ border: '1px solid rgba(248,81,73,0.3)', background: 'var(--danger-glow)' }}>
          <div className="card-title mb-4" style={{ color: 'var(--danger)' }}>⚠ Do NOT Restart</div>
          {data.do_not_restart.map(s => (
            <div key={s} className="font-mono text-sm" style={{ color: 'var(--danger)', lineHeight: 2 }}>✗ {s}</div>
          ))}
          <div className="text-sm text-muted mt-2">Restarting these will not resolve the root cause.</div>
        </div>

        <div className="card">
          <div className="card-title mb-4">Service Status</div>
          {[...NODE_LAYOUT].map(node => (
            <div key={node.name} className="flex items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="status-dot" style={{ background: COLORS[node.type as keyof typeof COLORS] }} />
              <span className="font-mono text-sm" style={{ flex: 1 }}>{node.name}</span>
              <span className={`badge ${node.type === 'healthy' ? 'badge-success' : node.type === 'origin' ? 'badge-danger' : 'badge-cascade'}`} style={{ fontSize: 9 }}>
                {LABELS[node.type as keyof typeof LABELS]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
