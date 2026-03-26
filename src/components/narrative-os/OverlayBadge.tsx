type Props = {
  label: string
}

/** Campaign or residency overlay chip — Phase 4 will wire real overlays. */
export function OverlayBadge({ label }: Props) {
  return (
    <span
      className="inline-flex items-center text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-amber-700/50 text-amber-400/90 bg-amber-950/20"
      title="Campaign overlay"
    >
      {label}
    </span>
  )
}
