/**
 * Campaign Lead Forge — invitee orientation content.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * The "onboarding & orientation to the system" a warm invitee sees before they
 * claim their character: what this game is, how helping works, and how their
 * matched tasks fit. Deterministic, editable copy — no AI.
 *
 * EDIT ME: revise voice/copy freely. Keep ids stable if you ever persist them.
 */
export interface OrientationCard {
  id: string
  /** Short kicker shown above the title. */
  kicker: string
  title: string
  body: string
}

export const ORIENTATION_CARDS: readonly OrientationCard[] = [
  {
    id: 'what-is-this',
    kicker: 'Orientation · 1',
    title: 'This is a game you play by helping',
    body: 'BARs turns real allyship into a game. You take small, real-world actions — “moves” — and the game tracks them, celebrates them, and connects your work to everyone else’s. No grinding, no busywork. Your actual contribution is the gameplay.',
  },
  {
    id: 'the-moves',
    kicker: 'Orientation · 2',
    title: 'Four kinds of moves',
    body: 'Every contribution is one of four moves: Wake Up (notice), Clean Up (tend your own side), Grow Up (build capacity), and Show Up (act in the world). Your tasks are just Show-Up moves with a clear next step — you always know exactly what to do.',
  },
  {
    id: 'how-you-help',
    kicker: 'Orientation · 3',
    title: 'You were hand-picked for this',
    body: 'Someone running this campaign chose you on purpose and matched you to specific tasks — because they think you’re a fit for them. On the next screen you’ll see exactly what they’re asking, and how it moves the campaign forward.',
  },
] as const

export const ORIENTATION_CARD_IDS: readonly string[] = ORIENTATION_CARDS.map((c) => c.id)
