import { useState, useEffect, useRef } from 'react'
import CascadeMap from '../components/CascadeMap'
import ConfidenceAnatomy from '../components/ConfidenceAnatomy'

interface ReasoningStep {
  type: string; step: string; label: string
  elapsed: number; result?: Record<string, unknown>
}

const DEMO_STEPS: ReasoningStep[] = [
  { type: 'step_complete', step: 'alert_intake', label: 'Alert received — GitHub Actions failure on main', elapsed: 0.8,
    result: { service_name: 'auth-service', error_type: 'NullReferenceException', error_location: 'auth/session.js:47', trigger: 'github_actions', citations: ['GitHub Actions run #8821'] } },
  { type: 'step_complete', step: 'log_analysis', label: 'Reading error logs', elapsed: 1.4,
    result: { error_message: 'NullReferenceException in auth/session.js line 47', first_occurrence: '2026-06-08T14:23:11Z', code_path: 'auth/session.js -> jwt.sign()', citations: ['application_logs: 2026-06-08T14:23:11Z'] } },
  { type: 'step_complete', step: 'commit_analysis', label: 'Pulling commits from last 24 hours', elapsed: 2.1,
    result: { suspicious_commits: ['PR #312 merged 2 hours ago'], suspect_pr: 312, overlap_files: ['auth/session.js', 'middleware/verify.js'], timeline_fit: true, citations: ['git log: PR #312, 2026-06-08T12:09:00Z'] } },
  { type: 'step_complete', step: 'pr_diff_analysis', label: 'Analyzing PR #312 diff', elapsed: 2.9,
    result: { changed_functions: ['jwt.sign() in session.js:47'], new_patterns: ['jsonwebtoken 8.5.1 to 9.0.0 major bump'], could_cause_error: true, explanation: 'PR #312 modified session token format in auth/session.js and touched middleware/verify.js', citations: ['PR #312 diff, auth/session.js:47'] } },
  { type: 'step_complete', step: 'dependency_detection', label: 'Checking dependency changes in window', elapsed: 3.6,
    result: { dependency_bumps: [{ name: 'jsonwebtoken', from: '8.5.1', to: '9.0.0', breaking: true }], breaking_changes: ['jwt.sign() signature changed in v9'], api_changes: 'options parameter now required', citations: ['jsonwebtoken CHANGELOG.md v9.0.0'] } },
  { type: 'step_complete', step: 'call_site_analysis', label: 'Scanning call sites for API mismatch', elapsed: 4.3,
    result: { call_sites: ['auth/session.js:47', 'auth/refresh.js:23', 'middleware/verify.js:61', 'tests/auth.test.js:12'], error_is_call_site: true, affected_lines: ['session.js:47 uses deprecated v8 signature'], citations: ['PR #312 diff, session.js:47'] } },
  { type: 'step_complete', step: 'hypothesis_formation', label: 'Forming hypothesis', elapsed: 5.1,
    result: { hypothesis: 'jsonwebtoken v9 introduced a breaking API change. jwt.sign() now requires an options object. session.js:47 still uses the v8 signature.', causal_chain: 'PR #312 bumped jsonwebtoken -> v9 signature change -> session.js:47 call fails -> auth-service down', timestamp_validation: 'First error 14 minutes after PR #312 merged', citations: ['PR #312 diff', 'jsonwebtoken CHANGELOG.md', 'application_logs'] } },
  { type: 'step_complete', step: 'confidence_scoring', label: 'Scoring confidence across 4 dimensions', elapsed: 5.8,
    result: { error_commit_correlation: { score: 96, explanation: 'Error location directly inside files changed in PR #312', citations: ['git diff PR #312, auth/session.js:47'] }, timeline_match: { score: 94, explanation: 'First error 14 minutes post-merge, consistent with cache invalidation delay', citations: ['application logs, 2026-06-08T14:23:11Z'] }, dependency_api_match: { score: 89, explanation: 'jwt.sign() signature change confirmed in v9 changelog, matches exact error signature', citations: ['jsonwebtoken CHANGELOG.md, v9.0.0'] }, historical_pattern: { score: 87, explanation: 'Similar jwt version-mismatch failure 52 days ago in the same service', citations: ['Incident #31, 2026-04-17'] }, overall: 91 } },
  { type: 'step_complete', step: 'fix_generation', label: 'Generating minimal fix (draft only)', elapsed: 6.2,
    result: { fix_description: 'Update jwt.sign() call at session.js:47 to use v9 signature with options object', file_path: 'auth/session.js', line_number: 47, old_code: 'jwt.sign(payload, secret)', new_code: "jwt.sign(payload, secret, { algorithm: 'HS256' })", test_suggestion: 'Add compatibility test for jwt.sign() v9 signature', citations: ['jsonwebtoken CHANGELOG.md v9.0.0', 'PR #312 diff'] } },
  { type: 'step_complete', step: 'cascade_mapping', label: 'Mapping failure cascade', elapsed: 6.8,
    result: { origin_service: 'auth-service', cascade_services: [{ name: 'api-gateway', reason: 'Blocked on auth, returning 503', status: 'cascade' }, { name: 'user-service', reason: 'Cannot validate requests', status: 'cascade' }, { name: 'payment-service', reason: 'Auth dependency timeout', status: 'cascade' }], healthy_services: [{ name: 'notification-service', reason: 'Queue buffering' }, { name: 'data-service', reason: 'No auth dependency' }], fix_recommendation: 'Fix auth-service only. Everything else recovers automatically.', do_not_restart: ['api-gateway', 'user-service', 'payment-service'], citations: ['service dependency graph'] } },
]

