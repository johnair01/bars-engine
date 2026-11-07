// The qi glow below the navel, by layer. Mirrors public/between/cult/glow.js (the page loads that file; this one is
// for TypeScript callers). glow.test.ts fails if they drift.
export const LAYERS = 9

export function glowForLayer(layer: number): number {
  const n = Math.min(LAYERS, Math.max(1, Math.round(Number(layer) || 1)))
  return 0.2 + 0.8 * Math.pow((n - 1) / (LAYERS - 1), 0.85)
}

export function glowChange(prev: number | null, next: number): { brightness: number; pulse: boolean } {
  return { brightness: glowForLayer(next), pulse: prev != null && Math.round(next) > Math.round(prev) }
}
