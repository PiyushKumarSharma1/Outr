export function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="brand" aria-label="Outr home">
    <span className="brand-mark" aria-hidden="true"><i/><i/><i/></span>
    {!compact && <span className="brand-word">outr<span>°</span></span>}
  </div>;
}
