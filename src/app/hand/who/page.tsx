import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultFourMovesStrip } from '@/components/hand/VaultFourMovesStrip'
import { VaultWhoContactsSection } from '@/components/hand/VaultWhoContactsSection'

export default async function HandWhoRoomPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/conclave/guided')
  if (!isGameAccountReady(player)) redirect('/conclave/guided')

  const data = await loadVaultCoreData(player.id, 'room')

  return (
    <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
      <VaultRoomHeader
        title="Who"
        description="People and moments you’ve named — from event bingo and future Wake Up moves. Private BARs you can open, tend, or play from."
      />

      <VaultFourMovesStrip
        moves={{
          wakeUp: {
            label: 'Charge captures',
            note: 'What’s alive in you — separate from this list.',
            href: '/hand/charges',
          },
          cleanUp: {
            label: 'Compost',
            note: 'Salvage or archive when a moment has done its job.',
            href: '/hand/compost',
          },
          growUp: {
            label: 'Other drafts',
            note: 'Work-in-progress BARs that aren’t on this ledger.',
            href: '/hand/drafts',
          },
          showUp: {
            label: 'Quests & invitations',
            note: 'Place quests or follow up in the world.',
            href: '/hand/quests',
          },
        }}
      />

      {data.whoContactCount > data.whoContactBars.length ? (
        <p className="text-xs text-zinc-600">
          Showing {data.whoContactBars.length} of {data.whoContactCount} (newest first).
        </p>
      ) : null}

      <VaultWhoContactsSection bars={data.whoContactBars} />

      <p className="text-xs text-zinc-600">
        Add more from{' '}
        <Link href="/event" className="text-emerald-400/90 hover:text-emerald-300">
          /event
        </Link>{' '}
        while logged in.
      </p>
    </div>
  )
}
