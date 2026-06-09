import pytest
from foundry_iq import stream_incident_reasoning, run_grounded_step

@pytest.mark.asyncio
async def test_run_grounded_step_demo_mode():
    # In demo mode (no Azure creds), it should return placeholder structured info with citations list
    result = await run_grounded_step("alert_intake", {}, [])
    assert isinstance(result, dict)
    assert result.get("service_name") == "auth-service"
    assert "citations" in result

    # For unknown steps, it should fallback to demo mode note
    result_fallback = await run_grounded_step("unknown_step", {}, [])
    assert result_fallback.get("note") == "demo_mode"

@pytest.mark.asyncio
async def test_stream_incident_reasoning_steps():
    incident_data = {"service": "auth-service"}
    sources = []
    events = []
    async for event in stream_incident_reasoning(incident_data, sources):
        events.append(event)
    
    # Check that we received step_start and step_complete events
    start_events = [e for e in events if e.get("type") == "step_start"]
    complete_events = [e for e in events if e.get("type") == "step_complete"]
    
    assert len(start_events) == 10
    assert len(complete_events) == 10
    
    # Check that the last event signals completion
    assert events[-1]["type"] == "reasoning_complete"
