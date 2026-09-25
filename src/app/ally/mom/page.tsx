/**
 * @route /ally/mom
 * @entity FAMILY_DECISION_ROOM
 * @description Password-protected, accountless room for a repayable family-support decision.
 * @permissions passphrase-gated; private reflections remain author-only.
 */
import type { Metadata } from 'next'
import { FamilySupportRoom } from './FamilySupportRoom'
import { FamilyRoomGate } from './FamilyRoomGate'
import { hasFamilyRoomAccess } from '@/lib/family-support/access'
import { getFamilyRoomView } from '@/actions/family-support'
import { FAMILY_FINANCIAL_SNAPSHOT } from '@/lib/family-support/financial-snapshot'

export const dynamic = 'force-dynamic'

// The tab title and the link preview are the first thing this family sees, so they name the room
// rather than the product. The room is private: keep it out of search indexes.
export const metadata: Metadata = {
  title: 'A family decision room',
  description: 'A private room to review a plan and decide what support, if any, makes sense.',
  robots: { index: false, follow: false },
}

export default async function MomAllyPage() {
  const allowed = await hasFamilyRoomAccess()
  if (!allowed) return <FamilyRoomGate />
  const state = await getFamilyRoomView()
  return <FamilySupportRoom snapshot={FAMILY_FINANCIAL_SNAPSHOT} state={state} />
}
