"""
Incidents router — Active mode incident handling + SSE streaming
"""
import json
import asyncio
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from foundry_iq import stream_incident_reasoning, generate_runbook
from database import get_supabase

router = APIRouter()


class IncidentTrigger(BaseModel):
    service_name: str
    trigger_type: str  # github_actions | webhook | manual
    error_logs: Optional[str] = None
    github_ref: Optional[str] = None
    commits: Optional[list] = []
    pr_number: Optional[int] = None
    pr_diff: Optional[str] = None
    dependencies: Optional[dict] = {}
    severity: Optional[str] = "high"


@router.get("/")
async def list_incidents():
    """List all incidents with their status."""
    try:
        db = get_supabase()
        res = db.table("incidents").select("*").order("created_at", desc=True).limit(50).execute()
        return {"incidents": res.data}
    except Exception:
        return {"incidents": DEMO_INCIDENTS}


@router.get("/{incident_id}")
async def get_incident(incident_id: int):
    """Get full incident detail with reasoning chain."""
    try:
        db = get_supabase()
        res = db.table("incidents").select("*").eq("id", incident_id).single().execute()
        return res.data
    except Exception:
        for inc in DEMO_INCIDENTS:
            if inc["id"] == incident_id:
                return inc
        raise HTTPException(404, "Incident not found")


@router.post("/trigger")
async def trigger_incident(body: IncidentTrigger):
    """
    Trigger incident analysis — stores incident and returns ID.
    Actual reasoning streams via /stream/{id}
    """
    try:
        db = get_supabase()
        res = db.table("incidents").insert({
            "service_name": body.service_name,
            "trigger_type": body.trigger_type,
            "github_ref": body.github_ref,
            "severity": body.severity,
            "status": "analyzing",
        }).execute()
        incident_id = res.data[0]["id"]
    except Exception:
        incident_id = 47  # demo fallback

    return {"incident_id": incident_id, "status": "analyzing", "stream_url": f"/api/incidents/stream/{incident_id}"}


@router.get("/stream/{incident_id}")
async def stream_reasoning(incident_id: int, request: Request):
    """
    Server-Sent Events endpoint — streams the live reasoning chain.
    This IS the demo. Every step visible in real time.
    """
    async def event_generator():
        incident_data = {
            "incident_id": incident_id,
            "service": "auth-service",
            "error_logs": "NullReferenceException in auth/session.js line 47\nStack: jwt.sign() called with wrong argument count",
            "commits": ["PR #312: bump jsonwebtoken 8.5.1→9.0.0, modify auth/session.js"],
            "pr_diff": "- jwt.sign(payload, secret)\n+ jwt.sign(payload, secret, options)",
            "dependencies": {"jsonwebtoken": {"old": "8.5.1", "new": "9.0.0", "breaking": True}},
            "service_graph": {
                "auth-service": ["api-gateway"],
                "api-gateway": ["user-service", "payment-service"],
                "payment-service": ["notification-service"],
            },
        }
        sources = [
            {"id": "pr_312", "type": "git_diff", "content": "PR #312 modified auth/session.js line 47"},
            {"id": "jwt_changelog", "type": "changelog", "content": "jsonwebtoken v9: jwt.sign() now requires options object"},
            {"id": "incident_31", "type": "past_incident", "content": "Similar jwt failure 52 days ago, same service"},
            {"id": "app_logs", "type": "logs", "content": "First error at 14:23:11, 14 min after PR #312 merged"},
        ]

        async for event in stream_incident_reasoning(incident_data, sources):
            if await request.is_disconnected():
                break
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.3)

        yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/{incident_id}/resolve")
async def resolve_incident(incident_id: int):
    """Mark incident resolved and generate runbook."""
    try:
        db = get_supabase()
        res = db.table("incidents").select("*").eq("id", incident_id).single().execute()
        incident = res.data
        runbook = await generate_runbook(incident, incident.get("reasoning_chain", {}))
        db.table("incidents").update({
            "status": "resolved",
            "runbook": runbook,
        }).eq("id", incident_id).execute()
        return {"status": "resolved", "runbook": runbook}
    except Exception as e:
        return {"status": "resolved", "runbook": DEMO_RUNBOOK, "note": "demo mode"}


