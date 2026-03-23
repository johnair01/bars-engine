'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { CyoaArtifactLedgerEntry } from '@/lib/cyoa/types'
import { promptsForBlueprintKey } from '@/lib/cyoa/blueprint-prompt-library'
import { elementCssVars, altitudeCssVars } from '@/lib/ui/card-tokens'
import '@/styles/cultivation-cards.css'

type Props = {
  entries: CyoaArtifactLedgerEntry[]
  /** When true, open expanded by default (e.g. Transcendence beat). */
  emphasizeRecap?: boolean
  /** Optional line from cyoaHexagramState for integration copy */
  hexagramLine?: string | null
}

/**
 * Bottom sheet listing BARs emitted during this CYOA run — context-preserving, thumb-zone friendly.
 */
export function CyoaBarLedgerSheet({ entries, emphasizeRecap = false, hexagramLine }: Props) {
  const [open, setOpen] = useState(emphasizeRecap)

  if (entries.length === 0 && !hexagramLine) return null

  const cardVars = { ...elementCssVars('wood'), ...altitudeCssVars('neutral') } as CSSProperties
  const stripVars = elementCssVars('wood') as CSSProperties

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex flex-col items-stretch sm:items-center sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={stripVars}
          className="w-full py-3 px-4 rounded-t-xl border border-b-0 border-zinc-700 bg-zinc-950/95 text-left text-sm font-mono text-zinc-200 shadow-lg backdrop-blur"
          aria-expanded={open}
        >
          <span style={{ color: 'var(--element-frame)' }}>Journey BARs</span>
          {entries.length > 0 && (
            <span className="text-zinc-500 ml-2">({entries.length})</span>
          )}
          <span className="float-right text-zinc-500">{open ? '▼' : '▲'}</span>
        </button>
        {open && (
          <div
            className="border border-t-0 border-zinc-700 rounded-b-xl bg-[#0a0908] max-h-[min(50vh,420px)] overflow-y-auto p-3 space-y-3 shadow-xl"
            role="region"
            aria-label="BARs from this journey"
          >
            {hexagramLine ? (
              <p className="text-xs text-zinc-500 font-mono border-b border-zinc-800 pb-2 mb-1">
                {hexagramLine}
              </p>
            ) : null}
            {entries.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No BARs yet — choices that create BARs will appear here.</p>
            ) : (
              entries.map((e) => {
                const prompts = promptsForBlueprintKey(e.blueprintKey)
                return (
                  <div
                    key={`${e.barId}-${e.createdAt}`}
                    className="cultivation-card p-3 text-left"
                    style={cardVars}
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                          {e.blueprintKey ?? e.source}
                        </p>
                        <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate max-w-[200px]">
                          {e.passageNodeId}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2 italic">{prompts[0]}</p>
                      </div>
                      <Link
                        href={`/bars/${e.barId}`}
                        className="shrink-0 text-xs text-purple-400 hover:text-purple-300 font-mono py-2 px-3 min-h-[44px] flex items-center"
                      >
                        Open →
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
