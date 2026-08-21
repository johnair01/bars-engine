import { redirect } from 'next/navigation'

/**
 * Public short-link alias for the course index — the URL that goes in a social
 * bio. Same shape as `/wake-up` and the other round-1 aliases: campaign
 * parameters are carried through so attribution survives the redirect.
 */
export default async function CourseAliasPage({
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
  redirect(`/mastering-allyship/course${suffix}`)
}
