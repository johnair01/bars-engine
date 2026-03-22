/**
 * NavigationContract — Move 1 of the nav restructure.
 *
 * Every game-loop action declares where the player goes on success, cancel,
 * and error. No component decides routing ad hoc.
 *
 * Governing principle (Sage synthesis):
 *   "The artifact owns its destination."
 *
 * Usage:
 *   import { NAV } from '@/lib/navigation-contract'
 *   const { navigate, cancel } = usePostActionRouter(NAV['321_quest'], returnTo)
 */

export type ActionResult = {
  questId?: string
  barId?: string
  daemonId?: string
  sceneId?: string
}

export type NavigationContract = {
  /** Where to go when the action succeeds. Receives the created artifact's IDs. */
  onSuccess: (result: ActionResult) => string
  /**
   * Where to go when the player cancels, skips, or completes a non-artifact action.
   * null = contextual return (caller must supply a fallback via usePostActionRouter).
   */
  onCancel: string | null
  /** On error: stay on the current form, or return to cancel destination. */
  onError: 'stay' | 'cancel'
}

/** Canonical navigation contracts for all game-loop actions. */
export const NAV: Record<string, NavigationContract> = {
  // ── 3-2-1 shadow work outcomes ──────────────────────────────────────────
  '321_quest': {
    onSuccess: (r) => `/hand?quest=${r.questId}`,
    onCancel: '/',
    onError: 'stay',
  },
  /** 321 completed → Quest Wizard → quest created */
  '321_quest_wizard': {
    onSuccess: (r) => `/hand?quest=${r.questId}`,
    onCancel: '/shadow/321',
    onError: 'stay',
  },
  '321_bar': {
    onSuccess: (r) => `/bars/${r.barId}`,
    onCancel: '/',
    onError: 'stay',
  },
  '321_daemon': {
    onSuccess: () => '/daemons',
    onCancel: '/',
    onError: 'stay',
  },
  /** Fuel the System — no artifact created; return to where player came from. */
  '321_fuel': {
    onSuccess: () => '/',
    onCancel: null,
    onError: 'stay',
  },
  /** Witness Note — no artifact created; quiet return. */
  '321_witness': {
    onSuccess: () => '/',
    onCancel: null,
    onError: 'stay',
  },

  // ── Grow from BAR (BAR detail page → artifact) ───────────────────────────
  'grow_quest': {
    onSuccess: (r) => `/hand?quest=${r.questId}`,
    onCancel: null,
    onError: 'stay',
  },
  'grow_daemon': {
    onSuccess: () => '/daemons',
    onCancel: null,
    onError: 'stay',
  },
  'grow_artifact': {
    onSuccess: (r) => `/growth-scene/${r.sceneId}`,
    onCancel: null,
    onError: 'stay',
  },

  // ── BAR creation ─────────────────────────────────────────────────────────
  'create_bar_private': {
    onSuccess: (r) => `/bars/${r.barId}`,
    onCancel: null,
    onError: 'stay',
  },
  'create_bar_public': {
    onSuccess: () => '/bars/available',
    onCancel: null,
    onError: 'stay',
  },

  // ── Charge capture → quest ───────────────────────────────────────────────
  'charge_quest': {
    onSuccess: (r) => `/hand?quest=${r.questId}`,
    onCancel: null,
    onError: 'stay',
  },
}
