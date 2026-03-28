'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

type NavItem = {
  name: string
  href: string
  icon: string
  questOpsCluster?: boolean
}

const SECTIONS: {
  id: string
  title: string
  hint?: string
  items: NavItem[]
}[] = [
  {
    id: 'wake',
    title: 'Wake — orient',
    hint: 'Learn the world',
    items: [
      { name: 'Dashboard', href: '/admin', icon: '🏠' },
      { name: 'Onboarding', href: '/admin/onboarding', icon: '✨' },
      { name: 'Instances', href: '/admin/instances', icon: '🧩' },
      { name: 'Players', href: '/admin/players', icon: '👥' },
      { name: 'World Data', href: '/admin/world', icon: '🌍' },
      { name: 'Governance', href: '/admin/governance', icon: '🏛️' },
      { name: 'Library', href: '/admin/library', icon: '📚' },
      { name: 'Docs', href: '/admin/docs', icon: '📄' },
    ],
  },
  {
    id: 'clean',
    title: 'Clean — repair',
    hint: 'Fix drift & config',
    items: [
      { name: 'Campaign events', href: '/admin/campaign-events', icon: '📅' },
      { name: 'Allyship intakes', href: '/admin/allyship-intakes', icon: '🤝' },
      { name: 'Config', href: '/admin/config', icon: '⚙️' },
      { name: 'First Aid', href: '/admin/first-aid', icon: '🩺' },
    ],
  },
  {
    id: 'grow',
    title: 'Grow — author',
    hint: 'Content & structure',
    items: [
      { name: 'Campaign Seeds', href: '/admin/campaign-seeds', icon: '🌱' },
      { name: 'Journeys', href: '/admin/journeys', icon: '📜' },
      { name: 'Adventures', href: '/admin/adventures', icon: '🧭' },
      { name: 'Twine Stories', href: '/admin/twine', icon: '📖' },
      { name: 'Books', href: '/admin/books', icon: '📕' },
      { name: 'Maps', href: '/admin/maps', icon: '🗺️' },
      { name: 'Quest ops', href: '/admin/quests', icon: '⚔️', questOpsCluster: true },
      { name: 'Moves', href: '/admin/moves', icon: '🎯' },
      { name: 'Templates', href: '/admin/templates', icon: '📋' },
      { name: 'Avatars', href: '/admin/avatars', icon: '🎭' },
      { name: 'Forge', href: '/admin/forge', icon: '⚒️' },
      { name: 'Discovery', href: '/admin/discovery', icon: '🔍' },
      { name: 'Agent Proposals', href: '/admin/agent-proposals', icon: '🤖' },
    ],
  },
  {
    id: 'show',
    title: 'Show — ship',
    hint: 'Player-facing surfaces',
    items: [{ name: 'Game Lobby', href: '/lobby', icon: '🎂' }],
  },
  {
    id: 'sage',
    title: 'Sage — meta',
    hint: 'Specs & backlog',
    items: [
      { name: 'Backlog', href: '/admin/backlog', icon: '📌' },
      { name: 'Player signals', href: '/admin/player-signal-backlog', icon: '📡' },
    ],
  },
]

const SECTION_IDS = SECTIONS.map((s) => s.id)

const metal = ELEMENT_TOKENS.metal

function isQuestOpsClusterPath(pathname: string) {
  return (
    pathname === '/admin/quests' ||
    pathname.startsWith('/admin/quests/') ||
    pathname.startsWith('/admin/quest-ops') ||
    pathname.startsWith('/admin/quest-grammar') ||
    pathname.startsWith('/admin/quest-from-context') ||
    pathname.startsWith('/admin/quest-proposals')
  )
}

function matchItem(pathname: string, item: NavItem): boolean {
  if (item.questOpsCluster) return isQuestOpsClusterPath(pathname)
  if (item.href === '/admin') return pathname === '/admin'
  if (item.href === '/lobby') return pathname === '/lobby' || pathname.startsWith('/lobby/')
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function activeSectionIdForPath(pathname: string): string {
  for (const s of SECTIONS) {
    if (s.items.some((item) => matchItem(pathname, item))) return s.id
  }
  return 'wake'
}

function itemActive(pathname: string, item: NavItem): boolean {
  return matchItem(pathname, item)
}

function expandedMapForPath(pathname: string): Record<string, boolean> {
  const active = activeSectionIdForPath(pathname)
  return Object.fromEntries(SECTION_IDS.map((id) => [id, id === active])) as Record<string, boolean>
}

export function AdminNav() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => expandedMapForPath(pathname))

  useEffect(() => {
    setExpanded(expandedMapForPath(pathname))
  }, [pathname])

  const handleNavClick = () => {
    setIsCollapsed(true)
  }

  const toggleSection = (id: string) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }))
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed left-4 top-20 z-50 rounded-lg border p-2 transition-all ${metal.bg} ${metal.border} ${metal.borderHover} hover:text-slate-200`}
        title={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        <span className="text-xl">{isCollapsed ? '→' : '←'}</span>
      </button>

      <nav
        className={`flex flex-col fixed left-0 top-0 z-40 h-screen overflow-y-auto border-r transition-all duration-300 ${metal.bg} border-slate-800/90 backdrop-blur ${
          isCollapsed ? 'w-0 -translate-x-full' : 'w-64 translate-x-0'
        }`}
      >
        <div className="border-b border-slate-800/90 p-6">
          <Link href="/admin" className="block" onClick={handleNavClick}>
            <h1 className={`text-xl font-bold ${metal.textAccent}`}>GM Suite</h1>
            <p className="mt-1 font-mono text-xs text-slate-500">BARS ENGINE ADMIN</p>
          </Link>
        </div>

        <div className="flex-1 space-y-1 px-2 py-4">
          {SECTIONS.map((section) => {
            const open = expanded[section.id] ?? false
            return (
              <div key={section.id} className="rounded-lg border border-slate-800/60 bg-slate-950/30">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{section.title}</div>
                    {section.hint ? <div className="text-[10px] text-slate-600">{section.hint}</div> : null}
                  </div>
                  <span className="text-slate-500 text-xs shrink-0" aria-hidden>
                    {open ? '▼' : '▶'}
                  </span>
                </button>
                {open ? (
                  <div className="space-y-0.5 px-2 pb-2">
                    {section.items.map((item) => {
                      const active = itemActive(pathname, item)
                      return (
                        <Link
                          key={item.href + item.name}
                          href={item.href}
                          onClick={handleNavClick}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? `${metal.border} ${metal.bg} ${metal.textAccent} shadow-[0_0_0_1px_rgba(142,154,171,0.25)]`
                              : 'border-transparent text-slate-400 hover:bg-slate-900/80 hover:text-slate-100'
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="border-t border-slate-800/90 p-4">
          <Link
            href="/"
            onClick={handleNavClick}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <span>←</span> Return to Game
          </Link>
        </div>
      </nav>
    </>
  )
}
