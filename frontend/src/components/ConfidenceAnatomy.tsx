import { useEffect, useState } from 'react'

interface ConfData {
  error_commit_correlation: { score: number; explanation: string; citations: string[] }
  timeline_match: { score: number; explanation: string; citations: string[] }
  dependency_api_match: { score: number; explanation: string; citations: string[] }
  historical_pattern: { score: number; explanation: string; citations: string[] }
  overall: number
}

const DIMS = [
  { key: 'error_commit_correlation', label: 'Error-Commit Correlation' },
  { key: 'timeline_match', label: 'Timeline Match' },
  { key: 'dependency_api_match', label: 'Dependency API Match' },
  { key: 'historical_pattern', label: 'Historical Pattern' },
] as const

export default function ConfidenceAnatomy({ data }: { data: ConfData }) {
  const [animated, setAnimated] = useState(false)
  const [selectedDim, setSelectedDim] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [sentToTeams, setSentToTeams] = useState(false)

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  return (
    <div className="grid-2" style={{ gap: 20 }}>
      <div className="card">
        <div className="card-title mb-4">Confidence Anatomy — 4-Dimension Breakdown</div>
        <div className="confidence-grid">
          {DIMS.map(dim => {
            const d = data[dim.key]
            const isSelected = selectedDim === dim.key
            return (
              <div
                key={dim.key}
                className="conf-dim"
                onClick={() => setSelectedDim(isSelected ? null : dim.key)}
                style={{
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  background: isSelected ? 'var(--bg-hover)' : 'transparent',
                  border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                  transition: 'all var(--transition)'
                }}
              >
                <div className="conf-dim-header">
                  <span className="conf-dim-name" style={{ fontWeight: isSelected ? 600 : 400 }}>{dim.label}</span>
                  <span className="conf-dim-score">{d.score}%</span>
                </div>
                <div className="conf-bar-track">
                  <div className="conf-bar-fill" style={{ width: animated ? `${d.score}%` : '0%' }} />
                </div>
                <div className="conf-dim-note" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {d.explanation}
                </div>
                {d.citations.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    {d.citations.map((c, i) => (
                      <span key={i} className="step-citation">[Source: {c}]</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="overall-confidence card mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="overall-num">{data.overall}%</div>
            <div className="overall-label" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Confidence</div>
            <div className="overall-verdict" style={{ marginTop: 8 }}>High confidence root cause</div>
          </div>
          <div style={{ color: 'var(--accent)', flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 44, height: 44 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              <path d="M2 12h20"/>
            </svg>
          </div>
        </div>

        <div className="card">
          <div className="card-title mb-4">Root Cause Summary</div>
          <div className="font-mono text-sm" style={{ lineHeight: 2, color: 'var(--text-secondary)' }}>
            <div><span className="text-danger" style={{ marginRight: 6 }}>■</span>jsonwebtoken 8.5.1 to 9.0.0 (major)</div>
            <div><span className="text-danger" style={{ marginRight: 6 }}>■</span>jwt.sign() signature changed in v9</div>
            <div><span className="text-danger" style={{ marginRight: 6 }}>■</span>session.js:47 uses v8 signature</div>
            <div><span className="text-success" style={{ marginRight: 6 }}>■</span>Fix: 4-line change, PR #313</div>
          </div>
          <div className="flex gap-2 mt-4">
            {!approved ? (
              <button className="btn btn-primary" onClick={() => setApproved(true)}>Approve Fix PR</button>
            ) : (
              <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: 12 }}>PR Approved</span>
            )}
            {!sentToTeams ? (
              <button className="btn btn-ghost" onClick={() => setSentToTeams(true)}>Send to Teams</button>
            ) : (
              <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: 12 }}>Sent to Teams</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
