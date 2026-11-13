/**
 * The vibeulon coin's face (spec .specify/specs/ember-to-vibeulon, Phase 3, FR-009 to FR-013).
 *
 * The ring reads the ember's from element, the texture its arrival element, the bezel the player's seal (empty until
 * they have one), and the body the colour and material the player picks once at the first mint. Pure: no database.
 */

export const COIN_ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
export type CoinElement = (typeof COIN_ELEMENTS)[number]

/** Six colours (silk violet is his printed blank) and six materials, all open from the start (FR-013). */
export const COIN_COLORS = ['violet', 'copper', 'jade', 'rose', 'pearl', 'night'] as const
export const COIN_MATS = ['silk', 'matte', 'brass', 'walnut', 'resin', 'porcelain'] as const
export type CoinColor = (typeof COIN_COLORS)[number]
export type CoinMat = (typeof COIN_MATS)[number]

export type CoinStyle = { color: CoinColor; mat: CoinMat }

/** The face written on a coin. `color` and `mat` are null on a bare coin (the first mint, before the coin turn). */
export type CoinFace = {
    v: 1
    ring: CoinElement | null
    tex: CoinElement | null
    seal: string | null
    color: CoinColor | null
    mat: CoinMat | null
}

/** The fifteen moves: [element it starts from, element it arrives at]. Mirrors MOVES in public/between/garden.js. */
export const MOVE_ELEMENTS: Record<string, readonly [CoinElement, CoinElement]> = {
    wood_transcend: ['wood', 'wood'],
    fire_transcend: ['fire', 'fire'],
    earth_transcend: ['earth', 'earth'],
    metal_transcend: ['metal', 'metal'],
    water_transcend: ['water', 'water'],
    wood_fire: ['wood', 'fire'],
    fire_earth: ['fire', 'earth'],
    earth_metal: ['earth', 'metal'],
    metal_water: ['metal', 'water'],
    water_wood: ['water', 'wood'],
    wood_earth: ['wood', 'earth'],
    fire_metal: ['fire', 'metal'],
    earth_water: ['earth', 'water'],
    metal_wood: ['metal', 'wood'],
    water_fire: ['water', 'fire'],
}

export const isCoinColor = (v: unknown): v is CoinColor => (COIN_COLORS as readonly unknown[]).includes(v)
export const isCoinMat = (v: unknown): v is CoinMat => (COIN_MATS as readonly unknown[]).includes(v)

/** A stored coin style, or null when it is missing or not a valid pair. */
export function asCoinStyle(v: unknown): CoinStyle | null {
    if (!v || typeof v !== 'object') return null
    const { color, mat } = v as { color?: unknown; mat?: unknown }
    return isCoinColor(color) && isCoinMat(mat) ? { color, mat } : null
}

/**
 * The face for a new coin. No ember (a BAR made outside the Between) or an unknown move gives ring and tex null, so the
 * coin shows the blank's printed chevrons (FR-009). No style means a bare coin (FR-010); a style is copied (FR-011).
 */
export function coinFace(move: string | null | undefined, seal: string | null | undefined, style: CoinStyle | null | undefined): CoinFace {
    const el = move ? MOVE_ELEMENTS[move] : undefined
    return {
        v: 1,
        ring: el ? el[0] : null,
        tex: el ? el[1] : null,
        seal: seal || null,
        color: style?.color ?? null,
        mat: style?.mat ?? null,
    }
}

/** A face whose colour is set is final: the coin's provenance never changes (FR-010). */
export const faceIsSet = (face: unknown): boolean =>
    !!face && typeof face === 'object' && (face as { color?: unknown }).color != null
