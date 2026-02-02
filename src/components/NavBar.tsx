'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/actions/logout'

export function NavBar() {
    const pathname = usePathname()

    // Don't show on invite pages to keep them focused? 
    // Actually, "Disconnect" is useful even there if stuck.
    // Let's keep it simple and pervasive.

    const isActive = (path: string) => pathname === path ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'

    return (
        <nav className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-900 bg-black/80 backdrop-blur z-50 flex items-center justify-between px-4 sm:px-8 font-mono text-xs">
            <div className="flex items-center gap-4">
                <Link href="/" className={`px-2 py-1 rounded transition-colors ${isActive('/')}`}>
                    TERMINAL
                </Link>
                <Link href="/admin" className={`px-2 py-1 rounded transition-colors ${isActive('/admin')}`}>
                    CONTROL
                </Link>
            </div>

            <form action={logout}>
                <button className="text-red-900 hover:text-red-500 hover:bg-red-950/30 px-2 py-1 rounded transition-colors uppercase tracking-widest">
                    Disconnect
                </button>
            </form>
        </nav>
    )
}
