'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/logout'

export function NavBar({ isAdmin }: { isAdmin: boolean }) {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'

    return (
        <nav className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-900 bg-black/80 backdrop-blur z-50 flex items-center justify-between px-4 sm:px-8 font-mono text-xs">
            <div className="flex items-center gap-4">
                <Link href="/" className={`px-4 py-3 rounded transition-colors ${isActive('/')}`}>
                    TERMINAL
                </Link>
                {isAdmin && (
                    <Link href="/admin" className={`px-4 py-3 rounded transition-colors ${isActive('/admin')}`}>
                        CONTROL
                    </Link>
                )}
            </div>

            <form action={logout}>
                <button className="text-red-900 hover:text-red-500 hover:bg-red-950/30 px-4 py-3 rounded transition-colors uppercase tracking-widest min-w-[44px] flex items-center justify-center">
                    Disconnect
                </button>
            </form>
        </nav>
    )
}
