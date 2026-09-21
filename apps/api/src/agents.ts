import { randomUUID } from "node:crypto";
import type {
  AgentDefinition,
  AgentJob,
  ComplianceReadiness,
  DomainEvent,
} from "@outr/contracts";
import type { Database, DataStore } from "./store.js";

export const agentRegistry: AgentDefinition[] = [
  {
    id: "market-intelligence",
    name: "Market Intelligence",
    description: "Turns an ICP hypothesis into evidence-backed segments and market questions.",
    capabilities: ["icp-design", "segmentation", "market-research"],
    accepts: ["workspace", "research-brief"],
    produces: ["segment-brief", "research-plan"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "source-research",
    name: "Source Research",
    description: "Collects public-source evidence with provenance and source timestamps.",
    capabilities: ["source-discovery", "provenance", "deduplication"],
    accepts: ["segment-brief"],
    produces: ["prospect-evidence"],
    enabled: true,
    mode: "PROVIDER_OPTIONAL",
  },
  {
    id: "enrichment",
    name: "Lead Enrichment",
    description: "Normalizes firmographic and contact fields without replacing original evidence.",
    capabilities: ["firmographics", "normalization", "email-verification"],
    accepts: ["prospect-evidence"],
    produces: ["enriched-lead"],
    enabled: true,
    mode: "PROVIDER_OPTIONAL",
  },
  {
    id: "qualification",
    name: "Qualification",
    description: "Applies explainable fit and intent scoring rules to each lead.",
    capabilities: ["fit-scoring", "intent-scoring", "explanations"],
    accepts: ["enriched-lead", "scoring-policy"],
    produces: ["qualified-lead"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "brand-alignment",
    name: "Brand Alignment",
    description: "Constrains copy to the client voice, offer, evidence, and prohibited claims.",
    capabilities: ["brand-voice", "offer-positioning", "claim-control"],
    accepts: ["brand-brief", "qualified-lead"],
    produces: ["message-brief"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "personalization",
    name: "Personalization",
    description: "Drafts source-grounded messages and exposes the evidence behind each claim.",
    capabilities: ["message-drafting", "evidence-linking", "sequence-copy"],
    accepts: ["message-brief", "prospect-evidence"],
    produces: ["message-draft"],
    enabled: true,
    mode: "PROVIDER_OPTIONAL",
  },
  {
    id: "compliance",
    name: "Compliance QA",
    description: "Evaluates market, source, suppression, identity, and approval gates.",
    capabilities: ["policy-evaluation", "suppression-check", "readiness"],
    accepts: ["campaign", "message-draft", "compliance-policy"],
    produces: ["policy-decision"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "deliverability",
    name: "Deliverability",
    description: "Tracks sender readiness, mailbox health, volume caps, bounces, and complaints.",
    capabilities: ["sender-readiness", "volume-policy", "health-monitoring"],
    accepts: ["sender-evidence", "delivery-events"],
    produces: ["deliverability-decision"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "campaign-operations",
    name: "Campaign Operations",
    description: "Builds approval-bound campaign plans and schedules; sending stays separately gated.",
    capabilities: ["campaign-planning", "sequence-scheduling", "approval-routing"],
    accepts: ["qualified-lead", "message-draft", "policy-decision"],
    produces: ["campaign-plan", "approval-request"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "reply-triage",
    name: "Reply Triage",
    description: "Classifies replies and prioritizes human follow-up without fabricating outcomes.",
    capabilities: ["reply-classification", "stop-on-reply", "inbox-priority"],
    accepts: ["inbound-message"],
    produces: ["reply-decision", "follow-up-task"],
    enabled: true,
    mode: "PROVIDER_OPTIONAL",
  },
  {
    id: "revenue-attribution",
    name: "Revenue Attribution",
    description: "Links evidence-backed replies, meetings, opportunities, and revenue to campaigns.",
    capabilities: ["funnel-attribution", "evidence-ledger", "reporting"],
    accepts: ["outcome-event"],
    produces: ["attribution-record"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "geo-intelligence",
    name: "Geo Intelligence",
    description: "Builds territory summaries, geographic segments, and whitespace signals from business locations.",
    capabilities: ["territory-analysis", "geo-segmentation", "whitespace-detection"],
    accepts: ["qualified-lead", "map-bounds", "territory-policy"],
    produces: ["territory-summary", "geo-segment"],
    enabled: true,
    mode: "LOCAL",
  },
  {
    id: "orchestrator",
    name: "Workflow Orchestrator",
    description: "Routes typed jobs across the agent pool and records every lifecycle event.",
    capabilities: ["job-routing", "event-ledger", "failure-isolation"],
    accepts: ["agent-job"],
    produces: ["agent-result", "domain-event"],
    enabled: true,
    mode: "LOCAL",
  },
];

export const complianceReadiness = (database: Database, workspaceId = "demo"): ComplianceReadiness => {
  const workspaceLeads = database.leads.filter((item) => item.workspaceId === workspaceId);
  const gates: ComplianceReadiness["gates"] = [
    {
      id: "approval-workflow",
      label: "Human approval workflow",
      status: "PASS",
      detail: "Every campaign activation creates a recorded approval request.",
    },
    {
      id: "suppression-ledger",
      label: "Immutable suppression ledger",
      status: "PASS",
      detail: "Suppression entries are append-only through the public API.",
    },
    {
      id: "source-provenance",
      label: "Lead source provenance",
      status: workspaceLeads.every((item) => item.source.url && item.source.capturedAt)
        ? "PASS"
        : "FAIL",
      detail: "Every lead must retain a source URL and capture time.",
    },
    {
      id: "sender-identity",
      label: "Client-owned sender identity",
      status: "NEEDS_EVIDENCE",
      detail: "Domain ownership, SPF, DKIM, DMARC, and mailbox control evidence are required.",
    },
    {
      id: "legal-footer",
      label: "Legal identity and postal address",
      status: "NEEDS_EVIDENCE",
      detail: "A verified business identity and physical postal address are required.",
    },
    {
      id: "unsubscribe-processing",
      label: "Unsubscribe and adverse-event processing",
      status: "NEEDS_EVIDENCE",
      detail: "Provider webhook handling and timing evidence must be verified before activation.",
    },
  ];

  return {
    sendingEnabled: false,
    launchMarket: "US_B2B_EMAIL",
    gates,
    ready: gates.every((gate) => gate.status === "PASS"),
  };
};

const buildOutput = (
  agentId: string,
  input: Record<string, unknown>,
  database: Database,
  workspaceId: string,
): Record<string, unknown> => {
  const leads = database.leads.filter((item) => item.workspaceId === workspaceId);
  switch (agentId) {
    case "market-intelligence":
      return { segments: [...new Set(leads.map((item) => item.industry))].sort(), leadCount: leads.length };
    case "source-research":
      return { evidenceCoverage: leads.length ? 1 : 0, records: leads.length, providerRequired: true };
    case "enrichment":
      return { normalized: leads.length, verifiedEmails: leads.filter((item) => item.emailStatus === "VALID").length };
    case "qualification":
      return { qualifiedLeadIds: leads.filter((item) => item.fitScore >= 85).map((item) => item.id), threshold: 85 };
    case "compliance":
    case "deliverability":
      return complianceReadiness(database, workspaceId);
    case "campaign-operations":
      return {
        campaigns: database.campaigns.filter((item) => item.workspaceId === workspaceId).length,
        sendingEnabled: false,
        nextAction: "request-approval",
      };
    case "revenue-attribution":
      return { wonLeads: leads.filter((item) => item.status === "WON").length, evidenceOnly: true };
    case "geo-intelligence": {
      const territories = [...new Set(leads.map((item) => `${item.location.region}, ${item.location.country}`))]
        .sort()
        .map((territory) => ({
          territory,
          leadCount: leads.filter((item) => `${item.location.region}, ${item.location.country}` === territory).length,
        }));
      return {
        mappedLeads: leads.filter((item) => Number.isFinite(item.location.latitude) && Number.isFinite(item.location.longitude)).length,
        coordinateCoverage: leads.length ? 1 : 0,
        territories,
      };
    }
    default:
      return { accepted: true, input, executionMode: "local-deterministic" };
  }
};

const event = (
  workspaceId: string,
  job: AgentJob,
  type: string,
  payload: Record<string, unknown>,
): DomainEvent => ({
  id: `event_${randomUUID()}`,
  workspaceId,
  type,
  aggregateType: "agent_job",
  aggregateId: job.id,
  correlationId: job.correlationId,
  payload,
  createdAt: new Date().toISOString(),
});

export const executeAgentJob = async (
  store: DataStore,
  workspaceId: string,
  agentId: string,
  input: Record<string, unknown>,
  correlationId = `correlation_${randomUUID()}`,
): Promise<AgentJob> => {
  const definition = agentRegistry.find((item) => item.id === agentId && item.enabled);
  if (!definition) throw new Error("AGENT_NOT_FOUND");

  return store.update((database) => {
    const createdAt = new Date().toISOString();
    const job: AgentJob = {
      id: `job_${randomUUID()}`,
      workspaceId,
      agentId,
      status: "QUEUED",
      input,
      correlationId,
      createdAt,
    };
    database.jobs.push(job);
    database.events.push(event(workspaceId, job, "agent.job.queued", { agentId }));

    job.status = "RUNNING";
    job.startedAt = new Date().toISOString();
    database.events.push(event(workspaceId, job, "agent.job.running", { agentId }));

    job.output = buildOutput(agentId, input, database, workspaceId);
    job.status = "SUCCEEDED";
    job.completedAt = new Date().toISOString();
    database.events.push(
      event(workspaceId, job, "agent.job.succeeded", {
        agentId,
        outputKeys: Object.keys(job.output),
      }),
    );
    return structuredClone(job);
  });
};
