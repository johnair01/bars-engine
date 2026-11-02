import { deriveSupportedElementalTriads, type ThoughtStringAnchor } from '../alchemy/thought-string-triad'

export type AnchorStatus = 'proposed' | 'confirmed' | 'declined'
export type AnchorId = 'wonder' | 'poignance' | 'joy'
export type AnchorDecisions = Record<AnchorId, AnchorStatus>

export const exampleAnchors: Record<AnchorId, ThoughtStringAnchor> = {
  wonder: { wordId: 'wonder', state: { channel: 'fear', altitude: 'satisfied' }, status: 'proposed' },
  poignance: { wordId: 'poignance', state: { channel: 'sadness', altitude: 'satisfied' }, status: 'proposed' },
  joy: { wordId: 'joy', state: { channel: 'joy', altitude: 'satisfied' }, status: 'proposed' },
}
export function deriveExample(decisions: AnchorDecisions) {
  const anchors = (Object.keys(exampleAnchors) as AnchorId[]).map(id => ({ ...exampleAnchors[id], status: decisions[id] }))
  return deriveSupportedElementalTriads(anchors).find(t => t.states[0].channel === 'fear' && t.states[1].channel === 'sadness' && t.states[2].channel === 'joy') ?? null
}
export const forms = [
  { id:'bounded_pilot_design', domain:'SKILLFUL_ORGANIZING', personalMove:'grow_up', label:'Skillful Organizing · Grow Up', title:'Design a 45-minute pilot', prompt:'Draft a 45-minute pilot: capacity, roles, one exercise, and one feedback question.', condition:'A bounded run-of-show exists.' },
  { id:'witness_invitation', domain:'GATHERING_RESOURCES', personalMove:'open_up', label:'Gathering Resources · Open Up', title:'Invite three witnesses', prompt:'Choose and invite three suitable witnesses.', condition:'Three invitations are sent, whether or not they are accepted.' },
  { id:'pilot_invitation_copy', domain:'RAISE_AWARENESS', personalMove:'wake_up', label:'Raise Awareness · Wake Up', title:'Write the invitation', prompt:'Write one paragraph explaining what it is, who it is for, and an easy no.', condition:'The invitation copy exists.' },
  { id:'host_pilot', domain:'DIRECT_ACTION', personalMove:'show_up', label:'Direct Action · Show Up', title:'Host the pilot', prompt:'Host the scheduled pilot.', condition:'You offer and host the room; attendance or approval is not required.' },
] as const
export function resolveForm(id: string) { return forms.find(form => form.id === id) ?? null }
