import type { CSSProperties } from 'react'
import type { PartyMiniGameDefinition } from '@/lib/party-mini-game/definitions'
import { altitudeCssVars, elementCssVars } from '@/lib/ui/card-tokens'

type Props = {
  game: PartyMiniGameDefinition
  /** Optional anchor for deep links / skip nav */
  sectionId?: string
  /**
   * Static read-only squares (☐). For tap + session persistence use
   * `PartyMiniGameGridInteractive` + `buildPartyMiniGameSessionKey` from `@/lib/party-mini-game/session-storage`.
   */
  readOnly?: boolean
}

/**
 * 3×3 party mini-game grid — cultivation card frame, Tailwind layout.
 * @see UI_COVENANT.md · .specify/specs/party-mini-game-event-layer/spec.md
 */
export function PartyMiniGameGrid({ game, sectionId, readOnly = true }: Props) {
  const headingId = `${game.id}-grid-title`
  const cardStyle: CSSProperties = {
    ...elementCssVars(game.element),
    ...altitudeCssVars('neutral'),
  }

  return (
    <section
      id={sectionId}
      className="scroll-mt-24"
      aria-labelledby={headingId}
    >
      <div className="cultivation-card p-4 sm:p-5" style={cardStyle}>
        <div className="space-y-1 mb-4">
          <h4 id={headingId} className="text-base font-bold text-zinc-100 tracking-tight">
            {game.title}
          </h4>
          {game.goalLine ? (
            <p className="text-xs text-zinc-500 leading-snug">{game.goalLine}</p>
          ) : null}
          {readOnly ? (
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider pt-1">
              In-room prompts · tap-to-check coming soon
            </p>
          ) : null}
        </div>

        <ul
          className="grid grid-cols-3 gap-2 list-none m-0 p-0"
          role="list"
          aria-label={`${game.title} prompts`}
        >
          {game.squares.map((sq) => (
            <li
              key={sq.id}
              className="min-h-[44px] flex gap-1.5 items-start rounded-lg border border-zinc-700/40 bg-black/30 px-1.5 py-2 text-left sm:px-2.5"
            >
              <span
                className="shrink-0 mt-0.5 text-zinc-500 font-mono text-sm select-none"
                aria-hidden
              >
                ☐
              </span>
              <span className="text-sm text-zinc-300 leading-snug">{sq.text}</span>
              <span className="sr-only">{sq.id}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
