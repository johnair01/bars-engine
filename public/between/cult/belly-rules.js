// The belly glow's rules (cultivated character T008, FR-010), kept free of three.js so a test can hold them to
// src/lib/cultivation/sheet.ts. The passport keeps only the sheet's count (sheet.gathered, his A on ccb3-sheet-qi) and no
// breakthrough yet, so the glow reads the lower floor: nine layers at 30 qi each, the ninth held at the gate.
export const LAYER_COST = 30;
export const LAYERS_PER_FLOOR = 9;

/** Layers reached on the lower floor from the sheet's count (sheet.ts layers() with no breakthrough). */
export function layersFrom(gathered) {
  const g = Math.max(0, Math.floor(Number(gathered) || 0));
  return Math.min(LAYERS_PER_FLOOR, Math.floor(g / LAYER_COST));
}

/** How bright the glow is, 0..1. Before the first layer it is a faint ember so the belly's store reads as there. */
export function glowStrength(layers) {
  const n = Math.max(0, Math.min(LAYERS_PER_FLOOR, layers | 0));
  return 0.12 + 0.88 * Math.sqrt(n / LAYERS_PER_FLOOR);
}

/** True when the layers rose since the figure last sat here, so the glow pulses once. `seen` is null on a first visit. */
export function shouldPulse(seen, layers) {
  return seen !== null && seen !== undefined && layers > seen;
}
