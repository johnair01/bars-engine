import Link from 'next/link'

/**
 * OrientationCompass — shows the player where they are in the four-move cycle
 * and offers one concrete next action.
 *
 * Spec: .specify/specs/player-handbook-orientation-system/spec.md (FR3)
 * No new DB queries — derives context from data already loaded by page.tsx.
 */

type MoveKey = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'

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

  return (
    <div className="space-y-1.5">
      {showRitualGate && (
        <p className="text-[11px] text-zinc-600 px-1">
          ↑ Check in above to orient your session — the compass updates once your field is active.
        </p>
      )}
      <div className={`rounded-xl border ${s.borderClass} ${showRitualGate ? 'opacity-60' : ''} bg-zinc-900/30 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
        <div className="space-y-0.5 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">Current move</p>
          <p className={`text-sm font-bold ${s.accentClass}`}>{s.move}</p>
          <p className="text-xs text-zinc-500 leading-snug max-w-sm">{s.tagline}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href={s.href}
            className={`text-xs font-bold px-4 py-2 rounded-lg border ${s.borderClass} ${s.accentClass} hover:bg-zinc-800 transition-colors whitespace-nowrap`}
          >
            {s.action} →
          </Link>
          <Link
            href="/wiki/handbook"
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors whitespace-nowrap"
          >
            Handbook
          </Link>
        </div>
      </div>
    </div>
  )
}
