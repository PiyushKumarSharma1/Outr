import type { Agent, Campaign, Lead } from './types';

export const demoLeads: Lead[] = [
  { id:'ld_01', name:'Maya Chen', title:'VP Revenue Operations', company:'Northstar Labs', industry:'SaaS', employees:420, city:'San Francisco', region:'CA', country:'US', latitude:37.7749, longitude:-122.4194, score:96, intent:'Surging', status:'Ready', email:'maya@northstarlabs.io', emailStatus:'Verified', source:'Company careers', signal:'Hiring 4 sales ops roles', lastActivity:'8m ago' },
  { id:'ld_02', name:'Theo Martin', title:'Head of Growth', company:'Arcworks', industry:'Fintech', employees:180, city:'New York', region:'NY', country:'US', latitude:40.7128, longitude:-74.006, score:92, intent:'Surging', status:'Researching', email:'theo@arcworks.co', emailStatus:'Verified', source:'Product changelog', signal:'Launched enterprise tier', lastActivity:'14m ago' },
  { id:'ld_03', name:'Priya Raman', title:'Director of Sales', company:'Juniper Health', industry:'Healthtech', employees:760, city:'Austin', region:'TX', country:'US', latitude:30.2672, longitude:-97.7431, score:89, intent:'Warm', status:'Ready', email:'priya@juniperhealth.com', emailStatus:'Verified', source:'Press release', signal:'Expanded into 3 states', lastActivity:'22m ago' },
  { id:'ld_04', name:'Elliot Woods', title:'CRO', company:'Form & Field', industry:'Professional services', employees:95, city:'Chicago', region:'IL', country:'US', latitude:41.8781, longitude:-87.6298, score:85, intent:'Warm', status:'Contacted', email:'elliot@formfield.com', emailStatus:'Verified', source:'First-party CRM', signal:'Visited pricing 3 times', lastActivity:'31m ago' },
  { id:'ld_05', name:'Sofia Alvarez', title:'VP Partnerships', company:'LumaGrid', industry:'Climate tech', employees:310, city:'Denver', region:'CO', country:'US', latitude:39.7392, longitude:-104.9903, score:82, intent:'Warm', status:'New', email:'sofia@lumagrid.energy', emailStatus:'Risky', source:'Conference list', signal:'Speaking at GridForward', lastActivity:'46m ago' },
  { id:'ld_06', name:'Marcus Reed', title:'Founder & CEO', company:'Harborline', industry:'Logistics', employees:62, city:'Seattle', region:'WA', country:'US', latitude:47.6062, longitude:-122.3321, score:78, intent:'Watching', status:'New', email:'marcus@harborline.io', emailStatus:'Unknown', source:'Public registry', signal:'Raised seed extension', lastActivity:'1h ago' },
  { id:'ld_07', name:'Aisha Bello', title:'Chief Commercial Officer', company:'Metric Grove', industry:'Analytics', employees:540, city:'Boston', region:'MA', country:'US', latitude:42.3601, longitude:-71.0589, score:94, intent:'Surging', status:'Replied', email:'aisha@metricgrove.com', emailStatus:'Verified', source:'Inbound reply', signal:'Asked for benchmark deck', lastActivity:'3m ago' },
  { id:'ld_08', name:'Noah Williams', title:'VP GTM', company:'Slate Robotics', industry:'Robotics', employees:225, city:'Detroit', region:'MI', country:'US', latitude:42.3314, longitude:-83.0458, score:87, intent:'Warm', status:'Ready', email:'noah@slaterobotics.ai', emailStatus:'Verified', source:'Jobs page', signal:'Building first SDR team', lastActivity:'18m ago' },
  { id:'ld_09', name:'Camille Laurent', title:'Sales Director', company:'Aster Security', industry:'Cybersecurity', employees:390, city:'Toronto', region:'ON', country:'CA', latitude:43.6532, longitude:-79.3832, score:84, intent:'Warm', status:'Ready', email:'camille@astersecurity.ca', emailStatus:'Verified', source:'Tech directory', signal:'New SOC 2 certification', lastActivity:'52m ago' },
  { id:'ld_10', name:'Daniel Kim', title:'Head of Demand Gen', company:'Relay Cloud', industry:'Cloud infrastructure', employees:1100, city:'Portland', region:'OR', country:'US', latitude:45.5152, longitude:-122.6784, score:91, intent:'Surging', status:'Researching', email:'daniel@relaycloud.com', emailStatus:'Verified', source:'Intent partner', signal:'Comparing outbound platforms', lastActivity:'11m ago' },
];

