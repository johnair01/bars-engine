#!/usr/bin/env node
/**
 * Per-cell sorceress post-pass for the 3x4 WOKA template (96x256, 32x64 cells):
 *   1. chroma-key the green plate (default #00b140) with edge spill suppression
 *   2. split the canvas into 3x4 cells (rows top->bottom: down,left,right,up)
 *   3. trim each cell to content, nearest-downscale to fit 32x64, feet to bottom
 *   4. assemble the 12 cells into an exact 96x256 sheet with a shared palette
 *
 * Modes:
 *   node scripts/wa/sorceress-key-cells.mjs in.png out.png --key-only
 *       write the keyed raw-size PNG (alignment source for overlays)
 *   node scripts/wa/sorceress-key-cells.mjs in.png out.png
 *       base sheet: full per-cell fit, feet-anchored
 *   node scripts/wa/sorceress-key-cells.mjs in.png out.png --align-to base-keyed-raw.png
 *       overlay sheet: crop each overlay cell with the BASE's content box
 *       (+4px margin) and place exactly where the base content lands, so
 *       overlays stay in register with the base silhouette.
 */
import sharp from 'sharp'

const args = process.argv.slice(2)
const inp = args[0]
const out = args[1]
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const noAnchor = args.includes('--no-anchor')
const keyOnly = args.includes('--key-only')
const COLORS = Number(flag('colors', '16'))
const TOL = Number(flag('tol', '60'))
const MARGIN = Number(flag('margin', '4'))

const COLS = 3, ROWS = 4
const CELL_W = 32, CELL_H = 64
const CW = CELL_W, CH = CELL_H

if (!inp || !out) {
  console.error('usage: sorceress-key-cells.mjs <in.png> <out.png> [--plate 00b140] [--tol 60] [--colors 16] [--key-only] [--align-to base-keyed-raw.png] [--no-anchor]')
  process.exit(2)
}

const PLATE = flag('plate', '00b140')
const pr = parseInt(PLATE.slice(0, 2), 16)
const pg = parseInt(PLATE.slice(2, 4), 16)
const pb = parseInt(PLATE.slice(4, 6), 16)

function keyData(data, W, H, C) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      const dr = data[i] - pr, dg = data[i + 1] - pg, db = data[i + 2] - pb
      const d = Math.sqrt(dr * dr + dg * dg + db * db)
      if (d < TOL) {
        data[i + 3] = 0
      } else if (d < TOL * 2) {
        const spill = 1 - (d - TOL) / TOL
        data[i + 1] = Math.min(data[i + 1], Math.max(data[i], data[i + 2]) + Math.round(spill * 40))
        data[i + 3] = 255
      } else {
        data[i + 3] = data[i + 3] < 128 ? 0 : 255
      }
    }
  }
}

function computeBoxes(data, W, H, C) {
  const boxes = []
  const cellW = Math.floor(W / COLS), cellH = Math.floor(H / ROWS)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let minX = cellW, minY = cellH, maxX = -1, maxY = -1
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const i = ((r * cellH + y) * W + (c * cellW + x)) * C
          if (data[i + 3] > 0) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      if (maxX < 0) { boxes.push({ x: 0, y: 0, w: 0, h: 0 }); continue }
      boxes.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 })
    }
  }
  return boxes
}

