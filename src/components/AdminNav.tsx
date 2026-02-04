'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminNav() {
    const pathname = usePathname()

    const navItems = [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Journeys', href: '/admin/journeys' },
        { name: 'Quests', href: '/admin/quests' },
        { name: 'Players', href: '/admin/players' },
        { name: 'World Data', href: '/admin/world' },
    ]

    return (
        <nav className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
                <Link href="/admin" className="block">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        GM Suite
                    </h1>
                    <p className="text-xs text-zinc-500 font-mono mt-1">BARS ENGINE ADMIN</p>
                </Link>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'bg-purple-900/20 text-purple-300 border border-purple-900/50'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            {item.name}
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-zinc-800">
                <Link
                    href="/"
                    className="flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                >
                    Return to Game
                </Link>
            </div>
        </nav>
    )
}
