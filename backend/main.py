"""
Sherlock — Production Incident Reasoning Agent
Backend: FastAPI + Azure AI Foundry (Foundry IQ) + Supabase
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from routers import incidents, webhooks, analytics, watch_mode, teams
from database import init_db

app = FastAPI(
    title="Sherlock API",
    description="Elementary. Here's what broke your production and why.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(incidents.router, prefix="/api/incidents", tags=["incidents"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(watch_mode.router, prefix="/api/watch", tags=["watch_mode"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])

@app.get("/health")
async def health():
    return {"status": "alive", "agent": "Sherlock", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
