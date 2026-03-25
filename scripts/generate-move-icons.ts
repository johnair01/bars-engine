/**
 * Generates monochrome 24×24 move icons for ARDS Register 5 (Frame/Chrome).
 * Run: npx tsx scripts/generate-move-icons.ts
 * Output: public/icons/moves/{wake-up,clean-up,grow-up,show-up}.png
 */

import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const SIZE = 24
const OUT = path.join(process.cwd(), 'public/icons/moves')

function setPixel(p: PNG, x: number, y: number, g: number, a: number) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const i = (SIZE * y + x) << 2
  p.data[i] = g
  p.data[i + 1] = g
  p.data[i + 2] = g
  p.data[i + 3] = a
}

function fillRect(p: PNG, x0: number, y0: number, w: number, h: number, g: number, a: number) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) setPixel(p, x, y, g, a)
  }
}

function writePng(name: string, draw: (p: PNG) => void) {
  const png = new PNG({ width: SIZE, height: SIZE })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 0
    png.data[i + 1] = 0
    png.data[i + 2] = 0
    png.data[i + 3] = 0
  }
  draw(png)
  const buf = PNG.sync.write(png)
  const file = path.join(OUT, `${name}.png`)
  fs.writeFileSync(file, buf)
  console.log('Wrote', file)
}

// Wake Up — upward chevron (↑)
function drawWake(p: PNG) {
  const g = 220
  const a = 255
  for (let row = 0; row < 8; row++) {
    const w = 3 + row * 2
    const x0 = Math.floor((SIZE - w) / 2)
    const y = 6 + row
    fillRect(p, x0, y, w, 1, g, a)
  }
}

// Clean Up — downward chevron (↓)
function drawClean(p: PNG) {
  const g = 220
  const a = 255
  for (let row = 0; row < 8; row++) {
    const w = 17 - row * 2
    const x0 = Math.floor((SIZE - w) / 2)
    const y = 6 + row
    fillRect(p, x0, y, w, 1, g, a)
  }
}

// Grow Up — rightward arrow (→)
function drawGrow(p: PNG) {
  const g = 220
  const a = 255
  fillRect(p, 4, 10, 14, 4, g, a)
  for (let i = 0; i < 6; i++) {
    fillRect(p, 14 + i, 8 + i, 3, 3, g, a)
    fillRect(p, 14 + i, 13 - i, 3, 3, g, a)
  }
}

// Show Up — radiating corners (◇ burst)
function drawShow(p: PNG) {
  const g = 220
  const a = 255
  const cx = 12
  const cy = 12
  for (let d = 0; d < 8; d++) {
    setPixel(p, cx, cy - d, g, a)
    setPixel(p, cx, cy + d, g, a)
    setPixel(p, cx - d, cy, g, a)
    setPixel(p, cx + d, cy, g, a)
    setPixel(p, cx - d, cy - d, g, a)
    setPixel(p, cx + d, cy - d, g, a)
    setPixel(p, cx - d, cy + d, g, a)
    setPixel(p, cx + d, cy + d, g, a)
  }
  fillRect(p, 10, 10, 4, 4, g, a)
}

function main() {
  fs.mkdirSync(OUT, { recursive: true })
  writePng('wake-up', drawWake)
  writePng('clean-up', drawClean)
  writePng('grow-up', drawGrow)
  writePng('show-up', drawShow)
}

main()
