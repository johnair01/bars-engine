/**
 * NPC Face Resolver — portraysFace + effectiveFace runtime computation
 *
 * Every NPC has a `portraysFace` (GameMasterFace | null) stored in NpcConstitution.
 * For all non-Sage NPCs, `effectiveFace` === `portraysFace` (fixed, immutable per NPC).
 *
 * Sage NPCs are special: they integrate all faces and compute their `effectiveFace`
 * at runtime based on scene context (emotional vector, spoke face, student needs).
 * The Sage face itself is NEVER returned as effectiveFace — Sage is a meta-face
 * that selects among the other 5 faces based on what the student needs most.
 *
 * Design constraints:
 *   - portraysFace is fixed per NPC except Sage NPCs which compute effectiveFace at runtime
 *   - GameMasterFace enum (6 faces) is existing infrastructure — do not alter
 *   - Pure functions, no side effects, fully testable
 *
 * @see prisma/schema.prisma — NpcConstitution.portraysFace
 * @see src/lib/quest-grammar/types.ts — GameMasterFace, EmotionalVector
 * @see src/lib/cyoa-composer/branch-visibility.ts — FACE_MOVE_AFFINITY
 */

import type { GameMasterFace, EmotionalVector, EmotionalChannel } from '@/lib/quest-grammar/types'
import { GAME_MASTER_FACES } from '@/lib/quest-grammar/types'

// ─── Types ─────────────────────────────────────────────────────────────────

/**
 * Minimal NPC shape needed for face resolution.
 * Avoids importing full Prisma type — follows TS boundary validation pattern.
 */
export interface NpcFaceInput {
  /** Stored portraysFace from NpcConstitution */
  portraysFace: string | null
  /** Archetypal role string from NpcConstitution */
  archetypalRole: string
}

/**
 * Scene context for Sage NPC effectiveFace computation.
 * When absent, Sage defaults to null (no effective face).
 */
export interface SageSceneContext {
  /** Current emotional vector from daily check-in or spoke state */
  emotionalVector?: EmotionalVector | null
  /** The GM face active for the current spoke/session */
  spokeFace?: GameMasterFace | null
  /** Faces the player has already explored (for under-explored face recommendation) */
  exploredFaces?: GameMasterFace[]
}

/**
 * Result of face resolution — always returns both stored and effective face.
 */
export interface ResolvedNpcFace {
  /** The stored portraysFace (may be null) */
  portraysFace: GameMasterFace | null
  /** The effective face for routing/filtering. For Sage NPCs, runtime-computed. */
  effectiveFace: GameMasterFace | null
  /** Whether effectiveFace was computed at runtime (true only for Sage NPCs) */
  isRuntimeComputed: boolean
}

// ─── Constants ─────────────────────────────────────────────────────────────

