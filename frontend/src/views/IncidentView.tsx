import { useState, useEffect } from 'react'
import CascadeMap from '../components/CascadeMap'
import ConfidenceAnatomy from '../components/ConfidenceAnatomy'

interface ReasoningStep {
  type: string; step: string; label: string
  elapsed: number; result?: Record<string, unknown>
  title?: string; desc?: string; time?: string; icon?: string; status?: string;
}

const DEMO_STEPS: ReasoningStep[] = [
  { type: 'step_complete', step: 'alert_intake', label: 'Alert received', elapsed: 0.8,
    title: 'Incident Detected', time: '09:42:10 AM', desc: 'Alert triggered for e-commerce checkout failure.', icon: 'alert', status: 'COMPLETE/ACTIVE',
    result: { service_name: 'auth-service', error_type: 'NullReferenceException', error_location: 'auth/session.js:47', trigger: 'github_actions', citations: ['GitHub Actions run #8821'] } },
  { type: 'step_complete', step: 'log_analysis', label: 'Reading error logs', elapsed: 1.4,
    title: 'Ingesting Logs', time: '09:42:15 AM', desc: 'Aggregating logs from checkout and payment gateways.', icon: 'db', status: 'COMPLETE/ACTIVE',
    result: { error_message: 'NullReferenceException in auth/session.js line 47', first_occurrence: '2026-06-08T14:23:11Z', code_path: 'auth/session.js -> jwt.sign()', citations: ['application_logs: 2026-06-08T14:23:11Z'] } },
  { type: 'step_complete', step: 'commit_analysis', label: 'Metric Analysis', elapsed: 2.1,
    title: 'Metric Analysis', time: '09:42:25 AM', desc: 'Analyzing latency and error rate metrics.', icon: 'chart', status: 'COMPLETE/ACTIVE',
    result: { suspicious_commits: ['PR #312 merged 2 hours ago'], suspect_pr: 312, overlap_files: ['auth/session.js', 'middleware/verify.js'], timeline_fit: true, citations: ['git log: PR #312, 2026-06-08T12:09:00Z'] } },
  { type: 'step_complete', step: 'pr_diff_analysis', label: 'Pattern Recognition', elapsed: 2.9,
    title: 'Pattern Recognition', time: '09:42:38 AM', desc: 'Cross-referencing historical outage signatures.', icon: 'pulse', status: 'COMPLETE/ACTIVE',
    result: { changed_functions: ['jwt.sign() in session.js:47'], new_patterns: ['jsonwebtoken 8.5.1 to 9.0.0 major bump'], could_cause_error: true, explanation: 'PR #312 modified session token format in auth/session.js and touched middleware/verify.js', citations: ['PR #312 diff, auth/session.js:47'] } },
  { type: 'step_complete', step: 'dependency_detection', label: 'Identifying Anomaly', elapsed: 3.6,
    title: 'Identifying Anomaly', time: '09:42:50 AM', desc: 'Detected latency spike in downstream dependencies.', icon: 'triangle', status: 'COMPLETE/ACTIVE',
    result: { dependency_bumps: [{ name: 'jsonwebtoken', from: '8.5.1', to: '9.0.0', breaking: true }], breaking_changes: ['jwt.sign() signature changed in v9'], api_changes: 'options parameter now required', citations: ['jsonwebtoken CHANGELOG.md v9.0.0'] } },
  { type: 'step_complete', step: 'call_site_analysis', label: 'Correlating Events', elapsed: 4.3,
    title: 'Correlating Events', time: '09:43:05 AM', desc: 'Linking GitHub PR #312 to error onset.', icon: 'nodes', status: 'COMPLETE/ACTIVE',
    result: { call_sites: ['auth/session.js:47', 'auth/refresh.js:23', 'middleware/verify.js:61', 'tests/auth.test.js:12'], error_is_call_site: true, affected_lines: ['session.js:47 uses deprecated v8 signature'], citations: ['PR #312 diff, session.js:47'] } },
  { type: 'step_complete', step: 'hypothesis_formation', label: 'Tracing Dependencies', elapsed: 5.1,
    title: 'Tracing Dependencies', time: '09:43:20 AM', desc: 'Mapping auth-service blast radius.', icon: 'tree', status: 'COMPLETE/ACTIVE',
    result: { hypothesis: 'jsonwebtoken v9 introduced a breaking API change. jwt.sign() now requires an options object. session.js:47 still uses the v8 signature.', causal_chain: 'PR #312 bumped jsonwebtoken -> v9 signature change -> session.js:47 call fails -> auth-service down', timestamp_validation: 'First error 14 minutes after PR #312 merged', citations: ['PR #312 diff', 'jsonwebtoken CHANGELOG.md', 'application_logs'] } },
  { type: 'step_complete', step: 'confidence_scoring', label: 'Hypothesizing Root Cause', elapsed: 5.8,
    title: 'Hypothesizing Root Cause', time: '09:43:38 AM', desc: 'Evaluating breaking changes in jsonwebtoken v9.', icon: 'search', status: 'COMPLETE/ACTIVE',
    result: { error_commit_correlation: { score: 96, explanation: 'Error location directly inside files changed in PR #312', citations: ['git diff PR #312, auth/session.js:47'] }, timeline_match: { score: 94, explanation: 'First error 14 minutes post-merge, consistent with cache invalidation delay', citations: ['application logs, 2026-06-08T14:23:11Z'] }, dependency_api_match: { score: 89, explanation: 'jwt.sign() signature change confirmed in v9 changelog, matches exact error signature', citations: ['jsonwebtoken CHANGELOG.md, v9.0.0'] }, historical_pattern: { score: 87, explanation: 'Similar jwt version-mismatch failure 52 days ago in the same service', citations: ['Incident #31, 2026-04-17'] }, overall: 91 } },
  { type: 'step_complete', step: 'fix_generation', label: 'Simulating Impact', elapsed: 6.2,
    title: 'Simulating Impact', time: '09:44:00 AM', desc: 'Simulating proposed fix in isolated environment.', icon: 'simulate', status: 'COMPLETE/ACTIVE',
    result: { fix_description: 'Update jwt.sign() call at session.js:47 to use v9 signature with options object', file_path: 'auth/session.js', line_number: 47, old_code: 'jwt.sign(payload, secret)', new_code: "jwt.sign(payload, secret, { algorithm: 'HS256' })", test_suggestion: 'Add compatibility test for jwt.sign() v9 signature', citations: ['jsonwebtoken CHANGELOG.md v9.0.0', 'PR #312 diff'] } },
  { type: 'step_complete', step: 'cascade_mapping', label: 'Recommended Actions', elapsed: 6.8,
    title: 'Recommended Actions', time: '09:44:20 AM', desc: 'Review draft PR #313 to update jwt.sign().', icon: 'alert', status: 'COMPLETE/ACTIVE', isFinal: true,
    result: { origin_service: 'auth-service', cascade_services: [{ name: 'api-gateway', reason: 'Blocked on auth, returning 503', status: 'cascade' }, { name: 'user-service', reason: 'Cannot validate requests', status: 'cascade' }, { name: 'payment-service', reason: 'Auth dependency timeout', status: 'cascade' }], healthy_services: [{ name: 'notification-service', reason: 'Queue buffering' }, { name: 'data-service', reason: 'No auth dependency' }], fix_recommendation: 'Fix auth-service only. Everything else recovers automatically.', do_not_restart: ['api-gateway', 'user-service', 'payment-service'], citations: ['service dependency graph'] } },
] as any

