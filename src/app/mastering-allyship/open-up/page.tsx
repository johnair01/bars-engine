import type { Metadata } from 'next'
import { OpenUpCheck } from '@/components/open-up/OpenUpCheck'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Open Up Check | Mastering the Game of Allyship',
  description: 'A small, private practice for making room before you choose your next allyship move.',
  alternates: { canonical: '/open-up' },
  openGraph: {
    title: 'There is energy here to work with.',
    description: 'Take the Open Up Check: a small practice for noticing where the charge wants to go before you choose your next allyship move.',
    url: '/open-up',
    siteName: 'Mastering the Game of Allyship',
    type: 'website',
    images: [
      {
        url: '/mastering-allyship/open-up/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'The MTGOA Open Up Check — There is energy here to work with.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'There is energy here to work with.',
    description: 'Take the Open Up Check and notice where the charge wants to go.',
    images: ['/mastering-allyship/open-up/opengraph-image'],
  },
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
