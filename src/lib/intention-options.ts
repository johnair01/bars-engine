/**
 * Predefined intention options for the intention quest.
 * Keyed by allyship domain (WHERE); null = cross-domain.
 * @see .specify/specs/domain-aligned-intentions/spec.md
 */
export const INTENTION_OPTIONS = [
  // Cross-domain (always available)
  { text: 'Following my curiosity.', allyshipDomain: null as string | null },
  // Gathering Resources
  {
    text: 'I intend to gather resources that support the residency and its community.',
    allyshipDomain: 'GATHERING_RESOURCES',
  },
  {
    text: 'I intend to contribute funds, time, or materials that strengthen the collective.',
    allyshipDomain: 'GATHERING_RESOURCES',
  },
  // Direct Action
  {
    text: 'I intend to take direct action that moves the work forward.',
    allyshipDomain: 'DIRECT_ACTION',
  },
  {
    text: 'I intend to show up and do the work of completing quests.',
    allyshipDomain: 'DIRECT_ACTION',
  },
  // Raise Awareness
  {
    text: 'I intend to raise awareness about the residency and its mission.',
    allyshipDomain: 'RAISE_AWARENESS',
  },
  {
    text: 'I intend to share the story so others can wake up to what\'s possible.',
    allyshipDomain: 'RAISE_AWARENESS',
  },
  // Skillful Organizing
  {
    text: 'I intend to organize and coordinate so the engine runs smoothly.',
    allyshipDomain: 'SKILLFUL_ORGANIZING',
  },
  {
    text: 'I intend to build systems and skills that support the community.',
    allyshipDomain: 'SKILLFUL_ORGANIZING',
  },
] as const

export type IntentionOption = (typeof INTENTION_OPTIONS)[number]

export function getIntentionOptionsForPreference(
  campaignDomainPreference: string[]
): { text: string; allyshipDomain: string | null }[] {
  const curiosity = INTENTION_OPTIONS.find((o) => o.allyshipDomain === null)!
  const domainAligned = campaignDomainPreference.length
    ? INTENTION_OPTIONS.filter(
        (o) => o.allyshipDomain && campaignDomainPreference.includes(o.allyshipDomain)
      )
    : []
  const others = INTENTION_OPTIONS.filter(
    (o) =>
      o.allyshipDomain !== null &&
      !campaignDomainPreference.includes(o.allyshipDomain)
  )
  return [...domainAligned, curiosity, ...others]
}
