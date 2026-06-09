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

  useEffect(() => { setTimeout(() => setAnimated(true), 100) }, [])

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      <div className="overall-confidence card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(79, 142, 247, 0.05)', border: '1px solid rgba(79, 142, 247, 0.2)' }}>
        <div>
          <div className="overall-num" style={{ fontSize: '24px', fontWeight: 700, color: '#4f8ef7' }}>{data.overall}%</div>
          <div className="overall-label" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Confidence</div>
          <div className="overall-verdict" style={{ marginTop: 4, fontSize: '12px', color: '#e2e8f0' }}>High confidence root cause</div>
        </div>
        <div style={{ color: '#4f8ef7', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 36, height: 36 }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            <path d="M2 12h20"/>
          </svg>
        </div>
      </div>

      <div className="confidence-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                padding: '12px',
                borderRadius: '8px',
                background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="conf-dim-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="conf-dim-name" style={{ fontWeight: isSelected ? 600 : 500, fontSize: '13px', color: '#e2e8f0' }}>{dim.label}</span>
                <span className="conf-dim-score" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', color: '#4f8ef7' }}>{d.score}%</span>
              </div>
              <div className="conf-bar-track" style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="conf-bar-fill" style={{ height: '100%', background: '#4f8ef7', width: animated ? `${d.score}%` : '0%', transition: 'width 1s ease-out' }} />
              </div>
              {isSelected && (
                <div className="conf-dim-expanded" style={{ marginTop: '12px' }}>
                  <div className="conf-dim-note" style={{ color: '#a0aec0', fontSize: '12px', lineHeight: '1.5' }}>
                    {d.explanation}
                  </div>
                  {d.citations.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      {d.citations.map((c, i) => (
                        <div key={i} className="step-citation" style={{ fontSize: '11px', color: '#718096' }}>[Source: {c}]</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
