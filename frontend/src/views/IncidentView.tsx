import { useState, useEffect, useRef } from 'react'
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
  const [steps, setSteps] = useState<ReasoningStep[]>(DEMO_STEPS)
  
  return (
    <div className="incident-grid-layout">
      {/* LEFT PANEL */}
      <div className="panel reasoning-panel">
        <div className="panel-header flex justify-between items-center">
          <div>
            <h2 className="panel-title">LIVE DIAGNOSTIC REASONING LOG</h2>
            <div className="panel-subtitle">Case #INC-7391: E-commerce Checkout Failure</div>
          </div>
          <span className="badge-updating">Updating</span>
        </div>
        
        <div className="dropdown-container">
          <select className="live-dropdown">
            <option>Live today</option>
          </select>
          <span className="live-dot"></span>
        </div>

        <div className="steps-list">
          {steps.map((step, idx) => (
            <div key={idx} className={`log-step ${step.isFinal ? 'step-warning' : (idx === 0 ? 'step-error' : 'step-info')}`}>
              <div className="step-number">{idx + 1}</div>
              <div className="step-icon-wrapper">
                {/* placeholder icon depending on type */}
                <div className="icon-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                </div>
              </div>
              <div className="step-content">
                <div className="step-header">
                  <span className="step-title">{step.title}</span>
                  <span className="step-time">{step.time}</span>
                </div>
                <div className="step-desc">{step.desc}</div>
                <div className="step-status">
                  Status: <span>{step.status}</span>
                </div>
                <div className="step-progress-bar"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-panels">
        {/* TOP RIGHT PANEL */}
        <div className="panel cascade-panel">
          <div className="panel-header flex justify-between">
            <div>
              <h2 className="panel-title">INTERACTIVE DEPENDENCY CASCADE MAP</h2>
              <div className="panel-subtitle">Case #INC-7391</div>
            </div>
            <div className="more-options">...</div>
          </div>
          <div className="map-container">
            {/* We will implement CSS-based map or just include CascadeMap component if it fits, but user wants it to look like the image exactly */}
            {/* For now, placeholder matching image */}
            <CascadeMap data={DEMO_STEPS[9].result as any} />
          </div>
          <div className="map-legend">
            <span className="legend-item"><span className="dot dot-critical"></span> Critical</span>
            <span className="legend-item"><span className="dot dot-error"></span> Error</span>
            <span className="legend-item"><span className="dot dot-warn"></span> Warn</span>
            <span className="legend-item"><span className="dot dot-healthy"></span> Healthy</span>
          </div>
        </div>

        {/* BOTTOM RIGHT PANEL */}
        <div className="panel confidence-panel">
          <div className="panel-header flex justify-between">
            <div>
              <h2 className="panel-title">INCIDENT CONFIDENCE GRID</h2>
              <div className="panel-subtitle">2x2 Matrix</div>
            </div>
            <div className="more-options">...</div>
          </div>
          <div className="grid-2x2-container">
            <div className="matrix-labels x-labels flex justify-between">
              <span>High</span>
              <span>Low</span>
            </div>
            <div className="matrix-labels y-labels">
              <span>High</span>
              <span>Low</span>
            </div>
            <div className="matrix-grid">
              <div className="quadrant q-tl">
                <div className="q-header">
                  <span>Payment Gateway Failure</span>
                  <span className="q-score">89.4%</span>
                </div>
                <div className="q-body">
                  <strong>Root Cause Hypothesis</strong>
                  <p>Payment Gateway concurrent failure</p>
                  <strong>Confidence Score: </strong> 89.4%
                  <br/><br/>
                  <strong>Evidence:</strong>
                  <ul>
                    <li>Latency spike, Error correlation, 7 previous patterns matching</li>
                  </ul>
                </div>
              </div>
              <div className="quadrant q-tr">
                <div className="q-header">
                  <span>AWS Region Issue</span>
                  <span className="q-score">21.2%</span>
                </div>
                <div className="q-body">
                  <span className="high-conf-text">HIGH CONFIDENCE (89.4%)</span>
                  <br/>
                  <strong>Confidence Score: </strong> 87.2%
                  <br/><br/>
                  <strong>Evidence:</strong>
                  <ul>
                    <li>Latency spike</li>
                  </ul>
                </div>
              </div>
              <div className="quadrant q-bl">
                <div className="q-header">
                  <span>Cache Miss</span>
                  <span className="q-score">14.5%</span>
                </div>
              </div>
              <div className="quadrant q-br">
                <div className="q-header">
                  <span>Code Deploy</span>
                  <span className="q-score">6.1%</span>
                </div>
              </div>
            </div>
            <div className="matrix-labels x-labels bottom flex justify-between">
              <span>High</span>
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
