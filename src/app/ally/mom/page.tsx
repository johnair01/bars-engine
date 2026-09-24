/**
 * @route /ally/mom
 * @entity FAMILY_DECISION_ROOM
 * @description Password-protected, accountless room for a repayable family-support decision.
 * @permissions passphrase-gated; private reflections remain author-only.
 */
import { FamilySupportRoom } from './FamilySupportRoom'
import { FamilyRoomGate } from './FamilyRoomGate'
import { hasFamilyRoomAccess } from '@/lib/family-support/access'
import { getFamilyRoomView } from '@/actions/family-support'
import { FAMILY_FINANCIAL_SNAPSHOT } from '@/lib/family-support/financial-snapshot'

export const dynamic = 'force-dynamic'

export default async function MomAllyPage() {
  const allowed = await hasFamilyRoomAccess()
  if (!allowed) return <FamilyRoomGate />
  const state = await getFamilyRoomView()
  return <FamilySupportRoom snapshot={FAMILY_FINANCIAL_SNAPSHOT} state={state} />
}
