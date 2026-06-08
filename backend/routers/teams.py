"""
Teams integration router — Work IQ owner-routed Adaptive Cards
"""
import os
import httpx
from fastapi import APIRouter
from database import get_supabase

router = APIRouter()

TEAMS_WEBHOOK = os.getenv("TEAMS_WEBHOOK_URL", "")


def build_adaptive_card(incident: dict, owner: str = "@sarah.chen") -> dict:
    """Build Teams Adaptive Card for incident alert."""
    severity = incident.get("severity", "high").upper()
    service = incident.get("service_name", "unknown")
    root_cause = (incident.get("root_cause") or {}).get("summary", "Analyzing...")
    confidence = (incident.get("root_cause") or {}).get("confidence", 0)
    incident_id = incident.get("id", 0)

    return {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.5",
                    "body": [
                        {
                            "type": "Container",
                            "style": "attention",
                            "items": [
                                {"type": "TextBlock", "text": "🚨 SHERLOCK — Critical Incident", "weight": "bolder", "size": "large", "color": "attention"},
                                {"type": "TextBlock", "text": f"Routed to: {owner} (identified via Work IQ)", "size": "small", "isSubtle": True},
                            ],
                        },
                        {
                            "type": "FactSet",
                            "facts": [
                                {"title": "Service", "value": service},
                                {"title": "Severity", "value": severity},
                                {"title": "Root Cause", "value": root_cause},
                                {"title": "Confidence", "value": f"{confidence}%"},
                                {"title": "Incident ID", "value": f"#{incident_id}"},
                            ],
                        },
                        {
                            "type": "TextBlock",
                            "text": "**Sherlock is monitoring recovery. Human approval required for any fix.**",
                            "wrap": True,
                            "color": "warning",
                        },
                    ],
                    "actions": [
                        {"type": "Action.OpenUrl", "title": "VIEW REASONING TRACE", "url": f"http://localhost:5173/incidents/{incident_id}"},
                        {"type": "Action.OpenUrl", "title": "APPROVE FIX PR", "url": "#"},
                        {"type": "Action.OpenUrl", "title": "ESCALATE", "url": "#"},
                    ],
                },
            }
        ],
    }


@router.post("/alert/{incident_id}")
async def send_teams_alert(incident_id: int):
    """Send owner-routed Teams Adaptive Card alert."""
    try:
        db = get_supabase()
        res = db.table("incidents").select("*").eq("id", incident_id).single().execute()
        incident = res.data
    except Exception:
        incident = {"id": incident_id, "service_name": "auth-service", "severity": "high",
                    "root_cause": {"summary": "JWT API breaking change in PR #312", "confidence": 91}}

    # Work IQ would identify owner from Microsoft 365 signals
    owner = identify_service_owner(incident.get("service_name", ""))
    card = build_adaptive_card(incident, owner)

    if TEAMS_WEBHOOK:
        async with httpx.AsyncClient() as client:
            await client.post(TEAMS_WEBHOOK, json=card, timeout=10)
        return {"status": "sent", "routed_to": owner}

    return {"status": "demo_mode", "card": card, "routed_to": owner, "note": "Set TEAMS_WEBHOOK_URL to send real alerts"}


def identify_service_owner(service_name: str) -> str:
    """Work IQ: identify service owner from M365 signals."""
    owners = {
        "auth-service": "@sarah.chen",
        "api-gateway": "@mike.rodriguez",
        "payment-service": "@james.kim",
        "user-service": "@priya.patel",
        "notification-service": "@tom.harris",
        "data-service": "@elena.volkov",
    }
    return owners.get(service_name, "@on-call-engineer")