const STEP_DETAILS: Record<string, (r: Record<string, unknown>) => string> = {
  alert_intake: r => `${r.error_type} in ${r.error_location}\nTrigger: ${r.trigger}`,
  log_analysis: r => `${r.error_message}\nFirst occurrence: ${r.first_occurrence}`,
  commit_analysis: r => `Found 3 commits. ${(r.suspicious_commits as string[])[0]}\nFiles overlapping with error: ${(r.overlap_files as string[]).join(', ')}`,
  pr_diff_analysis: r => `Changed: ${(r.changed_functions as string[]).join(', ')}\n${r.explanation}`,
  dependency_detection: r => { const b = (r.dependency_bumps as {name:string,from:string,to:string}[])[0]; return `${b.name} ${b.from} -> ${b.to} (major version)\n${(r.breaking_changes as string[]).join(', ')}` },
  call_site_analysis: r => `${(r.call_sites as string[]).length} call sites found: ${(r.call_sites as string[]).slice(0,2).join(', ')} ...\n${(r.affected_lines as string[])[0]}`,
  hypothesis_formation: r => `${r.hypothesis}\n${r.timestamp_validation}`,
  confidence_scoring: r => `Overall: ${(r as {overall:number}).overall}% — HIGH CONFIDENCE`,
  fix_generation: r => `${r.fix_description}\n${r.file_path}:${r.line_number}\n  - ${r.old_code}\n  + ${r.new_code}`,
  cascade_mapping: r => `Origin: ${r.origin_service}\n${r.fix_recommendation}`,
}

function getDetail(step: string, result: Record<string, unknown>): string | null {
  try { return STEP_DETAILS[step]?.(result) ?? null } catch { return null }
}
function getCitations(result: Record<string, unknown>): string[] {
  try { const c = (result as {citations?: unknown}).citations; return Array.isArray(c) ? c as string[] : [] } catch { return [] }
}

