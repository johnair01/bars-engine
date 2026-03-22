/**
 * Neutral–Playful copy for BSM UI. No shame metrics.
 */

export const bsmCopy = {
  panelTitle: 'Seed garden',
  panelHint:
    'Name the soil this seed belongs to and track where it is in your process—no pressure to “clear” anything.',

  soilLabel: 'Soil (where this seed belongs)',
  soilCampaign: 'Campaign',
  soilThread: 'Thread',
  soilHolding: 'Holding pen',
  soilUnset: 'Not set yet',

  contextNoteLabel: 'Context note (optional)',
  contextNotePlaceholder: 'A few words for future-you…',

  maturityLabel: 'Maturity',
  maturityCaptured: 'Captured',
  maturityContextNamed: 'Context named',
  maturityElaborated: 'Linked / elaborated',
  maturityShared: 'Shared or acted',
  maturityIntegrated: 'Closed / integrated',

  compostTitle: 'Compost this seed',
  compostHint:
    'Moves it out of your main list (soft archive). Optional: one line about what you’re releasing.',
  compostButton: 'Compost',
  compostReleasePlaceholder: 'I’m releasing… (optional)',
  compostConfirm: 'Compost and archive',

  restoreTitle: 'Bring back from compost',
  restoreHint: 'This seed was composted. You can return it to your active list.',
  restoreButton: 'Restore to garden',

  graduateHint: 'Turn this seed into a quest when you’re ready—same flow as Grow.',

  gardenTitle: 'Nursery',
  gardenSubtitle: 'Optional view—work seeds when you choose, not on a counter.',
  gardenLink: 'Nursery',
  gardenFiltersSoil: 'Soil',
  gardenFiltersMaturity: 'Maturity',
  gardenShowComposted: 'Show composted',
  gardenEmpty: 'No seeds match these filters.',
} as const

export function maturityLabel(phase: string): string {
  switch (phase) {
    case 'captured':
      return bsmCopy.maturityCaptured
    case 'context_named':
      return bsmCopy.maturityContextNamed
    case 'elaborated':
      return bsmCopy.maturityElaborated
    case 'shared_or_acted':
      return bsmCopy.maturityShared
    case 'integrated':
      return bsmCopy.maturityIntegrated
    default:
      return phase
  }
}
