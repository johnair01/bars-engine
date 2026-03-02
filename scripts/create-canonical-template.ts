/**
 * Create a minimal canonical base template with index colors.
 * Artists use this as the starting point—edit in place, keep index colors.
 *
 * Run: npm run sprites:create-canonical-template
 */

import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'

const PARTS_DIR = path.join(process.cwd(), 'public', 'sprites', 'parts', 'base')
const OUT_PATH = path.join(PARTS_DIR, 'canonical.png')

function hexToRgba(hex: string): [number, number, number, number] {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!m) throw new Error(`Invalid hex: ${hex}`)
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16), 255]
}

const INDEX = {
    skin_light: hexToRgba('#FF0001'),
    skin_mid: hexToRgba('#FF0002'),
    skin_dark: hexToRgba('#FF0003'),
    hair_dark: hexToRgba('#FF0004'),
    hair_mid: hexToRgba('#FF0005'),
    outline: hexToRgba('#000000'),
    eye_white: hexToRgba('#FFFFFF'),
}

function setPixel(
    data: Buffer,
    w: number,
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
    a: number
) {
    const i = (w * y + x) * 4
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = a
}

function circle(data: Buffer, w: number, cx: number, cy: number, r: number, color: number[]) {
    for (let y = 0; y < w; y++) {
        for (let x = 0; x < w; x++) {
            const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if (d <= r) setPixel(data, w, x, y, color[0], color[1], color[2], color[3])
        }
    }
}

function outlineCircle(data: Buffer, w: number, cx: number, cy: number, r: number, color: number[]) {
    for (let y = 0; y < w; y++) {
        for (let x = 0; x < w; x++) {
            const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            if (d >= r - 1 && d <= r + 1)
                setPixel(data, w, x, y, color[0], color[1], color[2], color[3])
        }
    }
}

async function main() {
    const size = 64
    const png = new PNG({ width: size, height: size })
    const data = png.data

    // Transparent
    data.fill(0)

    const cx = 32
    const cy = 28
    const headR = 14

    // Head fill (skin)
    circle(data, size, cx, cy, headR - 1, INDEX.skin_light)
    // Head outline
    outlineCircle(data, size, cx, cy, headR, INDEX.outline)

    // Simple hair (top half of head)
    for (let y = Math.max(0, cy - headR); y < cy - 2; y++) {
        for (let x = cx - headR + 2; x < cx + headR - 2; x++) {
            if (x >= 0 && x < size && y >= 0 && y < size) {
                const i = (size * y + x) * 4
                if (data[i + 3] > 0) {
                    setPixel(data, size, x, y, INDEX.hair_dark[0], INDEX.hair_dark[1], INDEX.hair_dark[2], INDEX.hair_dark[3])
                }
            }
        }
    }

    // Eyes (simple dots)
    setPixel(data, size, cx - 4, cy - 2, INDEX.eye_white[0], INDEX.eye_white[1], INDEX.eye_white[2], INDEX.eye_white[3])
    setPixel(data, size, cx + 4, cy - 2, INDEX.eye_white[0], INDEX.eye_white[1], INDEX.eye_white[2], INDEX.eye_white[3])
    setPixel(data, size, cx - 4, cy - 2, INDEX.outline[0], INDEX.outline[1], INDEX.outline[2], INDEX.outline[3])
    setPixel(data, size, cx + 4, cy - 2, INDEX.outline[0], INDEX.outline[1], INDEX.outline[2], INDEX.outline[3])

    // Shoulders (simple trapezoid)
    for (let y = cy + headR - 2; y < size; y++) {
        const w = Math.max(4, 20 - (y - cy - headR) * 0.5)
        for (let x = cx - w; x <= cx + w; x++) {
            if (x >= 0 && x < size) {
                setPixel(data, size, x, y, INDEX.skin_mid[0], INDEX.skin_mid[1], INDEX.skin_mid[2], INDEX.skin_mid[3])
            }
        }
    }

    fs.mkdirSync(PARTS_DIR, { recursive: true })
    fs.writeFileSync(OUT_PATH, PNG.sync.write(png))
    console.log(`✅ Created ${OUT_PATH}`)
    console.log('   Edit in pixel editor; keep index colors (#FF0001–#FF0005). Run npm run sprites:derive-base to generate variants.')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
