import type { EventInviteEndingCta } from '@/lib/event-invite-story/schema'

/** Default outbound links after an event-invite story ending (Apr 2026 residency). */
export const EVENT_INVITE_DEFAULT_CTAS = [
    { href: '/event', label: 'Campaign & events →', className: 'bg-amber-600/90 hover:bg-amber-500 text-white' },
    {
        href: '/campaign/hub?ref=bruised-banana',
        label: 'Step into the 8 paths (hub) →',
        className: 'bg-purple-600 hover:bg-purple-500 text-white',
    },
    { href: '/conclave', label: 'Join / sign in →', className: 'border border-zinc-600 hover:border-zinc-500 text-zinc-200' },
] as const

const MINI_GAME_CTA_CLASS = 'bg-fuchsia-700/90 hover:bg-fuchsia-600 text-white'

/**
 * Standard ending row: campaign home, party-mini-game invite layer anchor, hub, sign-in.
 * @param miniGamePath e.g. `/event#bb-invite-bingo-apr4` — see party-mini-game-event-layer spec.
 */
export function eventInviteStandardCtasWithMiniGame(miniGamePath: string): EventInviteEndingCta[] {
    return [
        EVENT_INVITE_DEFAULT_CTAS[0],
        {
            href: miniGamePath,
            label: 'Invite friends (mini-game) →',
            className: MINI_GAME_CTA_CLASS,
        },
        EVENT_INVITE_DEFAULT_CTAS[1],
        EVENT_INVITE_DEFAULT_CTAS[2],
    ]
}
