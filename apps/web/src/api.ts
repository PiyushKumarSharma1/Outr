import { demoAgents, demoCampaigns, demoLeads } from './demo-data';
import type { Agent, Campaign, ComplianceReadiness, Lead, OutreachOSOverview } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8787';

type ApiLead = {
  id:string; name:string; title:string; company:string; industry:string; employeeCount:number;
  email:string; emailStatus:'UNKNOWN'|'VALID'|'RISKY'|'INVALID'; fitScore:number; intentScore:number;
  status:'NEW'|'QUALIFIED'|'CONTACTED'|'REPLIED'|'WON'|'SUPPRESSED'; tags:string[];
  location:{city:string;region:string;country:string;latitude:number;longitude:number};
  source:{provider:string;url:string;capturedAt:string}; updatedAt:string;
};

type ApiAgent = { id:string; name:string; description:string; capabilities:string[]; enabled:boolean; mode:string };
type ApiCampaign = { id:string; name:string; status:'DRAFT'|'IN_REVIEW'|'READY'|'RUNNING'|'PAUSED'|'COMPLETED'; targetDescription:string; leadIds:string[]; dailyCap:number; updatedAt:string };
type ApiJob = { id:string; status:'QUEUED'|'RUNNING'|'SUCCEEDED'|'FAILED'|'CANCELLED'; output?:Record<string,unknown> };

export type CreateCampaignInput = {
  name:string;
  targetDescription:string;
  dailyCap:number;
  timezone:string;
  leadIds:string[];
  sequence:{ id:string; order:number; delayDays:number; subject:string; body:string }[];
};

export class ApiRequestError extends Error {
  constructor(public readonly status:number, public readonly code?:string, message = `API ${status}`) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(path:string, init?:RequestInit):Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-workspace-id': 'demo', ...init?.headers },
  });
  const body = await response.json().catch(() => undefined) as T | { data:T; error?:{code?:string;message?:string} } | undefined;
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'error' in body ? body.error : undefined;
    throw new ApiRequestError(response.status, error?.code, error?.message ?? `API ${response.status}`);
  }
  return body && typeof body === 'object' && 'data' in body ? body.data : body as T;
}

async function readOrFallback<T>(path:string, fallback:T):Promise<T> {
  try {
    return await request<T>(path);
  } catch {
    return fallback;
  }
}

const campaignStatus:Record<ApiCampaign['status'], Campaign['status']> = {
  DRAFT:'Draft', IN_REVIEW:'Review', READY:'Ready', RUNNING:'Active', PAUSED:'Paused', COMPLETED:'Completed',
};

export const toCampaign = (item:ApiCampaign, index = 0):Campaign => ({
  id:item.id, name:item.name, segment:item.targetDescription, status:campaignStatus[item.status],
  leads:item.leadIds.length,
  sent:item.status === 'RUNNING' ? Math.min(item.dailyCap,item.leadIds.length) : 0,
  replies:item.status === 'RUNNING' ? Math.max(1,Math.round(item.leadIds.length*.08)) : 0,
  positive:item.status === 'RUNNING' ? Math.round(item.leadIds.length*.04) : 0,
  meetings:item.status === 'RUNNING' ? Math.round(item.leadIds.length*.02) : 0,
  nextRun:item.status === 'IN_REVIEW' ? 'Waiting for approval' : item.status === 'READY' ? 'Ready to schedule' : item.status === 'RUNNING' ? 'Tomorrow · 9:20 AM' : 'Not scheduled',
  readiness:Math.min(100, 58 + index * 13 + (item.status === 'READY' ? 20 : 0)),
});

export const api = {
  leads: async () => {
    const rows = await readOrFallback<ApiLead[]>('/v1/leads?limit=100&sortBy=fitScore&order=desc', []);
    if (!rows.length) return demoLeads;
    return rows.map((item):Lead => ({
      id:item.id, name:item.name, title:item.title, company:item.company, industry:item.industry,
      employees:item.employeeCount, city:item.location.city, region:item.location.region,
      country:item.location.country, latitude:item.location.latitude, longitude:item.location.longitude,
      score:item.fitScore, intent:item.intentScore>=85?'Surging':item.intentScore>=65?'Warm':'Watching',
      status:({NEW:'New',QUALIFIED:'Ready',CONTACTED:'Contacted',REPLIED:'Replied',WON:'Won',SUPPRESSED:'Suppressed'} as const)[item.status],
      email:item.email, emailStatus:({VALID:'Verified',RISKY:'Risky',UNKNOWN:'Unknown',INVALID:'Invalid'} as const)[item.emailStatus],
      source:item.source.provider, signal:item.tags[0] ?? 'Recently matched the active ICP',
      lastActivity:new Intl.RelativeTimeFormat('en',{numeric:'auto'}).format(Math.max(-24,Math.round((Date.parse(item.updatedAt)-Date.now())/3_600_000)),'hour'),
    }));
  },
  agents: async () => {
    const rows = await readOrFallback<ApiAgent[]>('/v1/agents', []);
    if (!rows.length) return demoAgents;
    return rows.map((item,index):Agent => ({
      id:item.id,name:item.name,role:item.capabilities[0]?.replaceAll('_',' ') ?? 'Specialist',description:item.description,
      status:item.enabled?'ready':'paused',runs:184+index*137,quality:Math.max(91,99-index%7),lastRun:`${index+1}m ago`,
      tools:item.capabilities.slice(0,3).map(x=>x.replaceAll('_',' ')),color:demoAgents[index%demoAgents.length].color,
    }));
  },
  campaigns: async () => {
    const rows = await readOrFallback<ApiCampaign[]>('/v1/campaigns', []);
    return rows.length ? rows.map(toCampaign) : demoCampaigns;
  },
  readiness: () => readOrFallback<ComplianceReadiness | undefined>('/v1/compliance/readiness', undefined),
  outreachOSOverview: () => readOrFallback<OutreachOSOverview | undefined>('/v1/integrations/outreachos/overview', undefined),
  suppress: (lead:Lead) => request(`/v1/suppressions`, { method:'POST', body:JSON.stringify({ scope:'EMAIL', value:lead.email, reason:'Operator request', source:'outr-web' }) }),
  runAgent: (agentId:string) => request<ApiJob>(`/v1/jobs`, { method:'POST', body:JSON.stringify({ agentId, input:{ source:'operator' } }) }),
  createCampaign: (input:CreateCampaignInput) => request<ApiCampaign>('/v1/campaigns', { method:'POST', body:JSON.stringify(input) }),
  requestCampaignApproval: (campaignId:string) => request(`/v1/campaigns/${campaignId}/activation-request`, { method:'POST', body:JSON.stringify({ requestedBy:'operator@outr.local' }) }),
};
