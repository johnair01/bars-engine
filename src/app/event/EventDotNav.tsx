'use client'

import { useEffect, useState, useCallback } from 'react'

const ALL_SECTIONS = [
  { id: 'hero', label: 'Top', icon: '◉' },
  { id: 'weekend', label: 'Weekend', icon: '◈' },
  { id: 'expect', label: 'Expect', icon: '◇' },
  { id: 'how', label: 'How', icon: '▸' },
  { id: 'support', label: 'Support', icon: '♦' },
  { id: 'story', label: 'Story', icon: '◐' },
  { id: 'footer', label: 'More', icon: '⊹' },
]

export function EventDotNav() {
  const [active, setActive] = useState('hero')
  const [visible, setVisible] = useState(false)
  const [sections, setSections] = useState(ALL_SECTIONS)
  const [mobileExpanded, setMobileExpanded] = useState(false)

  useEffect(() => {
    const present = ALL_SECTIONS.filter((s) => document.getElementById(s.id))
    setSections(present)
    const els = present.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    if (els.length === 0) return

    const showObserver = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.3 },
    )
    const heroEl = document.getElementById('hero')
    if (heroEl) showObserver.observe(heroEl)

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

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileExpanded(false)
  }, [])

  const activeSection = sections.find((s) => s.id === active)
  const activeIdx = sections.findIndex((s) => s.id === active)

  if (!visible) return null

  return (
    <>
      {/* ── DESKTOP: vertical dots on right edge (hidden on mobile) ─── */}
      <nav
        className="fixed right-3 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-3"
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
              className="group relative flex items-center justify-center min-w-[20px] min-h-[20px]"
            >
              <span
                className={`block rounded-full transition-all duration-200 ${
                  isActive
                    ? 'w-3 h-3 bg-[var(--ep-yellow,#f0d000)] shadow-[0_0_8px_var(--ep-yellow,#f0d000)]'
                    : 'w-2 h-2 bg-white/25 group-hover:bg-white/60 group-hover:scale-125'
                }`}
              />
              <span
                className="absolute right-7 px-2 py-1 rounded text-[11px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                style={{
                  background: 'var(--ep-surface, rgba(10,10,40,0.9))',
                  color: 'var(--ep-text, white)',
                  border: '1px solid var(--ep-border, rgba(255,255,255,0.1))',
                }}
              >
                {s.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* ── MOBILE: floating pill + expandable grid (hidden on desktop) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden pointer-events-none">

        {/* Backdrop when expanded */}
        {mobileExpanded && (
          <div
            className="fixed inset-0 z-30 pointer-events-auto"
            onClick={() => setMobileExpanded(false)}
          />
        )}

        {/* Expanded: section grid */}
        <div className="relative z-40 pointer-events-auto">
          {mobileExpanded && (
            <div
              className="mx-3 mb-2 rounded-2xl p-2 grid grid-cols-4 gap-1"
              style={{
                background: 'var(--ep-base, #0a0a2e)',
                border: '1px solid var(--ep-border, rgba(255,255,255,0.15))',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
              }}
            >
              {sections.map((s) => {
                const isActive = active === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl transition-colors min-h-[52px] justify-center active:scale-95"
                    style={isActive ? {
                      background: 'rgba(240, 208, 0, 0.12)',
                      color: 'var(--ep-yellow, #f0d000)',
                    } : {
                      color: 'var(--ep-text-muted, #6060a0)',
                    }}
                  >
                    <span className="text-lg leading-none">{s.icon}</span>
                    <span className="text-[10px] font-mono tracking-wide">{s.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Pill: shows current section + progress pips */}
          <div className="flex justify-center pb-5 pt-1">
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full min-h-[44px] transition-all active:scale-95"
              style={{
                background: 'var(--ep-base, #0a0a2e)',
                border: '1px solid var(--ep-border, rgba(255,255,255,0.15))',
                color: 'var(--ep-yellow, #f0d000)',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
              }}
            >
              {/* Progress pips — filled up to current, active one is wider */}
              <div className="flex gap-[3px] items-center">
                {sections.map((s, i) => (
                  <span
                    key={s.id}
                    className="block rounded-full transition-all duration-300"
                    style={{
                      width: active === s.id ? 14 : 5,
                      height: 5,
                      background: i <= activeIdx
                        ? 'var(--ep-yellow, #f0d000)'
                        : 'rgba(255,255,255,0.12)',
                    }}
                  />
                ))}
              </div>
              <span className="text-[11px] font-mono tracking-wider font-medium">
                {activeSection?.label ?? 'Menu'}
              </span>
              <span
                className={`text-xs transition-transform duration-200 ${mobileExpanded ? 'rotate-180' : ''}`}
                style={{ color: 'var(--ep-text-muted, #6060a0)' }}
              >
                ▴
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
