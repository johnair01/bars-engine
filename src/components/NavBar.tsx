'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/logout'
import { SiteSignalNavTrigger } from '@/components/feedback/SiteSignalModal'

export function NavBar({ isAdmin, isAuthenticated }: { isAdmin: boolean; isAuthenticated: boolean }) {
    const pathname = usePathname()

    const isActive = (path: string) => {
        let active: boolean
        if (path === '/') {
            active = pathname === '/'
        } else if (path === '/vault') {
            // VAULT: active across all player-possession routes
            active = pathname.startsWith('/vault') ||
                     pathname.startsWith('/bars') ||
                     pathname.startsWith('/wallet') ||
                     pathname.startsWith('/daemons') ||
                     pathname.startsWith('/capture')
        } else if (path === '/events') {
            // EVENTS: active on the events index and the single-instance event page
            active = pathname === '/events' ||
                     pathname.startsWith('/events/') ||
                     pathname === '/event' ||
                     pathname.startsWith('/event/')
        } else {
            active = pathname === path || pathname.startsWith(`${path}/`)
        }
        return active ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
    }

    return (
        <nav className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-900 bg-black/80 backdrop-blur z-50 flex items-center justify-between px-3 sm:px-8 font-mono text-xs">
            <div className="flex items-center gap-1 sm:gap-4 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {isAuthenticated && (
                    <>
                        <Link
                            href="/"
                            title="Orient your session: daily check-in, compass, what to do next — and zoom through time in the Observatory."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/')}`}
                        >
                            NOW
                        </Link>
                        <Link
                            href="/vault"
                            title="Your private studio: charges, quests, drafts, invitations — metabolize what you are carrying."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/vault')}`}
                        >
                            VAULT
                        </Link>
                        <Link
                            href="/garden"
                            title="Your Garden: the BARs you've planted, growing under your lenses."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/garden')}`}
                        >
                            GARDEN
                        </Link>
                        <Link
                            href="/events"
                            title="Events you're subscribed to, plus events open to all players."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/events')}`}
                        >
                            EVENTS
                        </Link>
                        <Link
                            href="/adventures"
                            title="Active play: shadow work, journeys, daemons, campaigns, and published adventures."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/adventures')}`}
                        >
                            PLAY
                        </Link>
                    </>
                )}
                {!isAuthenticated && (
                    <>
                        <Link
                            href="/launch"
                            title="The book, the deck, and the game — start here."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/launch')}`}
                        >
                            START
                        </Link>
                        <Link
                            href="/handbook"
                            title="Read the front of the book, phone-first. Free."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/handbook')}`}
                        >
                            BOOK
                        </Link>
                        <Link
                            href="/deck/sales"
                            title="The Allyship Deck — 120 cards. See what's inside."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/deck')}`}
                        >
                            DECK
                        </Link>
                        <Link
                            href="/game/index.html"
                            title="Play Mastering the Game of Allyship in your browser. No account needed."
                            className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/game')}`}
                        >
                            PLAY
                        </Link>
                    </>
                )}
                {isAdmin && (
                    <Link href="/admin" className={`px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/admin')}`}>
                        CONTROL
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {isAuthenticated && (
                    <Link
                        href="/bars/capture"
                        title="Forge a BAR: turn a charged moment into an artifact you can grow into a quest."
                        className={`shrink-0 px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/bars/capture')}`}
                    >
                        + BAR
                    </Link>
                )}
                {isAuthenticated ? <SiteSignalNavTrigger /> : null}
                {isAuthenticated && (
                    <>
                        <span className="hidden sm:inline h-6 w-px shrink-0 bg-zinc-800" aria-hidden />
                        <form action={logout} className="shrink-0">
                            <button
                                type="submit"
                                className="text-red-900 hover:text-red-500 hover:bg-red-950/30 px-3 sm:px-4 py-3 rounded transition-colors uppercase tracking-widest min-w-[44px] min-h-[44px] flex items-center justify-center text-[10px] sm:text-xs"
                            >
                                <span className="hidden sm:inline">Disconnect</span>
                                <span className="sm:hidden">Exit</span>
                            </button>
                        </form>
                    </>
                )}
                {!isAuthenticated && (
                    <>
                        <Link
                            href="/redeem"
                            title="Bought something? Redeem your code to unlock it."
                            className="text-zinc-500 hover:text-zinc-300 px-3 sm:px-4 py-3 rounded transition-colors uppercase tracking-widest text-[10px] sm:text-xs"
                        >
                            Redeem
                        </Link>
                        <Link
                            href="/login"
                            className="text-zinc-500 hover:text-zinc-300 px-3 sm:px-4 py-3 rounded transition-colors uppercase tracking-widest text-[10px] sm:text-xs"
                        >
                            Log in
                        </Link>
                    </>
                )}
            </div>
        </nav>
    )
}
