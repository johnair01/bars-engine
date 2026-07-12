/**
 * Deterministic 32-bit FNV-1a hash → unsigned int.
 *
 * Mirrors the scatter primitive in `src/lib/spatial-world/intent-agents.ts`
 * (`fnv32(id) % walkable.length`). Used to place fields/seeds at a cell that is a
 * pure function of the entity's own id — so layout is stable and append-only
 * (adding a new entity never moves existing ones) without hand-authoring maps.
 *
 * No RNG, no Date — deterministic across server and client, which the whole
 * "farm = pure projection" model depends on.
 */
export function fnv32(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
