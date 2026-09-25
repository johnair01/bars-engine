import { redirect } from 'next/navigation'

/**
 * Public short-link alias for the MTGOA Grow Up Check — the URL the Day 4 campaign
 * copy points at. Campaign parameters are retained for the canonical page's
 * attribution handoff.
 */
export default async function GrowUpAliasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = await searchParams
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === 'string') query.set(key, value)
    else if (Array.isArray(value) && value[0]) query.set(key, value[0])
  }

  const suffix = query.size ? `?${query.toString()}` : ''
  redirect(`/mastering-allyship/grow-up${suffix}`)
}
