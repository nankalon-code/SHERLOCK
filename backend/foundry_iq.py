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
        return {"note": "demo_mode", "step": step_name, "citations": []}
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
