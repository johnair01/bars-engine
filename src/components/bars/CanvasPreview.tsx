import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

/**
 * Read-only render of a canvas-captured BAR — a "frozen polaroid" of the
 * placed stickers, faithful to the Seed Capture Whiteboard composer.
 *
 * The composer lays stickers out in a logical 392×812 phone-frame space
 * (center-anchored x/y, rot degrees, text size in px). This preview replays
 * that layout: positions as percentages of the frame, sizes in container-query
 * width units (1 logical px = 100/392 cqw) so it scales with the container.
 *
 * Data source: CustomBar.canvasLayout (JSON CanvasItem[]) — NOT `inputs`
 * (which stores only links). See captureBarFromCanvas in src/actions/bars.ts.
 *
 * Design ref: design_handoff_bars_now_loop / "BARS BAR Detail - Runtime".
 */

const LOGICAL_W = 392
const LOGICAL_H = 812

/** Lightweight mirror of CanvasItem — defined locally so we don't import a type
 *  out of the 'use server' bars.ts module (Turbopack server-action barrels). */
type CanvasSticker = {
    id?: string
    type: 'text' | 'photo' | 'voice' | 'link'
    x: number
    y: number
    rot: number
    text?: string
    tint?: string | null
    size?: number
    url?: string
    label?: string
}

function isElementKey(v: string | null | undefined): v is ElementKey {
    return v === 'fire' || v === 'water' || v === 'wood' || v === 'metal' || v === 'earth'
}

/** Logical px → container-query width units (relative to the 392-wide frame). */
function cqw(px: number): string {
    return `${((px / LOGICAL_W) * 100).toFixed(4)}cqw`
}
function pctX(x: number): string {
    return `${((x / LOGICAL_W) * 100).toFixed(3)}%`
}
function pctY(y: number): string {
    return `${((y / LOGICAL_H) * 100).toFixed(3)}%`
}

function parseLayout(raw: string | null | undefined): CanvasSticker[] {
    if (!raw) return []
    try {
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr)) return []
        return arr.filter(
            (i): i is CanvasSticker =>
                i && typeof i === 'object' && typeof i.x === 'number' && typeof i.y === 'number',
        )
    } catch {
        return []
    }
}

function textColor(tint: string | null | undefined): string {
    return isElementKey(tint) ? ELEMENT_TOKENS[tint].gem : '#f4f1ec'
}

