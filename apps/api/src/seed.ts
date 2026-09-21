import type { Campaign, Lead } from "@outr/contracts";
import type { Database } from "./store.js";

const capturedAt = "2026-08-24T12:00:00.000Z";

const lead = (
  id: string,
  company: string,
  name: string,
  title: string,
  email: string,
  industry: string,
  city: string,
  region: string,
  latitude: number,
  longitude: number,
  fitScore: number,
  intentScore: number,
  status: Lead["status"],
  tags: string[],
  employeeCount: number,
  revenueBand: string,
): Lead => ({
  id,
  workspaceId: "demo",
  company,
  name,
  title,
  email,
  emailStatus: fitScore > 80 ? "VALID" : "UNKNOWN",
  website: `https://${company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`,
  industry,
  employeeCount,
  revenueBand,
  fitScore,
  intentScore,
  status,
  tags,
  location: { city, region, country: "US", latitude, longitude },
  source: {
    provider: "deterministic-demo",
    url: `https://example.com/evidence/${id}`,
    capturedAt,
  },
  createdAt: capturedAt,
  updatedAt: capturedAt,
});

export const deterministicLeads: Lead[] = [
  lead("lead_001", "Northstar Labs", "Maya Chen", "VP Revenue", "maya@northstar.example", "SaaS", "Detroit", "MI", 42.3314, -83.0458, 96, 88, "QUALIFIED", ["intent", "series-b"], 180, "$10M-$25M"),
  lead("lead_002", "Atlas Forge", "Noah Williams", "COO", "noah@atlasforge.example", "Manufacturing", "Grand Rapids", "MI", 42.9634, -85.6681, 87, 72, "NEW", ["hiring", "mid-market"], 420, "$25M-$50M"),
  lead("lead_003", "Bright Harbor", "Sofia Patel", "Head of Growth", "sofia@brightharbor.example", "Fintech", "Chicago", "IL", 41.8781, -87.6298, 92, 91, "QUALIFIED", ["intent", "fintech"], 95, "$5M-$10M"),
  lead("lead_004", "Fieldstone Health", "Ethan Brooks", "Director Partnerships", "ethan@fieldstone.example", "Healthcare", "Columbus", "OH", 39.9612, -82.9988, 82, 65, "CONTACTED", ["healthcare", "partner"], 650, "$50M-$100M"),
  lead("lead_005", "Orbit Grid", "Ava Rodriguez", "CRO", "ava@orbitgrid.example", "Energy", "Austin", "TX", 30.2672, -97.7431, 90, 84, "REPLIED", ["clean-tech", "intent"], 240, "$25M-$50M"),
  lead("lead_006", "Pinecone Works", "Liam Foster", "Founder", "liam@pinecone.example", "Professional Services", "Denver", "CO", 39.7392, -104.9903, 74, 55, "NEW", ["smb", "founder-led"], 32, "$1M-$5M"),
  lead("lead_007", "Redwood Signal", "Emma Kim", "VP Marketing", "emma@redwoodsignal.example", "Cybersecurity", "San Francisco", "CA", 37.7749, -122.4194, 94, 93, "QUALIFIED", ["cybersecurity", "series-c"], 310, "$25M-$50M"),
  lead("lead_008", "Lakeview Freight", "Oliver Smith", "Chief Commercial Officer", "oliver@lakeviewfreight.example", "Logistics", "Cleveland", "OH", 41.4993, -81.6944, 79, 61, "NEW", ["logistics", "mid-market"], 780, "$100M-$250M"),
  lead("lead_009", "Juniper Learning", "Isabella Moore", "VP Sales", "isabella@juniperlearning.example", "Education", "Boston", "MA", 42.3601, -71.0589, 85, 77, "CONTACTED", ["edtech", "intent"], 145, "$10M-$25M"),
  lead("lead_010", "Copper Cloud", "Lucas Martin", "Growth Lead", "lucas@coppercloud.example", "SaaS", "Seattle", "WA", 47.6062, -122.3321, 89, 86, "WON", ["saas", "expansion"], 205, "$25M-$50M"),
  lead("lead_011", "Evergreen Legal", "Mia Thompson", "Managing Partner", "mia@evergreenlegal.example", "Legal", "Portland", "OR", 45.5152, -122.6784, 71, 49, "NEW", ["services", "regional"], 68, "$5M-$10M"),
  lead("lead_012", "Cobalt Robotics", "James Wilson", "VP Business Development", "james@cobaltrobotics.example", "Robotics", "Pittsburgh", "PA", 40.4406, -79.9959, 93, 89, "QUALIFIED", ["robotics", "funding"], 125, "$10M-$25M"),
];

const campaign: Campaign = {
  id: "campaign_001",
  workspaceId: "demo",
  name: "Mid-market intent pilot",
  status: "DRAFT",
  channel: "EMAIL",
  targetDescription: "US mid-market revenue leaders with verified intent signals",
  dailyCap: 25,
  timezone: "America/Detroit",
  sequence: [
    {
      id: "step_001",
      order: 1,
      delayDays: 0,
      subject: "Idea for {{company}}",
      body: "Hi {{first_name}}, I noticed {{company}} is investing in growth. I drafted a relevant idea for your team.",
    },
    {
      id: "step_002",
      order: 2,
      delayDays: 4,
      subject: "Re: Idea for {{company}}",
      body: "Worth sending the short benchmark, {{first_name}}?",
    },
  ],
  leadIds: ["lead_001", "lead_003", "lead_007", "lead_012"],
  createdAt: capturedAt,
  updatedAt: capturedAt,
};

export const createSeedDatabase = (): Database => ({
  version: 1,
  leads: structuredClone(deterministicLeads),
  campaigns: [structuredClone(campaign)],
  suppressions: [],
  approvals: [],
  jobs: [],
  events: [],
});
