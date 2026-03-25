/**
 * Generate minimal placeholder nation and playbook sprites.
 * Uses base-silhouette.json (from npm run sprites:analyze-base) for alignment.
 * Proves layering works before full art. 64×64 PNG, transparent background.
 * Adds 1px black outline so layers are visually distinct (not flat grey blocks).
 *
 * Run: npm run sprites:nation-placeholders
 * Prereq: npm run sprites:analyze-base (when base changes)
 */

import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'

import { ELEMENT_TOKENS } from '../src/lib/ui/card-tokens'
import { NATION_KEY_TO_ELEMENT } from '../src/lib/ui/nation-element'

const PARTS_DIR = path.join(process.cwd(), 'public', 'sprites', 'parts')
const SILHOUETTE_PATH = path.join(PARTS_DIR, 'base-silhouette.json')
const W = 64
const H = 64

/** Nation body/accent tints align with ARDS `ELEMENT_TOKENS[element].frame` (Register 1 + 4). */
const NATION_KEYS = ['argyra', 'pyrakanth', 'virelune', 'meridia', 'lamenth'] as const
const NATIONS = NATION_KEYS.map(key => ({
    key,
    hex: ELEMENT_TOKENS[NATION_KEY_TO_ELEMENT[key]].frame,
}))

const PLAYBOOKS = [
    { key: 'bold-heart', hex: '#c41e3a' },
    { key: 'devoted-guardian', hex: '#2e5090' },
    { key: 'decisive-storm', hex: '#6b4c9a' },
    { key: 'danger-walker', hex: '#8b4513' },
    { key: 'still-point', hex: '#2f4f4f' },
    { key: 'subtle-influence', hex: '#9370db' },
    { key: 'truth-seer', hex: '#228b22' },
    { key: 'joyful-connector', hex: '#ffa500' },
] as const

interface OverlayRegion {
    x: number
    y: number
    width: number
    height: number
}

interface SilhouetteConfig {
    nationBody: OverlayRegion
    nationAccent: OverlayRegion
    playbookOutfit: OverlayRegion
    playbookAccent: OverlayRegion
}

function loadSilhouetteConfig(): SilhouetteConfig {
    if (!fs.existsSync(SILHOUETTE_PATH)) {
        console.warn(
            '⚠️  base-silhouette.json not found. Run: npm run sprites:analyze-base\n   Using fallback regions (may not align with your base).'
        )
        const body = { x: 17, y: 24, width: 28, height: 33 }
        const accent = { x: 27, y: 32, width: 8, height: 8 }
        return {
            nationBody: body,
            nationAccent: accent,
            playbookOutfit: body,
            playbookAccent: { x: 25, y: 36, width: 12, height: 8 },
        }
    }
    const raw = JSON.parse(fs.readFileSync(SILHOUETTE_PATH, 'utf-8'))
    return {
        nationBody: raw.nationBody,
        nationAccent: raw.nationAccent,
        playbookOutfit: raw.playbookOutfit ?? raw.nationBody,
        playbookAccent: raw.playbookAccent ?? raw.nationAccent,
    }
}

function hexToRgb(hex: string): [number, number, number] {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
    if (!m) throw new Error(`Invalid hex: ${hex}`)
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

function setPixel(data: Buffer, x: number, y: number, r: number, g: number, b: number, a: number) {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = a
}

/** Check if (x,y) is on the 1px outline around the region (immediately outside the fill) */
function isOutlinePixel(x: number, y: number, region: OverlayRegion): boolean {
    const { x: rx, y: ry, width: rw, height: rh } = region
    const inside = x >= rx && x < rx + rw && y >= ry && y < ry + rh
    if (inside) return false
    const inOutlineBounds = x >= rx - 1 && x <= rx + rw && y >= ry - 1 && y <= ry + rh
    return inOutlineBounds
}

/** Fill region with color and add 1px black outline for visual definition */
function createColoredOverlay(hex: string, region: OverlayRegion, fillAlpha: number): PNG {
    const [r, g, b] = hexToRgb(hex)
    const png = new PNG({ width: W, height: H })
    const data = png.data
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 0
        data[i + 1] = 0
        data[i + 2] = 0
        data[i + 3] = 0
    }
    // Fill
    for (let dy = 0; dy < region.height; dy++) {
        for (let dx = 0; dx < region.width; dx++) {
            setPixel(data, region.x + dx, region.y + dy, r, g, b, fillAlpha)
        }
    }
    // 1px black outline
    for (let py = region.y - 1; py <= region.y + region.height; py++) {
        for (let px = region.x - 1; px <= region.x + region.width; px++) {
            if (isOutlinePixel(px, py, region)) {
                setPixel(data, px, py, 0, 0, 0, 255)
            }
        }
    }
    return png
}

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

function main() {
    const config = loadSilhouetteConfig()
    const bodyDir = path.join(PARTS_DIR, 'nation_body')
    const accentDir = path.join(PARTS_DIR, 'nation_accent')
    const outfitDir = path.join(PARTS_DIR, 'archetype_outfit')
    const playbookAccentDir = path.join(PARTS_DIR, 'archetype_accent')
    ensureDir(bodyDir)
    ensureDir(accentDir)
    ensureDir(outfitDir)
    ensureDir(playbookAccentDir)

    for (const { key, hex } of NATIONS) {
        const bodyPng = createColoredOverlay(hex, config.nationBody, 220)
        const accentPng = createColoredOverlay(hex, config.nationAccent, 240)
        fs.writeFileSync(path.join(bodyDir, `${key}.png`), PNG.sync.write(bodyPng))
        fs.writeFileSync(path.join(accentDir, `${key}.png`), PNG.sync.write(accentPng))
        console.log(`✅ ${key}: nation_body, nation_accent`)
    }

    for (const { key, hex } of PLAYBOOKS) {
        const outfitPng = createColoredOverlay(hex, config.playbookOutfit, 200)
        const accentPng = createColoredOverlay(hex, config.playbookAccent, 230)
        fs.writeFileSync(path.join(outfitDir, `${key}.png`), PNG.sync.write(outfitPng))
        fs.writeFileSync(path.join(playbookAccentDir, `${key}.png`), PNG.sync.write(accentPng))
        console.log(`✅ ${key}: archetype_outfit, archetype_accent`)
    }

    console.log('Done. Test stacking at /admin/avatars')
}

main()
