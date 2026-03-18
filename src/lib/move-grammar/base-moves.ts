/**
 * Move Grammar — 12 BaseFaceMove constants (6 faces × 2 move types).
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-2)
 *
 * Template sentences use slots: {PLAYER}, {ACTION}, {NATION_REGISTER}, {OUTCOME}.
 * Nation flavor substitutes into {NATION_REGISTER} at render time.
 */

import type { BaseFaceMove } from './index'

export const BASE_MOVES: BaseFaceMove[] = [
  // ─── SHAMAN ────────────────────────────────────────────────────────────────

  {
    faceKey: 'shaman',
    moveTypeKey: 'create_ritual',
    templateSentence:
      '{PLAYER} calls {ACTION} into form through {NATION_REGISTER}. The container holds what could not be held before. {OUTCOME} becomes possible.',
    slots: [
      { key: 'PLAYER', description: 'The one creating the ritual' },
      { key: 'ACTION', description: 'What is being ritualized' },
      { key: 'NATION_REGISTER', description: 'The cultural medium of the ritual' },
      { key: 'OUTCOME', description: 'What the container makes possible' },
    ],
    defaultBody:
      'A ritual creates a container for what cannot otherwise be held. The Shaman does not impose structure — they call structure into being from the materials of the community. What needs to be held here? What form would let it be entered safely? The ritual is the answer before the answer is spoken.',
  },

  {
    faceKey: 'shaman',
    moveTypeKey: 'name_shadow_belief',
    templateSentence:
      '{PLAYER} speaks what {NATION_REGISTER} has held unspoken — {ACTION}. The hidden pattern surfaces. {OUTCOME} shifts.',
    slots: [
      { key: 'PLAYER', description: 'The one naming the shadow' },
      { key: 'NATION_REGISTER', description: 'The cultural field holding the belief' },
      { key: 'ACTION', description: 'The shadow belief being named' },
      { key: 'OUTCOME', description: 'What changes once the belief is named' },
    ],
    defaultBody:
      'Shadow beliefs run the system from below. The Shaman names what everyone knows but no one has said — not to expose or shame, but to bring it into the light where it can be worked with. The naming is the first move. What is the belief underneath the behavior? Name it plainly. Watch what opens.',
  },

  // ─── CHALLENGER ────────────────────────────────────────────────────────────

  {
    faceKey: 'challenger',
    moveTypeKey: 'issue_challenge',
    templateSentence:
      '{PLAYER} issues {ACTION} to the field. {NATION_REGISTER} answers. {OUTCOME} is now at stake.',
    slots: [
      { key: 'PLAYER', description: 'The one issuing the challenge' },
      { key: 'ACTION', description: 'The challenge being issued' },
      { key: 'NATION_REGISTER', description: 'How the nation registers the challenge' },
      { key: 'OUTCOME', description: 'What is now at stake' },
    ],
    defaultBody:
      'A challenge opens a new front. The Challenger does not provoke for the sake of it — they identify where the field has gone soft and push there. The challenge is an invitation disguised as pressure. What is the edge that needs to be touched? Issue it clearly. Let the field respond.',
  },

  {
    faceKey: 'challenger',
    moveTypeKey: 'propose_move',
    templateSentence:
      '{PLAYER} proposes {ACTION}. Through {NATION_REGISTER}, {OUTCOME} becomes the path forward.',
    slots: [
      { key: 'PLAYER', description: 'The one proposing the move' },
      { key: 'ACTION', description: 'The move being proposed' },
      { key: 'NATION_REGISTER', description: 'The national context that frames the proposal' },
      { key: 'OUTCOME', description: 'The path that opens' },
    ],
    defaultBody:
      'A proposal names the next step when no one else will. The Challenger sees what needs to happen and says it aloud — not as a command, but as a concrete invitation to move. The proposal makes the abstract legible. What is the next smallest honest action? Name it. Let others respond to something real.',
  },

  // ─── REGENT ────────────────────────────────────────────────────────────────

  {
    faceKey: 'regent',
    moveTypeKey: 'declare_period',
    templateSentence:
      '{PLAYER} declares {ACTION} as the quality of this period. {NATION_REGISTER} holds the field. {OUTCOME} orients the community.',
    slots: [
      { key: 'PLAYER', description: 'The one making the declaration' },
      { key: 'ACTION', description: 'The quality being declared' },
      { key: 'NATION_REGISTER', description: 'The national register that grounds the declaration' },
      { key: 'OUTCOME', description: 'How the community is oriented' },
    ],
    defaultBody:
      'A period declaration names the developmental moment the community is in. The Regent reads the collective state and articulates it — giving the group a shared orientation in time. This is not prediction; it is naming what is already true. What period are you in? Name it. Let the declaration do its work.',
  },

  {
    faceKey: 'regent',
    moveTypeKey: 'grant_role',
    templateSentence:
      '{PLAYER} grants {ACTION} in the name of {NATION_REGISTER}. {OUTCOME} takes form.',
    slots: [
      { key: 'PLAYER', description: 'The one granting the role' },
      { key: 'ACTION', description: 'The role being granted' },
      { key: 'NATION_REGISTER', description: 'The national authority behind the grant' },
      { key: 'OUTCOME', description: 'What becomes possible with the role filled' },
    ],
    defaultBody:
      'A role grant gives shape to a capacity that already exists. The Regent sees what a person or group is already doing and formalizes it — not as an imposition, but as a recognition. The role is the gift of a container. Who is already holding something that needs to be named? Grant the role. Let the naming make it real.',
  },

  // ─── ARCHITECT ─────────────────────────────────────────────────────────────

  {
    faceKey: 'architect',
    moveTypeKey: 'offer_blueprint',
    templateSentence:
      '{PLAYER} offers {ACTION} as structure. {NATION_REGISTER} gives it ground. {OUTCOME} can be built.',
    slots: [
      { key: 'PLAYER', description: 'The one offering the blueprint' },
      { key: 'ACTION', description: 'The structure being offered' },
      { key: 'NATION_REGISTER', description: 'The national substrate that supports the structure' },
      { key: 'OUTCOME', description: 'What can now be built' },
    ],
    defaultBody:
      'A blueprint makes the implicit explicit. The Architect does not build alone — they make the structure visible so that others can build within it. The offer is not a demand; it is a gift of clarity. What is the structure that this situation needs? Offer it. Let others work within it or push against it until it fits.',
  },

  {
    faceKey: 'architect',
    moveTypeKey: 'design_layout',
    templateSentence:
      '{PLAYER} designs {ACTION} across {NATION_REGISTER}. {OUTCOME} becomes navigable.',
    slots: [
      { key: 'PLAYER', description: 'The one designing the layout' },
      { key: 'ACTION', description: 'What is being laid out' },
      { key: 'NATION_REGISTER', description: 'The national terrain being mapped' },
      { key: 'OUTCOME', description: 'What becomes navigable through the design' },
    ],
    defaultBody:
      'A layout distributes capacity across space and time. The Architect takes what is scattered and gives it address — a place for each thing, a path between them. Design is the act of making complexity navigable without making it simple. What needs to be arranged? Design the layout. Let the arrangement do the thinking.',
  },

  // ─── DIPLOMAT ──────────────────────────────────────────────────────────────

  {
    faceKey: 'diplomat',
    moveTypeKey: 'offer_connection',
    templateSentence:
      '{PLAYER} offers {ACTION} across the threshold. {NATION_REGISTER} holds the space between. {OUTCOME} opens.',
    slots: [
      { key: 'PLAYER', description: 'The one offering connection' },
      { key: 'ACTION', description: 'What is being offered across the threshold' },
      { key: 'NATION_REGISTER', description: 'The relational field that holds the threshold' },
      { key: 'OUTCOME', description: 'What opens between' },
    ],
    defaultBody:
      'A connection offer crosses a threshold that has not been crossed before. The Diplomat moves toward what has been kept separate — not to merge the two sides, but to make passage possible. The offer is the bridge. What are the two things that need to be in contact? Offer the connection. Let it be refused or accepted on its own terms.',
  },

  {
    faceKey: 'diplomat',
    moveTypeKey: 'host_event',
    templateSentence:
      '{PLAYER} hosts {ACTION} within {NATION_REGISTER}. {OUTCOME} is what the gathering makes possible.',
    slots: [
      { key: 'PLAYER', description: 'The host' },
      { key: 'ACTION', description: 'The event being hosted' },
      { key: 'NATION_REGISTER', description: 'The national field the event inhabits' },
      { key: 'OUTCOME', description: 'What the gathering enables' },
    ],
    defaultBody:
      'An event creates a shared field where individual concerns can meet something larger. The Diplomat hosts without controlling — they set the conditions and then step back. The gathering does its own work. What needs to be convened? Host it. Prepare the space. Let the field do what fields do when people enter them together.',
  },

  // ─── SAGE ──────────────────────────────────────────────────────────────────

  {
    faceKey: 'sage',
    moveTypeKey: 'witness',
    templateSentence:
      '{PLAYER} witnesses {ACTION} without turning away. {NATION_REGISTER} is the ground. {OUTCOME} is what can now be named.',
    slots: [
      { key: 'PLAYER', description: 'The one witnessing' },
      { key: 'ACTION', description: 'What is being witnessed' },
      { key: 'NATION_REGISTER', description: 'The cultural ground that makes witnessing possible' },
      { key: 'OUTCOME', description: 'What becomes nameable through witnessing' },
    ],
    defaultBody:
      'Witnessing changes what is seen. The Sage does not interpret, intervene, or solve — they see clearly and let the seeing be enough. The witness is the gift of full attention without agenda. What needs to be seen without being fixed? Witness it. Stay present. Let the act of seeing do what only seeing can do.',
  },

  {
    faceKey: 'sage',
    moveTypeKey: 'cast_hexagram',
    templateSentence:
      '{PLAYER} casts {ACTION} for {NATION_REGISTER}. The pattern speaks. {OUTCOME} becomes legible.',
    slots: [
      { key: 'PLAYER', description: 'The one casting' },
      { key: 'ACTION', description: 'The question being cast' },
      { key: 'NATION_REGISTER', description: 'The national moment the hexagram reads' },
      { key: 'OUTCOME', description: 'What the pattern reveals' },
    ],
    defaultBody:
      'The hexagram reads the moment by creating a mirror. The Sage does not predict — they offer a structured way of seeing what is already present. The cast opens a question that the situation has been trying to ask. What is the question underneath the question? Cast the hexagram. Let the pattern answer in its own language.',
  },
]

export function getBaseMove(
  faceKey: string,
  moveTypeKey: string
): BaseFaceMove | undefined {
  return BASE_MOVES.find(
    (m) => m.faceKey === faceKey && m.moveTypeKey === moveTypeKey
  )
}
