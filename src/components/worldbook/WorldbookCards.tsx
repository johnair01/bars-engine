import Link from 'next/link'

export type NationWorldbookCardData = {
    id: string
    name: string
    description: string
    imgUrl?: string | null
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
}

export type ArchetypeWorldbookCardData = {
    id: string
    name: string
    description: string
    content?: string | null
    centralConflict?: string | null
    primaryQuestion?: string | null
    vibe?: string | null
    energy?: string | null
    examples?: string | null
    shadowSignposts?: string | null
    lightSignposts?: string | null
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
}

function parseStringList(raw?: string | null): string[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item): item is string => typeof item === 'string')
    } catch {
        return []
    }
}

function getHandbookPreview(markdown?: string | null, maxLength = 260): string | null {
    if (!markdown) return null
    const plain = markdown
        .replace(/[#>*_`]/g, '')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
    if (!plain) return null
    if (plain.length <= maxLength) return plain
    return `${plain.slice(0, maxLength).trim()}...`
}

function MoveLine({ label, emoji, value }: { label: string, emoji: string, value?: string | null }) {
    if (!value) return null
    const [moveName, ...descParts] = value.split(':')
    return (
        <div className="py-2 border-b border-zinc-800 last:border-0">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <span>{emoji}</span>
                <span className="text-zinc-500">{label}:</span>
                <span className="text-white">{moveName.trim()}</span>
            </div>
            {descParts.length > 0 && (
                <p className="text-xs text-zinc-500 mt-1 ml-6">{descParts.join(':').trim()}</p>
            )}
        </div>
    )
}

export function NationWorldbookCard({
    nation,
    selected,
    expanded,
    onToggle,
    detailHref,
    detailLabel,
    openInNewTab = false,
}: {
    nation: NationWorldbookCardData
    selected: boolean
    expanded: boolean
    onToggle: () => void
    detailHref: string
    detailLabel: string
    openInNewTab?: boolean
}) {
    return (
        <div
            className="rounded-xl border transition-all overflow-hidden"
            style={{
                backgroundColor: selected ? 'rgba(126, 34, 206, 0.15)' : 'rgba(39, 39, 42, 0.3)',
                borderColor: selected ? 'rgb(168, 85, 247)' : 'rgb(39, 39, 42)'
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full text-left p-4"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-bold text-white">{nation.name}</div>
                        <div className="text-sm text-zinc-500">{nation.description}</div>
                    </div>
                    <span className="text-zinc-600 text-xl">
                        {expanded ? '−' : '+'}
                    </span>
                </div>
            </button>
            {expanded && (
                <div className="px-4 pb-4 pt-2 border-t border-zinc-800 bg-zinc-900/50">
                    {nation.imgUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800 bg-black">
                            <img src={nation.imgUrl} alt={nation.name} className="w-full h-36 object-cover" />
                        </div>
                    )}
                    <MoveLine label="Wake Up" emoji="👁" value={nation.wakeUp} />
                    <MoveLine label="Clean Up" emoji="🧹" value={nation.cleanUp} />
                    <MoveLine label="Grow Up" emoji="🌱" value={nation.growUp} />
                    <MoveLine label="Show Up" emoji="🎯" value={nation.showUp} />
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <Link
                            href={detailHref}
                            target={openInNewTab ? '_blank' : undefined}
                            rel={openInNewTab ? 'noopener noreferrer' : undefined}
                            className="block w-full text-center py-2 rounded bg-purple-900/30 text-purple-300 text-sm font-bold border border-purple-500/30 hover:bg-purple-900/50 hover:border-purple-500 transition-all"
                        >
                            {detailLabel}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

export function ArchetypeWorldbookCard({
    archetype,
    selected,
    expanded,
    onToggle,
    detailHref,
    detailLabel,
    openInNewTab = false,
}: {
    archetype: ArchetypeWorldbookCardData
    selected: boolean
    expanded: boolean
    onToggle: () => void
    detailHref: string
    detailLabel: string
    openInNewTab?: boolean
}) {
    const examples = parseStringList(archetype.examples)
    const shadow = parseStringList(archetype.shadowSignposts)
    const light = parseStringList(archetype.lightSignposts)
    const preview = getHandbookPreview(archetype.content)

    return (
        <div
            className="rounded-xl border transition-all overflow-hidden"
            style={{
                backgroundColor: selected ? 'rgba(30, 64, 175, 0.15)' : 'rgba(39, 39, 42, 0.3)',
                borderColor: selected ? 'rgb(59, 130, 246)' : 'rgb(39, 39, 42)'
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full text-left p-4"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-bold text-white text-sm">{archetype.name}</div>
                        <div className="text-xs text-zinc-500">{archetype.description}</div>
                    </div>
                    <span className="text-zinc-600 text-xl">
                        {expanded ? '−' : '+'}
                    </span>
                </div>
            </button>
            {expanded && (
                <div className="px-4 pb-4 pt-2 border-t border-zinc-800 bg-zinc-900/50">
                    {archetype.vibe && (
                        <div className="mb-3 p-3 rounded-lg border border-blue-900/40 bg-blue-950/20">
                            <div className="text-[10px] uppercase tracking-widest text-blue-300 font-bold mb-1">Vibe</div>
                            <p className="text-sm text-blue-100/90 italic">"{archetype.vibe}"</p>
                        </div>
                    )}
                    {archetype.energy && (
                        <div className="mb-3 p-3 rounded-lg border border-indigo-900/40 bg-indigo-950/20">
                            <div className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold mb-1">Energy</div>
                            <p className="text-sm text-indigo-100/90 italic">"{archetype.energy}"</p>
                        </div>
                    )}
                    {archetype.centralConflict && (
                        <div className="mb-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Central Conflict</div>
                            <p className="text-sm text-zinc-300">{archetype.centralConflict}</p>
                        </div>
                    )}
                    {archetype.primaryQuestion && (
                        <div className="mb-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Primary Question</div>
                            <p className="text-sm text-zinc-300">{archetype.primaryQuestion}</p>
                        </div>
                    )}
                    <MoveLine label="Wake Up" emoji="👁" value={archetype.wakeUp} />
                    <MoveLine label="Clean Up" emoji="🧹" value={archetype.cleanUp} />
                    <MoveLine label="Grow Up" emoji="🌱" value={archetype.growUp} />
                    <MoveLine label="Show Up" emoji="🎯" value={archetype.showUp} />
                    {preview && (
                        <div className="mt-3 p-3 rounded-lg border border-cyan-900/40 bg-cyan-950/20">
                            <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold mb-1">Worldbook Excerpt</div>
                            <p className="text-xs text-cyan-100/90 leading-relaxed">{preview}</p>
                        </div>
                    )}
                    {examples.length > 0 && (
                        <div className="mt-3">
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Examples</div>
                            <div className="flex flex-wrap gap-2">
                                {examples.slice(0, 4).map((example, idx) => (
                                    <span key={`${archetype.id}-ex-${idx}`} className="px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                        {example}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {(shadow.length > 0 || light.length > 0) && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {shadow.length > 0 && (
                                <div className="p-2 rounded border border-orange-900/40 bg-orange-950/20">
                                    <div className="text-[10px] uppercase tracking-widest text-orange-300 font-bold mb-1">Shadow Signs</div>
                                    <ul className="text-[11px] text-orange-100/90 list-disc pl-4 space-y-1">
                                        {shadow.slice(0, 3).map((item, idx) => <li key={`${archetype.id}-sh-${idx}`}>{item}</li>)}
                                    </ul>
                                </div>
                            )}
                            {light.length > 0 && (
                                <div className="p-2 rounded border border-green-900/40 bg-green-950/20">
                                    <div className="text-[10px] uppercase tracking-widest text-green-300 font-bold mb-1">Light Signs</div>
                                    <ul className="text-[11px] text-green-100/90 list-disc pl-4 space-y-1">
                                        {light.slice(0, 3).map((item, idx) => <li key={`${archetype.id}-li-${idx}`}>{item}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <Link
                            href={detailHref}
                            target={openInNewTab ? '_blank' : undefined}
                            rel={openInNewTab ? 'noopener noreferrer' : undefined}
                            className="block w-full text-center py-2 rounded bg-blue-900/30 text-blue-300 text-sm font-bold border border-blue-500/30 hover:bg-blue-900/50 hover:border-blue-500 transition-all"
                        >
                            {detailLabel}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
