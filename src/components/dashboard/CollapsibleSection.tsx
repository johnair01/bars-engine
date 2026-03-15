'use client'

import { useState, useId } from 'react'

type CollapsibleSectionProps = {
  title: string
  count?: number
  defaultExpanded: boolean
  children: React.ReactNode
  titleClassName?: string
  id?: string
  /** Button variant: full-width button style for visual ergonomics */
  variant?: 'default' | 'button'
}

export function CollapsibleSection({
  title,
  count,
  defaultExpanded,
  children,
  titleClassName = 'text-zinc-400',
  id,
  variant = 'default',
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const contentId = useId()
  const headerId = useId()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setExpanded((prev) => !prev)
    }
  }

  const isButton = variant === 'button'
  const headerClass = isButton
    ? 'w-full p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-600 transition-colors flex items-center justify-between gap-3'
    : 'flex items-center gap-3 mb-6 cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded'

  return (
    <section id={id} className={isButton ? 'mb-4' : ''}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={contentId}
        id={headerId}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={headerClass}
      >
        {isButton ? (
          <>
            <h2 className={`uppercase tracking-widest text-sm font-bold ${titleClassName} flex items-center gap-2`}>
              <span
                className="inline-block transition-transform duration-200"
                style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                aria-hidden
              >
                ▼
              </span>
              {title}
              {count != null && <span className="text-zinc-500 font-normal">({count})</span>}
            </h2>
          </>
        ) : (
          <>
            <div className="h-px bg-zinc-800 flex-1" />
            <h2 className={`uppercase tracking-widest text-sm font-bold ${titleClassName} flex items-center gap-2`}>
              <span
                className="inline-block transition-transform duration-200"
                style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                aria-hidden
              >
                ▼
              </span>
              {title}
              {count != null && <span className="text-zinc-500 font-normal">({count})</span>}
            </h2>
            <div className="h-px bg-zinc-800 flex-1" />
          </>
        )}
      </div>
      <div
        id={contentId}
        aria-labelledby={headerId}
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isButton && expanded ? 'mt-4' : ''}`}
        style={{
          maxHeight: expanded ? '5000px' : '0',
        }}
      >
        {children}
      </div>
    </section>
  )
}
