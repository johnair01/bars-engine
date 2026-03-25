import Link from 'next/link'

type VaultMoveDashboardProps = {
    chargeCount: number
    unplacedQuestCount: number
    draftCount: number
    whoContactCount: number
    invitationCount: number
    staleItems: number
}

type RoomCard = {
    move: string
    room: string
    href: string
    count: number | null
    verb: string
    border: string
    label: string
    note: string
}

const ROOMS: RoomCard[] = [
    {
        move: 'Wake Up',
        room: 'Charges',
        href: '/hand/charges',
        count: null,
        verb: 'See what\'s alive',
        border: 'border-emerald-900/50',
        label: 'text-emerald-400',
        note: 'text-emerald-500',
    },
    {
        move: 'Clean Up',
        room: 'Compost',
        href: '/hand/compost',
        count: null,
        verb: 'Release & metabolize',
        border: 'border-sky-900/50',
        label: 'text-sky-400',
        note: 'text-sky-500',
    },
    {
        move: 'Grow Up',
        room: 'Drafts',
        href: '/hand/drafts',
        count: null,
        verb: 'Shape your work',
        border: 'border-violet-900/50',
        label: 'text-violet-400',
        note: 'text-violet-500',
    },
    {
        move: 'Show Up',
        room: 'Quests & Invitations',
        href: '/hand/quests',
        count: null,
        verb: 'Place, deliver, act',
        border: 'border-amber-900/50',
        label: 'text-amber-400',
        note: 'text-amber-500',
    },
]

/**
 * Four-move room nav for the Vault lobby — replaces inline collapsible previews.
 * Each card labels its move, names its primary room, and links directly in.
 * Spec: PMI G6, G8
 */
export function VaultMoveDashboard({
    chargeCount,
    unplacedQuestCount,
    draftCount,
    whoContactCount,
    invitationCount,
    staleItems,
}: VaultMoveDashboardProps) {
    const countMap: Record<string, number> = {
        Charges: chargeCount,
        Compost: staleItems,
        Drafts: draftCount,
        'Quests & Invitations': unplacedQuestCount + invitationCount,
    }

    return (
        <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 px-0.5">Enter a room</p>
            <div className="grid grid-cols-2 gap-2">
                {ROOMS.map((room) => {
                    const count = countMap[room.room] ?? 0
                    return (
                        <Link
                            key={room.href}
                            href={room.href}
                            className={`rounded-xl border ${room.border} bg-zinc-900/40 hover:bg-zinc-900/70 px-4 py-3 transition-colors group space-y-1`}
                        >
                            <div className="flex items-center justify-between gap-1">
                                <span className={`text-[9px] uppercase tracking-widest font-semibold ${room.note}`}>
                                    {room.move}
                                </span>
                                {count > 0 && (
                                    <span className={`text-[10px] font-mono ${room.note} opacity-70`}>{count}</span>
                                )}
                            </div>
                            <p className={`text-sm font-medium ${room.label} group-hover:opacity-90`}>
                                {room.room} →
                            </p>
                            <p className="text-[11px] text-zinc-600">{room.verb}</p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
