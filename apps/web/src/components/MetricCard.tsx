import type { LucideIcon } from 'lucide-react';

export function MetricCard({ label, value, delta, icon: Icon, tone = 'sage' }: { label:string; value:string; delta:string; icon:LucideIcon; tone?:string }) {
  return <article className={`metric-card tone-${tone}`}>
    <div className="metric-top"><span>{label}</span><span className="icon-well"><Icon size={17}/></span></div>
    <strong className="metric-value tabular">{value}</strong>
    <div className="metric-delta"><span className="delta-up">{delta}</span><span> vs last 7 days</span></div>
  </article>;
}
