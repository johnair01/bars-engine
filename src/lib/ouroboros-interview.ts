export const OUROBOROS_NODES = [
  'OUROBOROS_START',
  'OUROBOROS_LENS',
  'OUROBOROS_NATION',
  'OUROBOROS_ARCHETYPE',
  'OUROBOROS_PLAYBOOK',
  'OUROBOROS_DOMAIN',
  'OUROBOROS_COMPLETE',
] as const

export type OuroborosNodeId = (typeof OUROBOROS_NODES)[number]

export type OuroborosInterviewState = {
  currentNodeId: OuroborosNodeId
  answers: {
    lens?: string
    nationId?: string
    archetypeId?: string
    domainPreference?: string[]
  }
  archetypeId?: string
  nationId?: string
  playbookMoveIds?: string[]
  domainPreference?: string[]
}
