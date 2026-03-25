/**
 * CYOA Intake template schema — hub-and-spoke campaign routing.
 *
 * An IntakeTemplate is stored in Adventure.playbookTemplate (JSON string)
 * for Adventures of type CYOA_INTAKE.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PRIVACY CONTRACT
 * ─────────────────────────────────────────────────────────────────────────
 *   • IntakeTemplateChoice.routing is NEVER sent to the client / player UI.
 *   • Player-facing components consume IntakeChoice {text, targetId, choiceKey}
 *     only — routing metadata is stripped at the server action boundary.
 *   • GmFaceKey values are NEVER rendered to the player in any field.
 *   • Terminal passages do NOT carry gmFace or moveType labels — routing is
 *     purely computed from accumulated sdWeights in the player's choice log.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * See: .agent/context/game-master-sects.md for the SD ladder definition.
 * See: src/lib/cyoa-intake/intakeSurface.ts for the IntakeChoiceLogEntry schema.
 */

// ---------------------------------------------------------------------------
// GM Face Keys (Spiral Dynamics ladder — hidden from player UI)
// ---------------------------------------------------------------------------

/**
 * The six GM faces, ordered on the Spiral Dynamics developmental ladder.
 * Purple/Magenta → Red → Amber → Orange → Green → Yellow/Teal
 *
 * These keys are INTERNAL identifiers used only in routing weights.
 * They are never rendered to the player as face names.
 */
export type GmFaceKey =
  | 'shaman'      // Purple/Magenta — tribal, ritual, belonging
  | 'challenger'  // Red — power, action, edge
  | 'regent'      // Amber — order, rules, roles (Blue = Amber canonical)
  | 'architect'   // Orange — strategy, achievement, optimization
  | 'diplomat'    // Green — relational, care, pluralistic inclusion
  | 'sage'        // Yellow/Teal — integral, synthesis, meta-view

/**
 * The six GM face keys in SD ladder order (ascending).
 * Used by the reroute algorithm when the exact (gmFace, moveType) branch
 * is unavailable — ascends one step at a time to find the nearest match.
 */
export const SD_LADDER: readonly GmFaceKey[] = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
]

// ---------------------------------------------------------------------------
// Move Types
// ---------------------------------------------------------------------------

/**
 * The four personal move types that an intake CYOA can route to.
 * All four are valid routing targets — no value is excluded.
 *
 * wakeUp   — awareness, threshold crossing, seeing what is real
 * cleanUp  — responsibility, repair, amends
 * growUp   — development, capability, maturation
 * showUp   — committed presence, action, showing up for others
 */
export type IntakeMoveType = 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'

export const INTAKE_MOVE_TYPES: readonly IntakeMoveType[] = [
  'wakeUp',
  'cleanUp',
  'growUp',
  'showUp',
]

// ---------------------------------------------------------------------------
// Hidden SD routing metadata per choice option
// ---------------------------------------------------------------------------

/**
 * Hidden routing metadata attached to each intake choice option.
 *
 * sdWeights:
 *   Fractional vote (0.0–1.0) toward each GM face key.
 *   Values need NOT sum to 1; they are accumulated across all choices
 *   in the player's log and resolved via argmax to determine gmFace.
 *   Absent keys contribute 0.
 *
 * moveWeights:
 *   Optional fractional vote (0.0–1.0) toward each move type.
 *   Accumulated and resolved via argmax to determine moveType.
 *   When absent on all choices, moveType falls back to the simple
 *   IntakeMoveType tag approach (IntakeTemplateChoice.moveType) or 'growUp'.
 *
 * NEVER pass this object to the client or include it in player-facing output.
 */
export type IntakeChoiceRouting = {
  /** Fractional SD face weights — keys are GmFaceKey, values in [0, 1] */
  sdWeights: Partial<Record<GmFaceKey, number>>
  /** Optional fractional move-type weights — keys are IntakeMoveType, values in [0, 1] */
  moveWeights?: Partial<Record<IntakeMoveType, number>>
}

// ---------------------------------------------------------------------------
// Choice option (template-level — includes hidden routing)
// ---------------------------------------------------------------------------

/**
 * A choice option within an intake template passage.
 *
 * Player-visible fields (safe to send to client):
 *   text, targetId, choiceKey
 *
 * Hidden fields (server-only, stripped before client serialization):
 *   routing — contains sdWeights and moveWeights
 *
 * GM authoring contract:
 *   - Do NOT put gmFace names in `text`.
 *   - `routing` is the ONLY place SD face information lives.
 *   - Use metaphorical, thematic language in `text` that implies the face
 *     without naming it (e.g. "Find my place in the ritual" not "Shaman path").
 */
