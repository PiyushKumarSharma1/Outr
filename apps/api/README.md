# Outr API

Local-first typed API for the Outr lead operations control plane. It starts with deterministic demo data and persists updates through atomic JSON file replacement, so no database or provider credentials are required.

## Run

From the repository root:

```bash
npm run dev:api
```

The default listener is `http://127.0.0.1:8787`, matching the web development proxy. Override storage and listener settings with `OUTR_DATA_PATH`, `HOST`, and `PORT`.

## Contract

All routes use the `x-workspace-id` header for tenant scoping and default to the `demo` workspace.

| Route | Purpose |
| --- | --- |
| `GET /health` | Service and sending posture |
| `GET /v1/summary` | Workspace funnel counts |
| `GET /v1/leads` | Search, filter, sort, and paginate leads |
| `GET /v1/leads/map` | GeoJSON lead points with viewport/status filters |
| `POST /v1/leads` | Create a provenance-bearing lead |
| `GET/POST /v1/campaigns` | Campaign list and draft creation |
| `POST /v1/campaigns/:id/activation-request` | Create a human approval request |
| `GET/POST /v1/suppressions` | Append-only suppression ledger |
| `GET /v1/approvals` | Approval queue |
| `POST /v1/approvals/:id/decision` | Record one immutable approval decision |
| `GET /v1/compliance/readiness` | Evidence gates and launch readiness |
| `GET /v1/agents` | Shared agent capability registry |
| `GET/POST /v1/jobs` | Execute local typed jobs through the orchestrator |
| `GET /v1/events` | Ordered workspace event ledger |

`sendingEnabled` is always `false`. An approved campaign remains `IN_REVIEW` until external sender identity, legal footer, and adverse-event processing evidence are present.

## Verify

```bash
npm run typecheck --workspace @outr/api
npm test --workspace @outr/api
npm run build --workspace @outr/api
```
