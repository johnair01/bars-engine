import type { Metadata } from 'next'
import { MovePractice } from '@/components/mtgoa-course/MovePractice'

export const metadata: Metadata = {
  title: 'Clean Up | Mastering the Game of Allyship',
  description: 'Day 3 of the MTGOA self-paced practice: make room to see the story around a charge and find the missing move.',
  alternates: { canonical: '/clean-up' },
}

export default function CleanUpPage() { return <MovePractice kind="clean_up" /> }