export default function IncidentView({ incidentId: _incidentId }: { incidentId: number }) {
  const [steps, setSteps] = useState<ReasoningStep[]>([])

  // Simulate streaming steps for interactivity
  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < DEMO_STEPS.length) {
        setSteps(prev => [...prev, DEMO_STEPS[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="incident-grid-layout three-column">
      {/* COLUMN 1: LEFT PANEL (Reasoning Log) */}
      <div className="panel reasoning-panel" style={{ overflowY: 'auto' }}>
        <div className="panel-header flex justify-between items-center">
          <div>
            <h2 className="panel-title" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnostic Reasoning</h2>
            <div className="panel-subtitle">Case #INC-7391</div>
          </div>
          <span className="badge-updating" style={{ background: steps.length === DEMO_STEPS.length ? 'rgba(46,125,50,0.1)' : 'rgba(79,142,247,0.1)', color: steps.length === DEMO_STEPS.length ? '#4ade80' : '#4f8ef7', border: `1px solid ${steps.length === DEMO_STEPS.length ? 'rgba(46,125,50,0.3)' : 'rgba(79,142,247,0.3)'}` }}>
            {steps.length === DEMO_STEPS.length ? 'Resolved' : 'Active'}
          </span>
        </div>

        <div className="steps-list" style={{ marginTop: '16px' }}>
          {DEMO_STEPS.map((step, idx) => {
            const isDone = idx < steps.length - 1 || steps.length === DEMO_STEPS.length;
            const isActive = idx === steps.length - 1 && steps.length < DEMO_STEPS.length;
            let stepClass = 'pending';
            if (isDone) stepClass = 'done';
            if (isActive) stepClass = 'active';

            return (
              <div key={idx} className={`log-step ${stepClass}`} style={{ marginBottom: '16px', paddingLeft: '16px', borderLeft: '2px solid transparent' }}>
                <div className="step-content">
                  <div className="step-header flex justify-between" style={{ marginBottom: '4px' }}>
                    <span className="step-title" style={{ color: isActive ? '#fff' : (isDone ? '#a0aec0' : '#4a5568'), fontWeight: isActive ? 600 : 500, fontSize: '13px' }}>{step.title}</span>
                    <span className="step-time" style={{ color: '#718096', fontSize: '11px', fontFamily: '"JetBrains Mono", monospace' }}>{isDone || isActive ? `+${step.elapsed}s` : '--'}</span>
                  </div>
                  <div className="step-desc" style={{ color: isActive ? '#e2e8f0' : (isDone ? '#718096' : '#4a5568'), fontSize: '12px', lineHeight: '1.4' }}>{step.desc}</div>
                  {isActive && <div className="step-progress-bar"></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLUMN 2: CENTER PANEL (Cascade Map & Stats) */}
      <div className="panel cascade-panel flex flex-col" style={{ padding: '24px' }}>
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-label">Affected Services</div>
            <div className="stat-value danger">4</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Active Sessions Impacted</div>
            <div className="stat-value warning">2,400</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Time Elapsed</div>
            <div className="stat-value">01:14</div>
          </div>
        </div>

        <div className="panel-header flex justify-between" style={{ marginTop: '8px' }}>
          <div>
            <h2 className="panel-title" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dependency Cascade Map</h2>
            <div className="panel-subtitle">Originating from auth-service</div>
          </div>
        </div>
        <div className="map-container flex-1" style={{ background: '#0a0d14', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CascadeMap data={DEMO_STEPS[9].result as any} />
        </div>
      </div>

      {/* COLUMN 3: RIGHT PANEL (Action & Confidence) */}
      <div className="panel action-panel" style={{ overflowY: 'auto', padding: '24px' }}>
        <h2 className="action-panel-title">Resolution Intelligence</h2>
        
        <div className="confidence-container" style={{ marginBottom: '24px' }}>
          <div className="panel-header">
            <h2 className="panel-title" style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '12px' }}>CONFIDENCE ANATOMY</h2>
          </div>
          <ConfidenceAnatomy data={(DEMO_STEPS[7].result as any) || {}} />
        </div>

        <div className="fix-recommendation">
          <h3>✅ Fix Recommendation</h3>
          <p style={{ color: '#d4daf0', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
            Root cause confirmed in <strong>auth/session.js:47</strong>. 
            The <code>jsonwebtoken</code> major version bump (v8 → v9) introduced a breaking signature change. 
            Fix `auth-service` only. Everything else recovers automatically.
          </p>
        </div>

        <div className="do-not-restart">
          <h3>⚠️ Do Not Restart</h3>
          <ul>
            <li>api-gateway</li>
            <li>user-service</li>
            <li>payment-service</li>
          </ul>
        </div>

        <button className="primary-btn flex items-center justify-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          Approve PR #313 (One-Click Fix)
        </button>
      </div>
    </div>
  )
}
