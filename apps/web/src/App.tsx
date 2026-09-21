import { lazy, Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ArrowUpRight, Bell, Bot, BriefcaseBusiness, Building2, Check, CheckCircle2,
  ChevronDown, CircleDollarSign, Command, Filter, Globe2, Inbox, LayoutDashboard, ListFilter,
  MailCheck, Map, MapPin, MessageSquareReply, MoreHorizontal, Network, Pause, Play, Plus,
  Search, Send, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target, UsersRound, X,
  Zap, Eye, TrendingUp, BarChart3, Layers, Cpu, Database, Globe, AlertTriangle, Clock,
  Star, Heart, Download, Upload, RefreshCw, ExternalLink, Copy, Trash2, Edit3,
  ChevronRight, ChevronUp, Info, AlertCircle, CheckSquare, Square, Hash, AtSign,
  Phone, Link2, Calendar, FileText, Users, Award, Bookmark, BookmarkCheck
} from 'lucide-react';
import { api, toCampaign, type CreateCampaignInput } from './api';
import { LeadDrawer } from './components/LeadDrawer';
import { MetricCard } from './components/MetricCard';
import { SignalBadge } from './components/SignalBadge';
import { demoAgents, demoCampaigns, demoLeads, weeklyActivity } from './demo-data';
import type { Agent, Campaign, ComplianceReadiness, Lead, OutreachOSOverview, ViewKey } from './types';

const LeadMap = lazy(() => import('./components/LeadMap').then((module) => ({ default: module.LeadMap })));

const nav: { key:ViewKey; label:string; icon:typeof Command; badge?:number }[] = [
  { key:'command', label:'Command', icon:LayoutDashboard },
  { key:'leads', label:'Leads', icon:UsersRound },
  { key:'campaigns', label:'Campaigns', icon:Send },
  { key:'agents', label:'Agent pool', icon:Network },
  { key:'inbox', label:'Inbox', icon:Inbox, badge:3 },
];

