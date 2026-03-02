/**
 * Analyze base sprite to infer overlay regions for nation/archetype layers.
 * Outputs a config that generate-nation-placeholders and contributors can use.
 *
 * Run: npm run sprites:analyze-base
 * Output: public/sprites/parts/base-silhouette.json
 */

import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs'

const BASE_PATH = path.join(process.cwd(), 'public', 'sprites', 'parts', 'base', 'default.png')
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'sprites', 'parts', 'base-silhouette.json')

const W = 64
const H = 64

interface OverlayRegion {
    x: number
    y: number
    width: number
    height: number
    description: string
}

interface SilhouetteConfig {
    basePath: string
    analyzedAt: string
    dimensions: { width: number; height: number }
    /** Bounding box of all non-transparent pixels */
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
    /** Suggested overlay regions for nation_body (torso/vest area) */
    nationBody: OverlayRegion
    /** Suggested overlay region for nation_accent (badge/emblem) */
    nationAccent: OverlayRegion
    /** Suggested overlay region for playbook_outfit */
    playbookOutfit: OverlayRegion
    /** Suggested overlay region for playbook_accent */
    playbookAccent: OverlayRegion
}

function main() {
    if (!fs.existsSync(BASE_PATH)) {
        console.error(`Base not found: ${BASE_PATH}`)
        process.exit(1)
    }

    const png = PNG.sync.read(fs.readFileSync(BASE_PATH))
    const data = png.data

    let minX = W
    let minY = H
    let maxX = 0
    let maxY = 0

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4
            const a = data[i + 3]
            if (a > 10) {
                minX = Math.min(minX, x)
                minY = Math.min(minY, y)
                maxX = Math.max(maxX, x)
                maxY = Math.max(maxY, y)
            }
        }
    }

    const centerX = Math.round((minX + maxX) / 2)
    const torsoHeight = maxY - minY
    const headHeight = Math.round(torsoHeight * 0.35) // approximate head proportion
    const torsoTop = minY + headHeight
    const torsoBottom = maxY

    // nation_body: torso/vest area (below head, above legs)
    const bodyMargin = 2
    const nationBody: OverlayRegion = {
        x: Math.max(0, minX - bodyMargin),
        y: torsoTop,
        width: Math.min(W, maxX - minX + bodyMargin * 2),
        height: Math.min(H - torsoTop, torsoBottom - torsoTop + bodyMargin),
        description: 'Torso/vest overlay; transparent where face/neck show through',
    }

    // nation_accent: centered badge (belt or chest)
    const badgeSize = 8
    const accentY = Math.round(torsoTop + (torsoBottom - torsoTop) * 0.4) // ~40% down torso
    const nationAccent: OverlayRegion = {
        x: centerX - badgeSize / 2,
        y: accentY - badgeSize / 2,
        width: badgeSize,
        height: badgeSize,
        description: 'Small badge/emblem centered on torso',
    }

    // playbook_outfit: same as nation_body for now
    const playbookOutfit: OverlayRegion = {
        ...nationBody,
        description: 'Archetype clothing overlay',
    }

    // playbook_accent: smaller, slightly lower
    const playbookAccent: OverlayRegion = {
        x: centerX - 6,
        y: accentY,
        width: 12,
        height: 8,
        description: 'Archetype flourish (badge, motif)',
    }

    const config: SilhouetteConfig = {
        basePath: 'base/default.png',
        analyzedAt: new Date().toISOString(),
        dimensions: { width: W, height: H },
        bounds: { minX, minY, maxX, maxY },
        nationBody,
        nationAccent,
        playbookOutfit,
        playbookAccent,
    }

    const outDir = path.dirname(OUTPUT_PATH)
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(config, null, 2))
    console.log(`✅ Analyzed base silhouette → ${OUTPUT_PATH}`)
    console.log(`   Bounds: x=${minX}-${maxX}, y=${minY}-${maxY}`)
    console.log(`   nation_body: ${nationBody.x},${nationBody.y} ${nationBody.width}×${nationBody.height}`)
    console.log(`   nation_accent: ${nationAccent.x},${nationAccent.y} ${nationAccent.width}×${nationAccent.height}`)
    console.log('   Run npm run sprites:nation-placeholders to regenerate overlays.')
}

main()
