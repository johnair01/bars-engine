import type { Metadata } from 'next'
import { MovePractice } from '@/components/mtgoa-course/MovePractice'

export const metadata: Metadata = {
  title: 'Wake Up | Mastering the Game of Allyship',
  description: 'Day 1 of the MTGOA self-paced practice: notice what happens in your own allyship before deciding what to do.',
  alternates: { canonical: '/wake-up' },
}

export default function WakeUpPage() { return <MovePractice kind="wake_up" /> }