async function main() {
  let srcPath = inp
  const alignPath = flag('align-to')
  if (alignPath) {
    const bmeta = await sharp(alignPath).metadata()
    const meta0 = await sharp(srcPath).metadata()
    if (meta0.width !== bmeta.width || meta0.height !== bmeta.height) {
      const resized = '/tmp/sorceress-resized-' + Math.random().toString(36).slice(2) + '.png'
      await sharp(srcPath).resize(bmeta.width, bmeta.height, { kernel: 'nearest' }).png().toFile(resized)
      srcPath = resized
    }
  }
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  keyData(data, W, H, C)

  if (process.env.DEBUG_CELLS) await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toFile('/tmp/dbg-keyed-raw.png')
  if (keyOnly) {
    await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toFile(out)
    console.log(`wrote ${out} (${W}x${H}) keyed only`)
    return
  }

  let baseBoxes = null
  if (alignPath) {
    const b = await sharp(alignPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    if (b.info.width !== W || b.info.height !== H) {
      console.error(`align-to size mismatch: base ${b.info.width}x${b.info.height} vs overlay ${W}x${H}`)
      process.exit(1)
    }
    baseBoxes = computeBoxes(b.data, b.info.width, b.info.height, b.info.channels)
  }

  // Proportional full-cell map: the generator fills each raw cell edge to
  // edge (head near top, feet at bottom), so mapping the whole cell onto
  // 32x64 is exactly the transform every layer shares. Overlays produced by
  // mask-sorceress-overlay.mjs use the same mapping and stay in register.
  if (process.env.DEBUG_CELLS) {
    const cw = Math.floor(W / COLS), ch = Math.floor(H / ROWS)
    for (let idx = 0; idx < COLS * ROWS; idx++) {
      const r = Math.floor(idx / COLS), c = idx % COLS
      let a = 0, n = 0
      for (let y = 0; y < ch; y += 16) for (let x = 0; x < cw; x += 16) { n++; if (data[((r * ch + y) * W + (c * cw + x)) * C + 3] > 0) a++ }
      console.log('rawcheck cell', r, c, 'alpha>0 samples', a, '/', n)
    }
  }
  const areaSample = (cellIdx) => {
    if (process.env.DEBUG_CELLS && cellIdx === 0) console.log('DBG W H C cw ch =', W, H, C, Math.floor(W / COLS), Math.floor(H / ROWS))
    const r = Math.floor(cellIdx / COLS), c = cellIdx % COLS
    const cw = Math.floor(W / COLS), ch = Math.floor(H / ROWS)
    const buf = Buffer.alloc(CW * CH * 4)
    for (let y = 0; y < CH; y++) {
      const y0 = Math.floor(y * ch / CH), y1 = Math.max(y0 + 1, Math.floor((y + 1) * ch / CH))
      for (let x = 0; x < CW; x++) {
        const x0 = Math.floor(x * cw / CW), x1 = Math.max(x0 + 1, Math.floor((x + 1) * cw / CW))
        let ar = 0, ag = 0, ab = 0, aa = 0, n = 0
        for (let yy = y0; yy < y1; yy++) {
          for (let xx = x0; xx < x1; xx++) {
            const p = ((r * ch + yy) * W + (c * cw + xx)) * C
            const a = data[p + 3]
            ar += data[p] * a; ag += data[p + 1] * a; ab += data[p + 2] * a; aa += a; n++
          }
        }
        const q = (y * CW + x) * 4
        if (process.env.DEBUG_CELLS && cellIdx === 3 && y === 40 && (x === 16 || x === 20)) console.log('dbg y40 x', x, 'aa', aa, 'n', n, 'mean', aa / n)
        if (aa > 0) {
          buf[q] = Math.round(ar / aa)
          buf[q + 1] = Math.round(ag / aa)
          buf[q + 2] = Math.round(ab / aa)
          buf[q + 3] = aa / n > 64 ? 255 : 0
        }
      }
    }
    let dbg = 0
    for (let i = 3; i < buf.length; i += 4) if (buf[i] > 0) dbg++
    if (process.env.DEBUG_CELLS) console.log('cell', Math.floor(cellIdx / COLS), cellIdx % COLS, 'opaque', dbg)
    if (process.env.DEBUG_CELLS && cellIdx === 0) globalThis.dbgBuf0 = Buffer.from(buf)
    return buf
  }

  const OUT_W = COLS * CW, OUT_H = ROWS * CH
  const full = Buffer.alloc(OUT_W * OUT_H * 4)
  for (let idx = 0; idx < COLS * ROWS; idx++) {
    const r = Math.floor(idx / COLS), c = idx % COLS
    const cell = areaSample(idx)
    for (let y = 0; y < CH; y++) {
      // each output row interleaves the three columns' cell rows
      cell.copy(full, ((r * CH + y) * OUT_W + c * CW) * 4, y * CW * 4, (y + 1) * CW * 4)
    }
  }
  if (process.env.DEBUG_CELLS && globalThis.dbgBuf0) await sharp(globalThis.dbgBuf0, { raw: { width: CW, height: CH, channels: 4 } }).png().toFile('/tmp/dbg-buf0.png')
  if (process.env.DEBUG_CELLS) await sharp(full, { raw: { width: OUT_W, height: OUT_H, channels: 4 } }).png().toFile('/tmp/dbg-full.png')
  await sharp(full, { raw: { width: OUT_W, height: OUT_H, channels: 4 } })
    .png({ palette: true, colors: COLORS, dither: 0 })
    .toFile(out)
  console.log(`wrote ${out} (${OUT_W}x${OUT_H}), 12 cells area-mapped, palette ${COLORS}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
