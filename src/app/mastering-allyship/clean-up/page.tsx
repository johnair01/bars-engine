import type { Metadata } from 'next'
import { MovePractice } from '@/components/mtgoa-course/MovePractice'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Clean Up | Mastering the Game of Allyship',
  description: 'A private 3-2-1 practice for working the story around a charge and finding the missing allyship move.',
  alternates: { canonical: '/clean-up' },
  openGraph: {
    title: 'Clean Up the story around the charge.',
    description: 'Draw a Clean Up card, work the charge through 3-2-1, and find the next allyship move.',
    url: '/clean-up',
    siteName: 'Mastering the Game of Allyship',
    type: 'website',
    images: [{ url: '/mastering-allyship/clean-up/opengraph-image', width: 1200, height: 630, alt: 'The MTGOA Clean Up practice — Work the charge through 3-2-1.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clean Up the story around the charge.',
    description: 'Draw a card. Work 3-2-1. Find the missing move.',
    images: ['/mastering-allyship/clean-up/opengraph-image'],
  },
}

export default function CleanUpPage() { return <MovePractice kind="clean_up" /> }
