import { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowUp, CheckCircle2, Eye, Moon, Radio, Send, Sparkles, Sun, UsersRound, X,
} from 'lucide-react';
import type { Agent, Campaign, Lead, OutreachOSOverview, ViewKey } from '../types';

export type ThemeMode = 'light' | 'dark';

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem('outr-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.themeSwitching = 'true';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    window.localStorage.setItem('outr-theme', theme);
    const timer = window.setTimeout(() => { delete root.dataset.themeSwitching; }, 80);
    return () => window.clearTimeout(timer);
  }, [theme]);

  return { theme, toggleTheme: () => setTheme(value => value === 'dark' ? 'light' : 'dark') };
}

export function ThemeToggle({ theme, onToggle }: { theme:ThemeMode; onToggle:()=>void }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  return <button className="icon-button theme-toggle" onClick={onToggle} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
    <span className="theme-toggle-icons" data-theme={theme}><Sun size={16}/><Moon size={15}/></span>
  </button>;
}

export function BootSequence({ visible }: { visible:boolean }) {
  if (!visible) return null;
  return <div className="boot-screen" role="status" aria-live="polite" aria-label="Preparing Outr workspace">
    <div className="boot-instrument">
      <div className="boot-radar" aria-hidden="true"><i/><span/><b/></div>
      <div className="boot-copy"><span className="eyebrow">Agency intelligence system</span><strong>Calibrating your workspace</strong><p>Connecting source evidence, territory signals and agent telemetry.</p></div>
      <div className="boot-progress"><i/></div>
      <div className="boot-checks"><span><CheckCircle2 size={13}/>Ledger</span><span><CheckCircle2 size={13}/>Territories</span><span><Radio size={13}/>Live bridge</span></div>
    </div>
  </div>;
}

export function NavigationProgress({ view }: { view:ViewKey }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    setProgress(18);
    const frame = window.requestAnimationFrame(() => setProgress(72));
    const complete = window.setTimeout(() => setProgress(100), 180);
    const reset = window.setTimeout(() => setProgress(0), 430);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(complete); window.clearTimeout(reset); };
  }, [view]);
  return <div className={`navigation-progress ${progress ? 'visible' : ''}`} aria-hidden="true"><i style={{ transform:`scaleX(${progress / 100})` }}/></div>;
}

export function LiveRuntime({ overview }: { overview?:OutreachOSOverview }) {
  const [now, setNow] = useState(() => new Date());
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1_000);
    const connect = () => setOnline(true);
    const disconnect = () => setOnline(false);
    window.addEventListener('online', connect);
    window.addEventListener('offline', disconnect);
    return () => { window.clearInterval(clock); window.removeEventListener('online', connect); window.removeEventListener('offline', disconnect); };
  }, []);
  return <div className={`live-runtime ${online ? 'online' : 'offline'}`} role="status" aria-label={`${online ? 'Online' : 'Offline'}, source bridge ${overview ? 'synchronized' : 'connecting'}`}>
    <span className="live-beacon"><i/></span><div><strong>{online ? 'Live' : 'Offline'}</strong><span>{overview ? 'source synced' : 'connecting'}</span></div><time>{now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</time>
  </div>;
}

export function LivePreviewButton({ onClick }: { onClick:()=>void }) {
  return <button className="preview-trigger" onClick={onClick}><Eye size={15}/><span>Live preview</span><i/></button>;
}

export function LivePreview({ open, onClose, leads, campaigns, agents, overview }: { open:boolean; onClose:()=>void; leads:Lead[]; campaigns:Campaign[]; agents:Agent[]; overview?:OutreachOSOverview }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const closeOnEscape = (event:KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);
  if (!open) return null;
  const source = overview?.totals;
  const activeCampaign = campaigns.find(campaign => campaign.status === 'Active') ?? campaigns[0];
  const ready = leads.filter(lead => lead.status === 'Ready').length;
  return <div className="preview-backdrop" onMouseDown={onClose}>
    <aside className="live-preview" role="dialog" aria-modal="true" aria-label="Live workspace preview" onMouseDown={event=>event.stopPropagation()}>
      <header><div><span className="eyebrow">Live workspace mirror</span><h2>Signal room</h2><p>Operational state refreshed from the active workspace.</p></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close live preview"><X size={17}/></button></header>
      <section className="preview-radar-box">
        <div className="preview-radar" aria-hidden="true"><i/><span className="ping ping-one"/><span className="ping ping-two"/><span className="ping ping-three"/></div>
        <div className="preview-live-label"><Radio size={14}/><span>Source telemetry</span><strong>{source ? 'Synchronized' : 'Connecting'}</strong></div>
      </section>
      <section className="preview-stat-grid">
        <article><span><UsersRound size={15}/>Source leads</span><strong>{source?.leads ?? '—'}</strong><small>{ready} ready in Outr</small></article>
        <article><span><Send size={15}/>Messages sent</span><strong>{source?.sent ?? '—'}</strong><small>{source?.booked ?? 0} booked</small></article>
        <article><span><Activity size={15}/>Agent pool</span><strong>{agents.length}</strong><small>{agents.filter(agent=>agent.status==='working').length} working now</small></article>
      </section>
      <section className="campaign-preview-box"><div><span className="eyebrow">Campaign preview</span><h3>{activeCampaign?.name ?? 'No active campaign'}</h3><p>{activeCampaign?.segment ?? 'Create a campaign to preview its sequence.'}</p></div><span className={`campaign-status ${activeCampaign?.status.toLowerCase() ?? 'draft'}`}>{activeCampaign?.status ?? 'Draft'}</span><div className="campaign-preview-funnel"><i style={{'--preview-width':`${activeCampaign?.readiness ?? 0}%`} as React.CSSProperties}/></div><footer><span>{activeCampaign?.leads ?? 0} leads</span><span>{activeCampaign?.replies ?? 0} replies</span><span>{activeCampaign?.meetings ?? 0} meetings</span></footer></section>
      <section className="preview-ai-note"><Sparkles size={16}/><div><strong>Operator brief</strong><p>{source ? `${source.booked} booked outcomes are recorded across ${overview?.campaigns.length ?? 0} source campaign${overview?.campaigns.length === 1 ? '' : 's'}.` : 'The source bridge is establishing a fresh runtime snapshot.'}</p></div></section>
    </aside>
  </div>;
}

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 240);
    update();
    window.addEventListener('scroll', update, { passive:true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <button className={`scroll-top ${visible ? 'visible' : ''}`} onClick={()=>window.scrollTo({ top:0, behavior:'smooth' })} aria-label="Scroll back to top" tabIndex={visible ? 0 : -1}><ArrowUp size={17}/><span>Top</span></button>;
}
