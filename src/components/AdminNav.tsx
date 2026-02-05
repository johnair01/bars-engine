'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function AdminNav() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: '🏠' },
        { name: 'Journeys', href: '/admin/journeys', icon: '📜' },
        { name: 'Quests', href: '/admin/quests', icon: '⚔️' },
        { name: 'Players', href: '/admin/players', icon: '👥' },
        { name: 'World Data', href: '/admin/world', icon: '🌍' },
    ]

    return (
        <>
            {/* Toggle Button - Always visible */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="fixed left-4 top-20 z-50 bg-zinc-900 border border-zinc-800 hover:border-purple-500 rounded-lg p-2 transition-all"
                title={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
                <span className="text-xl">{isCollapsed ? '→' : '←'}</span>
            </button>

            {/* Sidebar */}
            <nav className={`bg-zinc-900/95 backdrop-blur border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto transition-all duration-300 z-40 ${isCollapsed ? 'w-0 -translate-x-full' : 'w-64 translate-x-0'
                }`}>
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
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                                        ? 'bg-purple-900/20 text-purple-300 border border-purple-900/50'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-zinc-800">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                    >
                        <span>←</span> Return to Game
                    </Link>
                </div>
            </nav>
        </>
    )
}
