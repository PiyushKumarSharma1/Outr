export type LeadStatus = 'New' | 'Researching' | 'Ready' | 'Contacted' | 'Replied' | 'Won' | 'Suppressed';

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  employees: number;
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  score: number;
  intent: 'Surging' | 'Warm' | 'Watching';
  status: LeadStatus;
  email: string;
  emailStatus: 'Verified' | 'Risky' | 'Invalid' | 'Unknown';
  source: string;
  signal: string;
  lastActivity: string;
  selected?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: 'working' | 'ready' | 'paused';
  runs: number;
  quality: number;
  lastRun: string;
  tools: string[];
  color: string;
}

export interface Campaign {
  id: string;
  name: string;
  segment: string;
  status: 'Draft' | 'Review' | 'Ready' | 'Active' | 'Paused' | 'Completed';
  leads: number;
  sent: number;
  replies: number;
  positive: number;
  meetings: number;
  nextRun: string;
  readiness: number;
}

export interface ComplianceGate {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'NEEDS_EVIDENCE';
  detail: string;
}

export interface ComplianceReadiness {
  sendingEnabled: boolean;
  ready: boolean;
  gates: ComplianceGate[];
}

export interface OutreachOSOverview {
  totals: { leads: number; booked: number; sent: number };
  campaigns: { id: string; name: string; status: string; stats: { total_leads: number } }[];
}

export type ViewKey = 'command' | 'leads' | 'campaigns' | 'agents' | 'inbox';
