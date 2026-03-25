import type { GmFaceStageMove } from '@/lib/gm-face-stage-moves'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'
import { GmFaceMoveQuestPickButton } from '@/components/campaign/GmFaceMoveQuestPickButton'

export type GmFaceMovePickConfig = {
  campaignRef: string
  hexagramId?: number
  portalTheme?: string | null
}

type Props = {
  kotterStage: number
  campaignRef: string
  moves: readonly GmFaceStageMove[]
  /** When set, each move shows a CTA that composes a Kotter quest BAR (Phase B+). */
  pickConfig?: GmFaceMovePickConfig | null
}

/**
 * Six face moves for the instance’s current Kotter stage (Phase B — campaign hub).
 * @see .specify/specs/kotter-quest-seed-grammar/spec.md §C–D
 */
export function GmFaceMovesPanel({ kotterStage, campaignRef, moves, pickConfig }: Props) {
  if (moves.length === 0) return null

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5 space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Show up</p>
        <h2 className="text-lg font-semibold text-white tracking-tight">GM face moves · stage {kotterStage}</h2>
        <p className="text-xs text-zinc-500 max-w-2xl">
          Six ways to metabolize this Kotter beat — same campaign clock for everyone on{' '}
          <span className="font-mono text-zinc-400">{campaignRef}</span>. Use one as your next honest move; quest
          seeds can reference the move id in tooling.
        </p>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {moves.map((move) => {
          const meta = FACE_META[move.face as GameMasterFace]
          return (
            <li
              key={move.id}
              className="rounded-lg border border-zinc-800/80 bg-black/40 p-3 flex flex-col gap-1.5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${meta?.color ?? 'text-zinc-400'}`}>
                  {meta?.label ?? move.face}
                </span>
                <code className="text-[9px] text-zinc-600 font-mono">{move.id}</code>
              </div>
              <p className="text-sm font-medium text-zinc-200">{move.title}</p>
              <p className="text-xs text-zinc-500 leading-snug [&_strong]:text-zinc-400">{move.action}</p>
              <p className="text-[10px] text-zinc-600 mt-1 pt-1 border-t border-zinc-800/60">
                <span className="text-zinc-500">Done when:</span> {move.evidence}
              </p>
              {pickConfig ? (
                <GmFaceMoveQuestPickButton
                  campaignRef={pickConfig.campaignRef}
                  gmFaceMoveId={move.id}
                  hexagramId={pickConfig.hexagramId}
                  portalTheme={pickConfig.portalTheme}
                />
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
