// The qi glow below the navel, by layer (cultivated character, first slice, 2026-11-07). Pure: layer 1..9 in, a
// brightness 0..1 out, and a pulse flag when a layer opens. No number is drawn on the player; the sitter feeds this
// to the glow's sprites and light. src/lib/cultivation/glow.ts holds the same function for TypeScript callers, and
// its test fails if the two drift apart.
export const LAYERS = 9;
export function glowForLayer(layer) {
  const n = Math.min(LAYERS, Math.max(1, Math.round(Number(layer) || 1)));
  return 0.2 + 0.8 * Math.pow((n - 1) / (LAYERS - 1), 0.85);
}
// prev: the layer the player was on (or null on the first draw); next: the layer now. pulse is true when a layer opens.
export function glowChange(prev, next) {
  const b = glowForLayer(next);
  return { brightness: b, pulse: prev != null && Math.round(next) > Math.round(prev) };
}
