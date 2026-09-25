import type { Metadata } from 'next'
import { GrowUpCheck } from '@/components/grow-up/GrowUpCheck'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Grow Up Check | Mastering the Game of Allyship',
  description:
    'Day 4 of the MTGOA self-paced practice: choose one capacity to practise before you ask it to be easy, and build a rep small enough to finish.',
  alternates: { canonical: '/grow-up' },
  openGraph: {
    title: 'Choose a capacity to practise.',
    description:
      'Take the Grow Up Check: draw a Game Master, and build one rep small enough to complete, notice, and learn from.',
    url: '/grow-up',
    siteName: 'Mastering the Game of Allyship',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Choose a capacity to practise.',
    description: 'Take the Grow Up Check — Day 4 of Mastering the Game of Allyship.',
  },
}

export default async function GrowUpCheckPage({
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
  return <GrowUpCheck queryString={query.toString()} />
}
