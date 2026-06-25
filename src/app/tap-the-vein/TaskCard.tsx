'use client'

/**
 * TaskCard — a Tap the Vein task rendered as a Cultivation Card seed.
 *
 * Three-channel mapping by lifecycle status (design handoff §07):
 *   committed            → neutral   / seed
 *   in_progress          → satisfied / seed (glow + float)
 *   completed            → satisfied / growing (✓ + "♦ +1 · brick paved")
 *   composted            → dissatisfied / composted (crosshatch + dimmed, shows reason)
 *   carried_over (out)   → neutral / seed, terminal ("carried →"), dimmed
 *   assigned_to_campaign → neutral / seed (terminal)
 *   upgraded_to_quest    → satisfied / growing (terminal)
 *
 * The `carried ×N` badge is driven by isCarried (carried *in* from a prior day),
 * independent of status. Element is the player's nation element (passed in — no
 * NationProvider in this tree).
 */

import { CultivationCard, type ElementKey, type AlchemyAltitude } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, type CardStage } from '@/lib/ui/card-tokens'
import type { TtvTaskDTO } from '@/actions/tap-the-vein'

type StatusStyle = {
  altitude: AlchemyAltitude
  stage: CardStage
  label: string
  floating: boolean
  terminal: boolean
}

const STATUS_STYLE: Record<string, StatusStyle> = {
  committed: { altitude: 'neutral', stage: 'seed', label: 'Committed', floating: false, terminal: false },
  in_progress: { altitude: 'satisfied', stage: 'seed', label: 'In progress', floating: true, terminal: false },
  completed: { altitude: 'satisfied', stage: 'growing', label: 'Done', floating: false, terminal: true },
  composted: { altitude: 'dissatisfied', stage: 'composted', label: 'Composted', floating: false, terminal: true },
  carried_over: { altitude: 'neutral', stage: 'seed', label: 'Carried →', floating: false, terminal: true },
  assigned_to_campaign: { altitude: 'neutral', stage: 'seed', label: 'Assigned', floating: false, terminal: true },
  upgraded_to_quest: { altitude: 'satisfied', stage: 'growing', label: 'Upgraded', floating: false, terminal: true },
}

const REASON_LABEL: Record<string, string> = {
  not_relevant: 'not relevant',
  already_done: 'already done',
  assigned_elsewhere: 'assigned elsewhere',
  too_small: 'too small',
  too_big: 'too big',
  other: 'other',
}

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'

export function TaskCard({
  task,
  element,
  nationName,
  onOpenMenu,
}: {
  task: TtvTaskDTO
  element: ElementKey
  nationName: string | null
  onOpenMenu?: (task: TtvTaskDTO) => void
}) {
  const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.committed
  const gem = ELEMENT_TOKENS[element].gem
  const sigil = ELEMENT_TOKENS[element].sigil
  const dimmed = s.terminal && task.status !== 'completed' && task.status !== 'upgraded_to_quest'
  const interactive = !s.terminal && !!onOpenMenu

  return (
    <CultivationCard
      element={element}
      altitude={s.altitude}
      stage={s.stage}
      floating={s.floating}
      animated
      className="w-full"
      aria-label={`${nationName ?? element} task, ${s.label.toLowerCase()}: ${task.text}`}
    >
      <div
        className="flex items-stretch gap-3 p-3"
        style={{ opacity: dimmed ? 0.55 : 1 }}
      >
        {/* Element sigil tile */}
        <div
          className="flex-none flex items-center justify-center rounded-lg"
          style={{
            width: 38,
            height: 38,
            background: `color-mix(in srgb, ${gem} 14%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${gem} 45%, transparent)`,
            color: gem,
            fontSize: 16,
          }}
          aria-hidden
        >
          {sigil}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="truncate"
                style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}
              >
                {nationName ?? 'Your nation'}
              </span>
              {task.isCarried && task.carryCount > 0 && (
                <span
                  className="flex-none rounded-full px-1.5"
                  style={{
                    fontFamily: mono,
                    fontSize: 8,
                    lineHeight: '14px',
                    color: gem,
                    background: `color-mix(in srgb, ${gem} 16%, transparent)`,
                  }}
                >
                  carried ×{task.carryCount}
                </span>
              )}
            </div>
            <span
              className="flex-none"
              style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: gem }}
            >
              {s.label}
            </span>
          </div>

          <p
            className="mt-1"
            style={{
              fontFamily: body,
              fontSize: 14,
              lineHeight: 1.35,
              color: 'var(--bars-text-primary)',
              textDecoration: task.status === 'composted' ? 'line-through' : 'none',
            }}
          >
            {task.text}
          </p>

          {task.status === 'completed' && (
            <p className="mt-1" style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', color: gem }}>
              ♦ +1 · brick paved
            </p>
          )}
          {task.status === 'composted' && task.compostReason && (
            <p className="mt-1" style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', color: 'var(--bars-text-muted)' }}>
              reason · {REASON_LABEL[task.compostReason] ?? task.compostReason}
            </p>
          )}
        </div>

        {/* Affordance */}
        <div className="flex-none flex items-center">
          {task.status === 'completed' ? (
            <span
              className="flex items-center justify-center rounded-full"
              style={{ width: 26, height: 26, color: gem, boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${gem} 60%, transparent)`, fontSize: 13 }}
              aria-hidden
            >
              ✓
            </span>
          ) : interactive ? (
            <button
              type="button"
              onClick={() => onOpenMenu?.(task)}
              aria-label="Task actions"
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, color: 'var(--bars-text-secondary)', background: 'transparent', fontFamily: display, fontSize: 18 }}
            >
              ⋯
            </button>
          ) : null}
        </div>
      </div>
    </CultivationCard>
  )
}
