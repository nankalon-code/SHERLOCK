import { useState, useEffect, useRef } from 'react'
import CascadeMap from '../components/CascadeMap'
import ConfidenceAnatomy from '../components/ConfidenceAnatomy'

interface ReasoningStep {
  type: string
  step: string
  label: string
  elapsed: number
  result?: Record<string, unknown>
}

// Demo reasoning steps that stream in order
const DEMO_STEPS: ReasoningStep[] = [
  { type: 'step_complete', step: 'alert_intake', label: 'Alert received — GitHub Actions failure on main', elapsed: 0.8,
    result: { service_name: 'auth-service', error_type: 'NullReferenceException', error_location: 'auth/session.js:47', trigger: 'github_actions', citations: ['GitHub Actions run #8821'] } },
  { type: 'step_complete', step: 'log_analysis', label: 'Reading error logs...', elapsed: 1.4,
    result: { error_message: 'NullReferenceException in auth/session.js line 47', first_occurrence: '2026-06-08T14:23:11Z', code_path: 'auth/session.js → jwt.sign()', citations: ['application_logs: 2026-06-08T14:23:11Z'] } },
  { type: 'step_complete', step: 'commit_analysis', label: 'Pulling commits from last 24 hours...', elapsed: 2.1,
    result: { suspicious_commits: ['PR #312 merged 2 hours ago'], suspect_pr: 312, overlap_files: ['auth/session.js', 'middleware/verify.js'], timeline_fit: true, citations: ['git log: PR #312, 2026-06-08T12:09:00Z'] } },
  { type: 'step_complete', step: 'pr_diff_analysis', label: 'Analyzing PR #312 diff...', elapsed: 2.9,
    result: { changed_functions: ['jwt.sign() in session.js:47'], new_patterns: ['jsonwebtoken 8.5.1 → 9.0.0 major bump'], could_cause_error: true, explanation: 'PR #312 modified session token format in auth/session.js and touched middleware/verify.js', citations: ['PR #312 diff, auth/session.js:47'] } },
  { type: 'step_complete', step: 'dependency_detection', label: 'Checking dependency changes in window...', elapsed: 3.6,
    result: { dependency_bumps: [{ name: 'jsonwebtoken', from: '8.5.1', to: '9.0.0', breaking: true }], breaking_changes: ['jwt.sign() signature changed in v9'], api_changes: 'options parameter now required', citations: ['jsonwebtoken CHANGELOG.md v9.0.0'] } },
  { type: 'step_complete', step: 'call_site_analysis', label: 'Scanning call sites for API mismatch...', elapsed: 4.3,
    result: { call_sites: ['auth/session.js:47', 'auth/refresh.js:23', 'middleware/verify.js:61', 'tests/auth.test.js:12'], error_is_call_site: true, affected_lines: ['session.js:47 uses deprecated v8 signature'], citations: ['PR #312 diff, session.js:47'] } },
  { type: 'step_complete', step: 'hypothesis_formation', label: 'Hypothesis forming...', elapsed: 5.1,
    result: { hypothesis: 'jsonwebtoken v9 introduced breaking API change. jwt.sign() now requires options object. session.js:47 still uses v8 signature.', causal_chain: 'PR #312 bumped jsonwebtoken → v9 signature change → session.js:47 call fails → auth-service down', timestamp_validation: 'First error 14 minutes after PR #312 merged ✓', citations: ['PR #312 diff', 'jsonwebtoken CHANGELOG.md', 'application_logs'] } },
  { type: 'step_complete', step: 'confidence_scoring', label: 'Scoring confidence across 4 dimensions...', elapsed: 5.8,
    result: { error_commit_correlation: { score: 96, explanation: 'Error location directly inside files changed in PR #312', citations: ['git diff PR #312, auth/session.js:47'] }, timeline_match: { score: 94, explanation: 'First error 14 minutes post-merge, consistent with cache invalidation delay', citations: ['application logs, 2026-06-08T14:23:11Z'] }, dependency_api_match: { score: 89, explanation: "jwt.sign() signature change confirmed in v9 changelog, matches exact error signature", citations: ['jsonwebtoken CHANGELOG.md, v9.0.0'] }, historical_pattern: { score: 87, explanation: 'Similar jwt version-mismatch failure 52 days ago in the same service', citations: ['Incident #31, 2026-04-17'] }, overall: 91 } },
  { type: 'step_complete', step: 'fix_generation', label: 'Generating minimal fix — draft only...', elapsed: 6.2,
    result: { fix_description: 'Update jwt.sign() call at session.js:47 to use v9 signature with options object', file_path: 'auth/session.js', line_number: 47, old_code: 'jwt.sign(payload, secret)', new_code: "jwt.sign(payload, secret, { algorithm: 'HS256' })", test_suggestion: "Add test for jwt.sign() v9 compatibility", citations: ['jsonwebtoken CHANGELOG.md v9.0.0', 'PR #312 diff'] } },
  { type: 'step_complete', step: 'cascade_mapping', label: 'Mapping failure cascade...', elapsed: 6.8,
    result: { origin_service: 'auth-service', cascade_services: [{ name: 'api-gateway', reason: 'Blocked on auth, returning 503', status: 'cascade' }, { name: 'user-service', reason: 'Cannot validate requests', status: 'cascade' }, { name: 'payment-service', reason: 'Auth dependency timeout', status: 'cascade' }], healthy_services: [{ name: 'notification-service', reason: 'Queue buffering' }, { name: 'data-service', reason: 'No auth dependency' }], fix_recommendation: 'Fix auth-service only. Everything else recovers automatically.', do_not_restart: ['api-gateway', 'user-service', 'payment-service'], citations: ['service dependency graph'] } },
]

