/**
 * Face Move Library Accessor — typed access to the 24 face moves.
 *
 * 6 NPCs × 4 WAVE stages = 24 face moves. Each move is a PROMPT the NPC offers
 * the player. The player's response becomes a `player_response` BAR. This is
 * the prototype implementation of the prompt deck pattern.
 *
 * Convergence: when backlog 1.34 PDH (Prompt deck draw + shared hand) ships,
 * each entry here folds into a `BarDeckCard` row with no semantic loss. The
 * fields below (prompt, prompt_templates, response_bar_type) are deliberately
 * aligned with that future schema. Issue #47 (I Ching → Prompt Deck Engine)
 * is the first concrete instance of this pattern.
 *
 * Naming lineage locked 2026-04-10 by 6-face council. See:
 *   - data/face-moves.json (canonical content)
 *   - memory: project_face_moves_prompt_deck_convergence.md
 *   - .specify/specs/prompt-deck-draw-hand/spec.md
 */

import faceMovesJson from '../../../data/face-moves.json'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { WcgsStage } from '@/lib/nation/move-library-accessor'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FaceMoveDefinition {
    canonical_id: string
    short_name: string
    ritual_name: string
    face: GameMasterFace
    npc_id: string
    nation_key: string
    element: string
    wcgs_stage: WcgsStage
    tagline: string
    description: string
    prompt: string
    prompt_templates: string[]
    response_bar_type: string
    trial_slug: string | null
}

interface FaceMovesFile {
    _README?: unknown
    moves: FaceMoveDefinition[]
}

// ─── Data ───────────────────────────────────────────────────────────────────

const FILE = faceMovesJson as FaceMovesFile

export const FACE_MOVES: readonly FaceMoveDefinition[] = FILE.moves

// ─── Lookups ────────────────────────────────────────────────────────────────

const _byId = new Map<string, FaceMoveDefinition>()
for (const m of FACE_MOVES) _byId.set(m.canonical_id, m)

/** Lookup a face move by canonical id. */
export function getFaceMoveById(id: string): FaceMoveDefinition | undefined {
    return _byId.get(id)
}

/** Get all 4 moves for a single face (Wake/Clean/Grow/Show). */
export function getFaceMoveSet(face: GameMasterFace): FaceMoveDefinition[] {
    return FACE_MOVES.filter((m) => m.face === face)
}

/** Get the specific move for a (face, stage) pair. */
export function getFaceMove(
    face: GameMasterFace,
    stage: WcgsStage,
): FaceMoveDefinition | undefined {
    return FACE_MOVES.find((m) => m.face === face && m.wcgs_stage === stage)
}

/** Get all 4 moves offered by an NPC (looked up by npc_id like 'ignis', 'kaelen'). */
export function getMovesByNpcId(npcId: string): FaceMoveDefinition[] {
    return FACE_MOVES.filter((m) => m.npc_id === npcId)
}

/** Pick a random prompt template for a move (for prompt rotation). */
export function pickPromptTemplate(move: FaceMoveDefinition, seed?: number): string {
    const templates = move.prompt_templates.length > 0 ? move.prompt_templates : [move.prompt]
    const idx = typeof seed === 'number' ? seed % templates.length : Math.floor(Math.random() * templates.length)
    return templates[idx]
}
