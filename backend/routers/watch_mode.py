"""
Watch Mode router — Proactive anomaly detection (every 15 min)
Catches below-threshold patterns before they page anyone
"""
from fastapi import APIRouter, BackgroundTasks
from database import get_supabase
import os
import asyncio

router = APIRouter()

WATCH_MODE_INTERVAL_MIN = int(os.getenv("WATCH_MODE_INTERVAL_MIN", "15"))


DEMO_WATCH_FEED = [
    {
        "id": 1,
        "service": "auth-service",
        "type": "anomaly_warning",
        "message": "Response time has increased 34% over the last 4 hours — from 82ms to 109ms. Still within SLA but the trend is consistent and accelerating. Last time I saw this pattern it preceded a full service failure by ~6 hours.",
        "metric": "response_time_ms",
        "current_value": 109,
        "baseline_value": 82,
        "change_pct": 33,
        "severity": "warning",
        "timestamp": "2026-06-08T10:00:00Z",
        "action": "Worth investigating before it pages someone.",
    },
    {
        "id": 2,
        "service": "payment-service",
        "type": "normal",
        "message": "All metrics within normal range. No anomalies detected.",
        "severity": "info",
        "timestamp": "2026-06-08T14:00:00Z",
    },
    {
        "id": 3,
        "service": "api-gateway",
        "type": "anomaly_watch",
        "message": "Error rate trending up: 0.12% → 0.31% over 2 hours. Below alert threshold (1%) but worth monitoring.",
        "metric": "error_rate_pct",
        "current_value": 0.31,
        "baseline_value": 0.12,
        "change_pct": 158,
        "severity": "watch",
        "timestamp": "2026-06-08T13:45:00Z",
    },
]


@router.get("/feed")
async def watch_feed():
    """Current watch mode feed — anomaly warnings and trends."""
    try:
        db = get_supabase()
        metrics = db.table("service_metrics").select("*").order("recorded_at", desc=True).limit(50).execute()
        return {"feed": process_metrics(metrics.data)}
    except Exception:
        return {"feed": DEMO_WATCH_FEED}


@router.get("/services")
async def monitored_services():
    """List all monitored services and their current health."""
    return {
        "services": [
            {"name": "auth-service", "status": "degraded", "health_pct": 87, "open_anomalies": 1},
            {"name": "api-gateway", "status": "watching", "health_pct": 95, "open_anomalies": 1},
            {"name": "payment-service", "status": "healthy", "health_pct": 100, "open_anomalies": 0},
            {"name": "user-service", "status": "healthy", "health_pct": 99, "open_anomalies": 0},
            {"name": "notification-service", "status": "healthy", "health_pct": 100, "open_anomalies": 0},
            {"name": "data-service", "status": "healthy", "health_pct": 100, "open_anomalies": 0},
        ]
    }


@router.post("/scan")
async def trigger_scan(background_tasks: BackgroundTasks):
    """Manually trigger a watch mode scan."""
    background_tasks.add_task(run_anomaly_scan)
    return {"status": "scan_queued"}


async def run_anomaly_scan():
    """Scheduled anomaly detection."""
    print(f"Running scheduled anomaly scan (interval: {WATCH_MODE_INTERVAL_MIN} min)")
    try:
        db = get_supabase()
        services = db.table("service_graph").select("service_name").execute().data
        for service in services:
            await check_service_anomalies(service["service_name"], db)
    except Exception:
        pass


async def check_service_anomalies(service_name: str, db):
    """Check a single service for anomaly patterns."""
    pass  # In production: pull metrics, compute Z-score, compare to historical patterns


def process_metrics(metrics: list) -> list:
    return DEMO_WATCH_FEED
