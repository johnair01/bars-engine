'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DECK_FONTS, DECK_GOLD } from '@/lib/allyship-deck/card-visuals'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getGlossaryTerm,
  glossaryHref,
  type GlossaryCategory,
  type GlossaryTerm,
} from '@/lib/allyship-deck/glossary'

/**
 * The Allyship Deck glossary — a deep-linkable dictionary of every term that
 * appears on a card. Each term renders in a section with `id={term.id}`, so a
 * card link to `/deck/glossary#shaman` scrolls straight to it. Pure
 * presentational deck aesthetic (inline styles, not CultivationCard — the deck
 * is its own surface per UI_COVENANT).
 *
 * @see src/lib/allyship-deck/glossary.ts (GLOSSARY + id helpers)
 */
export function GlossaryReader({ terms }: { terms: GlossaryTerm[] }) {
  // The term targeted by the incoming #hash — briefly highlighted on arrival.
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const focusFromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
      if (!id) return
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setActiveId(id)
      window.setTimeout(() => setActiveId((cur) => (cur === id ? null : cur)), 2400)
    }
    focusFromHash()
    window.addEventListener('hashchange', focusFromHash)
    return () => window.removeEventListener('hashchange', focusFromHash)
  }, [])

  const byCategory = (cat: GlossaryCategory) => terms.filter((t) => t.category === cat)

  return (
    <main style={{ minHeight: '100vh', background: SURFACE_TOKENS.bgBase, color: SURFACE_TOKENS.textPrimary }}>
      {/* Top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: SURFACE_TOKENS.bgBase,
          borderBottom: '1px solid rgba(255,255,255,.1)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/deck" style={{ ...kicker, color: SURFACE_TOKENS.textSecondary, textDecoration: 'none' }}>
            ← Deck
          </Link>
          <span style={{ ...kicker, color: DECK_GOLD }}>Glossary</span>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 96px' }}>
        <h1 style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 30, color: '#fff', margin: '0 0 6px' }}>
          The deck, defined
        </h1>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14.5, color: SURFACE_TOKENS.textSecondary, margin: '0 0 22px', lineHeight: 1.5, maxWidth: 620 }}>
          Every term that appears on a card, in plain language. Tap a term on any card to land here.
        </p>

        {/* Category jump nav */}
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 28 }}>
          {CATEGORY_ORDER.filter((c) => byCategory(c).length > 0).map((c) => (
            <a key={c} href={`#cat-${c}`} style={navChip}>
              {CATEGORY_LABELS[c]}
            </a>
          ))}
        </nav>

        {CATEGORY_ORDER.map((cat) => {
          const items = byCategory(cat)
          if (items.length === 0) return null
          return (
            <section key={cat} style={{ marginBottom: 36 }}>
              <h2 id={`cat-${cat}`} style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: DECK_GOLD, margin: '0 0 14px', scrollMarginTop: 68 }}>
                {CATEGORY_LABELS[cat]}
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map((t) => (
                  <TermCard key={t.id} term={t} active={t.id === activeId} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}

function TermCard({ term, active }: { term: GlossaryTerm; active: boolean }) {
  return (
    <article
      id={term.id}
      style={{
        scrollMarginTop: 68,
        background: SURFACE_TOKENS.surfaceCard,
        borderRadius: 12,
        padding: '15px 17px',
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 2px ${DECK_GOLD}`
          : 'inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(255,255,255,.08)',
        transition: 'box-shadow .3s',
      }}
    >
      <h3 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 17, color: '#fff', margin: 0 }}>
        {term.term}
      </h3>
      <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textPrimary, margin: '7px 0 0', lineHeight: 1.5 }}>
        {term.definition}
      </p>
      {term.also && (
        <p style={{ fontFamily: DECK_FONTS.body, fontStyle: 'italic', fontSize: 13, color: '#e7c98a', margin: '7px 0 0' }}>
          {term.also}
        </p>
      )}
      {term.related && term.related.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
          {term.related.map((rid) => {
            const r = getGlossaryTerm(rid)
            if (!r) return null
            return (
              <Link key={rid} href={glossaryHref(rid)} style={relatedChip}>
                {r.term}
              </Link>
            )
          })}
        </div>
      )}
    </article>
  )
}

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}

const navChip: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  padding: '6px 11px',
  borderRadius: 999,
  color: SURFACE_TOKENS.textSecondary,
  background: SURFACE_TOKENS.surfaceInset,
  border: '1px solid rgba(255,255,255,.12)',
  textDecoration: 'none',
}

const relatedChip: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.04em',
  padding: '4px 9px',
  borderRadius: 7,
  color: SURFACE_TOKENS.textSecondary,
  background: SURFACE_TOKENS.surfaceInset,
  border: '1px solid rgba(255,255,255,.1)',
  textDecoration: 'none',
}
