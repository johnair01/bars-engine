/**
 * Generate default walkable sprite (8 frames: N/S/E/W idle+walk).
 * Run: npx tsx scripts/generate-walkable-default.ts
 */

import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'

const WALKABLE_DIR = path.join(process.cwd(), 'public', 'sprites', 'walkable')
const FRAME_W = 64
const FRAME_H = 64
const FRAMES = 8
const OUT_W = FRAME_W * FRAMES
const OUT_H = FRAME_H

function setPixel(data: Buffer, x: number, y: number, r: number, g: number, b: number, a: number) {
  if (x < 0 || x >= OUT_W || y < 0 || y >= OUT_H) return
  const i = (y * OUT_W + x) * 4
  data[i] = r
  data[i + 1] = g
  data[i + 2] = b
  data[i + 3] = a
}

function drawCircle(data: Buffer, cx: number, cy: number, r: number, hex: string, alpha: number) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return
  const [r0, g0, b0] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        setPixel(data, cx + dx, cy + dy, r0, g0, b0, alpha)
      }
    }
  }
}

function main() {
  fs.mkdirSync(WALKABLE_DIR, { recursive: true })
  const png = new PNG({ width: OUT_W, height: OUT_H })
  const data = png.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 0
    data[i + 1] = 0
    data[i + 2] = 0
    data[i + 3] = 0
  }

  const cx = FRAME_W / 2
  const cy = FRAME_H / 2
  const bodyR = 10
  const headR = 6

  for (let f = 0; f < FRAMES; f++) {
    const offsetX = f * FRAME_W
    drawCircle(data, offsetX + cx, cy + 8, bodyR, '#6366f1', 255)
    drawCircle(data, offsetX + cx, cy - 8, headR, '#fbbf24', 255)
  }

  const outPath = path.join(WALKABLE_DIR, 'default.png')
  fs.writeFileSync(outPath, PNG.sync.write(png))
  console.log('✅ Created', outPath)
}

main()
