import { useState } from 'react'

const DEMO_PR = {
  number: 312, title: 'chore: bump jsonwebtoken to 9.0.0',
  risk_score: 38, risk_level: 'ELEVATED',
  flags: [
    { reason: 'Modifies auth/session.js', detail: 'Your last 2 production incidents originated in this file. Historical failure rate for changes here: 41%.', citations: ['Incident #31', 'Incident #18'] },
    { reason: 'jsonwebtoken 8.5.1 -> 9.0.0 (major version bump)', detail: 'Breaking API changes detected in changelog. You call jwt.sign() in 4 places. session.js:47 uses the deprecated v8 signature.', citations: ['jsonwebtoken CHANGELOG.md', 'call site analysis'] },
    { reason: 'Test coverage on changed paths: 54%', detail: 'Below your repo average of 79%. Reduced coverage on auth-critical paths increases incident risk.', citations: ['coverage report, last CI run'] },
  ],
  recommended: 'Fix jwt.sign() at session.js:47 before merging.',
  elapsed: 47,
}

export default function PreMortem() {
  const [prNum, setPrNum] = useState('312')
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null)

  const runPreMortem = () => {
    setLoading(true); setShowResult(false); setExpandedFlag(null)
    setTimeout(() => { setLoading(false); setShowResult(true) }, 1800)
  }

  const levelColor = { LOW: 'var(--success)', ELEVATED: 'var(--warning)', HIGH: 'var(--danger)', CRITICAL: 'var(--danger)' }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Pre-Mortem Risk Scoring</div>
            <div className="page-subtitle">Sherlock scores every PR before it merges — target: under 60 seconds</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="demo-banner">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, flexShrink: 0, marginTop: 2, color: 'var(--accent)' }}>
            <circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v.5"/>
          </svg>
          <span>
            This is the opening act of the demo. Sherlock posts this warning, the engineer merges anyway, production breaks,
            then Sherlock diagnoses it in 7 seconds and references this exact warning.
          </span>
        </div>

        <div className="card mb-6">
          <div className="card-title mb-4">Analyze a pull request</div>
          <div className="flex gap-3 items-center">
            <span className="text-muted font-mono" style={{ fontSize: 12 }}>PR #</span>
            <input
              id="pr-number-input"
              className="text-input"
              value={prNum}
              onChange={e => setPrNum(e.target.value)}
              style={{ width: 80 }}
            />
            <button id="run-premortem-btn" className="btn btn-primary" onClick={runPreMortem} disabled={loading}>
              {loading ? 'Analyzing...' : 'Run pre-mortem'}
            </button>
            {showResult && (
              <span className="text-xs text-muted">Completed in {DEMO_PR.elapsed}s (target &lt;60s)</span>
            )}
          </div>
        </div>

        {loading && (
          <div className="reasoning-panel">
            <div className="reasoning-header">
              <span className="reasoning-header-dot" style={{ background: 'var(--warning)' }} />
              Foundry IQ — Scoring PR #{prNum}...
            </div>
            <div className="reasoning-body" style={{ padding: '8px 0' }}>
              {['Fetching PR diff from GitHub...', 'Checking file-level incident history...', 'Detecting dependency version bumps...', 'Analyzing call site compatibility...', 'Computing risk score...'].map((s, i) => (
                <div key={i} className="step">
                  <div className="step-time">{(i * 0.35).toFixed(1)}s</div>
                  <div className="step-thinking">{s}</div>
                </div>
              ))}
              <div className="step step-active">
                <div className="step-time">...</div>
                <div className="step-thinking cursor-blink">Computing</div>
              </div>
            </div>
          </div>
        )}

        {showResult && (
          <div className="pr-comment" id="pr-comment-preview">
            <div className="pr-comment-header">
              <div className="logo-mark" style={{ width: 20, height: 20, borderRadius: 4, fontSize: 10, display:'flex', alignItems:'center', justifyContent:'center', background: 'var(--accent)', flexShrink: 0 }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" style={{ width: 10 }}>
                  <circle cx="6" cy="6" r="3.5"/><path d="M9 9.5l4.5 4.5"/><path d="M4.5 5l1 1.5 1.5-2"/>
                </svg>
              </div>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 12 }}>Sherlock</strong>
              <span className="text-muted" style={{ fontSize: 11 }}>commented on PR #{DEMO_PR.number} · {DEMO_PR.elapsed}s after opening</span>
            </div>
            <div className="pr-comment-body" style={{ fontFamily: 'var(--font-sans)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Risk Assessment — PR #{DEMO_PR.number}</div>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: levelColor[DEMO_PR.risk_level as keyof typeof levelColor] }}>
                  {DEMO_PR.risk_score}%
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: levelColor[DEMO_PR.risk_level as keyof typeof levelColor] }}>
                    Incident Probability — {DEMO_PR.risk_level}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Based on file history, dependency changes, and coverage analysis
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Why I'm flagging this:</div>
              {DEMO_PR.flags.map((f, i) => (
                <div key={i} className="pr-flag" onClick={() => setExpandedFlag(expandedFlag === i ? null : i)}>
                  <div className="pr-flag-title" style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <span>{f.reason}</span>
                    <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"
                      style={{ width: 10, color: 'var(--text-muted)', transform: expandedFlag === i ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', flexShrink: 0 }}>
                      <path d="M1 1l4 4 4-4"/>
                    </svg>
                  </div>
                  {expandedFlag === i && (
                    <div style={{ marginTop: 8, animation: 'step-in 0.2s ease' }}>
                      <div className="pr-flag-detail">{f.detail}</div>
                      <div style={{ marginTop: 6 }}>
                        {f.citations.map((c, j) => <span key={j} className="step-citation">[Source: {c}]</span>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(232,85,85,0.2)', borderRadius: 6, padding: '10px 14px', margin: '12px 0', fontSize: 13 }}>
                <strong>Recommended:</strong> {DEMO_PR.recommended}<br />
                <span className="text-accent" style={{ cursor: 'pointer', textDecoration: 'underline' }}>Draft fix available — view suggested change</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Reasoning trace available — Sherlock
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
