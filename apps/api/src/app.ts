import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import {
  ApprovalStatusSchema,
  CreateAgentJobSchema,
  CreateCampaignSchema,
  CreateLeadSchema,
  CreateSuppressionSchema,
  LeadStatusSchema,
  WorkspaceHeaderSchema,
  type Approval,
  type Campaign,
  type DomainEvent,
  type Lead,
  type Paginated,
} from "@outr/contracts";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { z, ZodError } from "zod";
import { agentRegistry, complianceReadiness, executeAgentJob } from "./agents.js";
import { OutreachOSBridgeError, PythonOutreachOSBridge, type OutreachOSRuntimeBridge } from "./outreachos-bridge.js";
import type { Database, DataStore } from "./store.js";

export type BuildAppOptions = {
  store: DataStore;
  logger?: boolean;
  outreachOS?: OutreachOSRuntimeBridge;
};

const ListLeadQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: LeadStatusSchema.optional(),
  industry: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  minFitScore: z.coerce.number().int().min(0).max(100).default(0),
  minIntentScore: z.coerce.number().int().min(0).max(100).default(0),
  sortBy: z.enum(["fitScore", "intentScore", "company", "createdAt"]).default("fitScore"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(250).default(100),
});

const DecisionSchema = z.object({
  decision: ApprovalStatusSchema.refine((value) => value !== "PENDING", {
    message: "Decision must be APPROVED or REJECTED",
  }),
  decidedBy: z.string().min(1).max(200),
  note: z.string().max(2_000).optional(),
});

const ActivationRequestSchema = z.object({
  requestedBy: z.string().min(1).max(200),
});

const serializeError = (code: string, message: string, details?: unknown) => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