const STEP_DETAILS: Record<string, (r: Record<string, unknown>) => string> = {
  alert_intake: r => `${r.error_type} in ${r.error_location}\nTrigger: ${r.trigger}`,
  log_analysis: r => `${r.error_message}\nFirst occurrence: ${r.first_occurrence}`,
  commit_analysis: r => `Found 3 commits. ${(r.suspicious_commits as string[])[0]}\nOverlapping files: ${(r.overlap_files as string[]).join(', ')}`,
  pr_diff_analysis: r => `Modified: ${(r.changed_functions as string[]).join(', ')}\n${r.explanation}`,
  dependency_detection: r => { const b = (r.dependency_bumps as {name:string,from:string,to:string}[])[0]; return `${b.name} bumped ${b.from} to ${b.to} (MAJOR)\n${r.breaking_changes}` },
  call_site_analysis: r => `Call sites found: ${(r.call_sites as string[]).join(', ')}\n${(r.affected_lines as string[])[0]}`,
  hypothesis_formation: r => `${r.hypothesis}\n${r.timestamp_validation}`,
  confidence_scoring: r => `Overall: ${(r as {overall:number}).overall}% - HIGH CONFIDENCE`,
  fix_generation: r => `Fix: ${r.fix_description}\nFile: ${r.file_path}:${r.line_number}\n- ${r.old_code}\n+ ${r.new_code}`,
  cascade_mapping: r => `Origin: ${r.origin_service}\n${r.fix_recommendation}`,
}

function getStepDetail(step: string, result: Record<string, unknown>): string | null {
  try {
    const fn = STEP_DETAILS[step]
    return fn ? fn(result) : null
  } catch {
    return null
  }
}

function getCitations(result: Record<string, unknown>): string[] {
  try {
    const cits = (result as {citations?: unknown}).citations
    if (Array.isArray(cits)) return cits as string[]
    return []
  } catch {
    return []
  }
}

