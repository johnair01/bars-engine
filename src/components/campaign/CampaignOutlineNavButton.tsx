import Link from 'next/link'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
}

/** Secondary campaign nav control — reads as a button, behaves as a link (metal/neutral chrome). */
export function CampaignOutlineNavButton({ href, children, className = '' }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium border border-zinc-600 bg-zinc-900/70 text-zinc-200 hover:border-zinc-500 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
    >
      {children}
    </Link>
  )
}
