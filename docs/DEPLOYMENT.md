# Deployment stages

## Local verified target

- Web: Vite at `127.0.0.1:5173`.
- API: Fastify at `127.0.0.1:8787`.
- Store: atomic JSON under `apps/api/data/`.
- Outbound: disabled.

## Hosted beta target

1. Vercel or Cloudflare frontend deployment.
2. Container/Worker API with authenticated sessions and RBAC.
3. Managed Postgres + PostGIS; tenant policies and migration backups.
4. Durable queue for agents/providers, with idempotency and dead letters.
5. Managed secrets, telemetry, rate limits and signed webhooks.
6. Contracted map tile/style provider with visible attribution.

## Activation evidence gate

Before an outbound adapter can move from draft to transmit, record: client legal identity/postal address, sender domain, SPF/DKIM/DMARC/MX, controlled mailbox, provider authorization, suppression/unsubscribe webhook, bounce and complaint events, approved market/channel policy, daily cap and rollback switch. A staged inbox test and observed stop-on-reply/idempotency smoke are required.

## Rollback

Deploy immutable versioned artifacts. Keep the prior application/database migration target, use expand/contract migrations, and roll provider adapters back independently. The universal emergency action is disabling the send adapter while keeping inbound webhooks and suppression processing online.