@router.get("/similar/{incident_id}")
async def find_similar(incident_id: int):
    """Find similar past incidents using pgvector similarity search in Supabase."""
    try:
        db = get_supabase()
        if db is not None:
            sig_res = db.table("pattern_signatures").select("*").eq("incident_id", incident_id).execute()
            if sig_res.data and len(sig_res.data) > 0:
                current_embedding = sig_res.data[0].get("embedding")
                if current_embedding:
                    rpc_res = db.rpc("match_pattern_signatures", {
                        "query_embedding": current_embedding,
                        "match_threshold": 0.5,
                        "match_count": 5
                    }).execute()
                    
                    if rpc_res.data:
                        matches = []
                        for match in rpc_res.data:
                            if match["incident_id"] == incident_id:
                                continue
                            matches.append({
                                "incident_id": match["incident_id"],
                                "similarity": round(match["similarity"], 2),
                                "description": f"Similar {match['root_cause_cat'].replace('_', ' ')} failure in {match['service_name']}",
                                "fix": f"Resolved by checking {match.get('dependency', 'dependencies')}",
                                "citations": [f"Incident #{match['incident_id']}"]
                            })
                        return {"matches": matches if matches else DEMO_SIMILAR_INCIDENTS}
    except Exception:
        pass
    return {"matches": DEMO_SIMILAR_INCIDENTS}


# ─── Demo data (used when Supabase not configured) ────────────────────────────

DEMO_INCIDENTS = [
    {
        "id": 47,
        "service_name": "auth-service",
        "severity": "high",
        "trigger_type": "github_actions",
        "status": "active",
        "github_ref": "PR #312",
        "root_cause": {
            "summary": "jsonwebtoken major version bump introduced breaking API change",
            "hypothesis": "jwt.sign() signature changed in v9. Code at session.js:47 uses v8 signature.",
            "confidence": 91,
        },
        "affected_services": ["auth-service", "api-gateway", "user-service", "payment-service"],
        "created_at": "2026-06-08T14:09:00Z",
    },
    {
        "id": 31,
        "service_name": "auth-service",
        "severity": "high",
        "trigger_type": "webhook",
        "status": "resolved",
        "root_cause": {
            "summary": "jwt validation failure after dependency update",
            "confidence": 88,
        },
        "affected_services": ["auth-service", "api-gateway"],
        "created_at": "2026-04-17T02:14:00Z",
        "resolved_at": "2026-04-17T02:22:00Z",
    },
    {
        "id": 18,
        "service_name": "auth-service",
        "severity": "medium",
        "trigger_type": "github_actions",
        "status": "resolved",
        "root_cause": {
            "summary": "JWT API version mismatch after library upgrade",
            "confidence": 85,
        },
        "created_at": "2026-02-10T11:30:00Z",
        "resolved_at": "2026-02-10T12:15:00Z",
    },
]

DEMO_SIMILAR_INCIDENTS = [
    {
        "incident_id": 31,
        "similarity": 0.94,
        "description": "Similar jwt validation failure 52 days ago in auth-service after dependency update",
        "fix": "Updated jwt.sign() call signature — resolved in 8 minutes",
        "citations": ["PR #289", "Incident #31"],
    }
]

DEMO_RUNBOOK = """# INCIDENT RUNBOOK — Auto-generated by Sherlock
**Incident:** #47 — auth-service failure
**Date:** June 8, 2026 | **Duration:** 23 minutes
**Severity:** High | **Services affected:** 4

## ROOT CAUSE
jsonwebtoken major version bump introduced breaking API change.
`jwt.sign()` signature changed in v9. Code at `session.js:47` used v8 signature.

## DETECTION SIGNALS
- Response time increase in auth-service (34% over 4hr)
- jwt-related errors in logs before full failure
- Major dependency bump in recent PR

## RESOLUTION
Updated `jwt.sign()` call at `session.js:47` to v9 signature.
PR #313 — 4-line fix. Deployed in 11 minutes.

## PREVENTION
- Sherlock now flags major jwt version bumps as elevated risk
- Pre-mortem check added for auth-service changes
- Test added for `jwt.sign()` signature compatibility

## SIMILAR INCIDENTS
- #31 (52 days ago), #18 (4 months ago)
- Pattern: recurring jwt API drift after major version bumps
"""
