/**
 * The Loop Lab's first deliberately small action grammar.  It is a registry,
 * not an interpretation service: every input is supplied by the player/UI.
 */
export type DojoAllyshipDomain = 'GATHERING_RESOURCES' | 'SKILLFUL_ORGANIZING' | 'RAISE_AWARENESS' | 'DIRECT_ACTION'
export type DojoPersonalMove = 'wake_up' | 'open_up' | 'grow_up' | 'show_up'

export type DojoActionForm = {
  id: 'bounded_pilot_design' | 'witness_invitation' | 'pilot_invitation_copy' | 'host_pilot'
  title: string
  prompt: string
  requiredSlots: string[]
  playerControlCondition: string
}

export type DojoActionGrammarInput = {
  version: 'v1'
  lifeLens: 'career'
  container: 'gathering'
  allyshipDomain: DojoAllyshipDomain
  personalMove: DojoPersonalMove
  eaMoveId: 'metal_wood'
}

export type DojoActionGrammar = DojoActionGrammarInput & { actionForms: DojoActionForm[] }

const forms: Record<DojoAllyshipDomain, DojoActionForm> = {
  SKILLFUL_ORGANIZING: {
    id: 'bounded_pilot_design',
    title: 'Draft a 45-minute pilot',
    prompt: 'Draft a 45-minute pilot: capacity, roles, one exercise, and one feedback question.',
    requiredSlots: ['capacity', 'roles', 'one exercise', 'one feedback question'],
    playerControlCondition: 'A bounded run-of-show exists.',
  },
  GATHERING_RESOURCES: {
    id: 'witness_invitation',
    title: 'Invite three suitable witnesses',
    prompt: 'Choose and invite three suitable witnesses.',
    requiredSlots: ['three suitable witnesses'],
    playerControlCondition: 'Three invitations are sent—not accepted.',
  },
  RAISE_AWARENESS: {
    id: 'pilot_invitation_copy',
    title: 'Write the pilot invitation',
    prompt: 'Write one paragraph explaining what it is, who it is for, and an easy no.',
    requiredSlots: ['what it is', 'who it is for', 'an easy no'],
    playerControlCondition: 'The invitation copy exists.',
  },
  DIRECT_ACTION: {
    id: 'host_pilot',
    title: 'Host the scheduled pilot',
    prompt: 'Host the scheduled pilot.',
    requiredSlots: ['a scheduled pilot'],
    playerControlCondition: 'The player offers and hosts the room—not that anyone attends or approves.',
  },
}

const expectedMove: Record<DojoAllyshipDomain, DojoPersonalMove> = {
  SKILLFUL_ORGANIZING: 'grow_up',
  GATHERING_RESOURCES: 'open_up',
  RAISE_AWARENESS: 'wake_up',
  DIRECT_ACTION: 'show_up',
}

/** Returns an empty registry result for an unsupported explicit stack. */
export function resolveDojoActionGrammar(input: DojoActionGrammarInput): DojoActionGrammar {
  const actionForms = expectedMove[input.allyshipDomain] === input.personalMove
    ? [forms[input.allyshipDomain]]
    : []
  return { ...input, actionForms }
}

export function personalMoveForDomain(domain: DojoAllyshipDomain): DojoPersonalMove {
  return expectedMove[domain]
}
