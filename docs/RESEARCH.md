# Outr product and market research

Research refreshed August 24, 2026. Public prices change by billing cadence, credits and contracts; the linked vendor pages are the source of truth.

## Market thesis

Lead databases, enrichment waterfalls, AI research, sequences and deliverability have converged into table stakes. Outr should win as an **agency and territory operating system**: provider-neutral sourcing, visible evidence, native geography, hard client isolation, explicit approvals, global suppression, unified replies and margin/outcome reporting.

## Competitive synthesis

| Product | Strongest pattern to absorb | Opening for Outr |
|---|---|---|
| [Apollo](https://www.apollo.io/product/prospect-and-enrich) | Search-to-sequence workflow, large dataset, intent, enrichment | Provider/license provenance, agency maps and client operations |
| [Clay](https://www.clay.com/pricing) | 150+ providers, waterfalls, reusable enrichment functions, Claygent | Opinionated playbooks and approvals instead of a blank workflow canvas |
| [Instantly](https://instantly.ai/pricing) | Mailbox rotation, lead search, unified inbox, reply agents | Unified research evidence, territory and client economics |
| [Smartlead](https://www.smartlead.ai/pricing) | Agency workspaces, sender infrastructure, inbox and placement tests | Sourcing, scoring, map intelligence and cross-client governance |
| [lemlist](https://www.lemlist.com/pricing) | Deep personalization, conditions and channel tasks | Explainable evidence and geography without browser-dependent automation |
| [HubSpot Sales Hub](https://www.hubspot.com/pricing/sales) | CRM adoption, workflows, meetings and reporting | Faster agency-native operating layer that syncs to CRM |
| [Salesforce Sales](https://www.salesforce.com/sales/pricing/) | Governance, cadences, platform extensibility and maps | Opinionated lower-complexity product for agencies and SMB teams |
| [Outreach](https://www.outreach.io/platform/pipeline-management) | Workflow-native agents, coaching and pipeline execution | Prospect-to-qualified-reply focus and transparent client controls |
| [Salesloft Rhythm](https://www.salesloft.com/platform/rhythm) | Signal-prioritized daily work | Simpler action center with territory context |
| [Common Room](https://www.commonroom.io/product/signals/) | Signal stacking and identity resolution | Accessible agency tier plus outbound and native map execution |
| [Unify](https://docs.unifygtm.com/reference/signals/overview) | Recurring signal-to-outbound agents | Explainability, human gates and agency governance |
| [HeyReach](https://www.heyreach.io/pricing) | Master agency view, sender pools and permissions | Official/manual channel handoffs plus compliant email core |

Clay's current public plans illustrate the category's two-meter economics: platform actions plus provider data credits. Its Launch and Growth tiers publicly begin around $185 and $495 monthly, with annual-equivalent prices shown lower. Outr should therefore expose provider cost and client margin instead of hiding credit economics.

## Differentiating product pillars

### 1. Territory intelligence

- Account pins and clusters; synchronized map, list and table.
- City/state/country, radius, polygon and saved-territory filters.
- Heatmaps for fit, intent, reply rate, revenue and unworked whitespace.
- Client territory conflicts and duplicate-account warnings.
- Local-time send windows and later field-sales route planning.

MapLibre GL JS natively supports filtered symbol layers and clustering; Outr uses it for the local product and keeps the tile/style provider replaceable. See [MapLibre examples](https://maplibre.org/maplibre-gl-js/docs/examples/) and [cluster implementation](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/).

### 2. Evidence-backed personalization

Every usable claim should retain the source URL, retrieval time, captured fact, confidence, freshness window and policy decision. Generated copy should highlight unsupported claims and remain an approval-bound draft.

### 3. Agency control room

- Tenant-isolated client offers, ICPs, brands, domains and suppression.
- Cross-client duplicate detection without exposing one client's data.
- Client approval queue and white-label reporting.
- Provider spend, cost per verified lead and gross margin per campaign.
- Capacity/SLA forecasts and outcome reconciliation.

### 4. Governed agent pool

Specialists exchange typed tasks/results through one event ledger. Each action records tenant, actor, input version, evidence, cost, decision and retry/rollback state. No content-generating agent can approve its own output.

## MVP / next / later

| Build now | Next | Later |
|---|---|---|
| Tenant model and contracts | Auth/RBAC and Postgres/PostGIS | SSO/SCIM and data residency |
| Lead table + native map | Saved geo segments and clusters | Drive-time and territory optimization |
| Evidence/source ledger | Licensed enrichment connectors | Adaptive provider routing |
| Email verification states | Gmail/Microsoft drafts and webhooks | Managed sending infrastructure |
| Approval-bound sequences | Inbox reconciliation and CRM sync | Custom agent/MCP SDK |
| Suppression + readiness gates | Client portal and margin ledger | Vertical data marketplace |
| Agent jobs/events | Durable queues and observability | Forecasting and conversation intelligence |

## Compliance-by-construction

- **US commercial email:** accurate header/sender identity, truthful subjects, postal address, clear opt out, prompt suppression and vendor oversight. CAN-SPAM applies to B2B email; the FTC lists penalties up to $53,088 per violating email. [FTC guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)
- **UK/EU:** distinguish corporate subscribers, sole traders and partnerships; record lawful basis; provide required privacy information for third-party/public data; honor objections. [ICO B2B guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/)
- **Canada:** default block without recorded consent or a documented implied-consent condition. [CRTC CASL guide](https://crtc.gc.ca/eng/com500/guide.htm)
- **Gmail:** sender authentication, alignment, low spam rate and one-click unsubscribe where required. [Google sender guidelines](https://support.google.com/mail/answer/81126)
- **LinkedIn:** Outr models manual tasks/deep links or approved APIs, not unauthorized scraping or browser automation. [LinkedIn prohibited software](https://www.linkedin.com/help/linkedin/answer/a1341387/prohibited-software-and-extensions)

## Business model to $10K–$30K MRR

| Package | Indicative pricing | Scope |
|---|---:|---|
| Launch | $1,500 setup + $1,500/mo | One ICP, region and campaign |
| Growth | $2,500 setup + $2,500–$3,000/mo | Signals, territories, inbox qualification, reporting |
| Scale | $5,000 setup + $5,000–$7,500/mo | Multiple brands/regions, CRM, SLA and custom connectors |

Four Growth clients can reach $10K MRR; eight reach $20K; ten at $3K reach $30K. Keep data/mailbox/model costs below roughly 20–30% of revenue, charge onboarding separately, and sell a well-operated qualified-meeting process rather than guaranteed revenue.

**North star:** qualified positive replies and ICP-qualified meetings per 1,000 delivered emails. Guardrails: verified-contact yield, evidence coverage, hard bounces under 2%, complaint target under 0.1%, unsubscribe latency, cost per positive reply, meeting show rate and client gross margin.
