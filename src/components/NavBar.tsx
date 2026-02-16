'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/logout'

export function NavBar({ isAdmin, isAuthenticated }: { isAdmin: boolean; isAuthenticated: boolean }) {
    const pathname = usePathname()

    const isActive = (path: string) => {
        let active: boolean
        if (path === '/') {
            active = pathname === '/'
        } else if (path === '/bars') {
            // /bars but NOT /bars/available
            active = pathname === '/bars' || (pathname.startsWith('/bars/') && !pathname.startsWith('/bars/available'))
        } else {
            active = pathname === path || pathname.startsWith(`${path}/`)
        }
        return active ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
    }

    return (
        <nav className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-900 bg-black/80 backdrop-blur z-50 flex items-center justify-between px-3 sm:px-8 font-mono text-xs">
            <div className="flex items-center gap-1 sm:gap-4">
                {isAuthenticated && (
                    <>
                        <Link href="/" className={`px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/')}`}>
                            HOME
                        </Link>
                        <Link href="/bars" className={`px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/bars')}`}>
                            BARS
                        </Link>
                        <Link href="/bars/available" className={`px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/bars/available')}`}>
                            QUESTS
                        </Link>
                        <Link href="/wallet" className={`px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/wallet')}`}>
                            WALLET
                        </Link>
                    </>
                )}
                {isAdmin && (
                    <Link href="/admin" className={`px-3 sm:px-4 py-3 rounded transition-colors ${isActive('/admin')}`}>
                        CONTROL
                    </Link>
                )}
            </div>

            <form action={logout}>
                <button className="text-red-900 hover:text-red-500 hover:bg-red-950/30 px-3 sm:px-4 py-3 rounded transition-colors uppercase tracking-widest min-w-[44px] min-h-[44px] flex items-center justify-center text-[10px] sm:text-xs">
                    <span className="hidden sm:inline">Disconnect</span>
                    <span className="sm:hidden">Exit</span>
                </button>
            </form>
        </nav>
    )
}
