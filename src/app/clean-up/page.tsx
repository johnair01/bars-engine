import { redirect } from 'next/navigation'

/** Public social short-link for the Day 3 Clean Up practice. */
export default async function CleanUpAliasPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolved = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === 'string') query.set(key, value)
    else if (Array.isArray(value) && value[0]) query.set(key, value[0])
  }
  const suffix = query.size ? `?${query.toString()}` : ''
  redirect(`/mastering-allyship/clean-up${suffix}`)
}