export const demoAgents: Agent[] = [
  { id:'ag_01', name:'Scout', role:'Signal discovery', description:'Monitors approved public sources and turns buying signals into evidence-backed prospects.', status:'working', runs:1842, quality:97, lastRun:'2m ago', tools:['Web search','Source ledger','ICP rules'], color:'#35695a' },
  { id:'ag_02', name:'Verifier', role:'Identity & email QA', description:'Validates identity, source provenance, deduplication and contact confidence.', status:'working', runs:931, quality:99, lastRun:'4m ago', tools:['DNS','Enrichment','Suppression'], color:'#466786' },
  { id:'ag_03', name:'Researcher', role:'Account intelligence', description:'Builds concise account briefs from cited company, role and market evidence.', status:'ready', runs:714, quality:94, lastRun:'9m ago', tools:['Research','Evidence graph','Summaries'], color:'#8a6338' },
  { id:'ag_04', name:'Writer', role:'Message studio', description:'Drafts claim-disciplined, one-CTA messages grounded in approved research.', status:'ready', runs:602, quality:92, lastRun:'12m ago', tools:['Brand voice','Sequences','A/B variants'], color:'#725878' },
  { id:'ag_05', name:'Guardian', role:'Policy & deliverability', description:'Blocks suppressed contacts, policy conflicts, unverified senders and risky volume.', status:'working', runs:2281, quality:100, lastRun:'1m ago', tools:['Policy engine','Approvals','Audit log'], color:'#9b4c45' },
  { id:'ag_06', name:'Router', role:'Workflow orchestration', description:'Moves typed jobs through the agent pool with retries, observability and human gates.', status:'ready', runs:1104, quality:98, lastRun:'6m ago', tools:['Durable queue','Routing','Webhooks'], color:'#4c5e72' },
];

export const demoCampaigns: Campaign[] = [
  { id:'cp_01', name:'Series A RevOps — Q3', segment:'US SaaS · 100–800 employees', status:'Active', leads:248, sent:126, replies:19, positive:11, meetings:6, nextRun:'Tomorrow · 9:20 AM', readiness:100 },
  { id:'cp_02', name:'Midwest Robotics Expansion', segment:'Manufacturing & robotics · Great Lakes', status:'Review', leads:74, sent:0, replies:0, positive:0, meetings:0, nextRun:'Waiting for 2 approvals', readiness:84 },
  { id:'cp_03', name:'Climate GTM Signals', segment:'Climate tech · recent growth signals', status:'Draft', leads:116, sent:0, replies:0, positive:0, meetings:0, nextRun:'Not scheduled', readiness:58 },
  { id:'cp_04', name:'Re-engage Qualified — H1', segment:'Prior positive replies · no meeting', status:'Paused', leads:42, sent:37, replies:8, positive:5, meetings:2, nextRun:'Paused by operator', readiness:92 },
];

export const weeklyActivity = [
  { day:'Mon', discovered:118, qualified:42, replies:7 }, { day:'Tue', discovered:146, qualified:51, replies:9 },
  { day:'Wed', discovered:131, qualified:48, replies:8 }, { day:'Thu', discovered:176, qualified:67, replies:13 },
  { day:'Fri', discovered:194, qualified:72, replies:17 }, { day:'Sat', discovered:82, qualified:29, replies:4 },
  { day:'Sun', discovered:97, qualified:35, replies:6 },
];
