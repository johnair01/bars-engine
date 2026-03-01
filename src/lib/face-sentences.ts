/**
 * Canonical face sentences for the 6 game master faces.
 * Each sentence sends players into the CYOA at that altitude.
 * See: .specify/specs/game-master-face-sentences/spec.md
 */
export const FACE_SENTENCES: Record<string, string> = {
  shaman:
    "Enter through the mythic threshold: the residency as ritual space, Wendell's technology as a bridge between worlds. Your journey begins in belonging.",
  challenger:
    "Enter through the edge: the residency as a proving ground, Wendell's technology as a lever. Your journey begins in action.",
  regent:
    "Enter through the order: the residency as a house with roles and rules, Wendell's technology as a tool for the collective. Your journey begins in structure.",
  architect:
    "Enter through the blueprint: the residency as a project to build, Wendell's technology as an advantage. Your journey begins in strategy.",
  diplomat:
    "Enter through the weave: the residency as a relational field, Wendell's technology as a connector. Your journey begins in care.",
  sage: "Enter through the whole: the residency as one expression of emergence, Wendell's technology as part of the flow. Your journey begins in integration.",
} as const

export type FaceKey = keyof typeof FACE_SENTENCES

export function getFaceSentence(face: FaceKey): string {
  return FACE_SENTENCES[face] ?? ''
}
