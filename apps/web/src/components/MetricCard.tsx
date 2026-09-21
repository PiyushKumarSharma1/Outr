import type { LucideIcon } from 'lucide-react';

export function MetricCard({ label, value, delta, icon: Icon, color = 'teal' }: { label:string; value:string; delta:string; icon:LucideIcon; color?:string }) {
  return (
    <article className="metric-card glass-panel-raised">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`icon-well ${color}`}><Icon size={17}/></span>
      </div>
      <strong className="metric-value tabular">{value}</strong>
      <div className="metric-delta"><span className="delta-up">{delta}</span></div>
    </article>
  );
}
