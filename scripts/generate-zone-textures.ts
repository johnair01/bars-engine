/**
 * ARDS Register 6 — tileable 64×64 zone textures (dark base, subtle variation).
 * Run: npx tsx scripts/generate-zone-textures.ts
 * Output: public/textures/zone-{vault,lobby,quest}.png
 */

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const SIZE = 64
const OUT = path.join(process.cwd(), 'public/textures')

/** Near-black base aligned with SURFACE_TOKENS.bgBase #0a0908 */
const BASE = { r: 10, g: 9, b: 8 }

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return h & 0xffff
}

function setPixel(p: PNG, x: number, y: number, r: number, g: number, b: number, a: number) {
  const i = (SIZE * y + x) << 2
  p.data[i] = r
  p.data[i + 1] = g
  p.data[i + 2] = b
  p.data[i + 3] = a
}

function writePng(name: string, drawPixel: (p: PNG, x: number, y: number) => void) {
  const png = new PNG({ width: SIZE, height: SIZE, colorType: 6 })
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      drawPixel(png, x, y)
    }
  }
  const buf = PNG.sync.write(png)
  const file = path.join(OUT, `${name}.png`)
  fs.writeFileSync(file, buf)
  console.log('Wrote', file)
}

/** Worn paper / parchment grain — low noise */
function drawVault(p: PNG, x: number, y: number) {
  const n = (hash(x, y) % 17) - 8
  const r = Math.min(255, Math.max(0, BASE.r + n))
  const g = Math.min(255, Math.max(0, BASE.g + n))
  const b = Math.min(255, Math.max(0, BASE.b + n))
  setPixel(p, x, y, r, g, b, 255)
}

/** Faint stone grid */
function drawLobby(p: PNG, x: number, y: number) {
  const grid = x % 8 === 0 || y % 8 === 0 ? 6 : 0
  const n = (hash(x + 17, y + 31) % 9) - 4
  const r = Math.min(255, Math.max(0, BASE.r + grid + n))
  const g = Math.min(255, Math.max(0, BASE.g + grid + n))
  const b = Math.min(255, Math.max(0, BASE.b + grid + n))
  setPixel(p, x, y, r, g, b, 255)
}

/** Subtle crosshatch (graph-paper feel) */
function drawQuest(p: PNG, x: number, y: number) {
  const d1 = (x + y) % 8 === 0 ? 5 : 0
  const d2 = (x - y + SIZE * 16) % 8 === 0 ? 4 : 0
  const h = Math.min(255, d1 + d2 + (hash(x, y) % 7))
  const n = (hash(x * 3, y * 5) % 5) - 2
  const r = Math.min(255, Math.max(0, BASE.r + h + n))
  const g = Math.min(255, Math.max(0, BASE.g + h + n))
  const b = Math.min(255, Math.max(0, BASE.b + h + n))
  setPixel(p, x, y, r, g, b, 255)
}

function main() {
  fs.mkdirSync(OUT, { recursive: true })
  writePng('zone-vault', drawVault)
  writePng('zone-lobby', drawLobby)
  writePng('zone-quest', drawQuest)
}

main()
