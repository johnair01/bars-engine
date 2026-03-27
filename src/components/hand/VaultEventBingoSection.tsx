/**
 * VaultEventBingoSection — RSC section for the player Vault.
 *
 * Two panels:
 *  1. Cards already owned (one widget per card, collapsed by default)
 *  2. Available events the player hasn't claimed yet
 */
import { loadVaultBingoCards, loadAvailableEventCards } from '@/lib/vault-bingo'
import { EventBingoCardWidget } from '@/components/hand/EventBingoCardWidget'
import { ClaimBingoCardButton } from '@/components/hand/ClaimBingoCardButton'

interface Props {
  playerId: string
}

export async function VaultEventBingoSection({ playerId }: Props) {
  const [cards, available] = await Promise.all([
    loadVaultBingoCards(playerId),
    loadAvailableEventCards(playerId),
  ])

  if (cards.length === 0 && available.length === 0) return null

  return (
    <section className="space-y-6">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">Invite Bingo</p>

      {/* Available events — claim a card */}
      {available.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Claim an invite bingo card for an upcoming event. Your card is pre-filled with prompts
            drawn from your campaign&apos;s community character — just add names and send links.
          </p>
          <div className="space-y-2">
            {available.map((ev) => (
              <div
                key={ev.eventId}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm text-zinc-200">{ev.eventTitle}</p>
                  {ev.eventStart && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(ev.eventStart).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <ClaimBingoCardButton eventId={ev.eventId} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing cards */}
      {cards.length > 0 && (
        <div className="space-y-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4"
            >
              <EventBingoCardWidget card={card} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
