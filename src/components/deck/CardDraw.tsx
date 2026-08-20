'use client'

import { useEffect, useRef } from 'react'

import { AllyshipCard } from './AllyshipCard'
import type { MoveCard } from '@/lib/allyship-deck/types'

import styles from './CardDraw.module.css'

/**
 * The shared "draw three, read one, carry one" surface.
 *
 * Both public checks (`/open-up`, `/mastering-allyship/clean-up`) hand off to
 * the deck the same way, so they hand off through the same two components. The
 * cards themselves always render through `AllyshipCard` — the canonical visual —
 * and the deck data behind them comes from `assembleDeck` in both flows, so a
 * card only has to be authored once to change everywhere it appears.
 *
 * Only the accent differs, because the element comes from the move: Open Up is
 * liminal, Clean Up is water.
 */

/** A row of drawn cards with a reserved caption slot under each. */
export function CardDrawRow({
  cards,
  carriedId,
  onOpen,
  accent,
  carriedLabel = '◇ carrying this',
}: {
  cards: MoveCard[]
  carriedId: string | null
  onOpen: (card: MoveCard) => void
  /** Selection ring + caption color. */
  accent: string
  carriedLabel?: string
}) {
  return (
    <div className={styles.row}>
      {cards.map((card) => {
        const carried = carriedId === card.id
        return (
          <div key={card.id} className={styles.cell}>
            <div
              className={styles.frame}
              style={{ outlineColor: carried ? accent : 'transparent' }}
            >
              <AllyshipCard card={card} variant="grid" onClick={() => onOpen(card)} />
            </div>
            {/* Reserved at all times so choosing a card never reflows the row. */}
            <span className={`bars-label ${styles.caption}`} style={{ color: carried ? accent : 'transparent' }}>
              {carried ? carriedLabel : '·'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * The card detail as a bottom sheet, not a centered dialog — the footer has to
 * stay in thumb reach on a phone, and the question and the practice have to be
 * readable without pinch-zoom.
 */
export function CardDrawSheet({
  card,
  carried,
  onClose,
  onChoose,
  accent,
  accentText = '#fff',
  chooseLabel = 'choose this card',
  carriedLabel = 'carrying this ✓',
}: {
  card: MoveCard
  carried: boolean
  onClose: () => void
  onChoose: () => void
  accent: string
  /** Foreground on `accent`. Light accents need dark text to clear 4.5:1. */
  accentText?: string
  chooseLabel?: string
  carriedLabel?: string
}) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab' || !sheetRef.current) return
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>('button, [href], textarea, input, [tabindex]:not([tabindex="-1"])')
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    sheetRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className={styles.scrim} onMouseDown={onClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={card.title}
        className={styles.sheet}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ borderTopColor: `color-mix(in srgb, ${accent} 35%, transparent)` }}
      >
        <div className={styles.grabRail}>
          <span aria-hidden className={styles.grab} />
        </div>
        <div className={styles.sheetBody}>
          <div className={styles.cardWell}>
            <AllyshipCard card={card} variant="full" />
          </div>
        </div>
        <div className={styles.sheetFoot}>
          <button type="button" className={styles.ghost} onClick={onClose}>close</button>
          <button
            type="button"
            className={styles.solid}
            onClick={onChoose}
            style={{ background: accent, color: accentText }}
          >
            {carried ? carriedLabel : chooseLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
