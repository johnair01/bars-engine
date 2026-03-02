/**
 * Derive base layer sprites (default, male, female, neutral) from canonical base.
 * Uses palette swap so all variants share identical silhouette—no deviation for overlay alignment.
 *
 * Run: npm run sprites:derive-base
 * Requires: base/canonical.png with index colors (see CANONICAL_BASE_SPRITE.md)
 */

import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'

const PARTS_DIR = path.join(process.cwd(), 'public', 'sprites', 'parts', 'base')
const CANONICAL_PATH = path.join(PARTS_DIR, 'canonical.png')

// Index colors in canonical (must match exactly or use hexToRgb)
function hexToRgb(hex: string): [number, number, number] {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!m) throw new Error(`Invalid hex: ${hex}`)
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

const PALETTES = {
    canonical: {
        skin_light: '#FF0001',
        skin_mid: '#FF0002',
        skin_dark: '#FF0003',
        hair_dark: '#FF0004',
        hair_mid: '#FF0005',
        outline: '#000000',
        eye_white: '#FFFFFF',
    },
    default: {
        skin_light: '#f4d4b8',
        skin_mid: '#e8b88c',
        skin_dark: '#c98b5c',
        hair_dark: '#2d2d2d',
        hair_mid: '#4a4a4a',
        outline: '#1a1a1a',
        eye_white: '#ffffff',
    },
    male: {
        skin_light: '#e8c4a0',
        skin_mid: '#d4a574',
        skin_dark: '#b87850',
        hair_dark: '#2d2d2d',
        hair_mid: '#4a4a4a',
        outline: '#1a1a1a',
        eye_white: '#ffffff',
    },
    female: {
        skin_light: '#f5dcc8',
        skin_mid: '#e8c4a8',
        skin_dark: '#c99a70',
        hair_dark: '#2d2d2d',
        hair_mid: '#4a4a4a',
        outline: '#1a1a1a',
        eye_white: '#ffffff',
    },
    neutral: {
        skin_light: '#f0d0b0',
        skin_mid: '#e0b890',
        skin_dark: '#c09060',
        hair_dark: '#2d2d2d',
        hair_mid: '#4a4a4a',
        outline: '#1a1a1a',
        eye_white: '#ffffff',
    },
} as const

function pixelMatches(
    r: number,
    g: number,
    b: number,
    target: [number, number, number],
    fuzz = 2
): boolean {
    return (
        Math.abs(r - target[0]) <= fuzz &&
        Math.abs(g - target[1]) <= fuzz &&
        Math.abs(b - target[2]) <= fuzz
    )
}

function applyPalette(
    data: Buffer,
    fromPalette: Record<string, string>,
    toPalette: Record<string, string>,
    fuzz = 2
): void {
    const keys = Object.keys(fromPalette) as (keyof typeof fromPalette)[]
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        if (a === 0) continue
        for (const k of keys) {
            const fromRgb = hexToRgb(fromPalette[k]) as [number, number, number]
            if (pixelMatches(r, g, b, fromRgb, fuzz)) {
                const toRgb = hexToRgb(toPalette[k])
                data[i] = toRgb[0]
                data[i + 1] = toRgb[1]
                data[i + 2] = toRgb[2]
                break
            }
        }
    }
}

/** Create canonical.png from default.png by replacing default palette with index colors. */
function initCanonicalFromDefault() {
    const defaultPath = path.join(PARTS_DIR, 'default.png')
    if (!fs.existsSync(defaultPath)) {
        console.log('ℹ No default.png found. Create default.png first, then run with --init-from-default')
        return false
    }
    const img = PNG.sync.read(fs.readFileSync(defaultPath))
    const data = Buffer.from(img.data)
    applyPalette(data, PALETTES.default, PALETTES.canonical, 15)
    const out = new PNG({ width: img.width, height: img.height })
    data.copy(out.data)
    fs.writeFileSync(CANONICAL_PATH, PNG.sync.write(out))
    console.log('✅ Created canonical.png from default.png (palette → index colors)')
    return true
}

async function main() {
    const initFromDefault = process.argv.includes('--init-from-default')
    if (initFromDefault) {
        initCanonicalFromDefault()
        if (!fs.existsSync(CANONICAL_PATH)) return
    }

    if (!fs.existsSync(CANONICAL_PATH)) {
        console.log('ℹ No base/canonical.png found. Skipping derive.')
        console.log('  Options: (1) Create canonical.png with index colors, or')
        console.log('           (2) Run: npm run sprites:derive-base -- --init-from-default')
        return
    }

    const canonical = PNG.sync.read(fs.readFileSync(CANONICAL_PATH))
    const variants = ['default', 'male', 'female', 'neutral'] as const

    for (const variant of variants) {
        const data = Buffer.from(canonical.data)
        applyPalette(data, PALETTES.canonical, PALETTES[variant])
        const out = new PNG({ width: canonical.width, height: canonical.height })
        data.copy(out.data)
        const outPath = path.join(PARTS_DIR, `${variant}.png`)
        fs.writeFileSync(outPath, PNG.sync.write(out))
        console.log(`✅ Wrote ${variant}.png`)
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
