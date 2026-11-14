import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { ConstellationPrototype } from './constellation-prototype'

export default async function TriangleWorkshopPrototypePage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  return <ConstellationPrototype />
}
