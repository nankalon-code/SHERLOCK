"""
Database layer - Supabase (Postgres + pgvector)
Incident memory, pattern signatures, audit log, service graph
"""
import os
from dotenv import load_dotenv

load_dotenv()

_supabase = None


def get_supabase():
    """Returns Supabase client or None in demo mode."""
    global _supabase
    if _supabase is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            return None  # demo mode - no crash
        try:
            from supabase import create_client
            _supabase = create_client(url, key)
        except Exception:
            return None
    return _supabase


async def init_db():
    """Verify DB connectivity on startup - non-fatal if not configured."""
    try:
        db = get_supabase()
        if db is None:
            print("Supabase not configured - running in demo mode")
            return
        db.table("incidents").select("id").limit(1).execute()
        print("Supabase connected OK")
    except Exception as e:
        print(f"Supabase check failed: {e} - demo mode")


# Schema reference - run in Supabase SQL editor
def load_schema():
    try:
        # check parent or current directory
        for path in ["../schema.sql", "schema.sql"]:
            if os.path.exists(path):
                with open(path, "r") as f:
                    return f.read()
    except Exception:
        pass
    return """
CREATE TABLE IF NOT EXISTS incidents (
    id              SERIAL PRIMARY KEY,
    github_ref      TEXT,
    service_name    TEXT NOT NULL,
    severity        TEXT DEFAULT 'high',
    trigger_type    TEXT NOT NULL,
    root_cause      JSONB,
    confidence      FLOAT,
    reasoning_chain JSONB,
    fix_pr_url      TEXT,
    status          TEXT DEFAULT 'active',
    runbook         TEXT,
    affected_services TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS pattern_signatures (
    id              SERIAL PRIMARY KEY,
    incident_id     INT REFERENCES incidents(id),
    service_name    TEXT NOT NULL,
    root_cause_cat  TEXT NOT NULL,
    dependency      TEXT,
    affected_files  TEXT[],
    embedding       vector(1536),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pr_risk_scores (
    id              SERIAL PRIMARY KEY,
    pr_number       INT NOT NULL,
    repo            TEXT NOT NULL,
    risk_score      FLOAT NOT NULL,
    risk_level      TEXT NOT NULL,
    reasoning       JSONB,
    incident_occurred BOOLEAN DEFAULT FALSE,
    incident_id     INT REFERENCES incidents(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_graph (
    id              SERIAL PRIMARY KEY,
    service_name    TEXT NOT NULL UNIQUE,
    dependencies    TEXT[],
    owner_email     TEXT,
    owner_name      TEXT,
    criticality     TEXT DEFAULT 'medium',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id              SERIAL PRIMARY KEY,
    incident_id     INT,
    action          TEXT NOT NULL,
    actor           TEXT NOT NULL,
    payload         JSONB,
    source_citations JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_metrics (
    id              SERIAL PRIMARY KEY,
    service_name    TEXT NOT NULL,
    metric_name     TEXT NOT NULL,
    value           FLOAT NOT NULL,
    baseline_value  FLOAT,
    anomaly_score   FLOAT,
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
"""

SCHEMA_SQL = load_schema()
# Legacy placeholder backup string (below)
_UNUSED_BACKUP_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS incidents (
    id              SERIAL PRIMARY KEY,
    github_ref      TEXT,
    service_name    TEXT NOT NULL,
    severity        TEXT DEFAULT 'high',
    trigger_type    TEXT NOT NULL,
    root_cause      JSONB,
    confidence      FLOAT,
    reasoning_chain JSONB,
    fix_pr_url      TEXT,
    status          TEXT DEFAULT 'active',
    runbook         TEXT,
    affected_services TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS pattern_signatures (
    id              SERIAL PRIMARY KEY,
    incident_id     INT REFERENCES incidents(id),
    service_name    TEXT NOT NULL,
    root_cause_cat  TEXT NOT NULL,
    dependency      TEXT,
    affected_files  TEXT[],
    embedding       vector(1536),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pr_risk_scores (
    id              SERIAL PRIMARY KEY,
    pr_number       INT NOT NULL,
    repo            TEXT NOT NULL,
    risk_score      FLOAT NOT NULL,
    risk_level      TEXT NOT NULL,
    reasoning       JSONB,
    incident_occurred BOOLEAN DEFAULT FALSE,
    incident_id     INT REFERENCES incidents(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_graph (
    id              SERIAL PRIMARY KEY,
    service_name    TEXT NOT NULL UNIQUE,
    dependencies    TEXT[],
    owner_email     TEXT,
    owner_name      TEXT,
    criticality     TEXT DEFAULT 'medium',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
    id              SERIAL PRIMARY KEY,
    incident_id     INT,
    action          TEXT NOT NULL,
    actor           TEXT NOT NULL,
    payload         JSONB,
    source_citations JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_metrics (
    id              SERIAL PRIMARY KEY,
    service_name    TEXT NOT NULL,
    metric_name     TEXT NOT NULL,
    value           FLOAT NOT NULL,
    baseline_value  FLOAT,
    anomaly_score   FLOAT,
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
"""
