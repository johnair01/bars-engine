import Link from 'next/link'

type Props = { campaignRef: string; className?: string }

/**
 * Deep links to per-campaign admin tools (same campaignRef scope — Challenger).
 * Paths: see docs/runbooks/ADMIN_ROUTE_AUDIT.md
 */
export function CampaignRefLinks({ campaignRef, className = '' }: Props) {
  const ref = encodeURIComponent(campaignRef)
  const base = `/admin/campaign/${ref}`

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${className}`}>
      <span className="text-zinc-500 shrink-0">Campaign tools</span>
      <span className="font-mono text-zinc-500 truncate max-w-[10rem]" title={campaignRef}>
        {campaignRef}
      </span>
      <span className="text-zinc-600">·</span>
      <Link href={`${base}/author`} className="text-teal-400/90 hover:text-teal-300 underline-offset-2 hover:underline">
        Author
      </Link>
      <Link href={`${base}/deck`} className="text-teal-400/90 hover:text-teal-300 underline-offset-2 hover:underline">
        Deck
      </Link>
      <Link
        href={`${base}/community-character`}
        className="text-teal-400/90 hover:text-teal-300 underline-offset-2 hover:underline"
      >
        Community character
      </Link>
    </div>
  )
}
