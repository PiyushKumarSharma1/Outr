import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { createSeedDatabase } from "../src/seed.js";
import { MemoryDataStore } from "../src/store.js";
import type { OutreachOSRuntimeBridge } from "../src/outreachos-bridge.js";

describe("Outr API", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp({ store: new MemoryDataStore(createSeedDatabase()) });
  });

  afterEach(async () => {
    await app.close();
  });

  it("reports an explicit local persistence and sending posture", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "ok",
      persistence: "atomic-json",
      sendingEnabled: false,
    });
  });

  it("filters and sorts leads with deterministic pagination", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/leads?industry=SaaS&minFitScore=80&sortBy=intentScore&order=desc&limit=10",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.page.total).toBe(2);
    expect(body.data.map((lead: { id: string }) => lead.id)).toEqual(["lead_001", "lead_010"]);
  });

  it("returns GeoJSON points and applies viewport bounds", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/leads/map?bbox=-90,40,-80,43",
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.type).toBe("FeatureCollection");
    expect(body.features.length).toBeGreaterThan(0);
    expect(body.features.every((feature: { geometry: { type: string } }) => feature.geometry.type === "Point")).toBe(true);
  });

  it("keeps workspace data isolated", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/leads",
      headers: { "x-workspace-id": "another_workspace" },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().page.total).toBe(0);
  });

  it("appends suppression and immediately suppresses a matching lead", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/v1/suppressions",
      payload: {
        scope: "EMAIL",
        value: "maya@northstar.example",
        reason: "Recipient requested no contact",
        source: "operator",
      },
    });
    expect(first.statusCode).toBe(201);

    const duplicate = await app.inject({
      method: "POST",
      url: "/v1/suppressions",
      payload: {
        scope: "EMAIL",
        value: "MAYA@NORTHSTAR.EXAMPLE",
        reason: "Duplicate request",
        source: "operator",
      },
    });
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate.json().id).toBe(first.json().id);

    const leads = await app.inject({ method: "GET", url: "/v1/leads?status=SUPPRESSED" });
    expect(leads.json().data.map((lead: { id: string }) => lead.id)).toContain("lead_001");
  });

  it("requires a recorded decision but does not turn on sending", async () => {
    const requested = await app.inject({
      method: "POST",
      url: "/v1/campaigns/campaign_001/activation-request",
      payload: { requestedBy: "ops@example.test" },
    });
    expect(requested.statusCode).toBe(201);
    expect(requested.json().status).toBe("PENDING");

    const decided = await app.inject({
      method: "POST",
      url: `/v1/approvals/${requested.json().id}/decision`,
      payload: { decision: "APPROVED", decidedBy: "reviewer@example.test" },
    });
    expect(decided.statusCode).toBe(200);
    expect(decided.json().status).toBe("APPROVED");

    const campaigns = await app.inject({ method: "GET", url: "/v1/campaigns" });
    expect(campaigns.json().data[0].status).toBe("READY");
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.json().sendingEnabled).toBe(false);
  });

  it("runs typed agent jobs and records the lifecycle event ledger", async () => {
    const registry = await app.inject({ method: "GET", url: "/v1/agents" });
    expect(registry.statusCode).toBe(200);
    expect(registry.json().data).toHaveLength(18);

    const created = await app.inject({
      method: "POST",
      url: "/v1/jobs",
      payload: { agentId: "qualification", input: { threshold: 85 }, correlationId: "test-correlation" },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ status: "SUCCEEDED", agentId: "qualification" });
    expect(created.json().output.qualifiedLeadIds).toContain("lead_001");

    const events = await app.inject({ method: "GET", url: "/v1/events?limit=10" });
    expect(events.json().data.map((item: { type: string }) => item.type)).toEqual([
      "agent.job.succeeded",
      "agent.job.running",
      "agent.job.queued",
    ]);

    const geoJob = await app.inject({
      method: "POST",
      url: "/v1/jobs",
      payload: { agentId: "geo-intelligence", input: { operation: "summarize-territories" } },
    });
    expect(geoJob.statusCode).toBe(201);
    expect(geoJob.json().output).toMatchObject({ mappedLeads: 12, coordinateCoverage: 1 });
    expect(geoJob.json().output.territories.length).toBeGreaterThan(5);
  });

  it("returns validation errors rather than accepting malformed map bounds", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/leads/map?bbox=bad" });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("exposes a source-level OutreachOS runtime bridge without coupling it to the UI", async () => {
    const calls: Array<{ operation: string; input: Record<string, unknown> | undefined }> = [];
    const bridge: OutreachOSRuntimeBridge = {
      status: () => ({ configured: true, root: "/fixture/OutreachOS", python: "python3", writeEnabled: false }),
      call: async (operation, input) => {
        calls.push({ operation, input });
        if (operation === "overview") return { totals: { leads: 42, booked: 3 } };
        if (operation === "campaign_stats") return { total_leads: 42 };
        return { campaigns: [] };
      },
    };
    const bridgedApp = await buildApp({ store: new MemoryDataStore(createSeedDatabase()), outreachOS: bridge });
    try {
      const status = await bridgedApp.inject({ method: "GET", url: "/v1/integrations/outreachos" });
      expect(status.statusCode).toBe(200);
      expect(status.json()).toMatchObject({ configured: true, writeEnabled: false });

      const overview = await bridgedApp.inject({ method: "GET", url: "/v1/integrations/outreachos/overview" });
      expect(overview.statusCode).toBe(200);
      expect(overview.json()).toMatchObject({ totals: { leads: 42, booked: 3 } });

      const stats = await bridgedApp.inject({ method: "GET", url: "/v1/integrations/outreachos/campaigns/acme/stats" });
      expect(stats.statusCode).toBe(200);
      expect(calls).toContainEqual({ operation: "campaign_stats", input: { campaign: "acme" } });
    } finally {
      await bridgedApp.close();
    }
  });
});
