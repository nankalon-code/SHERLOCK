#!/usr/bin/env python
"""
Sherlock — pgvector Seeding Script
Generates and inserts 1536-dimensional mock embeddings for historical incidents,
populating pgvector similarity search in Supabase.
"""
import os
import random
import sys
from dotenv import load_dotenv

# Ensure we can import from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_supabase

load_dotenv()

def generate_mock_vector(dim=1536):
    """Generate a normalized 1536-dimensional float vector."""
    vec = [random.uniform(-0.1, 0.1) for _ in range(dim)]
    # Normalize
    length = sum(x*x for x in vec) ** 0.5
    return [x / length for x in vec]

def seed_vectors():
    db = get_supabase()
    if db is None:
        print("ERROR: Supabase URL or Service Key not configured in .env")
        return

    print("Checking database connection...")
    try:
        # 1. Ensure historical incident exists
        inc_res = db.table("incidents").select("id").eq("id", 31).execute()
        incident_id = None
        if not inc_res.data:
            print("Seeding baseline incident #31...")
            new_inc = db.table("incidents").insert({
                "id": 31,
                "service_name": "auth-service",
                "severity": "high",
                "trigger_type": "webhook",
                "status": "resolved",
                "root_cause": {
                    "summary": "jwt validation failure after dependency update",
                    "confidence": 88
                },
                "affected_services": ["auth-service", "api-gateway"]
            }).execute()
            if new_inc.data:
                incident_id = 31
        else:
            incident_id = 31
            print("Baseline incident #31 already exists.")

        if not incident_id:
            print("ERROR: Could not establish a baseline incident.")
            return

        # 2. Check if vector signature exists
        sig_res = db.table("pattern_signatures").select("id").eq("incident_id", incident_id).execute()
        if not sig_res.data:
            print(f"Generating 1536-dimensional pattern embedding for Incident #{incident_id}...")
            mock_embedding = generate_mock_vector()
            
            db.table("pattern_signatures").insert({
                "incident_id": incident_id,
                "service_name": "auth-service",
                "root_cause_cat": "dependency_mismatch",
                "dependency": "jsonwebtoken",
                "affected_files": ["auth/session.js"],
                "embedding": mock_embedding
            }).execute()
            print("Successfully seeded pgvector signature!")
        else:
            print("pgvector pattern signature already exists.")

    except Exception as e:
        print(f"ERROR: Seeding failed: {e}")

if __name__ == "__main__":
    seed_vectors()