function StepRow({ step, isLast }: { step: ReasoningStep; isLast: boolean }) {
  const detail = step.result ? getDetail(step.step, step.result) : null
  const citations = step.result ? getCitations(step.result) : []
  return (
    <div className={`step ${isLast ? 'step-active' : 'step-done'}`}>
      <div className="step-time">[{step.elapsed}s]</div>
      <div style={{ flex: 1 }}>
        <div className="step-label">{step.label}</div>
        {detail && <div className="step-detail">{detail}</div>}
        {citations.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {citations.map((c, i) => <span key={i} className="step-citation" title={c}>[Source: {c}]</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function IncidentView({ incidentId: _incidentId }: { incidentId: number }) {
  const [steps, setSteps] = useState<ReasoningStep[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [activeTab, setActiveTab] = useState<'chain' | 'confidence' | 'cascade' | 'fix' | 'runbook'>('chain')
  const [approved, setApproved] = useState(false)
  const [streamStatus, setStreamStatus] = useState<null | 'connecting' | 'streaming' | 'offline_fallback' | 'error'>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [steps])

  const startStreaming = () => {
    setSteps([])
    setIsDone(false)
    setIsStreaming(true)
    setActiveTab('chain')
    setApproved(false)
    setStreamStatus('connecting')

    let fallbackTriggered = false
    const triggerFallback = () => {
      if (fallbackTriggered) return
      fallbackTriggered = true
      setStreamStatus('offline_fallback')
      let i = 0
      const interval = setInterval(() => {
        if (i < DEMO_STEPS.length) {
          setSteps(prev => [...prev, DEMO_STEPS[i]])
          i++
        } else {
          clearInterval(interval)
          setIsStreaming(false)
          setIsDone(true)
        }
      }, 680)
    }

    try {
      const url = `http://localhost:8000/api/incidents/stream/${_incidentId}`
      const es = new EventSource(url)

      es.onopen = () => {
        setStreamStatus('streaming')
      }

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'step_start') {
            setSteps(prev => {
              const exists = prev.some(s => s.step === data.step)
              if (exists) return prev
              return [...prev, { step: data.step, label: data.label, result: null } as any]
            })
          } else if (data.type === 'step_complete') {
            setSteps(prev => {
              const updated = prev.map(s => {
                if (s.step === data.step) {
                  return { ...s, result: data.result }
                }
                return s
              })
              const exists = prev.some(s => s.step === data.step)
              if (!exists) {
                updated.push({ step: data.step, label: data.label, result: data.result } as any)
              }
              return updated
            })
          } else if (data.type === 'done') {
            es.close()
            setIsStreaming(false)
            setIsDone(true)
          }
        } catch (err) {
          console.error("Error parsing stream event", err)
        }
      }

      es.onerror = () => {
        es.close()
        if (steps.length === 0) {
          triggerFallback()
        } else {
          setStreamStatus('error')
          setIsStreaming(false)
          setIsDone(true) // let them view what was loaded
        }
      }
    } catch (err) {
      console.error("Failed to start event source", err)
      triggerFallback()
    }
  }

  const confidenceData = isDone ? (DEMO_STEPS[7].result as unknown) as Parameters<typeof ConfidenceAnatomy>[0]['data'] : null
  const cascadeData = isDone ? (DEMO_STEPS[9].result as unknown) as Parameters<typeof CascadeMap>[0]['data'] : null
  const fixData = isDone ? DEMO_STEPS[8].result : null

  const TABS = [
    { id: 'chain',      label: 'Reasoning Chain', disabled: false },
    { id: 'confidence', label: 'Confidence',       disabled: !isDone },
    { id: 'cascade',    label: 'Cascade Map',      disabled: !isDone },
    { id: 'fix',        label: 'Draft Fix',        disabled: !isDone },
    { id: 'runbook',    label: 'Runbook',          disabled: !isDone },
  ] as const

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">Incident #47 — auth-service</div>
            <div className="page-subtitle">GitHub Actions failure · PR #312 · 4 services affected</div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-danger">Active</span>
            {!isStreaming && !isDone && (
              <button id="run-chain-btn" className="btn btn-danger" onClick={startStreaming}>Run reasoning chain</button>
            )}
            {isStreaming && <span className="badge badge-warning">Analyzing...</span>}
            {isDone && <button className="btn btn-ghost btn-sm" onClick={startStreaming}>Replay</button>}
          </div>
        </div>
      </div>

      <div className="p-6">
        {isDone && (
          <div className="grid-2 mb-6" style={{ gap: '16px' }}>
            <div className="card" style={{ border: '1px solid rgba(63,185,80,0.3)', background: 'rgba(63,185,80,0.02)' }}>
              <div className="card-title mb-3" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
                  <path d="M2 8l4 4 8-8"/>
                </svg>
                Blast Radius Audit: 2 Services Verified Safe
              </div>
              <div className="space-y" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--bg-base)', borderRadius: '4px' }}>
                  <span className="svc-dot green" />
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>notification-service</span>
                  <span style={{ marginLeft: 'auto' }}>Queue buffering active · Unaffected by auth API drift</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--bg-base)', borderRadius: '4px' }}>
                  <span className="svc-dot green" />
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>data-service</span>
                  <span style={{ marginLeft: 'auto' }}>Serving cached resources · No active session dependencies</span>
                </div>
              </div>
              <div className="text-xs text-muted mt-3">
                <strong>Directive:</strong> Services B and C are safe. Do not restart these.
              </div>
            </div>

            <div className="card" style={{ border: '1px solid rgba(248,81,73,0.3)', background: 'rgba(248,81,73,0.02)' }}>
              <div className="card-title mb-3" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
                  <circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v.5"/>
                </svg>
                Mitigation Advisory: Do NOT Restart
              </div>
              <div className="space-y" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--bg-base)', borderRadius: '4px' }}>
                  <span className="svc-dot red" />
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>api-gateway</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--danger)' }}>Do NOT Restart</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: 'var(--bg-base)', borderRadius: '4px' }}>
                  <span className="svc-dot red" />
                  <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>payment-service</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--danger)' }}>Do NOT Restart</span>
                </div>
              </div>
              <div className="text-xs text-muted mt-3">
                <strong>Crucial:</strong> Restarting the gateway or payment pipeline will not resolve token verification mismatch and could corrupt transaction states.
              </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 2', border: '1px solid rgba(188,140,255,0.3)', background: 'rgba(188,140,255,0.02)' }}>
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 16 16" fill="none" stroke="var(--cascade)" strokeWidth="1.5" style={{ width: 18, height: 18, flexShrink: 0 }}>
                  <circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v.5"/>
                </svg>
                <div style={{ fontSize: '13px' }}>
                  <strong>Memory Matching:</strong> Identical signature matched to **Incident #31** (52 days ago). Resolving the token format issue in `session.js` via **PR #313** will restore downstream health instantly.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reasoning chain */}
        {activeTab === 'chain' && (
          <div className="reasoning-panel">
            <div className="reasoning-header" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="reasoning-header-dot" />
              <span>Foundry IQ — multi-step grounded retrieval</span>
              {streamStatus === 'offline_fallback' && (
                <span className="badge badge-info" style={{ marginLeft: 10, fontSize: 9, padding: '2px 6px' }}>
                  Simulator Fallback
                </span>
              )}
              {streamStatus === 'streaming' && (
                <span className="badge badge-success" style={{ marginLeft: 10, fontSize: 9, padding: '2px 6px' }}>
                  Live Stream Active
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 11 }}>Every claim cited · Read-only during diagnosis</span>
            </div>
            <div className="reasoning-body" ref={bodyRef}>
              {streamStatus === 'error' && (
                <div className="alert-banner warning" style={{ margin: '8px 12px', padding: '8px 12px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, color: 'var(--warning)', flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="6.5"/><path d="M8 5v4M8 11v.5"/>
                  </svg>
                  <span style={{ fontSize: 12 }}>API stream disconnected unexpectedly. Displaying cached diagnostics.</span>
                </div>
              )}
              {steps.length === 0 && !isStreaming && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                  Click <strong style={{ color: 'var(--text-secondary)' }}>Run reasoning chain</strong> to start live incident analysis
                </div>
              )}
              {steps.map((step, idx) => (
                <StepRow key={idx} step={step} isLast={idx === steps.length - 1 && !isDone} />
              ))}
              {isStreaming && (
                <div className="step step-active">
                  <div className="step-time">...</div>
                  <div className="step-thinking cursor-blink">Analyzing</div>
                </div>
              )}
              {isDone && (
                <div className="step step-done" style={{ background: 'var(--success-dim)', borderLeft: '2px solid var(--success)' }}>
                  <div className="step-time" style={{ color: 'var(--success)' }}>[6.8s]</div>
                  <div style={{ flex: 1 }}>
                    <div className="step-label" style={{ color: 'var(--success)' }}>Root cause confirmed — 91% confidence</div>
                    <div className="step-detail">jsonwebtoken v9 breaking API change · jwt.sign() at session.js:47 · PR #312</div>
                    <div style={{ marginTop: 4 }}>
                      <span className="step-citation">[Source: PR #312 diff]</span>
                      <span className="step-citation">[Source: jsonwebtoken CHANGELOG.md]</span>
                      <span className="step-citation">[Source: Incident #31]</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'confidence' && confidenceData && <ConfidenceAnatomy data={confidenceData} />}
        {activeTab === 'cascade' && cascadeData && <CascadeMap data={cascadeData} />}

        {activeTab === 'fix' && fixData && (
          <div className="space-y">
            <div className="alert-banner warning">
              <svg className="alert-banner-icon" viewBox="0 0 16 16" fill="none" stroke="var(--warning)" strokeWidth="1.5"><path d="M8 1l7 13H1L8 1z"/><path d="M8 6v4M8 12v.5"/></svg>
              <div><strong>Draft PR only.</strong> Sherlock never auto-merges. Human approval required before any change is applied.</div>
            </div>
            <div className="card">
              <div className="card-title mb-4">Suggested fix — auth/session.js:47</div>
              <div className="code-diff">
                <div className="diff-del">- {fixData.old_code as string}</div>
                <div className="diff-add">+ {fixData.new_code as string}</div>
              </div>
              <div className="text-sm text-muted mt-3">{fixData.fix_description as string}</div>
              <div className="flex gap-2 mt-4">
                {!approved ? (
                  <button id="approve-fix-btn" className="btn btn-success" onClick={() => setApproved(true)}>
                    Approve draft PR #313
                  </button>
                ) : (
                  <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: 12 }}>
                    PR #313 approved — deploying
                  </span>
                )}
                <button className="btn btn-ghost">View on GitHub</button>
              </div>
            </div>
            <div className="card">
              <div className="card-title mb-3">Suggested test</div>
              <div className="font-mono text-sm text-muted">{fixData.test_suggestion as string}</div>
            </div>
          </div>
        )}

        {activeTab === 'runbook' && (
          <div className="card">
            <div className="card-title mb-4">Auto-generated runbook — Incident #47</div>
            <div className="font-mono text-sm text-muted" style={{ lineHeight: 2, whiteSpace: 'pre-wrap' }}>
{`INCIDENT RUNBOOK
Incident #47 — auth-service failure
Date: June 8, 2026  |  Duration: 23 min  |  Severity: High

ROOT CAUSE
jsonwebtoken major version bump introduced a breaking API change.
jwt.sign() signature changed in v9. Code at session.js:47 used v8 signature.

DETECTION SIGNALS
  Response time increase in auth-service (+34% over 4hr before failure)
  jwt-related errors appearing in logs ~14 minutes before full failure
  Major dependency version bump in a recent PR

RESOLUTION
  Updated jwt.sign() at session.js:47 to use the v9 options object signature.
  PR #313 — 4-line fix. Deployed in 11 minutes.

PREVENTION
  Sherlock now flags major jwt version bumps as elevated risk in pre-mortem
  Pre-mortem check added for any changes to auth-service files
  Compatibility test added for jwt.sign() v9 signature

SIMILAR INCIDENTS
  #31 (52 days ago) — identical root cause, same 8-minute fix
  #18 (4 months ago) — jwt API drift after library upgrade
  Pattern: recurring jwt API drift after major version bumps`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