export type IntakeTemplateChoice = {
  /** Player-visible answer text — must NOT contain face names or moveType labels */
  text: string
  /** Next passage nodeId to navigate to */
  targetId: string
  /**
   * Stable identifier for this choice within the adventure.
   * Used by the routing algorithm to cross-reference the player's choice log
   * against the IntakeTemplate without relying on fragile text matching.
   * Format convention: "{nodeId}_{letter}" e.g. "start_a", "q2_c"
   */
  choiceKey: string
  /** Hidden SD routing metadata — NEVER render or send to player */
  routing: IntakeChoiceRouting
}

// ---------------------------------------------------------------------------
// Passage node (template-level)
// ---------------------------------------------------------------------------

/**
 * A passage node in the intake template.
 *
 * GM authoring contract:
 *   - Do NOT set a `gmFace` field on any passage — face routing is purely
 *     computed from accumulated sdWeights in the choice log.
 *   - Do NOT set a `moveType` field directly on terminal passages — use
 *     routing.moveWeights on choices instead, or fall back to the simple
 *     IntakeMoveType tag on the player-facing IntakeChoice.
 *   - `isTerminal: true` passages end the intake flow; they have empty choices.
 */
export type IntakeTemplatePassage = {
  nodeId: string
  /** Player-visible passage text — may use {playerName} macro */
  text: string
  /** If true, this passage ends the intake — no choices are shown to the player */
  isTerminal?: boolean
  /** Available choices (empty array on terminal passages) */
  choices: IntakeTemplateChoice[]
}

// ---------------------------------------------------------------------------
// Master IntakeTemplate — stored in Adventure.playbookTemplate
// ---------------------------------------------------------------------------

/**
 * The master intake template for a CYOA_INTAKE Adventure.
 * Stored as JSON string in Adventure.playbookTemplate.
 *
 * Structure:
 *   version     — schema version (currently 1) for forward-compat parsing
 *   startNodeId — first passage nodeId to display to the player
 *   passages    — full passage graph including all hidden routing metadata
 *
 * Security note:
 *   When serving the IntakeTemplate to client components, strip the
 *   `routing` field from every choice before serialization.
 *   Use stripRoutingMetadata() from this module.
 */
export type IntakeTemplate = {
  version: 1
  startNodeId: string
  /** All passage nodes including hidden routing metadata */
  passages: IntakeTemplatePassage[]
}

// ---------------------------------------------------------------------------
// Routing resolution output (computed, never stored in template)
// ---------------------------------------------------------------------------

/**
 * Resolved routing result produced by resolveIntakeRouting().
 * Consumed by completeIntakeSession() to write gmFace + moveType
 * to SpokeSession in a single atomic transaction.
 *
 * faceScores and moveScores are included for audit/debug logging only —
 * they are NOT persisted to the DB and NOT sent to the client.
 */
export type IntakeRoutingResult = {
  /** The inferred GM face — written to SpokeSession.gmFace */
  gmFace: GmFaceKey
  /** The inferred move type — written to SpokeSession.moveType */
  moveType: IntakeMoveType
  /** Raw accumulated scores per face (for audit/debug) */
  faceScores: Record<GmFaceKey, number>
  /** Raw accumulated scores per move type (for audit/debug) */
  moveScores: Record<IntakeMoveType, number>
}

// ---------------------------------------------------------------------------
// Player-safe choice type (routing stripped)
// ---------------------------------------------------------------------------

/**
 * The player-safe version of an intake choice.
 * Excludes the `routing` field — safe to serialize and send to the client.
 *
 * The `choiceKey` field is included (it is not sensitive) so the player
 * runner can log it in IntakeChoiceLogEntry for server-side routing lookup.
 */
export type IntakeSafeChoice = Omit<IntakeTemplateChoice, 'routing'>

// ---------------------------------------------------------------------------
// Utility: strip routing metadata before client serialization
// ---------------------------------------------------------------------------

/**
 * Strip hidden `routing` fields from all choices in an IntakeTemplate.
 * Returns a new object safe to serialize and send to the client.
 *
 * Usage (in server actions before returning to client):
 *   const safePassages = stripRoutingMetadata(template).passages
 */
export function stripRoutingMetadata(
  template: IntakeTemplate,
): Omit<IntakeTemplate, 'passages'> & { passages: Array<Omit<IntakeTemplatePassage, 'choices'> & { choices: IntakeSafeChoice[] }> } {
  return {
    ...template,
    passages: template.passages.map((passage) => ({
      ...passage,
      choices: passage.choices.map(({ routing: _routing, ...safeChoice }) => safeChoice),
    })),
  }
}