const workspaceId = (request: FastifyRequest): string => {
  const raw = request.headers["x-workspace-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return WorkspaceHeaderSchema.parse(value ?? "demo");
};

const event = (
  workspace: string,
  type: string,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
): DomainEvent => ({
  id: `event_${randomUUID()}`,
  workspaceId: workspace,
  type,
  aggregateType,
  aggregateId,
  correlationId: `correlation_${randomUUID()}`,
  payload,
  createdAt: new Date().toISOString(),
});

const scoped = (database: Database, workspace: string) => ({
  leads: database.leads.filter((item) => item.workspaceId === workspace),
  campaigns: database.campaigns.filter((item) => item.workspaceId === workspace),
  suppressions: database.suppressions.filter((item) => item.workspaceId === workspace),
  approvals: database.approvals.filter((item) => item.workspaceId === workspace),
  jobs: database.jobs.filter((item) => item.workspaceId === workspace),
  events: database.events.filter((item) => item.workspaceId === workspace),
});

export const buildApp = async ({ store, logger = false, outreachOS = new PythonOutreachOSBridge() }: BuildAppOptions): Promise<FastifyInstance> => {
  const app = Fastify({ logger });
  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof OutreachOSBridgeError) {
      reply.status(error.statusCode).send(serializeError(error.code, error.message));
      return;
    }
    if (error instanceof ZodError) {
      reply.status(400).send(serializeError("VALIDATION_ERROR", "Request validation failed", error.flatten()));
      return;
    }
    if (error instanceof Error && error.message === "AGENT_NOT_FOUND") {
      reply.status(404).send(serializeError("AGENT_NOT_FOUND", "The requested agent is not registered or enabled"));
      return;
    }
    app.log.error(error);
    reply.status(500).send(serializeError("INTERNAL_ERROR", "The request could not be completed"));
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "outr-api",
    version: "0.1.0",
    persistence: "atomic-json",
    sendingEnabled: false,
  }));

  app.get("/v1/integrations/outreachos", async () => outreachOS.status());

  app.get("/v1/integrations/outreachos/overview", async () => outreachOS.call("overview"));

  app.get("/v1/integrations/outreachos/campaigns", async () => outreachOS.call("campaigns"));

  app.get("/v1/integrations/outreachos/campaigns/:campaign/stats", async (request) => {
    const { campaign } = z.object({ campaign: z.string().min(1).max(200) }).parse(request.params);
    return outreachOS.call("campaign_stats", { campaign });
  });

  app.get("/v1/integrations/outreachos/campaigns/:campaign/leads", async (request) => {
    const { campaign } = z.object({ campaign: z.string().min(1).max(200) }).parse(request.params);
    const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }).parse(request.query);
    return outreachOS.call("search_leads", { campaign, limit });
  });

  app.post("/v1/integrations/outreachos/campaigns/:campaign/cycle", async (request) => {
    const { campaign } = z.object({ campaign: z.string().min(1).max(200) }).parse(request.params);
    const { limit } = z.object({ limit: z.coerce.number().int().min(1).max(100).default(25) }).parse(request.body);
    return outreachOS.call("run_cycle", { campaign, limit });
  });

  app.get("/v1/summary", async (request) => {
    const workspace = workspaceId(request);
    const view = scoped(await store.read(), workspace);
    return {
      leads: view.leads.length,
      qualifiedLeads: view.leads.filter((item) => item.status === "QUALIFIED").length,
      replies: view.leads.filter((item) => item.status === "REPLIED").length,
      won: view.leads.filter((item) => item.status === "WON").length,
      campaigns: view.campaigns.length,
      pendingApprovals: view.approvals.filter((item) => item.status === "PENDING").length,
      activeJobs: view.jobs.filter((item) => ["QUEUED", "RUNNING"].includes(item.status)).length,
      sendingEnabled: false,
    };
  });

  app.get("/v1/leads", async (request): Promise<Paginated<Lead>> => {
    const workspace = workspaceId(request);
    const query = ListLeadQuerySchema.parse(request.query);
    const needle = query.search?.toLocaleLowerCase();
    const candidates = (await store.read()).leads.filter((item) => {
      if (item.workspaceId !== workspace) return false;
      if (query.status && item.status !== query.status) return false;
      if (query.industry && item.industry.toLocaleLowerCase() !== query.industry.toLocaleLowerCase()) return false;
      if (query.tag && !item.tags.some((tag) => tag.toLocaleLowerCase() === query.tag?.toLocaleLowerCase())) return false;
      if (item.fitScore < query.minFitScore || item.intentScore < query.minIntentScore) return false;
      if (needle) {
        const haystack = [item.company, item.name, item.title, item.email, item.industry, ...item.tags]
          .join(" ")
          .toLocaleLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });

    candidates.sort((left, right) => {
      const a = left[query.sortBy];
      const b = right[query.sortBy];
      const order = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
      return query.order === "asc" ? order : -order;
    });
    const start = (query.page - 1) * query.limit;
    return {
      data: candidates.slice(start, start + query.limit),
      page: {
        number: query.page,
        size: query.limit,
        total: candidates.length,
        totalPages: Math.ceil(candidates.length / query.limit),
      },
    };
  });

  app.get("/v1/leads/map", async (request) => {
    const workspace = workspaceId(request);
    const query = z.object({ bbox: z.string().optional(), status: LeadStatusSchema.optional() }).parse(request.query);
    let bounds: [number, number, number, number] | undefined;
    if (query.bbox) {
      const parts = query.bbox.split(",").map(Number);
      if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
        throw new ZodError([{ code: "custom", path: ["bbox"], message: "bbox must be west,south,east,north" }]);
      }
      bounds = parts as [number, number, number, number];
    }
    const leads = (await store.read()).leads.filter((item) => {
      if (item.workspaceId !== workspace || (query.status && item.status !== query.status)) return false;
      if (!bounds) return true;
      const [west, south, east, north] = bounds;
      return item.location.longitude >= west && item.location.longitude <= east && item.location.latitude >= south && item.location.latitude <= north;
    });
    return {
      type: "FeatureCollection" as const,
      features: leads.map((item) => ({
        type: "Feature" as const,
        id: item.id,
        geometry: { type: "Point" as const, coordinates: [item.location.longitude, item.location.latitude] },
        properties: {
          leadId: item.id,
          company: item.company,
          name: item.name,
          title: item.title,
          industry: item.industry,
          fitScore: item.fitScore,
          intentScore: item.intentScore,
          status: item.status,
        },
      })),
    };
  });

  app.post("/v1/leads", async (request, reply) => {
    const workspace = workspaceId(request);
    const input = CreateLeadSchema.parse(request.body);
    const created = await store.update((database) => {
      const now = new Date().toISOString();
      const lead: Lead = { ...input, id: `lead_${randomUUID()}`, workspaceId: workspace, createdAt: now, updatedAt: now };
      database.leads.push(lead);
      database.events.push(event(workspace, "lead.created", "lead", lead.id, { company: lead.company }));
      return lead;
    });
    return reply.status(201).send(created);
  });

  app.get("/v1/campaigns", async (request) => {
    const workspace = workspaceId(request);
    return { data: (await store.read()).campaigns.filter((item) => item.workspaceId === workspace) };
  });

  app.post("/v1/campaigns", async (request, reply) => {
    const workspace = workspaceId(request);
    const input = CreateCampaignSchema.parse(request.body);
    const campaign = await store.update((database) => {
      const leadIds = new Set(database.leads.filter((item) => item.workspaceId === workspace).map((item) => item.id));
      const missingLeadIds = input.leadIds.filter((id) => !leadIds.has(id));
      if (missingLeadIds.length) throw new ZodError([{ code: "custom", path: ["leadIds"], message: `Unknown lead IDs: ${missingLeadIds.join(", ")}` }]);
      const now = new Date().toISOString();
      const campaign: Campaign = { ...input, id: `campaign_${randomUUID()}`, workspaceId: workspace, status: "DRAFT", createdAt: now, updatedAt: now };
      database.campaigns.push(campaign);
      database.events.push(event(workspace, "campaign.created", "campaign", campaign.id, { leadCount: campaign.leadIds.length }));
      return campaign;
    });
    return reply.status(201).send(campaign);
  });

  app.post("/v1/campaigns/:campaignId/activation-request", async (request, reply) => {
    const workspace = workspaceId(request);
    const { campaignId } = z.object({ campaignId: z.string().min(1) }).parse(request.params);
    const input = ActivationRequestSchema.parse(request.body);
    const result = await store.update((database) => {
      const campaign = database.campaigns.find((item) => item.id === campaignId && item.workspaceId === workspace);
      if (!campaign) return undefined;
      const existing = database.approvals.find((item) => item.id === campaign.approvalId && item.status === "PENDING");
      if (existing) return existing;
      const approval: Approval = {
        id: `approval_${randomUUID()}`,
        workspaceId: workspace,
        kind: "CAMPAIGN_ACTIVATION",
        resourceId: campaign.id,
        status: "PENDING",
        requestedBy: input.requestedBy,
        requestedAt: new Date().toISOString(),
      };
      campaign.status = "IN_REVIEW";
      campaign.approvalId = approval.id;
      campaign.updatedAt = new Date().toISOString();
      database.approvals.push(approval);
      database.events.push(event(workspace, "approval.requested", "campaign", campaign.id, { approvalId: approval.id }));
      return approval;
    });
    if (!result) return reply.status(404).send(serializeError("CAMPAIGN_NOT_FOUND", "Campaign not found"));
    return reply.status(201).send(result);
  });

  app.get("/v1/suppressions", async (request) => {
    const workspace = workspaceId(request);
    return { data: (await store.read()).suppressions.filter((item) => item.workspaceId === workspace) };
  });

  app.post("/v1/suppressions", async (request, reply) => {
    const workspace = workspaceId(request);
    const input = CreateSuppressionSchema.parse(request.body);
    const normalizedValue = input.value.trim().toLocaleLowerCase();
    const result = await store.update((database) => {
      const existing = database.suppressions.find((item) => item.workspaceId === workspace && item.scope === input.scope && item.value === normalizedValue);
      if (existing) return { entry: existing, created: false };
      const entry = { ...input, value: normalizedValue, id: `suppression_${randomUUID()}`, workspaceId: workspace, createdAt: new Date().toISOString() };
      database.suppressions.push(entry);
      if (input.scope === "EMAIL") {
        for (const lead of database.leads.filter((item) => item.workspaceId === workspace && item.email.toLocaleLowerCase() === normalizedValue)) {
          lead.status = "SUPPRESSED";
          lead.updatedAt = new Date().toISOString();
        }
      }
      database.events.push(event(workspace, "suppression.created", "suppression", entry.id, { scope: entry.scope, value: entry.value }));
      return { entry, created: true };
    });
    return reply.status(result.created ? 201 : 200).send(result.entry);
  });

  app.get("/v1/approvals", async (request) => {
    const workspace = workspaceId(request);
    return { data: (await store.read()).approvals.filter((item) => item.workspaceId === workspace) };
  });

  app.post("/v1/approvals/:approvalId/decision", async (request, reply) => {
    const workspace = workspaceId(request);
    const { approvalId } = z.object({ approvalId: z.string().min(1) }).parse(request.params);
    const input = DecisionSchema.parse(request.body);
    const result = await store.update((database) => {
      const approval = database.approvals.find((item) => item.id === approvalId && item.workspaceId === workspace);
      if (!approval) return { kind: "missing" as const };
      if (approval.status !== "PENDING") return { kind: "conflict" as const, approval };
      approval.status = input.decision;
      approval.decidedBy = input.decidedBy;
      approval.decidedAt = new Date().toISOString();
      if (input.note) approval.note = input.note;
      const campaign = database.campaigns.find((item) => item.id === approval.resourceId && item.workspaceId === workspace);
      if (campaign) {
        campaign.status = input.decision === "REJECTED" ? "DRAFT" : "READY";
        campaign.updatedAt = new Date().toISOString();
      }
      database.events.push(event(workspace, "approval.decided", "approval", approval.id, { decision: approval.status, sendingEnabled: false }));
      return { kind: "ok" as const, approval };
    });
    if (result.kind === "missing") return reply.status(404).send(serializeError("APPROVAL_NOT_FOUND", "Approval not found"));
    if (result.kind === "conflict") return reply.status(409).send(serializeError("APPROVAL_ALREADY_DECIDED", "Approval has already been decided"));
    return result.approval;
  });

  app.get("/v1/compliance/readiness", async (request) => {
    const workspace = workspaceId(request);
    return complianceReadiness(await store.read(), workspace);
  });

  app.get("/v1/agents", async () => ({ data: agentRegistry }));

  app.get("/v1/jobs", async (request) => {
    const workspace = workspaceId(request);
    const { limit } = ListQuerySchema.parse(request.query);
    return { data: (await store.read()).jobs.filter((item) => item.workspaceId === workspace).slice(-limit).reverse() };
  });

  app.post("/v1/jobs", async (request, reply) => {
    const workspace = workspaceId(request);
    const input = CreateAgentJobSchema.parse(request.body);
    const job = await executeAgentJob(store, workspace, input.agentId, input.input, input.correlationId);
    return reply.status(201).send(job);
  });

  app.get("/v1/events", async (request) => {
    const workspace = workspaceId(request);
    const { limit } = ListQuerySchema.parse(request.query);
    return { data: (await store.read()).events.filter((item) => item.workspaceId === workspace).slice(-limit).reverse() };
  });

  return app;
};
