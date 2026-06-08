-- ==============================================================================
-- Sherlock — Database Schema (Supabase / Postgres + pgvector)
-- Run this in your Supabase SQL Editor to set up the database tables.
-- ==============================================================================

-- Enable the pgvector extension for similarity search embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Incidents table (stores active and resolved incident metadata, reasoning chains)
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

-- Pattern signatures table (stores embeddings of past root causes for similarity checks)
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

-- Pull Request risk score history (pre-mortem database tracking)
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

-- Service dependency graph (maps service relationships and owner contact info)
CREATE TABLE IF NOT EXISTS service_graph (
    id              SERIAL PRIMARY KEY,
    service_name    TEXT NOT NULL UNIQUE,
    dependencies    TEXT[],
    owner_email     TEXT,
    owner_name      TEXT,
    criticality     TEXT DEFAULT 'medium',
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log (permanent, immutable trail of all agent decisions and reasoning steps)
CREATE TABLE IF NOT EXISTS audit_log (
    id              SERIAL PRIMARY KEY,
    incident_id     INT,
    action          TEXT NOT NULL,
    actor           TEXT NOT NULL,
    payload         JSONB,
    source_citations JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Service telemetry metrics (for proactive anomaly detection alerts)
CREATE TABLE IF NOT EXISTS service_metrics (
    id              SERIAL PRIMARY KEY,
    service_name    TEXT NOT NULL,
    metric_name     TEXT NOT NULL,
    value           FLOAT NOT NULL,
    baseline_value  FLOAT,
    anomaly_score   FLOAT,
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Similarity search helper function using pgvector <=> cosine distance
CREATE OR REPLACE FUNCTION match_pattern_signatures (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id int,
  incident_id int,
  service_name text,
  root_cause_cat text,
  dependency text,
  affected_files text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.id,
    ps.incident_id,
    ps.service_name,
    ps.root_cause_cat,
    ps.dependency,
    ps.affected_files,
    1 - (ps.embedding <=> query_embedding) AS similarity
  FROM pattern_signatures ps
  WHERE 1 - (ps.embedding <=> query_embedding) > match_threshold
  ORDER BY ps.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

