import type { Metadata } from 'next'
import { WakeUpCheck } from '@/components/wake-up/WakeUpCheck'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Wake Up Check | Mastering the Game of Allyship',
  description:
    'Day 1 of the MTGOA self-paced practice: six questions that map what you want to create, where you actually are, and the reservation narrowing the next move.',
  alternates: { canonical: '/wake-up' },
  openGraph: {
    title: 'Before you decide whether to act, notice what comes alive.',
    description:
      'Take the Wake Up Check: six questions, a card from the Allyship Deck, and a private receipt. Awareness is the output.',
    url: '/wake-up',
    siteName: 'Mastering the Game of Allyship',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Before you decide whether to act, notice what comes alive.',
    description: 'Take the Wake Up Check — Day 1 of Mastering the Game of Allyship.',
  },
}

export default async function WakeUpCheckPage({
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
  return <WakeUpCheck queryString={query.toString()} />
}