/** The 5 non-Sage faces that Sage can resolve to at runtime. */
const SAGE_RESOLVABLE_FACES: GameMasterFace[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat']

/**
 * Emotional channel → face affinity mapping for Sage resolution.
 * Each emotional channel has a natural affinity with certain faces.
 * This follows the alchemy/wuxing routing patterns.
 */
const CHANNEL_FACE_AFFINITY: Record<EmotionalChannel, GameMasterFace[]> = {
  Fear: ['shaman', 'diplomat'],      // Fear → threshold (Shaman) or relational safety (Diplomat)
  Anger: ['challenger', 'regent'],    // Anger → action (Challenger) or structure (Regent)
  Sadness: ['diplomat', 'shaman'],    // Sadness → care (Diplomat) or belonging (Shaman)
  Joy: ['architect', 'challenger'],   // Joy → strategy (Architect) or action (Challenger)
  Neutrality: ['architect', 'regent'], // Neutrality → structure (Regent) or blueprint (Architect)
}

// ─── Validators ────────────────────────────────────────────────────────────

/**
 * Check if a string is a valid GameMasterFace.
 * Used at TypeScript boundary when reading from DB (JSON config validated at TS boundary, not DB level).
 */
export function isValidGameMasterFace(value: string | null | undefined): value is GameMasterFace {
  if (value == null) return false
  return (GAME_MASTER_FACES as readonly string[]).includes(value)
}

/**
 * Parse portraysFace from DB string to typed GameMasterFace | null.
 * Returns null for invalid values (defensive — DB may contain legacy data).
 */
export function parsePortraysFace(raw: string | null | undefined): GameMasterFace | null {
  if (raw == null) return null
  return isValidGameMasterFace(raw) ? raw : null
}

// ─── Sage Detection ────────────────────────────────────────────────────────

/**
 * Determine if an NPC is a Sage NPC (effectiveFace computed at runtime).
 *
 * A Sage NPC is identified by having portraysFace === 'sage'.
 * This is the ONLY criterion — archetypalRole is not used for face routing.
 */
export function isSageNpc(npc: NpcFaceInput): boolean {
  return parsePortraysFace(npc.portraysFace) === 'sage'
}

// ─── Core Resolver ─────────────────────────────────────────────────────────

/**
 * Resolve the effective face for an NPC.
 *
 * - Non-Sage NPCs: effectiveFace === portraysFace (fixed, stored in DB)
 * - Sage NPCs: effectiveFace is computed at runtime from scene context
 *   - With emotional vector → resolves to the face most aligned with the channel
 *   - With spoke face → mirrors the spoke face (Sage reflects what's needed)
 *   - With explored faces → recommends least-explored face
 *   - No context → returns null (Sage is latent until scene context exists)
 *
 * @param npc — NPC with portraysFace and archetypalRole
 * @param sceneContext — optional scene context (only used for Sage NPCs)
 * @returns ResolvedNpcFace with both stored and effective face
 */
export function resolveEffectiveFace(
  npc: NpcFaceInput,
  sceneContext?: SageSceneContext,
): ResolvedNpcFace {
  const portraysFace = parsePortraysFace(npc.portraysFace)

  // Non-Sage: effectiveFace === portraysFace (immutable)
  if (portraysFace !== 'sage') {
    return {
      portraysFace,
      effectiveFace: portraysFace,
      isRuntimeComputed: false,
    }
  }

  // Sage NPC: compute effectiveFace at runtime
  const effectiveFace = computeSageEffectiveFace(sceneContext)

  return {
    portraysFace: 'sage',
    effectiveFace,
    isRuntimeComputed: true,
  }
}

/**
 * Compute the effective face for a Sage NPC based on scene context.
 *
 * Priority chain:
 *   1. Emotional vector channel affinity (strongest signal — matches daily check-in)
 *   2. Spoke face (mirror the current session's face)
 *   3. Least-explored face (recommend novelty)
 *   4. null (no context available)
 */
function computeSageEffectiveFace(
  context?: SageSceneContext,
): GameMasterFace | null {
  if (!context) return null

  // Priority 1: Emotional vector → channel affinity
  if (context.emotionalVector) {
    const channel = context.emotionalVector.channelFrom
    const affineFaces = CHANNEL_FACE_AFFINITY[channel]
    if (affineFaces && affineFaces.length > 0) {
      // If we have explored faces data, prefer the affine face that's least explored
      if (context.exploredFaces && context.exploredFaces.length > 0) {
        const unexploredAffine = affineFaces.find(
          (f) => !context.exploredFaces!.includes(f),
        )
        if (unexploredAffine) return unexploredAffine
      }
      // Otherwise return the primary affine face
      return affineFaces[0]!
    }
  }

  // Priority 2: Mirror the spoke face (but not 'sage' — would be circular)
  if (context.spokeFace && context.spokeFace !== 'sage') {
    return context.spokeFace
  }

  // Priority 3: Recommend least-explored face
  if (context.exploredFaces && context.exploredFaces.length > 0) {
    const leastExplored = findLeastExploredFace(context.exploredFaces)
    if (leastExplored) return leastExplored
  }

  // Priority 4: No context — Sage is latent
  return null
}

/**
 * Find the face with the fewest explorations from the 5 non-Sage faces.
 * Returns the first face with the minimum count, or null if all are explored equally.
 */
function findLeastExploredFace(
  exploredFaces: GameMasterFace[],
): GameMasterFace | null {
  const counts = new Map<GameMasterFace, number>()
  for (const f of SAGE_RESOLVABLE_FACES) {
    counts.set(f, 0)
  }
  for (const f of exploredFaces) {
    if (f !== 'sage' && counts.has(f)) {
      counts.set(f, (counts.get(f) ?? 0) + 1)
    }
  }

  let minCount = Infinity
  let minFace: GameMasterFace | null = null
  for (const [face, count] of counts) {
    if (count < minCount) {
      minCount = count
      minFace = face
    }
  }

  return minFace
}

// ─── Batch Resolution ──────────────────────────────────────────────────────

/**
 * Resolve effective faces for multiple NPCs at once.
 * Useful for filtering NPC lists by face compatibility (e.g., branch-visibility).
 *
 * @param npcs — array of NPCs with portraysFace
 * @param sceneContext — shared scene context for Sage NPCs
 * @returns Map of NPC index → ResolvedNpcFace
 */
export function resolveEffectiveFaces(
  npcs: NpcFaceInput[],
  sceneContext?: SageSceneContext,
): ResolvedNpcFace[] {
  return npcs.map((npc) => resolveEffectiveFace(npc, sceneContext))
}

/**
 * Filter NPCs by effective face compatibility.
 * Returns NPCs whose effectiveFace matches any of the target faces.
 * NPCs with null effectiveFace are included only if includeUnresolved is true.
 *
 * @param npcs — array of NPCs
 * @param targetFaces — faces to filter by
 * @param sceneContext — scene context for Sage runtime computation
 * @param includeUnresolved — whether to include NPCs with null effectiveFace (default: false)
 */
export function filterNpcsByEffectiveFace<T extends NpcFaceInput>(
  npcs: T[],
  targetFaces: GameMasterFace[],
  sceneContext?: SageSceneContext,
  includeUnresolved = false,
): T[] {
  return npcs.filter((npc) => {
    const resolved = resolveEffectiveFace(npc, sceneContext)
    if (resolved.effectiveFace === null) return includeUnresolved
    return targetFaces.includes(resolved.effectiveFace)
  })
}