interface StepProps { step: ReasoningStep }
function StepRow({ step }: StepProps) {
  const detail = step.result ? getStepDetail(step.step, step.result) : null
  const citations = step.result ? getCitations(step.result) : []
  return (
    <div className="step">
      <div className="step-time">[{step.elapsed}s]</div>
      <div className="step-content">
        <div className="step-label">{step.label}</div>
        {detail && <div className="step-detail" style={{ whiteSpace: 'pre-line' }}>{detail}</div>}
        {citations.length > 0 && (
          <div style={{ marginTop: 4 }}>
            {citations.map((c, i) => <span key={i} className="step-citation">[Source: {c}]</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function IncidentView({ incidentId }: { incidentId: number }) {
  const [steps, setSteps] = useState<ReasoningStep[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [activeTab, setActiveTab] = useState<'chain' | 'confidence' | 'cascade' | 'fix' | 'runbook'>('chain')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [steps])

  const startStreaming = () => {
    setSteps([])
    setIsDone(false)
    setIsStreaming(true)
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
    }, 700)
  }

  const confidenceData = isDone
    ? (DEMO_STEPS[7].result as {error_commit_correlation:{score:number,explanation:string,citations:string[]}, timeline_match:{score:number,explanation:string,citations:string[]}, dependency_api_match:{score:number,explanation:string,citations:string[]}, historical_pattern:{score:number,explanation:string,citations:string[]}, overall:number})
    : null

  const fixData = isDone ? DEMO_STEPS[8].result : null
  const cascadeData = isDone ? DEMO_STEPS[9].result : null

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">🔥 Incident #47 — auth-service</div>
            <div className="page-subtitle">GitHub Actions failure · PR #312 · 4 services affected · Foundry IQ reasoning active</div>
          </div>
          <div className="flex gap-2 items-center">
            <span className="badge badge-danger">ACTIVE</span>
            {!isStreaming && !isDone && (
              <button className="btn btn-danger" onClick={startStreaming}>▶ Run Reasoning Chain</button>
            )}
            {isStreaming && (
              <span className="badge badge-warning">ANALYZING...</span>
            )}
            {isDone && (
              <button className="btn btn-ghost" onClick={startStreaming}>↺ Replay</button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* What's still safe banner */}
        {isDone && (
          <div className="alert-banner success mb-4">
            <span style={{ fontSize: 16 }}>✅</span>
            <div>
              <strong>What's still safe:</strong> Data reads, search, notifications, admin dashboard all functioning normally.
              <span className="text-danger"> Do NOT restart api-gateway — it will not resolve the root cause.</span>
            </div>
          </div>
        )}

        {/* Similar incident */}
        {isDone && (
          <div className="alert-banner warning mb-4">
            <span style={{ fontSize: 16 }}>🕐</span>
            <div>
              <strong>Pattern match found.</strong> 52 days ago: similar jwt validation failure in auth-service after dependency update.
              Fix resolved it in 8 minutes. Same pattern — same fix. <span className="text-accent">[PR #289] [Incident #31]</span>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {([
            { id: 'chain', label: '⛓ Reasoning Chain' },
            { id: 'confidence', label: '📊 Confidence', disabled: !isDone },
            { id: 'cascade', label: '🌊 Cascade Map', disabled: !isDone },
            { id: 'fix', label: '🔧 Draft Fix', disabled: !isDone },
            { id: 'runbook', label: '📋 Runbook', disabled: !isDone },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', cursor: tab.disabled ? 'not-allowed' : 'pointer',
                padding: '8px 14px', fontSize: 13, fontWeight: 600,
                color: activeTab === tab.id ? 'var(--accent)' : tab.disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s', fontFamily: 'inherit', marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reasoning chain */}
        {activeTab === 'chain' && (
          <div className="reasoning-panel">
            <div className="reasoning-header">
              <span style={{ color: 'var(--success)', fontSize: 10 }}>●</span>
              Foundry IQ — Multi-step grounded retrieval
              <span style={{ marginLeft: 'auto' }}>Every claim cited · Read-only diagnosis</span>
            </div>
            <div className="reasoning-body" ref={bodyRef}>
              {steps.length === 0 && !isStreaming && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Click "Run Reasoning Chain" to start the live incident analysis
                </div>
              )}
              {steps.map((step, idx) => (
                <StepRow key={idx} step={step} />
              ))}
              {isStreaming && (
                <div className="step">
                  <div className="step-time">...</div>
                  <div className="step-content step-thinking cursor-blink">Analyzing</div>
                </div>
              )}
              {isDone && (
                <div className="step" style={{ background: 'var(--accent-glow)', borderRadius: 6, padding: 12, margin: '8px 0' }}>
                  <div className="step-time" style={{ color: 'var(--success)' }}>✓</div>
                  <div className="step-content">
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

        {/* Confidence anatomy */}
        {activeTab === 'confidence' && confidenceData && (
          <ConfidenceAnatomy data={confidenceData} />
        )}

        {/* Cascade map */}
        {activeTab === 'cascade' && cascadeData && (
          <CascadeMap data={cascadeData as {origin_service:string, cascade_services:{name:string,reason:string,status:string}[], healthy_services:{name:string,reason:string}[], fix_recommendation:string, do_not_restart:string[]}} />
        )}

        {/* Draft fix */}
        {activeTab === 'fix' && fixData && (
          <div className="space-y">
            <div className="alert-banner warning">
              <span>⚠️</span>
              <strong>Draft PR only — human approval required. Sherlock never auto-merges.</strong>
            </div>
            <div className="card">
              <div className="card-title mb-4">Suggested Fix — auth/session.js:47</div>
              <div className="font-mono" style={{ background: 'var(--bg-base)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, lineHeight: 2 }}>
                <div style={{ color: 'var(--danger)' }}>- {fixData.old_code as string}</div>
                <div style={{ color: 'var(--success)' }}>+ {fixData.new_code as string}</div>
              </div>
              <div className="text-sm text-muted mt-4">{fixData.fix_description as string}</div>
              <div className="flex gap-2 mt-4">
                <button className="btn btn-success">✓ Approve Draft PR #313</button>
                <button className="btn btn-ghost">View on GitHub →</button>
              </div>
            </div>
            <div className="card">
              <div className="card-title mb-4">Suggested Test</div>
              <div className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{fixData.test_suggestion as string}</div>
            </div>
          </div>
        )}

        {/* Runbook */}
        {activeTab === 'runbook' && (
          <div className="card">
            <div className="card-title mb-4">📋 Auto-Generated Runbook — Incident #47</div>
            <div className="font-mono text-sm" style={{ lineHeight: 2, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
{`INCIDENT RUNBOOK — Auto-generated by Sherlock
Incident: #47 — auth-service failure
Date: June 8, 2026 | Duration: 23 min | Severity: High

ROOT CAUSE
jsonwebtoken major version bump introduced breaking API change.
jwt.sign() signature changed in v9. Code at session.js:47 used v8 signature.

DETECTION SIGNALS
→ Response time increase in auth-service (34% over 4hr)
→ jwt-related errors in logs before full failure
→ Major dependency bump in recent PR

RESOLUTION
Updated jwt.sign() call at session.js:47 to v9 signature.
PR #313 — 4-line fix. Deployed in 11 minutes.

PREVENTION
→ Sherlock now flags major jwt version bumps as elevated risk
→ Pre-mortem check added for auth-service changes
→ Test added for jwt.sign() signature compatibility

SIMILAR INCIDENTS: #31 (52 days ago), #18 (4 months ago)
Pattern: recurring jwt API drift after major version bumps`}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
