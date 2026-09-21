# Architecture

## Current decision

The first release is a TypeScript monorepo with a React/Vite web application, Fastify API, shared Zod contracts and atomic JSON storage. This is intentionally easy to run and inspect while preserving the domain seams required for Postgres/PostGIS, durable queues and provider adapters.

## Domains

- **Prospect ledger:** source provenance, identity, verification, fit/intent, location and lifecycle.
- **Territory intelligence:** GeoJSON projection now; PostGIS `geography(Point,4326)` plus GiST bounds/distance queries in hosted beta.
- **Campaign:** immutable sequence intent, audience, readiness and activation approval.
- **Trust:** suppression, jurisdiction policy, sender evidence and audit events.
- **Agent runtime:** registry, typed input/output, job status, correlation and events.

## Invariants

1. Tenant scope is applied before reading or mutating business entities.
2. Suppression is append-only and immediately moves matching email leads to `SUPPRESSED`.
3. Campaign activation creates an explicit approval; approval does not enable sending in this baseline.
4. Jobs write queued, running and terminal events with a correlation ID.
5. Providers are optional adapters; the core can run without credentials.
6. Map coordinates represent business/account locations, not private home addresses.

## Production evolution

Replace the trusted local workspace header with authenticated membership/RBAC. Replace JSON with Postgres/PostGIS and row-level tenant policies. Put agent jobs, provider calls and webhooks on a durable queue with idempotency keys, retries, dead-letter state and reconciliation. Store provider secrets in a managed secret store. Add OpenTelemetry traces, structured logs, SLOs and alerting. Use a contracted map tile/style service rather than relying on community OSM tiles.

## OutreachOS source-runtime bridge

`apps/api/src/outreachos-bridge.ts` invokes `apps/api/src/outreachos_bridge.py` as a short-lived child process. The Python runner adds `OUTREACHOS_ROOT/src` to `sys.path` and imports the OutreachOS `Engine` and `PoolStore` directly; it does not depend on the separate OutreachOS HTTP dashboard. Each bridge call starts a new Python interpreter, so source-module and SQLite changes are used by the next request without restarting Outr. The Command screen polls the bridge overview every five seconds and displays the current source totals. This gives Outr one HTTP surface while retaining the existing Python engine, campaign statistics, lead search, signals, deliverability and provider configuration.

The Fastify routes are `GET /v1/integrations/outreachos`, `/overview`, `/campaigns`, `/campaigns/:campaign/stats`, and `/campaigns/:campaign/leads`. `POST /campaigns/:campaign/cycle` is present but disabled unless `OUTREACHOS_BRIDGE_WRITE_ENABLED=true`. Configure `OUTREACHOS_ROOT`, `OUTREACHOS_PYTHON`, and optionally `OUTREACHOS_DB` using `apps/api/.env.example`. The production API build copies the Python runner to `apps/api/dist/` beside the bundled Node entrypoint.
