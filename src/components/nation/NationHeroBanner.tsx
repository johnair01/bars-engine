import { lookupCardArt, QUARANTINED_CARD_KEYS } from '@/lib/ui/card-art-registry'
import { elementCssVars, type ElementKey, ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

export function NationHeroBanner({
    nation,
}: {
    nation: { id: string, name: string, element?: string | null }
}) {
    const resolvedElement = (nation.element as ElementKey) || 'earth'
    const artEntry = lookupCardArt('bold-heart', resolvedElement)
    const isQuarantined = artEntry ? QUARANTINED_CARD_KEYS.has(artEntry.key) : false
    const vars = elementCssVars(resolvedElement)
    const tokens = ELEMENT_TOKENS[resolvedElement]

    return (
        <div
            className="w-full h-64 md:h-80 relative flex items-end pb-8 border-b"
            style={{
                ...vars,
                borderColor: 'var(--element-frame)',
                backgroundColor: tokens.gradFrom
            } as any}
        >
            <div className={`absolute inset-0 bg-[var(--element-frame)] opacity-20`} />

            {isQuarantined && <div className="absolute inset-0 skeleton-shimmer bg-black/40" />}
            {artEntry && !isQuarantined && (
                <img
                    src={artEntry.publicPath}
                    alt={nation.name}
                    className="absolute inset-0 w-full h-full object-cover object-[center_30%] mix-blend-luminosity opacity-30"
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px shadow-[0_0_20px_var(--element-glow)] opacity-50 bg-[var(--element-glow)]" />

            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-end gap-6 pt-16">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl md:text-5xl font-black shadow-[0_0_15px_var(--element-glow)] bg-black/50 backdrop-blur-md"
                    style={{ borderColor: 'var(--element-frame)', color: 'var(--element-glow)' }}
                >
                    {tokens.sigil}
                </div>

                <div className="flex-1 pb-2">
                    <div className="text-[10px] md:text-xs uppercase font-mono tracking-widest mb-1 drop-shadow-md" style={{ color: 'var(--element-glow)' }}>
                        Nation History
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
                        {nation.name}
                    </h1>
                </div>
            </div>
        </div>
    )
}
