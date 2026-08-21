import type { Metadata } from 'next'
import { ShowUpCheck } from '@/components/show-up/ShowUpCheck'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Show Up Check | Mastering the Game of Allyship',
  description:
    'Day 5 of the MTGOA self-paced practice: turn four days of noticing into one consentful handoff a particular person can actually receive.',
  alternates: { canonical: '/show-up' },
  openGraph: {
    title: 'A plan is not a handoff.',
    description:
      'Take the Show Up Check: aim one handoff, draw a card, and name what it gives them whether or not they ever buy.',
    url: '/show-up',
    siteName: 'Mastering the Game of Allyship',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A plan is not a handoff.',
    description: 'Take the Show Up Check — Day 5 of Mastering the Game of Allyship.',
  },
}

export default async function ShowUpCheckPage({
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
  return <ShowUpCheck queryString={query.toString()} />
}
