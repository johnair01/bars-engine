import type { Metadata } from 'next'
import { OpenUpCheck } from '@/components/open-up/OpenUpCheck'

export const metadata: Metadata = {
  title: 'Open Up Check | Mastering the Game of Allyship',
  description: 'A small, private practice for making room before you choose your next allyship move.',
}

export default async function OpenUpCheckPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolved = await searchParams
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === 'string') query.set(key, value)
    else if (Array.isArray(value) && value[0]) query.set(key, value[0])
  }
  return <OpenUpCheck queryString={query.toString()} />
}