export function CanvasPreview({
    canvasLayout,
    element,
    charge,
    title,
}: {
    canvasLayout: string | null | undefined
    element?: string | null
    charge?: number | null
    title?: string | null
}) {
    const items = parseLayout(canvasLayout)
    if (items.length === 0) return null

    const el = isElementKey(element) ? ELEMENT_TOKENS[element] : null

    // Field background — element-driven radial glow (top) + purple glow (bottom)
    // + two faint grids over #0c0d11. Mirrors FieldBackground in the composer.
    const topGlow = el
        ? `radial-gradient(ellipse 130% 66% at 50% 6%, color-mix(in srgb, ${el.frame} 30%, transparent), transparent 56%),`
        : ''
    const fieldBg = [
        topGlow,
        'radial-gradient(ellipse 110% 55% at 50% 122%, rgba(124,58,237,0.12), transparent 54%)',
        'repeating-linear-gradient(115deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 27px)',
        'repeating-linear-gradient(58deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 35px)',
        'linear-gradient(180deg, #14151a, #0b0c0f)',
    ]
        .filter(Boolean)
        .join(', ')

    const chargeLevel = typeof charge === 'number' && charge >= 1 ? Math.min(5, Math.round(charge)) : 0

    return (
        <div
            className="relative w-full overflow-hidden mx-auto"
            style={{
                aspectRatio: `${LOGICAL_W} / ${LOGICAL_H}`,
                maxWidth: 392,
                borderRadius: 30,
                containerType: 'inline-size',
                boxShadow:
                    '0 30px 60px -24px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
            role="img"
            aria-label={title ? `Canvas capture: ${title}` : 'Canvas capture'}
        >
            {/* Field background */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: fieldBg }} />

            {/* Stickers */}
            {items.map((item, i) => {
                const common: React.CSSProperties = {
                    position: 'absolute',
                    left: pctX(item.x),
                    top: pctY(item.y),
                    transform: `translate(-50%, -50%) rotate(${item.rot || 0}deg)`,
                }

                if (item.type === 'text' && item.text) {
                    return (
                        <div
                            key={item.id ?? i}
                            style={{
                                ...common,
                                fontFamily: 'Nunito, sans-serif',
                                fontWeight: 700,
                                fontSize: cqw(item.size ?? 27),
                                lineHeight: 1.25,
                                textAlign: 'center',
                                whiteSpace: 'pre-wrap',
                                maxWidth: cqw(300),
                                padding: `${cqw(4)} ${cqw(8)}`,
                                color: textColor(item.tint),
                                textShadow: '0 2px 16px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,0.6)',
                            }}
                        >
                            {item.text}
                        </div>
                    )
                }

                if (item.type === 'photo') {
                    return (
                        <div
                            key={item.id ?? i}
                            style={{
                                ...common,
                                width: cqw(118),
                                height: cqw(132),
                                borderRadius: cqw(11),
                                overflow: 'hidden',
                                background: 'linear-gradient(155deg,#2b2724,#15110e)',
                                boxShadow:
                                    '0 14px 30px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.06)',
                            }}
                        >
                            {item.text ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={item.text}
                                    alt=""
                                    aria-hidden
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <span style={{ fontSize: cqw(30), color: 'rgba(232,226,218,0.3)' }}>▦</span>
                                </div>
                            )}
                        </div>
                    )
                }

                if (item.type === 'link') {
                    return (
                        <div
                            key={item.id ?? i}
                            style={{
                                ...common,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: cqw(6),
                                maxWidth: cqw(210),
                                padding: `${cqw(9)} ${cqw(12)}`,
                                borderRadius: cqw(10),
                                background: 'rgba(20,21,26,0.86)',
                                boxShadow:
                                    '0 14px 30px -12px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.08)',
                                color: 'rgba(232,226,218,0.85)',
                                fontFamily: 'Nunito, sans-serif',
                                fontSize: cqw(12),
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ opacity: 0.6 }}>↗</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.label || item.url}
                            </span>
                        </div>
                    )
                }

                if (item.type === 'voice') {
                    const water = ELEMENT_TOKENS.water
                    return (
                        <div
                            key={item.id ?? i}
                            style={{
                                ...common,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: cqw(8),
                                padding: `${cqw(9)} ${cqw(13)}`,
                                borderRadius: cqw(11),
                                background: `color-mix(in srgb, ${water.frame} 24%, #15110e)`,
                                boxShadow: `0 14px 30px -12px rgba(0,0,0,0.8), inset 0 0 0 1px color-mix(in srgb, ${water.frame} 50%, transparent)`,
                                color: water.gem,
                                fontFamily: 'Space Mono, monospace',
                                fontSize: cqw(10),
                            }}
                        >
                            <span>▮▮▮</span>
                            <span>voice</span>
                        </div>
                    )
                }

                return null
            })}

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(6,7,10,0.55), transparent 20%, transparent 60%, rgba(6,7,10,0.94))',
                }}
            />

            {/* Caption strip — sigil + name + charge dots */}
            <div
                className="absolute left-0 right-0 bottom-0 flex items-center gap-3 px-5"
                style={{
                    paddingTop: cqw(16),
                    paddingBottom: cqw(18),
                    background: 'linear-gradient(transparent, rgba(6,7,10,0.92))',
                }}
            >
                {el && (
                    <span
                        style={{
                            fontSize: cqw(22),
                            color: el.gem,
                            textShadow: `0 0 8px ${el.glow}`,
                            lineHeight: 1,
                        }}
                    >
                        {el.sigil}
                    </span>
                )}
                {title && (
                    <span
                        className="flex-1 truncate"
                        style={{
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 700,
                            fontSize: cqw(13),
                            color: 'rgba(232,226,218,0.92)',
                        }}
                    >
                        {title}
                    </span>
                )}
                {chargeLevel > 0 && (
                    <span className="flex items-center" style={{ gap: cqw(5) }}>
                        {Array.from({ length: 5 }).map((_, i) => {
                            const filled = i < chargeLevel
                            return (
                                <span
                                    key={i}
                                    style={{
                                        width: cqw(7),
                                        height: cqw(7),
                                        borderRadius: '50%',
                                        background: filled
                                            ? (el?.gem ?? '#7c3aed')
                                            : 'rgba(232,226,218,0.18)',
                                        boxShadow: filled ? `0 0 6px 1px ${el?.glow ?? '#7c3aed'}` : 'none',
                                    }}
                                />
                            )
                        })}
                    </span>
                )}
            </div>
        </div>
    )
}
