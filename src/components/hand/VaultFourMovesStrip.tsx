import Link from 'next/link'

export type VaultMoveEntry = {
    /** Short verb phrase shown as the action label. */
    label: string
    /** Optional sub-copy describing what happens. */
    note?: string
    /** Navigation href (internal or external). */
    href: string
}

export type VaultRoomMovesConfig = {
    wakeUp: VaultMoveEntry
    cleanUp: VaultMoveEntry
    growUp: VaultMoveEntry
    showUp: VaultMoveEntry
}

const MOVES: {
    key: keyof VaultRoomMovesConfig
    name: string
    meaning: string
    color: {
        border: string
        label: string
        action: string
        badge: string
    }
}[] = [
    {
        key: 'wakeUp',
        name: 'Wake Up',
        meaning: "See what's here",
        color: {
            border: 'border-emerald-900/50',
            label: 'text-emerald-500',
            action: 'text-emerald-400 hover:text-emerald-300',
            badge: 'bg-emerald-950/50 text-emerald-500',
        },
    },
    {
        key: 'cleanUp',
        name: 'Clean Up',
        meaning: 'Unblock, clear, metabolize',
        color: {
            border: 'border-sky-900/50',
            label: 'text-sky-500',
            action: 'text-sky-400 hover:text-sky-300',
            badge: 'bg-sky-950/50 text-sky-500',
        },
    },
    {
        key: 'growUp',
        name: 'Grow Up',
        meaning: 'Deepen or level up',
        color: {
            border: 'border-violet-900/50',
            label: 'text-violet-500',
            action: 'text-violet-400 hover:text-violet-300',
            badge: 'bg-violet-950/50 text-violet-500',
        },
    },
    {
        key: 'showUp',
        name: 'Show Up',
        meaning: 'Complete, ship, send',
        color: {
            border: 'border-amber-900/50',
            label: 'text-amber-500',
            action: 'text-amber-400 hover:text-amber-300',
            badge: 'bg-amber-950/50 text-amber-500',
        },
    },
]

/** Four Moves strip for Vault room pages (VPE-E2). */
export function VaultFourMovesStrip({ moves }: { moves: VaultRoomMovesConfig }) {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Four Moves</p>
                <Link href="/hand/moves" className="text-[10px] text-zinc-600 hover:text-zinc-400">
                    Reference →
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOVES.map(({ key, name, meaning, color }) => {
                    const entry = moves[key]
                    return (
                        <div
                            key={key}
                            className={`rounded-lg border ${color.border} bg-zinc-900/40 px-3 py-2.5 space-y-1`}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded ${color.badge}`}
                                >
                                    {name}
                                </span>
                                <span className="text-[10px] text-zinc-600">{meaning}</span>
                            </div>
                            <Link href={entry.href} className={`text-sm font-medium block ${color.action}`}>
                                {entry.label}
                            </Link>
                            {entry.note && <p className="text-[11px] text-zinc-600 leading-snug">{entry.note}</p>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
