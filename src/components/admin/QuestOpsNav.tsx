'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

const TABS = [
  { href: '/admin/quests', label: 'Catalog' },
  { href: '/admin/quest-grammar', label: 'Grammar' },
  { href: '/admin/quest-from-context', label: 'From context' },
  { href: '/admin/quest-proposals', label: 'Proposals' },
] as const

const PREFIXES = [
  '/admin/quests',
  '/admin/quest-grammar',
  '/admin/quest-from-context',
  '/admin/quest-proposals',
] as const

function tabActive(pathname: string, href: string): boolean {
  if (href === '/admin/quests') {
    return pathname === '/admin/quests' || pathname.startsWith('/admin/quests/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

const metal = ELEMENT_TOKENS.metal

/** Shared sub-nav for quest tooling (Phase E — admin stewardship). */
export function QuestOpsNav() {
  const pathname = usePathname()
  const inCluster = PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!inCluster) return null

  return (
    <nav aria-label="Quest ops" className="mb-6">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Quest ops</div>
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-700/60 bg-slate-950/50 p-1">
        {TABS.map(({ href, label }) => {
          const active = tabActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                active
                  ? `${metal.bg} ${metal.border} ${metal.textAccent}`
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
