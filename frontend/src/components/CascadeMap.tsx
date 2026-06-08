import { useState } from 'react'

interface CascadeData {
  origin_service: string
  cascade_services: { name: string; reason: string; status: string }[]
  healthy_services: { name: string; reason: string }[]
  fix_recommendation: string
  do_not_restart: string[]
}

const NODE_LAYOUT = [
  { name: 'auth-service', x: 300, y: 60, type: 'origin', reason: 'Root cause — JWT validation failure after jsonwebtoken upgrade' },
  { name: 'api-gateway', x: 300, y: 170, type: 'cascade', reason: 'Blocked on auth. Returning HTTP 503 Service Unavailable' },
  { name: 'user-service', x: 160, y: 280, type: 'cascade', reason: 'Cannot validate session tokens. Requests fail check' },
  { name: 'payment-service', x: 440, y: 280, type: 'cascade', reason: 'Auth dependency timeout. Transactions blocked' },
  { name: 'notification-service', x: 440, y: 390, type: 'healthy', reason: 'Queue buffering active. No direct dependency on auth' },
  { name: 'data-service', x: 100, y: 390, type: 'healthy', reason: 'No auth check required. Serving cached resources' },
]

const EDGES = [
  ['auth-service', 'api-gateway'],
  ['api-gateway', 'user-service'],
  ['api-gateway', 'payment-service'],
  ['payment-service', 'notification-service'],
]

function getNode(name: string, nodes: typeof NODE_LAYOUT) {
  return nodes.find(n => n.name === name) || NODE_LAYOUT.find(n => n.name === name)!
}

const COLORS = { origin: '#f85149', cascade: '#bc8cff', healthy: '#3fb950' }
const LABELS = { origin: 'ORIGIN', cascade: 'CASCADE', healthy: 'HEALTHY' }

export default function CascadeMap({ data }: { data: CascadeData }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Dynamically map statuses based on backend data payload (Gap 4)
  const dynamicNodes = NODE_LAYOUT.map(node => {
    if (data) {
      if (node.name === data.origin_service) {
        return { ...node, type: 'origin', reason: data.fix_recommendation || node.reason }
      }
      const cascadeMatch = data.cascade_services?.find(c => c.name === node.name)
      if (cascadeMatch) {
        return { ...node, type: 'cascade', reason: cascadeMatch.reason || node.reason }
      }
      const healthyMatch = data.healthy_services?.find(h => h.name === node.name)
      if (healthyMatch) {
        return { ...node, type: 'healthy', reason: healthyMatch.reason || node.reason }
      }
    }
    return node
  })

  const activeNode = dynamicNodes.find(n => n.name === selectedNode)

  return (
    <div className="grid-2" style={{ gap: 20 }}>
      <div className="card">
        <div className="card-title mb-4">Failure Cascade Map</div>
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 600 460" className="cascade-svg" style={{ background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)' }}>
            {/* Edges */}
            {EDGES.map(([from, to], i) => {
              const f = getNode(from, dynamicNodes), t = getNode(to, dynamicNodes)
              const isHighlighted = selectedNode === from || selectedNode === to
              return (
                <line
                  key={i}
                  x1={f.x}
                  y1={f.y + 24}
                  x2={t.x}
                  y2={t.y - 24}
                  stroke={isHighlighted ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeDasharray={to === 'user-service' || to === 'notification-service' ? '4,4' : undefined}
                  style={{ transition: 'all var(--transition)' }}
                />
              )
            })}

            {/* Nodes */}
            {dynamicNodes.map(node => {
              const color = COLORS[node.type as keyof typeof COLORS]
              const label = LABELS[node.type as keyof typeof LABELS]
              const isSelected = selectedNode === node.name
              return (
                <g
                  key={node.name}
                  className="cascade-node"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(isSelected ? null : node.name)}
                >
                  <rect
                    x={node.x - 90}
                    y={node.y - 24}
                    width={180}
                    height={48}
                    rx={8}
                    fill={isSelected ? 'var(--bg-hover)' : 'var(--bg-card)'}
                    stroke={isSelected ? 'var(--accent)' : color}
                    strokeWidth={isSelected ? 3 : node.type === 'origin' ? 2.5 : 1.5}
                    style={{ transition: 'all var(--transition)' }}
                    filter={node.type === 'origin' ? `drop-shadow(0 0 8px ${color}44)` : undefined}
                  />
                  <text x={node.x} y={node.y - 2} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontWeight={600} fontFamily="JetBrains Mono, monospace">
                    {node.name}
                  </text>
                  <text x={node.x} y={node.y + 14} textAnchor="middle" fill={color} fontSize={9} fontWeight={700}>
                    {label}
                  </text>
                </g>
              )
            })}
          </svg>
          <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 11, color: 'var(--text-muted)' }}>
            Click node to inspect dependency details
          </div>
        </div>

        <div className="cascade-legend mt-4">
          <div className="legend-item"><div className="legend-dot" style={{ background: '#f85149' }} /> Origin (root cause)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#bc8cff' }} /> Cascade (secondary)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: '#3fb950' }} /> Healthy (unaffected)</div>
        </div>
      </div>

      <div className="space-y">
        {activeNode ? (
          <div className="card" style={{ border: `1px solid ${COLORS[activeNode.type as keyof typeof COLORS]}` }}>
            <div className="card-title mb-4" style={{ color: COLORS[activeNode.type as keyof typeof COLORS] }}>
              {activeNode.name} details
            </div>
            <div className="font-mono text-sm" style={{ lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {activeNode.reason}
            </div>
            <div style={{ marginTop: 12 }}>
              <span className={`badge ${activeNode.type === 'healthy' ? 'badge-success' : activeNode.type === 'origin' ? 'badge-danger' : 'badge-cascade'}`}>
                {LABELS[activeNode.type as keyof typeof LABELS]}
              </span>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-title mb-4">Fix Recommendation</div>
            <div className="font-mono text-sm" style={{ color: 'var(--success)', lineHeight: 2 }}>
              {data?.fix_recommendation || "Fix auth-service only. Everything else recovers automatically."}
            </div>
          </div>
        )}

        <div className="card" style={{ border: '1px solid rgba(248,81,73,0.3)' }}>
          <div className="card-title mb-4" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
              <circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v.5"/>
            </svg>
            Warning: Do NOT Restart
          </div>
          {data?.do_not_restart?.map(s => (
            <div key={s} className="font-mono text-sm" style={{ color: 'var(--danger)', lineHeight: 2 }}>* {s}</div>
          )) || <div className="font-mono text-sm" style={{ color: 'var(--danger)', lineHeight: 2 }}>* api-gateway</div>}
          <div className="text-sm text-muted mt-2">Restarting these will not resolve the root cause.</div>
        </div>

        <div className="card">
          <div className="card-title mb-4">Service Status</div>
          {dynamicNodes.map(node => (
            <div
              key={node.name}
              className="flex items-center gap-2"
              onClick={() => setSelectedNode(selectedNode === node.name ? null : node.name)}
              style={{
                padding: '6px 8px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                borderRadius: 4,
                background: selectedNode === node.name ? 'var(--bg-hover)' : 'transparent',
                transition: 'all var(--transition)'
              }}
            >
              <span className="svc-dot" style={{ background: COLORS[node.type as keyof typeof COLORS], boxShadow: node.type === 'origin' ? `0 0 6px ${COLORS.origin}` : 'none' }} />
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
