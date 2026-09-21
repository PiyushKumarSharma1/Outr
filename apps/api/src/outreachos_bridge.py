"""JSON stdin/stdout adapter for the local OutreachOS Python source tree.

The TypeScript API owns HTTP; this runner imports the Python engine directly from
OUTREACHOS_ROOT/src and returns compact, JSON-safe results.  It does not start an
HTTP server or depend on the separate OutreachOS dashboard process.
"""
from __future__ import annotations

import json
import os
import sys
import traceback
from pathlib import Path
from typing import Any


def _fail(code: str, message: str, detail: str | None = None) -> dict[str, Any]:
    result: dict[str, Any] = {"ok": False, "error": {"code": code, "message": message}}
    if detail:
        result["error"]["detail"] = detail
    return result


def _engine():
    root = os.environ.get("OUTREACHOS_ROOT", "").strip()
    if not root:
        raise RuntimeError("OUTREACHOS_ROOT is required")
    source = Path(root).expanduser().resolve() / "src"
    if not source.is_dir():
        raise RuntimeError(f"OutreachOS source missing: {source}")
    sys.path.insert(0, str(source))
    from outreachos.config import SETTINGS
    from outreachos.orchestration.engine import Engine
    from outreachos.pool.store import PoolStore

    db_path = os.environ.get("OUTREACHOS_DB", "").strip() or str(Path(root).expanduser().resolve() / "outreachos.db")
    return Engine(PoolStore(db_path)), SETTINGS, db_path


def _campaigns(engine) -> list[dict[str, Any]]:
    return [
        {
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status,
            "clientId": campaign.client_id,
            "icp": campaign.icp.to_dict(),
            "createdAt": campaign.created_at,
        }
        for campaign in engine.active_campaigns()
    ]


def _search_leads(engine, campaign: str, limit: int) -> dict[str, Any]:
    selected = engine.get_campaign(campaign)
    leads = engine.store.leads(selected.id)
    return {
        "campaign": selected.name,
        "count": len(leads),
        "leads": [
            {
                "id": lead.id,
                "name": lead.full_name,
                "title": lead.title,
                "company": lead.company,
                "email": lead.email,
                "emailStatus": lead.email_status,
                "stage": lead.stage,
                "outreachState": lead.outreach_state,
                "location": lead.location,
                "industry": lead.industry,
                "intentScore": lead.enrichment.get("intent_score", 0),
                "triggerSignal": lead.trigger_signal,
            }
            for lead in leads[:limit]
        ],
    }


def _operation(payload: dict[str, Any]) -> dict[str, Any]:
    operation = payload.get("operation")
    engine, settings, db_path = _engine()
    if operation == "status":
        return {
            "ok": True,
            "data": {
                "available": True,
                "source": "outreachos-python-engine",
                "dbPath": db_path,
                "providerMode": settings.provider_mode,
                "llmMode": settings.llm_mode,
                "writeEnabled": os.environ.get("OUTREACHOS_BRIDGE_WRITE_ENABLED", "false").lower() == "true",
            },
        }
    if operation == "overview":
        campaigns = []
        totals = {"leads": 0, "booked": 0, "sent": 0}
        for campaign in engine.active_campaigns():
            stats = engine.stats(campaign.name)
            booked = stats["by_outreach_state"].get("booked", 0)
            totals["leads"] += stats["total_leads"]
            totals["booked"] += booked
            totals["sent"] += stats["sent_est"]
            campaigns.append({"id": campaign.id, "name": campaign.name, "status": campaign.status, "stats": stats})
        return {"ok": True, "data": {"totals": totals, "campaigns": campaigns}}
    if operation == "campaigns":
        return {"ok": True, "data": {"campaigns": _campaigns(engine)}}
    campaign = str(payload.get("campaign", "")).strip()
    if operation == "campaign_stats":
        return {"ok": True, "data": engine.stats(campaign)}
    if operation == "search_leads":
        return {"ok": True, "data": _search_leads(engine, campaign, min(max(int(payload.get("limit", 50)), 1), 100))}
    if operation == "run_cycle":
        if os.environ.get("OUTREACHOS_BRIDGE_WRITE_ENABLED", "false").lower() != "true":
            return _fail("BRIDGE_WRITE_DISABLED", "Cycle execution is disabled for this bridge runtime")
        return {"ok": True, "data": engine.full_cycle(campaign, limit=min(max(int(payload.get("limit", 25)), 1), 100))}
    return _fail("UNKNOWN_OPERATION", f"Unknown bridge operation: {operation}")


def main() -> None:
    try:
        payload = json.load(sys.stdin)
        if not isinstance(payload, dict):
            raise ValueError("Request must be a JSON object")
        result = _operation(payload)
    except KeyError as error:
        result = _fail("NOT_FOUND", str(error))
    except Exception as error:  # structured error lets the TypeScript API keep its HTTP contract
        result = _fail("OUTREACHOS_BRIDGE_ERROR", str(error), traceback.format_exc(limit=3))
    print(json.dumps(result, default=str))


if __name__ == "__main__":
    main()
