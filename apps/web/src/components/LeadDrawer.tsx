import { motion, AnimatePresence } from 'framer-motion';
import { Building2, CheckCircle2, ExternalLink, Mail, MapPin, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { Lead } from '../types';
import { SignalBadge } from './SignalBadge';

export function LeadDrawer({ lead, onClose, onSuppress }: { lead?:Lead; onClose:()=>void; onSuppress:(lead:Lead)=>void }) {
  if (!lead) return null;
  return (
    <AnimatePresence>
      <motion.aside 
        className="lead-drawer glass-panel-raised" 
        aria-label="Lead details"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <header>
          <div className="lead-avatar large">{lead.name.split(' ').map(x=>x[0]).join('')}</div>
          <button className="btn-icon" onClick={onClose} aria-label="Close lead details"><X size={18}/></button>
        </header>
        
        <div className="drawer-name">
          <SignalBadge intent={lead.intent}/>
          <h2>{lead.name}</h2>
          <p>{lead.title} at <strong>{lead.company}</strong></p>
        </div>
        
        <div className="fit-score glass-panel-raised">
          <div>
            <span>Outr fit score</span>
            <strong className="tabular">{lead.score}<small>/100</small></strong>
          </div>
          <div className="score-ring" style={{'--score':`${lead.score * 3.6}deg`} as React.CSSProperties}>
            <span>{lead.score}</span>
          </div>
        </div>
        
        <section className="drawer-section">
          <h3><Sparkles size={15}/> Why now</h3>
          <div className="signal-callout glass-panel-raised">
            <strong>{lead.signal}</strong>
            <p>Detected from {lead.source.toLowerCase()} with high account-role confidence.</p>
          </div>
        </section>
        
        <section className="drawer-section">
          <h3><Building2 size={15}/> Account context</h3>
          <dl className="details-list">
            <div><dt>Company</dt><dd>{lead.company}</dd></div>
            <div><dt>Industry</dt><dd>{lead.industry}</dd></div>
            <div><dt>Size</dt><dd>{lead.employees.toLocaleString()} people</dd></div>
            <div><dt>Location</dt><dd><MapPin size={13}/>{lead.city}, {lead.region}</dd></div>
          </dl>
        </section>
        
        <section className="drawer-section">
          <h3><ShieldCheck size={15}/> Evidence</h3>
          <div className="evidence-row">
            <CheckCircle2 size={16}/>
            <div><strong>{lead.emailStatus} work email</strong><span>{lead.email}</span></div>
          </div>
          <div className="evidence-row">
            <ExternalLink size={16}/>
            <div><strong>Source preserved</strong><span>{lead.source} · checked {lead.lastActivity}</span></div>
          </div>
        </section>
        
        <div className="drawer-actions">
          <button className="btn btn-primary"><Mail size={16}/>Add to sequence</button>
          <button className="btn btn-ghost" onClick={()=>onSuppress(lead)}>Suppress</button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
