# Outr delivery plan

## Acceptance criteria

- [x] Research current competitors, pricing patterns, compliance and map technology.
- [x] Implement a responsive, modern skeuomorphic product surface rather than a static landing page.
- [x] Implement native map/list lead exploration, filters, sorting and evidence details.
- [x] Implement typed tenant-scoped backend contracts, persistence and API.
- [x] Implement campaign approvals, immutable suppression and sending-readiness gates.
- [x] Implement an integrated specialist-agent registry, job execution and event trail.
- [x] Add automated API and web smoke tests plus typecheck and production build scripts.
- [ ] Add authenticated RBAC, Postgres/PostGIS, durable workers and production connectors before multi-user deployment.
- [ ] Supply and validate real sender-domain, mailbox, legal identity and provider evidence before enabling transmission.

## Roadmap

1. **Reliable local product** — current repository state.
2. **Hosted multi-tenant beta** — Auth, Postgres/PostGIS, queues, object storage, secrets, telemetry.
3. **Agency operations** — client portal, margin ledger, HubSpot sync, inbox webhooks, white label.
4. **Differentiation** — territory whitespace, signal monitors, adaptive enrichment routing, vertical playbooks.
5. **Enterprise** — SSO/SCIM, retention/data residency, reconciliation, custom connectors and agent SDK.
