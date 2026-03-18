/**
 * Move Grammar — types for the Nation × Face × Archetype composition system.
 * Spec: .specify/specs/deck-card-move-grammar/spec.md (DCG-1)
 *
 * Grammar compounds at render time via resolveMoveSentence().
 * No DB rows — all grammar lives in TypeScript constants.
 */

export type FaceKey =
  | 'shaman'
  | 'challenger'
  | 'regent'
  | 'architect'
  | 'diplomat'
  | 'sage'

export type FaceMoveType =
  | 'create_ritual'
  | 'name_shadow_belief'   // shaman
  | 'issue_challenge'
  | 'propose_move'         // challenger
  | 'declare_period'
  | 'grant_role'           // regent
  | 'offer_blueprint'
  | 'design_layout'        // architect
  | 'offer_connection'
  | 'host_event'           // diplomat
  | 'witness'
  | 'cast_hexagram'        // sage

export interface MoveSlot {
  key: string
  description: string
}

export interface BaseFaceMove {
  faceKey: FaceKey
  moveTypeKey: FaceMoveType
  /**
   * Template sentence using {PLAYER}, {ACTION}, {NATION_REGISTER}, {OUTCOME} slots.
   * Nation flavor substitutes into {NATION_REGISTER}.
   */
  templateSentence: string
  slots: MoveSlot[]
  /** Full body text when no nation/archetype overlay is applied. */
  defaultBody: string
}

export interface NationFlavorProfile {
  nationKey: string       // 'argyra' | 'pyrakanth' | 'virelune' | 'meridia' | 'lamenth'
  nationName: string
  element: string         // primary wuxing element
  register: string        // tonal quality
  verbPalette: string[]   // 5–8 verbs in this nation's register
  metaphorField: string   // a single evocative phrase for body text
  moveTypeInflections: Partial<Record<FaceMoveType, string>>
}
