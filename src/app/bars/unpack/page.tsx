import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UnpackingQuiz } from '@/components/bars/UnpackingQuiz'

export default async function UnpackPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  return <UnpackingQuiz />
}
