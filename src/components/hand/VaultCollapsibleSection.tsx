'use client'

import { useState, type ReactNode } from 'react'
import { VAULT_COLLAPSE_THRESHOLD } from '@/lib/vault-ui'

type VaultCollapsibleSectionProps = {
    sectionId: string
    title: string
    count: number
    titleClassName: string
    children: ReactNode
    /** One-line purpose (Voice Style Guide: presence first). */
    description?: string
    /** When true, section starts expanded regardless of count. */
    forceExpanded?: boolean
}

/**
 * Collapsible vault section with count badge — UI Style Guide: progressive disclosure.
 */
export function VaultCollapsibleSection({
    sectionId,
    title,
    count,
    titleClassName,
    children,
    description,
    forceExpanded = false,
}: VaultCollapsibleSectionProps) {
    const shouldCollapseByDefault = !forceExpanded && count > VAULT_COLLAPSE_THRESHOLD
    const [open, setOpen] = useState(!shouldCollapseByDefault)

    const label = count === 1 ? `${title} (1)` : `${title} (${count})`

    return (
        <section className="space-y-4" aria-labelledby={`${sectionId}-heading`}>
            <div className="flex items-center gap-3">
                <div className="h-px bg-zinc-800 flex-1" />
                <div className="flex flex-col items-center gap-1 min-w-0">
                    <button
                        type="button"
                        id={`${sectionId}-heading`}
                        onClick={() => setOpen((o) => !o)}
                        className={`group flex items-center gap-2 text-center ${titleClassName} uppercase tracking-widest text-sm font-bold hover:opacity-90`}
                        aria-expanded={open}
                        aria-controls={`${sectionId}-panel`}
                    >
                        <span className="truncate max-w-[min(100vw-8rem,28rem)]">{label}</span>
                        <span className="text-zinc-500 font-normal text-xs tabular-nums shrink-0" aria-hidden>
                            {open ? '▼' : '▶'}
                        </span>
                    </button>
                    {description && open ? (
                        <p className="text-zinc-500 text-sm text-center max-w-lg px-2">{description}</p>
                    ) : null}
                    {!open && description ? (
                        <p className="text-zinc-600 text-xs text-center max-w-lg px-2 line-clamp-1">{description}</p>
                    ) : null}
                </div>
                <div className="h-px bg-zinc-800 flex-1" />
            </div>

            {open ? (
                <div id={`${sectionId}-panel`} className="space-y-4">
                    {children}
                </div>
            ) : (
                <p className="text-center text-sm text-zinc-600 py-2">
                    Collapsed — <button type="button" className="text-amber-400/90 hover:text-amber-300 underline" onClick={() => setOpen(true)}>Expand</button> to see {count} {count === 1 ? 'item' : 'items'}.
                </p>
            )}
        </section>
    )
}