export function App() {
  const [view, setView] = useState<ViewKey>('command');
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [agents, setAgents] = useState<Agent[]>(demoAgents);
  const [campaigns, setCampaigns] = useState<Campaign[]>(demoCampaigns);
  const [readiness, setReadiness] = useState<ComplianceReadiness>();
  const [outreachOSOverview, setOutreachOSOverview] = useState<OutreachOSOverview>();
  const [selectedLead, setSelectedLead] = useState<Lead>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [campaignBuilderOpen, setCampaignBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    void Promise.all([api.leads(), api.agents(), api.campaigns(), api.readiness()])
      .then(([l,a,c,r]) => {
        if (!active) return;
        if (l.length) setLeads(l); if (a.length) setAgents(a); if (c.length) setCampaigns(c);
        if (r) setReadiness(r);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const overview = await api.outreachOSOverview();
      if (active && overview) setOutreachOSOverview(overview);
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 5_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const notify = (message:string) => { setToast(message); window.setTimeout(()=>setToast(''), 2600); };
  const closePreview = useCallback(() => setPreviewOpen(false), []);
  
  const suppress = async (lead:Lead) => {
    try {
      await api.suppress(lead);
      setLeads(current => current.map(item => item.id === lead.id ? {...item, status:'Suppressed'} : item));
      setSelectedLead(undefined); notify(`${lead.name} added to suppression`);
    } catch (error) {
      notify(error instanceof Error ? `Suppression failed: ${error.message}` : 'Suppression failed');
    }
  };

  const createCampaign = async (input:CreateCampaignInput) => {
    try {
      const created = await api.createCampaign(input);
      setCampaigns(current => [...current, toCampaign(created, current.length)]);
      setCampaignBuilderOpen(false);
      notify(`${created.name} created as a draft`);
    } catch (error) {
      notify(error instanceof Error ? `Campaign creation failed: ${error.message}` : 'Campaign creation failed');
    }
  };

  const requestCampaignApproval = async (campaign:Campaign) => {
    try {
      await api.requestCampaignApproval(campaign.id);
      setCampaigns(current => current.map(item => item.id === campaign.id ? {...item,status:'Review',nextRun:'Waiting for approval'} : item));
      notify(`${campaign.name} sent to approval`);
    } catch (error) {
      notify(error instanceof Error ? `Approval request failed: ${error.message}` : 'Approval request failed');
    }
  };

  const runAgent = async (agent:Agent) => {
    try {
      const job = await api.runAgent(agent.id);
      setAgents(items => items.map(item => item.id === agent.id ? {...item,status:'ready',lastRun:'now'} : item));
      notify(`${agent.name} ${job.status.toLowerCase()}`);
    } catch (error) {
      notify(error instanceof Error ? `Agent failed: ${error.message}` : 'Agent failed');
    }
  };

  return (
    <div className="app-shell">
      {/* Ambient background effects */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      
      <aside className="sidebar glass-panel">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="logo-mark">
              <Zap size={18} />
            </div>
            <span className="brand-word">OUTR</span>
          </div>
          <button className="workspace-switch">
            <span>Agency HQ</span>
            <ChevronDown size={12} />
          </button>
        </div>
        
        <nav aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {nav.map(item => (
            <button key={item.key} className={`nav-item ${view===item.key?'active':''}`} onClick={()=>setView(item.key)}>
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
          <p className="nav-label spaced">Manage</p>
          <button className="nav-item"><BriefcaseBusiness size={18}/><span>Clients</span></button>
          <button className="nav-item"><ShieldCheck size={18}/><span>Guardrails</span><span className="healthy-dot"/></button>
          <button className="nav-item"><Settings2 size={18}/><span>Settings</span></button>
        </nav>
        
        <div className="capacity-card glass-panel-raised">
          <div className="capacity-head">
            <span>Monthly capacity</span>
            <strong>68%</strong>
          </div>
          <div className="capacity-track">
            <motion.div 
              className="capacity-fill"
              initial={{ width: 0 }}
              animate={{ width: '68%' }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p>6,840 of 10,000 researched leads</p>
          <button className="btn-link">Manage plan <ArrowUpRight size={14}/></button>
        </div>
        
        <div className="user-row">
          <span className="avatar">PS</span>
          <div className="user-info">
            <strong>Piyush Sharma</strong>
            <span>Owner</span>
          </div>
          <MoreHorizontal size={18} className="text-muted" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar glass-panel">
          <div className="breadcrumbs">
            <span>Agency HQ</span>
            <ChevronRight size={14} className="text-muted" />
            <strong>{nav.find(x=>x.key===view)?.label}</strong>
          </div>
          <div className="top-actions">
            <LiveRuntime overview={outreachOSOverview}/>
            <button className="search-trigger" onClick={()=>setSearchOpen(true)}>
              <Search size={16}/>
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <button className="btn-icon" onClick={()=>setPreviewOpen(true)} aria-label="Live preview">
              <Eye size={16}/>
            </button>
            <button className="btn-icon" aria-label="Notifications">
              <Bell size={16}/>
              <span className="notification-dot"/>
            </button>
            <button className="btn btn-primary" onClick={()=>{setView('campaigns'); setCampaignBuilderOpen(true)}}>
              <Plus size={16}/>New campaign
            </button>
          </div>
        </header>
        
        <AnimatePresence mode="wait">
          <motion.div 
            className="view-stage" 
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {view==='command' && <CommandView leads={leads} campaigns={campaigns} agents={agents} readiness={readiness} outreachOSOverview={outreachOSOverview} onLead={setSelectedLead} go={setView}/>} 
            {view==='leads' && <LeadsView leads={leads} onLead={setSelectedLead}/>} 
            {view==='campaigns' && <CampaignsView campaigns={campaigns} leads={leads} onOpenBuilder={()=>setCampaignBuilderOpen(true)} onRequestApproval={requestCampaignApproval}/>} 
            {view==='agents' && <AgentsView agents={agents} onRun={runAgent}/>} 
            {view==='inbox' && <InboxView notify={notify}/>}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <LeadDrawer lead={selectedLead} onClose={()=>setSelectedLead(undefined)} onSuppress={suppress}/>
      
      {searchOpen && (
        <CommandSearch 
          onClose={()=>setSearchOpen(false)} 
          onNavigate={key=>{setView(key);setSearchOpen(false)}} 
          leads={leads} 
          onLead={lead=>{setSelectedLead(lead);setSearchOpen(false)}}
        />
      )}
      
      {campaignBuilderOpen && (
        <CampaignBuilder leads={leads} onClose={()=>setCampaignBuilderOpen(false)} onCreate={createCampaign}/>
      )}
      
      <AnimatePresence>
        {previewOpen && (
          <LivePreview 
            open={previewOpen} 
            onClose={closePreview} 
            leads={leads} 
            campaigns={campaigns} 
            agents={agents} 
            overview={outreachOSOverview}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {toast && (
          <motion.div 
            className="toast glass-panel-raised"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <CheckCircle2 size={17}/>{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
function LiveRuntime({overview}:{overview?:OutreachOSOverview}) {
  return (
    <div className="live-runtime glass-panel-raised">
      <div className="live-beacon">
        <span className="beacon-pulse" />
      </div>
      <div className="live-info">
        <strong>OutreachOS</strong>
        <span>{overview?.totals ? `${overview.totals.leads} leads · ${overview.totals.booked} booked` : 'Syncing...'}</span>
      </div>
    </div>
  );
}

function CommandView({ leads, campaigns, agents, readiness, outreachOSOverview, onLead, go }: { leads:Lead[]; campaigns:Campaign[]; agents:Agent[]; readiness?:ComplianceReadiness; outreachOSOverview?:OutreachOSOverview; onLead:(l:Lead)=>void; go:(v:ViewKey)=>void }) {
  const topLeads = leads.slice().sort((a,b)=>b.score-a.score).slice(0,5);
  const activeAgents = agents.filter(a=>a.status==='working').length;
  const qualified = leads.filter(lead=>lead.status==='Ready').length;
  const replied = leads.filter(lead=>lead.status==='Replied'||lead.status==='Won').length;
  const won = leads.filter(lead=>lead.status==='Won').length;
  const healthGates = readiness?.gates ?? [];
  const sourceTotals = outreachOSOverview?.totals;
  
  return (
    <div className="page-content">
      <PageTitle 
        eyebrow="Live workspace" 
        title="Good evening, Piyush." 
        copy="Review evidence, territory coverage, campaign approvals and recorded agent work from one control desk." 
        actions={
          <>
            <button className="btn btn-ghost" onClick={()=>go('leads')}>
              <Map size={16}/>Open territory map
            </button>
            <button className="btn btn-primary" onClick={()=>go('leads')}>
              <Sparkles size={16}/>Review new leads
            </button>
          </>
        }
      />
      
      <section className="metrics-grid stagger-children">
        <MetricCard label="Qualified leads" value={String(qualified)} delta={`${leads.length} in ledger`} icon={Target} color="teal"/>
        <MetricCard label="Replies" value={String(replied)} delta="Recorded outcomes" icon={MessageSquareReply} color="blue"/>
        <MetricCard label="Won" value={String(won)} delta="Evidence-linked" icon={MailCheck} color="amber"/>
        <MetricCard label="Campaigns" value={String(campaigns.length)} delta={`${campaigns.filter(c=>c.status==='Review').length} in review`} icon={CircleDollarSign} color="rose"/>
      </section>
      
      <section className="command-grid">
        <article className="panel glass-panel-raised chart-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Signal velocity</span>
              <h2>Activity funnel</h2>
            </div>
            <button className="select-button">Last 7 days <ChevronDown size={14}/></button>
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot discovered"/>Discovered</span>
            <span><span className="legend-dot qualified"/>Qualified</span>
            <span><span className="legend-dot replies"/>Replies</span>
          </div>
          <ActivityChart/>
        </article>
        
        <article className="panel glass-panel-raised agent-pulse">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Live orchestration</span>
              <h2>Agent pulse</h2>
            </div>
            <button className="btn-link" onClick={()=>go('agents')}>Open pool <ArrowUpRight size={14}/></button>
          </div>
          <div className="agent-orbit">
            <div className="orbit-core">
              <Zap size={20}/>
              <span>Router</span>
            </div>
            {agents.slice(0,5).map((agent,i)=>(
              <div key={agent.id} className={`orbit-agent orbit-${i+1}`} style={{'--agent-color':agent.color} as React.CSSProperties}>
                <Bot size={15}/>
                <span>{agent.name}</span>
              </div>
            ))}
          </div>
          <div className="source-runtime-status">
            <span><span className="status-dot"/>OutreachOS source bridge</span>
            <strong>{sourceTotals ? `${sourceTotals.leads} leads · ${sourceTotals.booked} booked · ${sourceTotals.sent} sent` : 'Syncing source engine…'}</strong>
          </div>
          <div className="pulse-stats">
            <div><strong className="tabular">{activeAgents}</strong><span>working now</span></div>
            <div><strong className="tabular">{agents.length}</strong><span>registered agents</span></div>
            <div><strong className="tabular">{healthGates.filter(g=>g.status==='PASS').length}/{healthGates.length || '—'}</strong><span>gates passed</span></div>
          </div>
        </article>
      </section>
      
      <section className="panel glass-panel-raised lead-preview">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Prioritized by evidence</span>
            <h2>High-intent leads</h2>
          </div>
          <button className="btn-link" onClick={()=>go('leads')}>Explore all leads <ArrowUpRight size={14}/></button>
        </div>
        <LeadRows leads={topLeads} onLead={onLead}/>
      </section>
      
      <section className="bottom-grid">
        <article className="panel glass-panel-raised health-panel">
          <div className="panel-heading">
            <h2>Activation readiness</h2>
            <span className={`health-pill ${readiness?.ready?'':'pending'}`}>
              <span className="status-dot"/>{readiness?.ready?'Ready':'Evidence pending'}
            </span>
          </div>
          <div className="health-list">
            {healthGates.length ? healthGates.slice(0,4).map(gate=>(
              <Health key={gate.id} name={gate.label} value={gate.status.replaceAll('_',' ')} ok={gate.status==='PASS'}/>
            )) : <Health name="Readiness service" value="Unavailable"/>}
          </div>
        </article>
        
        <article className="panel glass-panel-raised campaign-mini">
          <div className="panel-heading">
            <h2>Campaign momentum</h2>
            <button className="btn-link" onClick={()=>go('campaigns')}>View all</button>
          </div>
          {campaigns.slice(0,3).map(c=>(
            <div className="campaign-line" key={c.id}>
              <span className={`status-orb status-${c.status.toLowerCase()}`}/>
              <div>
                <strong>{c.name}</strong>
                <span>{c.leads} leads · {c.nextRun}</span>
              </div>
              <b className="tabular">{c.replies ? `${((c.replies/c.sent)*100).toFixed(1)}%` : '—'}</b>
            </div>
          ))}
        </article>
      </section>
    </div>
  );
}

function ActivityChart() {
  const x = (index:number) => 36 + index * 102;
  const y = (value:number) => 210 - value;
  const points = (key:'discovered'|'qualified'|'replies') => weeklyActivity.map((item,index)=>`${x(index)},${y(item[key])}`).join(' ');
  const area = `M ${x(0)} ${y(weeklyActivity[0].discovered)} ${weeklyActivity.slice(1).map((item,index)=>`L ${x(index+1)} ${y(item.discovered)}`).join(' ')} L ${x(weeklyActivity.length-1)} 210 L ${x(0)} 210 Z`;
  
  return (
    <div className="activity-chart" role="img" aria-label="Weekly activity: discovered leads, qualified leads, and replies from Monday through Sunday">
      <svg viewBox="0 0 680 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#00f5d4" stopOpacity=".22"/>
            <stop offset="1" stopColor="#00f5d4" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[10,60,110,160,210].map((line,index)=>(
          <g key={line}>
            <line x1="36" x2="648" y1={line} y2={line} className="chart-grid-line"/>
            <text x="2" y={line+3} className="chart-axis-label">{200-index*50}</text>
          </g>
        ))}
        <path className="activity-area" d={area}/>
        <polyline className="line-discovered" points={points('discovered')}/>
        <polyline className="line-qualified" points={points('qualified')}/>
        <polyline className="line-replies" points={points('replies')}/>
        {weeklyActivity.map((item,index)=>(
          <text key={item.day} className="day-label" x={x(index)} y="232" textAnchor="middle">{item.day}</text>
        ))}
      </svg>
    </div>
  );
}

function Health({name,value,ok}:{name:string;value:string;ok?:boolean}) {
  return (
    <div className="health-item">
      <span>{ok?<Check size={15}/>:<X size={15}/>}{name}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LeadRows({ leads, onLead }: { leads:Lead[]; onLead:(l:Lead)=>void }) {
  return (
    <div className="lead-rows">
      {leads.map(lead=>(
        <button className="lead-row" key={lead.id} onClick={()=>onLead(lead)}>
          <div className="lead-person">
            <span className="lead-avatar">{lead.name.split(' ').map(x=>x[0]).join('')}</span>
            <div>
              <strong>{lead.name}</strong>
              <span>{lead.title}</span>
            </div>
          </div>
          <div className="lead-company">
            <Building2 size={15}/>
            <div>
              <strong>{lead.company}</strong>
              <span>{lead.industry} · {lead.employees} people</span>
            </div>
          </div>
          <SignalBadge intent={lead.intent}/>
          <div className="lead-signal">
            <strong>{lead.signal}</strong>
            <span>{lead.source}</span>
          </div>
          <div className="score-chip tabular">{lead.score}</div>
          <ArrowUpRight size={16}/>
        </button>
      ))}
    </div>
  );
}

function LeadsView({ leads, onLead }: { leads:Lead[]; onLead:(lead:Lead)=>void }) {
  const [layout,setLayout] = useState<'map'|'list'>('map');
  const [query,setQuery] = useState('');
  const [intent,setIntent] = useState('All intent');
  const [minimum,setMinimum] = useState(0);
  const [status,setStatus] = useState('All statuses');
  const [sort,setSort] = useState('Highest fit');
  const [selected,setSelected] = useState<string>();
  
  const filtered = useMemo(()=>leads.filter(l => 
    `${l.name} ${l.company} ${l.title} ${l.city}`.toLowerCase().includes(query.toLowerCase()) && 
    (intent==='All intent'||l.intent===intent) && 
    (status==='All statuses'||l.status===status) && 
    l.score>=minimum
  ).sort((left,right)=>
    sort==='Highest fit'?right.score-left.score:
    sort==='Highest intent'?({Surging:3,Warm:2,Watching:1}[right.intent]-{Surging:3,Warm:2,Watching:1}[left.intent]):
    left.company.localeCompare(right.company)
  ),[leads,query,intent,minimum,status,sort]);
  
  const selectMapLead = useCallback((lead:Lead)=>{setSelected(lead.id);onLead(lead)},[onLead]);
  
  return (
    <div className="page-content lead-page">
      <PageTitle 
        eyebrow="Evidence-backed prospect ledger" 
        title="Lead explorer" 
        copy="Find the right accounts by fit, intent, timing and territory—then inspect every source before action." 
        actions={
          <>
            <button className="btn btn-ghost"><Plus size={16}/>Import</button>
            <button className="btn btn-primary"><Sparkles size={16}/>Find prospects</button>
          </>
        }
      />
      
      <div className="filter-bar glass-panel-raised">
        <label className="filter-search">
          <Search size={16}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search person, account, role or city…" aria-label="Search leads"/>
        </label>
        <SelectFilter value={intent} set={setIntent} options={['All intent','Surging','Warm','Watching']} icon={Activity}/>
        <SelectFilter value={minimum?`${minimum}+ score`:'Any score'} set={v=>setMinimum(parseInt(v)||0)} options={['Any score','75+ score','85+ score','90+ score']} icon={Target}/>
        <SelectFilter value={status} set={setStatus} options={['All statuses','New','Ready','Contacted','Replied','Won','Suppressed']} icon={SlidersHorizontal}/>
        <SelectFilter value={sort} set={setSort} options={['Highest fit','Highest intent','Account A–Z']} icon={MapPin}/>
        <div className="view-toggle">
          <button className={layout==='map'?'active':''} onClick={()=>setLayout('map')} aria-label="Map view"><Map size={16}/></button>
          <button className={layout==='list'?'active':''} onClick={()=>setLayout('list')} aria-label="List view"><ListFilter size={16}/></button>
        </div>
      </div>
      
      <div className="result-summary">
        <strong className="tabular">{filtered.length}</strong> leads match this view 
        <span>·</span>
        <span>{filtered.filter(l=>l.emailStatus==='Verified').length} verified</span>
        <button className="btn-link">Save view</button>
      </div>
      
      {layout==='map' ? (
        <div className="explorer-grid glass-panel-raised">
          <div className="map-panel">
            <div className="map-toolbar">
              <span className="map-control"><Globe2 size={15}/>Fit score</span>
              <span className="map-control"><Filter size={15}/>{filtered.length} mapped</span>
            </div>
            <Suspense fallback={<div className="map-loading">Loading territory map…</div>}>
              <LeadMap leads={filtered} selectedId={selected} onSelect={selectMapLead}/>
            </Suspense>
          </div>
          <div className="map-list">
            <LeadRowsCompact leads={filtered} selected={selected} onLead={lead=>{setSelected(lead.id);onLead(lead)}}/>
          </div>
        </div>
      ) : (
        <article className="panel glass-panel-raised list-table">
          <LeadTable leads={filtered} onLead={onLead}/>
        </article>
      )}
    </div>
  );
}

function SelectFilter({value,set,options,icon:Icon}:{value:string;set:(v:string)=>void;options:string[];icon:typeof Activity}) {
  return (
    <label className="select-wrap">
      <Icon size={15}/>
      <select value={value} onChange={e=>set(e.target.value)}>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14}/>
    </label>
  );
}

function LeadRowsCompact({leads,selected,onLead}:{leads:Lead[];selected?:string;onLead:(l:Lead)=>void}) {
  return (
    <div className="compact-leads">
      {leads.map(l=>(
        <button key={l.id} className={`compact-lead ${selected===l.id?'selected':''}`} onClick={()=>onLead(l)}>
          <span className="lead-avatar">{l.name.split(' ').map(x=>x[0]).join('')}</span>
          <div>
            <strong>{l.name}<small>{l.score}</small></strong>
            <span>{l.title} · {l.company}</span>
            <p><MapPin size={12}/>{l.city}, {l.region}<span/> {l.signal}</p>
          </div>
          <SignalBadge intent={l.intent}/>
        </button>
      ))}
    </div>
  );
}

function LeadTable({leads,onLead}:{leads:Lead[];onLead:(l:Lead)=>void}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" aria-label="Select all leads"/></th>
            <th>Person</th>
            <th>Account</th>
            <th>Location</th>
            <th>Intent</th>
            <th>Email</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(l=>(
            <tr key={l.id} onClick={()=>onLead(l)}>
              <td><input type="checkbox" aria-label={`Select ${l.name}`} onClick={e=>e.stopPropagation()}/></td>
              <td><strong>{l.name}</strong><span>{l.title}</span></td>
              <td><strong>{l.company}</strong><span>{l.industry}</span></td>
              <td>{l.city}, {l.region}</td>
              <td><SignalBadge intent={l.intent}/></td>
              <td><span className={`email-state ${l.emailStatus.toLowerCase()}`}>{l.emailStatus}</span></td>
              <td><b className="score-chip">{l.score}</b></td>
              <td>{l.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CampaignsView({campaigns,leads,onOpenBuilder,onRequestApproval}:{campaigns:Campaign[];leads:Lead[];onOpenBuilder:()=>void;onRequestApproval:(campaign:Campaign)=>void}) {
  return (
    <div className="page-content">
      <PageTitle 
        eyebrow="Approval-bound execution" 
        title="Campaign studio" 
        copy="Build focused sequences, preview every claim and keep replies, suppression and deliverability in one loop." 
        actions={<button className="btn btn-primary" onClick={onOpenBuilder}><Plus size={16}/>Create campaign</button>}
      />
      
      <div className="campaign-board">
        {campaigns.map(c=>(
          <article className="campaign-card glass-panel-raised neon-border" key={c.id}>
            <header>
              <span className={`campaign-status ${c.status.toLowerCase()}`}>{c.status}</span>
              <button className="btn-icon" aria-label={`More options for ${c.name}`}><MoreHorizontal size={17}/></button>
            </header>
            <h2>{c.name}</h2>
            <p>{c.segment}</p>
            <div className="readiness">
              <span>Launch readiness <b>{c.readiness}%</b></span>
              <div><motion.div className="readiness-fill" initial={{width:0}} animate={{width:`${c.readiness}%`}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}} /></div>
            </div>
            <div className="campaign-stats">
              <div><strong>{c.leads}</strong><span>Leads</span></div>
              <div><strong>{c.sent}</strong><span>Sent</span></div>
              <div><strong>{c.replies}</strong><span>Replies</span></div>
              <div><strong>{c.meetings}</strong><span>Meetings</span></div>
            </div>
            <footer>
              <span><Activity size={14}/>{c.nextRun}</span>
              {c.status==='Draft'||c.status==='Paused' ? (
                <button className="btn btn-ghost" onClick={()=>onRequestApproval(c)}>Request review <ArrowUpRight size={14}/></button>
              ) : (
                <span className="campaign-action-note">{c.status==='Review'?'Approval pending':c.status==='Ready'?'Ready to schedule':'Operational'}</span>
              )}
            </footer>
          </article>
        ))}
      </div>
      
      <SequenceBuilder leadCount={leads.length}/>
    </div>
  );
}

function SequenceBuilder({leadCount}:{leadCount:number}) {
  const touches = [
    {day:'Day 1',title:'Signal-led introduction',type:'Email',state:'Approved'},
    {day:'Day 3',title:'Relevant proof point',type:'Email',state:'Needs review'},
    {day:'Day 6',title:'Manual research touch',type:'Task',state:'Draft'},
    {day:'Day 10',title:'Close the loop',type:'Email',state:'Draft'}
  ];
  
  return (
    <article className="panel glass-panel-raised sequence-builder">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Sequence preview</span>
          <h2>Default approval-bound sequence</h2>
        </div>
        <span className="sequence-meta">{leadCount} leads available</span>
      </div>
      <div className="sequence-flow">
        {touches.map((t,i)=>(
          <div className="touch" key={t.day}>
            <div className="touch-line">
              <span>{i+1}</span>
              {i<touches.length-1 && <div className="touch-connector"/>}
            </div>
            <article className="touch-card glass-panel-raised">
              <header>
                <b>{t.day}</b>
                <span className={`review-state ${t.state.toLowerCase().replace(' ','-')}`}>{t.state}</span>
              </header>
              <h3>{t.title}</h3>
              <p>{t.type} · Local-time send · Stop on any reply</p>
            </article>
          </div>
        ))}
      </div>
    </article>
  );
}

function AgentsView({agents,onRun}:{agents:Agent[];onRun:(a:Agent)=>void}) {
  return (
    <div className="page-content">
      <PageTitle 
        eyebrow="Typed, bounded and observable" 
        title="Agent pool" 
        copy="Every specialist has an allowlisted role, explicit inputs, measurable quality and a human approval boundary." 
        actions={<button className="btn btn-primary"><Plus size={16}/>Create agent</button>}
      />
      
      <div className="agent-summary glass-panel-raised">
        <div>
          <span className="agent-live-dot"/>
          <div>
            <strong>System online</strong>
            <p>{agents.length} registered specialists · typed jobs recorded in the event ledger</p>
          </div>
        </div>
        <div className="budget-gauge">
          <span>Daily agent budget</span>
          <strong>$18.42 <small>/ $35</small></strong>
          <div className="budget-track">
            <motion.div className="budget-fill" initial={{width:0}} animate={{width:'53%'}} transition={{duration:0.8,ease:[0.22,1,0.36,1]}} />
          </div>
        </div>
      </div>
      
      <div className="agent-grid stagger-children">
        {agents.map(agent=>(
          <article className="agent-card glass-panel-raised neon-border" key={agent.id}>
            <header>
              <span className="agent-symbol" style={{background:agent.color}}><Bot size={20}/></span>
              <span className={`agent-status ${agent.status}`}><span className="status-dot"/>{agent.status}</span>
              <button className="btn-icon" aria-label={`Settings for ${agent.name}`}><MoreHorizontal size={17}/></button>
            </header>
            <span className="eyebrow">{agent.role}</span>
            <h2>{agent.name}</h2>
            <p>{agent.description}</p>
            <div className="tool-chips">
              {agent.tools.map(t=><span key={t}>{t}</span>)}
            </div>
            <div className="agent-metrics">
              <div><strong>{agent.runs.toLocaleString()}</strong><span>Runs</span></div>
              <div><strong>{agent.quality}%</strong><span>Quality</span></div>
              <div><strong>{agent.lastRun}</strong><span>Last run</span></div>
            </div>
            <footer>
              <button className="btn btn-ghost" onClick={()=>onRun(agent)}>
                {agent.status==='working' ? <><Pause size={15}/>Pause</> : <><Play size={15}/>Run now</>}
              </button>
              <button className="btn-link">Inspect log <ArrowUpRight size={14}/></button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function CampaignBuilder({leads,onClose,onCreate}:{leads:Lead[];onClose:()=>void;onCreate:(input:CreateCampaignInput)=>void}) {
  const [name,setName] = useState('');
  const [targetDescription,setTargetDescription] = useState('US B2B accounts with verified fit and intent evidence');
  const [dailyCap,setDailyCap] = useState(25);
  const eligibleLeads = leads.filter(lead => lead.status==='Ready' && lead.emailStatus==='Verified');
  
  const submit = (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreate({ 
      name:name.trim(), 
      targetDescription:targetDescription.trim(), 
      dailyCap, 
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Detroit', 
      leadIds:eligibleLeads.map(lead=>lead.id), 
      sequence:[
        {id:'step_1',order:1,delayDays:0,subject:'A relevant idea for {{company}}',body:'Hi {{first_name}}, I noticed a relevant signal at {{company}}. Would a concise benchmark be useful?'},
        {id:'step_2',order:2,delayDays:4,subject:'Re: a relevant idea for {{company}}',body:'Hi {{first_name}}, following up with the short version. Should I send it over?'}
      ] 
    });
  };
  
  return (
    <motion.div 
      className="command-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form 
        className="campaign-builder glass-panel-raised"
        role="dialog" 
        aria-modal="true" 
        aria-label="Create campaign"
        onClick={event=>event.stopPropagation()} 
        onSubmit={submit}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <header>
          <div>
            <span className="eyebrow">Approval-bound campaign</span>
            <h2>Create campaign</h2>
          </div>
          <button className="btn-icon" type="button" onClick={onClose} aria-label="Close campaign builder"><X size={18}/></button>
        </header>
        <p>Creates a draft only. Review is a separate recorded action.</p>
        <label>Campaign name
          <input className="input" required minLength={3} value={name} onChange={event=>setName(event.target.value)} placeholder="e.g. Q3 RevOps signal pilot" autoFocus/>
        </label>
        <label>Target description
          <textarea className="input" required minLength={8} value={targetDescription} onChange={event=>setTargetDescription(event.target.value)}/>
        </label>
        <div className="campaign-builder-grid">
          <label>Daily cap
            <input className="input" type="number" min="1" max="500" value={dailyCap} onChange={event=>setDailyCap(Number(event.target.value))}/>
          </label>
          <div className="builder-readonly">
            <span>Eligible leads</span>
            <strong>{eligibleLeads.length}</strong>
            <small>Ready + verified</small>
          </div>
        </div>
        <footer>
          <button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit"><Plus size={15}/>Create draft</button>
        </footer>
      </motion.form>
    </motion.div>
  );
}

function InboxView({notify}:{notify:(s:string)=>void}) {
  const replies = [
    {name:'Aisha Bello',company:'Metric Grove',subject:'Re: benchmark for analytics teams',text:'This is timely. Can you send over the benchmark and a few slots for next week?',kind:'Positive',time:'3m'},
    {name:'Elliot Woods',company:'Form & Field',subject:'Re: your enterprise motion',text:'Interesting idea, but this quarter is packed. Could you circle back in October?',kind:'Later',time:'31m'},
    {name:'Jamie Park',company:'Cobalt Systems',subject:'Re: sales capacity planning',text:'I am not the right person. Maya on our RevOps team owns this.',kind:'Referral',time:'1h'}
  ];
  const [active,setActive] = useState(0);
  
  return (
    <div className="page-content inbox-page">
      <PageTitle eyebrow="Human-first reply handling" title="Unified inbox" copy="Triage intent, stop sequences immediately and turn positive interest into a clean handoff."/>
      <div className="inbox-shell glass-panel-raised">
        <aside>
          <div className="inbox-filters">
            <button className="active">Needs review <b>3</b></button>
            <button>Positive <b>12</b></button>
            <button>Later <b>7</b></button>
            <button>Unsubscribe <b>2</b></button>
          </div>
          {replies.map((r,i)=>(
            <button className={`message-preview ${active===i?'active':''}`} key={r.name} onClick={()=>setActive(i)}>
              <span className="lead-avatar">{r.name.split(' ').map(x=>x[0]).join('')}</span>
              <div>
                <strong>{r.name}<time>{r.time}</time></strong>
                <span>{r.company}</span>
                <p>{r.text}</p>
              </div>
            </button>
          ))}
        </aside>
        <article className="message-detail">
          <header>
            <div>
              <span className="eyebrow">{replies[active].company}</span>
              <h2>{replies[active].subject}</h2>
            </div>
            <span className={`intent-label ${replies[active].kind.toLowerCase()}`}>{replies[active].kind}</span>
          </header>
          <div className="message-bubble">
            <div className="lead-avatar">{replies[active].name.split(' ').map(x=>x[0]).join('')}</div>
            <div>
              <strong>{replies[active].name}</strong>
              <span>{replies[active].time} ago</span>
              <p>{replies[active].text}</p>
            </div>
          </div>
          <div className="triage-card glass-panel-raised">
            <Sparkles size={18}/>
            <div>
              <strong>AI recommendation</strong>
              <p>{replies[active].kind==='Positive'?'Send calendar link and stop sequence.':replies[active].kind==='Later'?'Schedule follow-up for October 1.':'Remove from sequence and log referral.'}</p>
            </div>
          </div>
          <div className="composer glass-panel-raised">
            <textarea className="input" placeholder="Type your reply…" rows={4}/>
            <div className="composer-actions">
              <button className="btn btn-ghost"><Copy size={14}/>Templates</button>
              <button className="btn btn-primary"><Send size={14}/>Send reply</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function CommandSearch({onClose,onNavigate,leads,onLead}:{onClose:()=>void;onNavigate:(v:ViewKey)=>void;leads:Lead[];onLead:(l:Lead)=>void}) {
  const [q,setQ]=useState('');
  const matches=leads.filter(l=>`${l.name} ${l.company}`.toLowerCase().includes(q.toLowerCase())).slice(0,4);
  
  return (
    <motion.div 
      className="command-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="command-dialog glass-panel-raised"
        role="dialog" 
        aria-modal="true" 
        aria-label="Command search" 
        onClick={e=>e.stopPropagation()}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <header>
          <Search size={18}/>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search leads, campaigns or actions…"/>
          <kbd>esc</kbd>
        </header>
        <section>
          <span className="eyebrow">Navigate</span>
          <div className="command-grid-small">
            <button onClick={()=>onNavigate('leads')}><UsersRound size={17}/>Explore leads</button>
            <button onClick={()=>onNavigate('campaigns')}><Send size={17}/>Campaign studio</button>
            <button onClick={()=>onNavigate('agents')}><Bot size={17}/>Agent pool</button>
            <button onClick={()=>onNavigate('inbox')}><Inbox size={17}/>Reply inbox</button>
          </div>
        </section>
        <section>
          <span className="eyebrow">Lead results</span>
          {matches.map(l=>(
            <button className="command-result" onClick={()=>onLead(l)} key={l.id}>
              <span className="lead-avatar">{l.name.split(' ').map(x=>x[0]).join('')}</span>
              <div>
                <strong>{l.name}</strong>
                <span>{l.title} · {l.company}</span>
              </div>
              <b>{l.score}</b>
            </button>
          ))}
        </section>
      </motion.div>
    </motion.div>
  );
}

function LivePreview({open,onClose,leads,campaigns,agents,overview}:{open:boolean;onClose:()=>void;leads:Lead[];campaigns:Campaign[];agents:Agent[];overview?:OutreachOSOverview}) {
  if (!open) return null;
  
  return (
    <motion.div 
      className="preview-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="live-preview glass-panel-raised"
        role="dialog"
        aria-label="Live preview"
        aria-modal="true"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <header>
          <div>
            <h2>Live Preview</h2>
            <p>Real-time workspace overview</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </header>
        
        <div className="preview-radar-box glass-panel-raised">
          <div className="preview-radar" />
          <span className="ping ping-one"/>
          <span className="ping ping-two"/>
          <span className="ping ping-three"/>
          <div className="preview-live-label glass-panel-raised">
            <span className="status-dot"/>
            <strong>LIVE</strong>
            <span>{agents.filter(a=>a.status==='working').length} agents working</span>
          </div>
        </div>
        
        <div className="preview-stat-grid">
          <article className="glass-panel-raised">
            <span><Users size={14}/>Leads</span>
            <strong>{leads.length}</strong>
            <span>{leads.filter(l=>l.status==='Ready').length} ready</span>
          </article>
          <article className="glass-panel-raised">
            <span><Send size={14}/>Campaigns</span>
            <strong>{campaigns.length}</strong>
            <span>{campaigns.filter(c=>c.status==='Active').length} active</span>
          </article>
          <article className="glass-panel-raised">
            <span><Bot size={14}/>Agents</span>
            <strong>{agents.length}</strong>
            <span>{agents.filter(a=>a.status==='working').length} working</span>
          </article>
        </div>
        
        <div className="campaign-preview-box glass-panel-raised">
          <div>
            <h3>Campaign funnel</h3>
            <p>Last 7 days performance</p>
          </div>
          <span className="status-dot"/>
          <div className="campaign-preview-funnel">
            <motion.div 
              className="funnel-fill"
              initial={{ width: 0 }}
              animate={{ width: '68%' }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <footer>
            <span><CheckCircle2 size={14}/> 12 replies</span>
            <span><Calendar size={14}/> 3 meetings</span>
            <span><TrendingUp size={14}/> +18%</span>
          </footer>
        </div>
        
        <div className="preview-ai-note glass-panel-raised">
          <Sparkles size={18}/>
          <div>
            <strong>AI Insight</strong>
            <p>Your "Mid-market intent pilot" campaign is showing 3.2x higher reply rate than average. Consider increasing daily cap by 25%.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PageTitle({ eyebrow, title, copy, actions }: { eyebrow?:string; title:string; copy:string; actions?:React.ReactNode }) {
  return (
    <motion.div 
      className="page-title"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </motion.div>
  );
}
