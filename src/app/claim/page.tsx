import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClaimClient from './ClaimClient'

// The ontology game opens /claim#OAG2... in a new tab. The fragment never reaches the server,
// so the page reads it on the client. A signed-out visitor goes to the sign-in door first.
export const dynamic = 'force-dynamic'

export default async function ClaimPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login?callbackUrl=/claim')
  return <ClaimClient />
}
