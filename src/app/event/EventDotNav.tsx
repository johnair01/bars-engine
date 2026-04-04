'use client'

import { useEffect, useState } from 'react'

const ALL_SECTIONS = [
  { id: 'hero', label: 'Top' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'expect', label: 'Expect' },
  { id: 'how', label: 'How' },
  { id: 'support', label: 'Support' },
  { id: 'story', label: 'Story' },
  { id: 'footer', label: 'Footer' },
]

export function EventDotNav() {
  const [active, setActive] = useState('hero')
  const [visible, setVisible] = useState(false)
  const [sections, setSections] = useState(ALL_SECTIONS)

  useEffect(() => {
    // Only show dots for sections that actually exist in the DOM
    const present = ALL_SECTIONS.filter((s) => document.getElementById(s.id))
    setSections(present)
    const els = present.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    if (els.length === 0) return

    // Show dot nav only after scrolling past hero
    const showObserver = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.5 },
    )
    const heroEl = document.getElementById('hero')
    if (heroEl) showObserver.observe(heroEl)

    // Track which section is active
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            setActive(entry.target.id)
          }
        }
      },
      { threshold: 0.3, rootMargin: '-10% 0px -60% 0px' },
    )
    els.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      showObserver.disconnect()
    }
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      className={`fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Page sections"
    >
      {sections.map((s) => {
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            aria-label={s.label}
            aria-current={isActive ? 'true' : undefined}
            className="group relative flex items-center justify-center"
          >
            {/* Dot */}
            <span
              className={`block rounded-full transition-all duration-200 ${
                isActive
                  ? 'w-2.5 h-2.5 bg-[var(--ep-yellow,#f0d000)] shadow-[0_0_6px_var(--ep-yellow,#f0d000)]'
                  : 'w-1.5 h-1.5 bg-white/20 group-hover:bg-white/50'
              }`}
            />
            {/* Label tooltip on hover */}
            <span
              className="absolute right-5 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
              style={{ background: 'var(--ep-surface, rgba(10,10,40,0.8))', color: 'var(--ep-text, white)' }}
            >
              {s.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
