# Integrated agent pool

The API registry in `apps/api/src/agents.ts` is the common runtime pool. Every specialist declares capabilities, accepted artifacts, produced artifacts, enabled state and local/provider-optional mode. `POST /v1/jobs` routes a typed job through that registry and writes the full lifecycle to `/v1/events`.

| Agent | Responsibility | Gate |
|---|---|---|
| ICP Strategist | Offer-to-audience rules | Client approval |
| Lead Scout | Approved source discovery | Source/license policy |
| Source Intake | Normalize provenance | Required evidence |
| Enrichment Router | Cost-aware provider waterfall | Budget cap |
| Email Verifier | Confidence and risky/catch-all state | No-send on invalid |
| Fit Scorer | Explainable fit, intent, timing, geo | Factor visibility |
| Evidence Researcher | Cited account and role facts | Freshness threshold |
| Personalization Writer | Short brand-aligned drafts | Claim review |
| Policy Guardian | Jurisdiction, suppression, identity | Hard block authority |
| Campaign Operator | Sequence scheduling and retries | Activation approval |
| Reply Triage | Intent classification and stop state | Human review if ambiguous |
| Geo Intelligence | Territories, conflicts and whitespace | Approximate business coordinates |
| Revenue Attribution | Replies, meetings, opportunities and evidence | Evidence-only outcomes |

## Envelope

```json
{
  "agentId": "evidence-researcher",
  "correlationId": "corr_TYPED_SLOT",
  "input": { "leadId": "lead_TYPED_SLOT", "evidencePolicyVersion": "v1" }
}
```

The terminal job records output or a structured error; no hidden free-form handoff is required. A future custom-agent builder must keep role-specific tool allowlists, spend ceilings, approval separation and versioned prompts/contracts.
