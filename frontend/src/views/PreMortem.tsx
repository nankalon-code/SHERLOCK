import { useState } from 'react'

const DEMO_PR = {
  number: 312, title: 'chore: bump jsonwebtoken to 9.0.0',
  risk_score: 38, risk_level: 'ELEVATED',
  flags: [
    { reason: 'Modifies auth/session.js', detail: 'Your last 2 production incidents originated in this file. Historical failure rate: 41%', citations: ['Incident #31', 'Incident #18'] },
    { reason: 'Introduces jsonwebtoken 8.5.1 → 9.0.0 (major bump)', detail: 'Breaking API changes detected. You call jwt.sign() in 4 places. session.js:47 uses deprecated v8 signature ⚠️', citations: ['jsonwebtoken CHANGELOG.md', 'call site analysis'] },
    { reason: 'Test coverage on changed paths: 54%', detail: 'Below your repo average of 79%.', citations: ['coverage report, last CI run'] },
  ],
  recommended: 'Fix jwt.sign() at session.js:47 before merging.',
  elapsed: 47,
}

export default function PreMortem() {
  const [prNum, setPrNum] = useState('312')
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)

  const runPreMortem = () => {
    setLoading(true)
    setShowResult(false)
    setTimeout(() => { setLoading(false); setShowResult(true) }, 1800)
  }

  const levelColor = { LOW: 'var(--success)', ELEVATED: 'var(--warning)', HIGH: 'var(--danger)', CRITICAL: 'var(--danger)' }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔍 Pre-Mortem PR Risk Scoring</div>
        <div className="page-subtitle">Sherlock scores every PR before it merges — in under 60 seconds</div>
      </div>

      <div className="p-6">
        <div className="demo-banner">
          <span>ℹ️</span>
          <span>This is the opening act of the demo. Sherlock posts this warning → engineer merges anyway → production breaks → Sherlock diagnoses it in 7 seconds and references this exact warning.</span>
        </div>

        <div className="card mb-6">
          <div className="card-title mb-4">Analyze a Pull Request</div>
          <div className="flex gap-2 items-center">
            <span className="text-muted font-mono">PR #</span>
            <input
              value={prNum} onChange={e => setPrNum(e.target.value)}
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 14, width: 100 }}
            />
            <button className="btn btn-primary" onClick={runPreMortem} disabled={loading}>
              {loading ? '⏳ Analyzing...' : '🔍 Run Pre-Mortem'}
            </button>
            {showResult && <span className="text-xs text-muted">Completed in {DEMO_PR.elapsed}s ✓ (target: &lt;60s)</span>}
          </div>
        </div>

        {loading && (
          <div className="reasoning-panel">
            <div className="reasoning-header">
              <span style={{ color: 'var(--warning)', fontSize: 10 }}>●</span> Foundry IQ — Scoring PR #{prNum}...
            </div>
            <div className="reasoning-body">
              {['Fetching PR diff...', 'Checking file-level incident history...', 'Detecting dependency version bumps...', 'Analyzing call site compatibility...', 'Computing risk score...'].map((s, i) => (
                <div key={i} className="step">
                  <div className="step-time">{(i * 0.4).toFixed(1)}s</div>
                  <div className="step-content step-thinking">{s}</div>
                </div>
              ))}
              <div className="step">
                <div className="step-time">...</div>
                <div className="step-content step-thinking cursor-blink">Computing</div>
              </div>
            </div>
          </div>
        )}

        {showResult && (
          <div className="pr-comment">
            <div className="pr-comment-header">
              <div className="logo-icon" style={{ width: 24, height: 24, fontSize: 12 }}>S</div>
              <strong>Sherlock</strong>
              <span className="text-muted">commented on PR #{DEMO_PR.number} · {DEMO_PR.elapsed}s after opening</span>
            </div>
            <div className="pr-comment-body">
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>🔍 Sherlock Risk Assessment</div>
              <div style={{ marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
                <strong>Incident Probability: </strong>
                <span style={{ fontSize: 18, fontWeight: 800, color: levelColor[DEMO_PR.risk_level as keyof typeof levelColor] }}>{DEMO_PR.risk_score}%</span>
                <span className={`badge badge-warning`} style={{ marginLeft: 8 }}>{DEMO_PR.risk_level}</span>
              </div>
              <div style={{ marginBottom: 10, color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <strong>Why I'm flagging this:</strong>
              </div>
              {DEMO_PR.flags.map((f, i) => (
                <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'Inter', fontSize: 13 }}>→ {f.reason}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4, fontFamily: 'Inter' }}>{f.detail}</div>
                  <div style={{ marginTop: 4 }}>
                    {f.citations.map((c, j) => <span key={j} className="step-citation">[Source: {c}]</span>)}
                  </div>
                </div>
              ))}
              <div style={{ background: 'var(--danger-glow)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 6, padding: '10px 14px', margin: '12px 0', fontFamily: 'Inter', fontSize: 13 }}>
                <strong>Recommended:</strong> {DEMO_PR.recommended}<br />
                <span className="text-accent">Draft fix available — [View fix]</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'Inter' }}>Reasoning trace: [View full chain] — Sherlock</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
