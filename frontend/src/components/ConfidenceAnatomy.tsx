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
  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  return (
    <div className="grid-2" style={{ gap: 20 }}>
      <div className="card">
        <div className="card-title mb-4">Confidence Anatomy — 4-Dimension Breakdown</div>
        <div className="confidence-grid">
          {DIMS.map(dim => {
            const d = data[dim.key]
            return (
              <div key={dim.key} className="conf-dim">
                <div className="conf-dim-header">
                  <span className="conf-dim-name">{dim.label}</span>
                  <span className="conf-dim-score">{d.score}%</span>
                </div>
                <div className="conf-bar-track">
                  <div className="conf-bar-fill" style={{ width: animated ? `${d.score}%` : '0%' }} />
                </div>
                <div className="conf-dim-note">{d.explanation}</div>
                <div style={{ marginTop: 4 }}>
                  {d.citations.map((c, i) => (
                    <span key={i} className="step-citation">[Source: {c}]</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="overall-confidence card mb-4">
          <div>
            <div className="overall-num">{data.overall}%</div>
            <div className="overall-label">Overall Confidence</div>
            <div className="overall-verdict" style={{ marginTop: 8 }}>High confidence root cause</div>
          </div>
          <div style={{ fontSize: 48 }}>🎯</div>
        </div>

        <div className="card">
          <div className="card-title mb-4">Root Cause Summary</div>
          <div className="font-mono text-sm" style={{ lineHeight: 2, color: 'var(--text-secondary)' }}>
            <div><span className="text-danger">■</span> jsonwebtoken 8.5.1 → 9.0.0 (major)</div>
            <div><span className="text-danger">■</span> jwt.sign() signature changed in v9</div>
            <div><span className="text-danger">■</span> session.js:47 uses v8 signature</div>
            <div><span className="text-success">■</span> Fix: 4-line change, PR #313</div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary">✓ Approve Fix PR</button>
            <button className="btn btn-ghost">Send to Teams</button>
          </div>
        </div>
      </div>
    </div>
  )
}
