import type { Metadata } from 'next'
import { CleanUpCheck } from '@/components/clean-up/CleanUpCheck'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Clean Up Check | Mastering the Game of Allyship',
  description:
    'A small, private 3-2-1 practice for working a live charge until the energy inside it is yours to spend.',
  alternates: { canonical: '/clean-up' },
  openGraph: {
    title: 'Something has your attention. Until you work it, it works you.',
    description:
      'Take the Clean Up Check: name what is live, draw a card for the lens, and walk the charge around three vantage points.',
    url: '/clean-up',
    siteName: 'Mastering the Game of Allyship',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Something has your attention. Until you work it, it works you.',
    description: 'Take the Clean Up Check and work the charge instead of obeying it.',
  },
}

export default async function CleanUpCheckPage({
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
  return <CleanUpCheck queryString={query.toString()} />
}
