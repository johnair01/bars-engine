import Link from 'next/link'

const ROOMS: { href: string; label: string; color: string }[] = [
    { href: '/hand/charges', label: 'Charges', color: 'text-rose-400 border-rose-800/50 bg-rose-950/20 hover:border-rose-700/60' },
    { href: '/hand/quests', label: 'Quests', color: 'text-amber-400 border-amber-800/50 bg-amber-950/20 hover:border-amber-700/60' },
    { href: '/hand/drafts', label: 'Drafts', color: 'text-purple-400 border-purple-800/50 bg-purple-950/20 hover:border-purple-700/60' },
    { href: '/hand/invitations', label: 'Invitations', color: 'text-emerald-400 border-emerald-800/50 bg-emerald-950/20 hover:border-emerald-700/60' },
]

/**
 * Deep links into Vault rooms — lobby only (spec: peek → enter room).
 */
export function VaultNestedRoomsNav() {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Rooms</p>
            <p className="text-xs text-zinc-500">Open a room to work with a full list — the lobby stays shallow.</p>
            <div className="flex flex-wrap gap-2">
                {ROOMS.map((room) => (
                    <Link
                        key={room.href}
                        href={room.href}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm transition-colors ${room.color}`}
                    >
                        {room.label} →
                    </Link>
                ))}
            </div>
        </div>
    )
}
