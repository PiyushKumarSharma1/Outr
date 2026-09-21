import { z } from "zod";

export const LeadStatusSchema = z.enum([
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "REPLIED",
  "WON",
  "SUPPRESSED",
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const EmailStatusSchema = z.enum([
  "UNKNOWN",
  "VALID",
  "RISKY",
  "INVALID",
]);
export type EmailStatus = z.infer<typeof EmailStatusSchema>;

export const LocationSchema = z.object({
  city: z.string().min(1),
  region: z.string().min(1),
  country: z.string().length(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Location = z.infer<typeof LocationSchema>;

export const LeadSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  company: z.string().min(1),
  name: z.string().min(1),
  title: z.string().min(1),
  email: z.string().email(),
  emailStatus: EmailStatusSchema,
  website: z.string().url(),
  industry: z.string().min(1),
  employeeCount: z.number().int().nonnegative(),
  revenueBand: z.string().min(1),
  fitScore: z.number().int().min(0).max(100),
  intentScore: z.number().int().min(0).max(100),
  status: LeadStatusSchema,
  tags: z.array(z.string().min(1)).default([]),
  location: LocationSchema,
  source: z.object({
    provider: z.string().min(1),
    url: z.string().url(),
    capturedAt: z.string().datetime(),
  }),
  assignedAgentId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const CreateLeadSchema = LeadSchema.omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: LeadStatusSchema.default("NEW"),
  emailStatus: EmailStatusSchema.default("UNKNOWN"),
  fitScore: z.number().int().min(0).max(100).default(0),
  intentScore: z.number().int().min(0).max(100).default(0),
  tags: z.array(z.string().min(1)).default([]),
});
export type CreateLead = z.infer<typeof CreateLeadSchema>;

export const SequenceStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(1).max(5),
  delayDays: z.number().int().min(0).max(30),
  subject: z.string().min(1).max(140),
  body: z.string().min(1).max(10_000),
});
export type SequenceStep = z.infer<typeof SequenceStepSchema>;

export const CampaignStatusSchema = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "READY",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
]);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const CampaignSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  status: CampaignStatusSchema,
  channel: z.literal("EMAIL"),
  targetDescription: z.string().min(1),
  dailyCap: z.number().int().min(1).max(500),
  timezone: z.string().min(1),
  sequence: z.array(SequenceStepSchema).min(1).max(5),
  leadIds: z.array(z.string()),
  approvalId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const CreateCampaignSchema = CampaignSchema.omit({
  id: true,
  workspaceId: true,
  status: true,
  approvalId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  channel: z.literal("EMAIL").default("EMAIL"),
  leadIds: z.array(z.string()).default([]),
});
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>;

export const SuppressionScopeSchema = z.enum(["EMAIL", "DOMAIN", "WORKSPACE"]);
export type SuppressionScope = z.infer<typeof SuppressionScopeSchema>;

export const SuppressionEntrySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  scope: SuppressionScopeSchema,
  value: z.string().min(1),
  reason: z.string().min(1),
  source: z.string().min(1),
  createdAt: z.string().datetime(),
});
export type SuppressionEntry = z.infer<typeof SuppressionEntrySchema>;

export const CreateSuppressionSchema = SuppressionEntrySchema.omit({
  id: true,
  workspaceId: true,
  createdAt: true,
});
export type CreateSuppression = z.infer<typeof CreateSuppressionSchema>;

export const ApprovalStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
export const ApprovalKindSchema = z.enum([
  "CAMPAIGN_ACTIVATION",
  "MESSAGE_TEMPLATE",
  "DATA_SOURCE",
]);
export type ApprovalKind = z.infer<typeof ApprovalKindSchema>;

export const ApprovalSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  kind: ApprovalKindSchema,
  resourceId: z.string().min(1),
  status: ApprovalStatusSchema,
  requestedBy: z.string().min(1),
  requestedAt: z.string().datetime(),
  decidedBy: z.string().optional(),
  decidedAt: z.string().datetime().optional(),
  note: z.string().max(2_000).optional(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

export const AgentDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  capabilities: z.array(z.string().min(1)).min(1),
  accepts: z.array(z.string().min(1)),
  produces: z.array(z.string().min(1)),
  enabled: z.boolean(),
  mode: z.enum(["LOCAL", "PROVIDER_OPTIONAL"]),
});
export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

export const AgentJobStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]);
export type AgentJobStatus = z.infer<typeof AgentJobStatusSchema>;

export const AgentJobSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  agentId: z.string().min(1),
  status: AgentJobStatusSchema,
  input: z.record(z.unknown()),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  correlationId: z.string().min(1),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});
export type AgentJob = z.infer<typeof AgentJobSchema>;

export const CreateAgentJobSchema = z.object({
  agentId: z.string().min(1),
  input: z.record(z.unknown()).default({}),
  correlationId: z.string().min(1).optional(),
});
export type CreateAgentJob = z.infer<typeof CreateAgentJobSchema>;

export const DomainEventSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  type: z.string().min(1),
  aggregateType: z.string().min(1),
  aggregateId: z.string().min(1),
  correlationId: z.string().min(1),
  payload: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});
export type DomainEvent = z.infer<typeof DomainEventSchema>;

export const ComplianceGateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["PASS", "FAIL", "NEEDS_EVIDENCE"]),
  detail: z.string().min(1),
});
export type ComplianceGate = z.infer<typeof ComplianceGateSchema>;

export const ComplianceReadinessSchema = z.object({
  sendingEnabled: z.boolean(),
  launchMarket: z.literal("US_B2B_EMAIL"),
  gates: z.array(ComplianceGateSchema),
  ready: z.boolean(),
});
export type ComplianceReadiness = z.infer<typeof ComplianceReadinessSchema>;

export const WorkspaceHeaderSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);

export type ApiError = {
  error: { code: string; message: string; details?: unknown };
};

export type Paginated<T> = {
  data: T[];
  page: { number: number; size: number; total: number; totalPages: number };
};
