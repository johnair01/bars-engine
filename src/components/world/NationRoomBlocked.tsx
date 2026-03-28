import Link from 'next/link'

type Props = {
  instanceSlug: string
  nationDisplayName: string
}

/**
 * Full-page block when a player hits a nation room URL directly without membership.
 * Admin / SKIP_NATION_GATE bypass is applied on the server before this renders.
 */
export function NationRoomBlocked({ instanceSlug, nationDisplayName }: Props) {
  return (
    <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-white text-xl font-semibold">Members only</h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          <span className="text-amber-200/90">{nationDisplayName}</span>&apos;s hall admits only members of that
          nation.
        </p>
        <Link
          href={`/world/${instanceSlug}/card-club`}
          className="inline-block px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium"
        >
          Back to Card Club
        </Link>
      </div>
    </div>
  )
}
