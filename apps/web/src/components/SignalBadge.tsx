export function SignalBadge({ intent }: { intent: 'Surging' | 'Warm' | 'Watching' }) {
  return <span className={`signal-badge signal-${intent.toLowerCase()}`}><i />{intent}</span>;
}
