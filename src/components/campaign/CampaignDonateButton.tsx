import Link from 'next/link'

function defaultDonateHref(campaignRef?: string): string {
  const base = '/event/donate/wizard'
  const r = campaignRef?.trim()
  if (!r) return base
  return `${base}?${new URLSearchParams({ ref: r }).toString()}`
}

type Props = {
  /**
   * Campaign context for wizard + self-report (DSW Phase 3 / COC Phase G).
   * Ignored when `href` is set.
   */
  campaignRef?: string
  /** Full URL override. When omitted, uses `/event/donate/wizard` (+ optional `?ref=`). */
  href?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Primary green CTA for residency support (Phase F — campaign-onboarding-cyoa).
 * Defaults to guided **`/event/donate/wizard`** (Phase G); wood/emerald = growth / resource.
 */
export function CampaignDonateButton({
  campaignRef,
  href,
  className = '',
  children = 'Donate',
}: Props) {
  const resolvedHref = href ?? defaultDonateHref(campaignRef)
  return (
    <Link
      href={resolvedHref}
      className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/60 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
    >
      {children}
    </Link>
  )
}
