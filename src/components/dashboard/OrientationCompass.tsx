import Image from 'next/image'
import Link from 'next/link'

import { MOVE_ICON_PATHS, type MoveIconSlug } from '@/lib/ui/move-icons'

/**
 * OrientationCompass — shows the player where they are in the four-move cycle
 * and offers one concrete next action.
 *
 * Spec: .specify/specs/player-handbook-orientation-system/spec.md (FR3);
 * Single card, ~50/50 columns on phone; current-move pane wraps CTAs (ABCL follow-up).
 * No new DB queries — derives context from data already loaded by page.tsx.
 */

type CompassProps = {
  /** Completed moveType strings from PlayerQuest rows */
  completedMoveTypes: string[]
  /** True if player has no quest history at all */
  isFirstSession: boolean
  /** True if player has a charge captured today */
  hasChargeToday: boolean
  /** Number of active quests */
  activeQuestCount: number
  /** True if player profile is incomplete (no nation/archetype) */
  isSetupIncomplete: boolean
  /**
   * True if the player has completed their daily check-in.
   * When false, the compass shows a ritual gate pre-prompt.
   * G2: check-in wizard and compass form a single ritual gate.
   */
  hasCheckedIn?: boolean
}

type CompassSuggestion = {
  move: string
  tagline: string
  action: string
  href: string
  accentClass: string
  borderClass: string
}

function deriveSuggestion(props: CompassProps): CompassSuggestion {
  const { isFirstSession, isSetupIncomplete, hasChargeToday, completedMoveTypes, activeQuestCount } = props

  // No character setup → point to onboarding first
  if (isSetupIncomplete) {
    return {
      move: 'Wake Up',
      tagline: 'Complete your character to unlock your move context.',
      action: 'Choose your Nation & Archetype',
      href: '/onboarding',
      accentClass: 'text-emerald-400',
      borderClass: 'border-emerald-800/50',
    }
  }

  // First session — pure Wake Up
  if (isFirstSession) {
    return {
      move: 'Wake Up',
      tagline: 'Start here: name something charged so the game knows where you are.',
      action: 'Capture a charge',
      href: '/capture',
      accentClass: 'text-emerald-400',
      borderClass: 'border-emerald-800/50',
    }
  }

  // Has charge today but no cleanUp quests yet — suggest 321
  const hasCleanUp = completedMoveTypes.includes('cleanUp')
  if (hasChargeToday && !hasCleanUp) {
    return {
      move: 'Clean Up',
      tagline: 'You have live charge. Move it through the 321 process before it dissipates.',
      action: 'Run the 321 process',
      href: '/shadow/321',
      accentClass: 'text-sky-400',
      borderClass: 'border-sky-800/50',
    }
  }

  // Has cleanUp but no growUp — suggest quest unpack
  const hasGrowUp = completedMoveTypes.includes('growUp')
  if (hasCleanUp && !hasGrowUp) {
    return {
      move: 'Grow Up',
      tagline: 'You have metabolized charge. Now deepen your capacity — unpack a quest.',
      action: 'View your quests',
      href: '/hand/quests',
      accentClass: 'text-violet-400',
      borderClass: 'border-violet-800/50',
    }
  }

  // Has active quests → Show Up
  if (activeQuestCount > 0) {
    return {
      move: 'Show Up',
      tagline: `You have ${activeQuestCount} active ${activeQuestCount === 1 ? 'quest' : 'quests'}. Move one to completion.`,
      action: 'View active quests',
      href: '/#active-quests',
      accentClass: 'text-amber-400',
      borderClass: 'border-amber-800/50',
    }
  }

  // Returning player, no active quests — encourage new charge
  return {
    move: 'Wake Up',
    tagline: "Nothing active right now. What's alive? Capture a charge to start a new cycle.",
    action: 'Capture a charge',
    href: '/capture',
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-800/50',
  }
}

export function OrientationCompass(props: CompassProps) {
  const { hasCheckedIn = true } = props
  const s = deriveSuggestion(props)

  // Ritual gate pre-prompt: player hasn't checked in yet for today.
  // The check-in button lives in DashboardHeader above this component.
  const showRitualGate = !hasCheckedIn && !props.isFirstSession && !props.isSetupIncomplete

  const quadrantOrder: { label: string; slug: MoveIconSlug }[] = [
    { label: 'Wake Up', slug: 'wake-up' },
    { label: 'Grow Up', slug: 'grow-up' },
    { label: 'Clean Up', slug: 'clean-up' },
    { label: 'Show Up', slug: 'show-up' },
  ]

  return (
    <div className="space-y-1.5">
      {showRitualGate && (
        <p className="text-[11px] text-zinc-600 px-1">
          ↑ Check in above to orient your session — the compass updates once your field is active.
        </p>
      )}
      <div
        className={`rounded-xl border-2 ${s.borderClass} bg-zinc-900/80 shadow-lg shadow-black/40 ring-1 ring-white/10 overflow-hidden ${
          showRitualGate ? 'opacity-80' : ''
        }`}
      >
        <div className="grid min-h-0 grid-cols-2 items-stretch gap-0 divide-x divide-zinc-800/70 md:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)]">
          {/* Four moves — ~half screen on phone; grid rows grow to match current-move column height */}
          <div className="flex min-h-0 h-full min-w-0 flex-col p-2.5 sm:p-3 md:pr-3">
            <p className="mb-1.5 shrink-0 text-[9px] uppercase tracking-widest text-zinc-600">Four moves</p>
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[1fr_1fr] gap-1.5 sm:gap-2">
              {quadrantOrder.map(({ label, slug }) => {
                const active = s.move === label
                const src = MOVE_ICON_PATHS[slug]
                return (
                  <div
                    key={slug}
                    className={`flex h-full min-h-0 min-w-0 items-center gap-1 rounded-md border px-1.5 py-1 sm:gap-1.5 sm:rounded-lg sm:px-2 sm:py-1.5 ${
                      active
                        ? 'border-zinc-400/90 bg-zinc-800/90 ring-1 ring-white/15'
                        : 'border-zinc-700/80 bg-zinc-950/50 opacity-90'
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 opacity-90 sm:h-6 sm:w-6"
                    />
                    <span
                      className={`min-w-0 text-[9px] font-semibold leading-tight sm:text-[10px] ${
                        active ? 'text-zinc-50' : 'text-zinc-400'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Current move — same width budget as half an iPhone at default grid; stacks CTA + Handbook */}
          <div className="flex min-w-0 flex-col gap-2 p-2.5 sm:gap-2.5 sm:p-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">Current move</p>
            <p className={`text-base sm:text-lg font-bold leading-tight break-words text-balance ${s.accentClass}`}>
              {s.move}
            </p>
            <p className="text-[11px] leading-snug text-zinc-400 break-words text-pretty sm:text-sm">{s.tagline}</p>
            <div className="mt-0.5 flex min-w-0 flex-col gap-2">
              <Link
                href={s.href}
                className={`flex min-h-10 w-full items-center justify-center rounded-lg border-2 px-2 py-2 text-center text-[11px] font-bold leading-snug transition-colors hover:bg-zinc-800/90 sm:text-xs bg-zinc-950/40 ${s.borderClass} ${s.accentClass}`}
              >
                <span className="break-words">
                  {s.action}
                  <span aria-hidden="true"> →</span>
                </span>
              </Link>
              <Link
                href="/wiki/handbook"
                className="min-h-9 self-start text-[10px] leading-snug text-zinc-600 underline-offset-2 hover:text-zinc-400 break-words"
              >
                Handbook
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
