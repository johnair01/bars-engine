'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'dashboard_get_started_dismissed'

export function GetStartedPane() {
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      setDismissed(stored === 'true')
    } catch {
      // ignore
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
      setDismissed(true)
    } catch {
      setDismissed(true)
    }
  }

  const handleShow = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setDismissed(false)
    } catch {
      setDismissed(false)
    }
  }

  if (!mounted) {
    return (
      <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 sm:p-6">
        <div className="animate-pulse h-24 bg-zinc-800/50 rounded-xl" />
      </section>
    )
  }

  if (dismissed) {
    return (
      <div className="flex items-center justify-between gap-2 py-2">
        <button
          type="button"
          onClick={handleShow}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition"
        >
          Show Get Started
        </button>
      </div>
    )
  }

  return (
    <section className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between gap-4 p-5 sm:p-6 cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setCollapsed((c) => !c)
          }
        }}
        aria-expanded={!collapsed}
      >
        <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold">
          Get Started
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleDismiss()
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition"
          >
            Dismiss
          </button>
          <span className="text-zinc-500 text-sm">
            {collapsed ? '▼' : '▲'}
          </span>
        </div>
      </div>
      {!collapsed && (
        <div className="px-5 sm:p-6 pt-0 pb-5 sm:pb-6 space-y-4">
          <p className="text-zinc-400 text-sm max-w-xl">
            Play quests, try Emotional First Aid when stuck, and support the residency.
          </p>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>
              <Link href="/campaign/board?ref=bruised-banana" className="text-emerald-400 hover:text-emerald-300 underline">Play quests</Link>
              {' on the Gameboard'}
            </li>
            <li>
              <Link href="/emotional-first-aid" className="text-cyan-400 hover:text-cyan-300 underline">Try EFA</Link>
              {' when stuck — 2 minutes to unblock'}
            </li>
            <li>
              <Link href="/event/donate" className="text-green-400 hover:text-green-300 underline">Donate</Link>
              {' to support the residency'}
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/game-map" className="text-xs text-zinc-500 hover:text-zinc-300">Game Map →</Link>
            <Link href="/wiki/rules/game-loop" className="text-xs text-zinc-500 hover:text-zinc-300">Wiki →</Link>
          </div>
        </div>
      )}
    </section>
  )
}
