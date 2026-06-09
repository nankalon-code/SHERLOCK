"""
Foundry IQ — Azure AI Foundry reasoning engine
Multi-step grounded retrieval with explicit citations
"""
import os
import json
import time
from typing import AsyncGenerator
from dotenv import load_dotenv

load_dotenv()

DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
_client = None

def get_client():
    """Lazy init — runs in demo mode if credentials not set."""
    global _client
    if _client is None:
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        key = os.getenv("AZURE_OPENAI_KEY", "")
        if not endpoint or not key:
            return None  # demo mode
        try:
            from openai import AsyncAzureOpenAI
            _client = AsyncAzureOpenAI(
                azure_endpoint=endpoint,
                api_key=key,
                api_version="2024-12-01-preview",
            )
        except Exception:
            return None
    return _client


async def run_grounded_step(step_name: str, context: dict, sources: list) -> dict:
    """Single grounded retrieval step — not a monolithic prompt."""
    prompts = {
        "alert_intake": "Extract: service_name, error_type, error_location, trigger, timestamp. Return JSON.",
        "log_analysis": "Analyze logs: error_message, stack_trace, first_occurrence, code_path. Return JSON.",
        "commit_analysis": "Analyze commits: suspicious_commits, suspect_pr, overlap_files, timeline_fit. Return JSON.",
        "pr_diff_analysis": "Analyze PR diff: changed_functions, new_patterns, could_cause_error, explanation. Return JSON.",
        "dependency_detection": "Check deps: dependency_bumps, breaking_changes, api_changes. Return JSON.",
        "call_site_analysis": "Find call sites: call_sites, affected_lines, error_is_call_site. Return JSON.",
        "hypothesis_formation": "Form hypothesis: hypothesis, causal_chain, timestamp_validation. Return JSON.",
        "confidence_scoring": "Score 4 dims (0-100): error_commit_correlation, timeline_match, dependency_api_match, historical_pattern, overall. Return JSON.",
        "fix_generation": "Generate fix: fix_description, file_path, line_number, old_code, new_code, test_suggestion. DRAFT ONLY. Return JSON.",
        "cascade_mapping": "Map cascade: origin_service, cascade_services, healthy_services, fix_recommendation, do_not_restart. Return JSON.",
    }
    system = (
        "You are Sherlock, an AI incident reasoning agent. "
        "Every claim MUST cite a source. Return valid JSON only. "
        "If you cannot ground a claim, say 'uncertain — insufficient data'."
    )
    user_msg = (
        f"Step: {step_name}\nInstruction: {prompts.get(step_name, 'Analyze.')}\n"
        f"Context: {json.dumps(context)[:3000]}\nSources: {json.dumps(sources)[:1000]}"
    )
    cl = get_client()
    if cl is None:
        mock_data = {
            "alert_intake": {"service_name": "auth-service", "error_type": "NullReferenceException", "error_location": "auth/session.js:47", "trigger": "github_actions", "citations": ["GitHub Actions run #8821"]},
            "log_analysis": {"error_message": "NullReferenceException in auth/session.js line 47", "first_occurrence": "2026-06-08T14:23:11Z", "code_path": "auth/session.js -> jwt.sign()", "citations": ["application_logs: 2026-06-08T14:23:11Z"]},
            "commit_analysis": {"suspicious_commits": ["PR #312 merged 2 hours ago"], "suspect_pr": 312, "overlap_files": ["auth/session.js", "middleware/verify.js"], "timeline_fit": True, "citations": ["git log: PR #312, 2026-06-08T12:09:00Z"]},
            "pr_diff_analysis": {"changed_functions": ["jwt.sign() in session.js:47"], "new_patterns": ["jsonwebtoken 8.5.1 to 9.0.0 major bump"], "could_cause_error": True, "explanation": "PR #312 modified session token format in auth/session.js and touched middleware/verify.js", "citations": ["PR #312 diff, auth/session.js:47"]},
            "dependency_detection": {"dependency_bumps": [{"name": "jsonwebtoken", "from": "8.5.1", "to": "9.0.0", "breaking": True}], "breaking_changes": ["jwt.sign() signature changed in v9"], "api_changes": "options parameter now required", "citations": ["jsonwebtoken CHANGELOG.md v9.0.0"]},
            "call_site_analysis": {"call_sites": ["auth/session.js:47", "auth/refresh.js:23", "middleware/verify.js:61", "tests/auth.test.js:12"], "error_is_call_site": True, "affected_lines": ["session.js:47 uses deprecated v8 signature"], "citations": ["PR #312 diff, session.js:47"]},
            "hypothesis_formation": {"hypothesis": "jsonwebtoken v9 introduced a breaking API change. jwt.sign() now requires an options object. session.js:47 still uses the v8 signature.", "causal_chain": "PR #312 bumped jsonwebtoken -> v9 signature change -> session.js:47 call fails -> auth-service down", "timestamp_validation": "First error 14 minutes after PR #312 merged", "citations": ["PR #312 diff", "jsonwebtoken CHANGELOG.md", "application_logs"]},
            "confidence_scoring": {
                "error_commit_correlation": {"score": 96, "explanation": "Error location directly inside files changed in PR #312", "citations": ["git diff PR #312, auth/session.js:47"]},
                "timeline_match": {"score": 94, "explanation": "First error 14 minutes post-merge, consistent with cache invalidation delay", "citations": ["application logs, 2026-06-08T14:23:11Z"]},
                "dependency_api_match": {"score": 89, "explanation": "jwt.sign() signature change confirmed in v9 changelog, matches exact error signature", "citations": ["jsonwebtoken CHANGELOG.md, v9.0.0"]},
                "historical_pattern": {"score": 87, "explanation": "Similar jwt version-mismatch failure 52 days ago in the same service", "citations": ["Incident #31, 2026-04-17"]},
                "overall": 91,
                "citations": ["multi-dimensional score rollup"]
            },
            "fix_generation": {"fix_description": "Update jwt.sign() call at session.js:47 to use v9 signature with options object", "file_path": "auth/session.js", "line_number": 47, "old_code": "jwt.sign(payload, secret)", "new_code": "jwt.sign(payload, secret, { algorithm: 'HS256' })", "test_suggestion": "Add compatibility test for jwt.sign() v9 signature", "citations": ["jsonwebtoken CHANGELOG.md v9.0.0", "PR #312 diff"]},
            "cascade_mapping": {"origin_service": "auth-service", "cascade_services": [{"name": "api-gateway", "reason": "Blocked on auth, returning 503", "status": "cascade"}, {"name": "user-service", "reason": "Cannot validate requests", "status": "cascade"}, {"name": "payment-service", "reason": "Auth dependency timeout", "status": "cascade"}], "healthy_services": [{"name": "notification-service", "reason": "Queue buffering"}, {"name": "data-service", "reason": "No auth dependency"}], "fix_recommendation": "Fix auth-service only. Everything else recovers automatically.", "do_not_restart": ["api-gateway", "user-service", "payment-service"], "citations": ["service dependency graph"]}
        }
        return mock_data.get(step_name, {"note": "demo_mode", "citations": []})
    try:
        resp = await cl.chat.completions.create(
            model=DEPLOYMENT,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        return {"error": str(e), "note": "uncertain — insufficient data", "citations": []}


async def stream_incident_reasoning(incident_data: dict, sources: list) -> AsyncGenerator[dict, None]:
    """Stream the multi-step reasoning chain — each step is a separate grounded call."""
    start = time.time()
    ctx = {**incident_data}
    steps = [
        ("alert_intake", "Alert received — parsing trigger"),
        ("log_analysis", "Reading error logs..."),
        ("commit_analysis", "Pulling commits from last 24 hours..."),
        ("pr_diff_analysis", "Analyzing PR diff..."),
        ("dependency_detection", "Checking dependency changes in window..."),
        ("call_site_analysis", "Scanning call sites for API mismatch..."),
        ("hypothesis_formation", "Hypothesis forming..."),
        ("confidence_scoring", "Scoring confidence across 4 dimensions..."),
        ("fix_generation", "Generating minimal fix — draft only..."),
        ("cascade_mapping", "Mapping failure cascade..."),
    ]
    for step_name, label in steps:
        elapsed = round(time.time() - start, 1)
        yield {"type": "step_start", "step": step_name, "label": label, "elapsed": elapsed}
        result = await run_grounded_step(step_name, ctx, sources)
        ctx[step_name] = result
        elapsed = round(time.time() - start, 1)
        yield {"type": "step_complete", "step": step_name, "label": label, "elapsed": elapsed, "result": result}

    yield {"type": "reasoning_complete", "elapsed": round(time.time() - start, 1), "full_context": ctx}


async def score_pr_risk(pr_data: dict, repo_history: list) -> dict:
    """Pre-mortem risk scoring using file history, dep bumps, coverage delta."""
    system = "You are Sherlock. Every risk flag must cite a historical source. Return valid JSON."
    user_msg = (
        f"Score incident probability (0-100) for this PR.\n"
        f"PR: {json.dumps(pr_data)[:2000]}\nHistory: {json.dumps(repo_history)[:1500]}\n"
        "Return: {risk_score, risk_level, flags:[{reason,detail,citations}], recommended_action, draft_fix_available, draft_fix_description}"
    )
    cl = get_client()
    if cl is None:
        return {"risk_score": 38, "risk_level": "elevated", "note": "demo_mode",
                "flags": [{"reason": "Demo mode", "detail": "Set Azure credentials for live scoring", "citations": []}]}
    try:
        resp = await cl.chat.completions.create(
            model=DEPLOYMENT,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user_msg}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        return {"risk_score": 0, "risk_level": "unknown", "error": str(e)}


async def generate_runbook(incident: dict, reasoning_chain: dict) -> str:
    """Auto-generate structured runbook after incident resolution."""
    user_msg = (
        f"Generate a markdown runbook for this resolved incident.\n"
        f"Incident: {json.dumps(incident)[:2000]}\nChain: {json.dumps(reasoning_chain)[:2000]}\n"
        "Sections: ROOT CAUSE, DETECTION SIGNALS, RESOLUTION, PREVENTION, SIMILAR INCIDENTS."
    )
    cl = get_client()
    if cl is None:
        return "# Demo Mode\nSet Azure credentials to generate real runbooks."
    resp = await cl.chat.completions.create(
        model=DEPLOYMENT,
        messages=[{"role": "user", "content": user_msg}],
        temperature=0.2,
    )
    return resp.choices[0].message.content
