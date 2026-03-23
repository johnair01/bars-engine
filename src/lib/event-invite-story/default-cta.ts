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
