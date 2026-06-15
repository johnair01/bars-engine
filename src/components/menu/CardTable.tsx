import type { ReactNode } from 'react'

/**
 * CardTable — the dark-slate surface that card-table menus rest on.
 *
 * The reusable "tray": wraps the `.card-table` aesthetic (cool slate + vignette + grain,
 * from cultivation-cards.css) so any menu surface (MtGoA deck, campaign portals, lobby)
 * gets the same physical table. Layout only via `className`; aesthetic lives in CSS.
 *
 * Spec: .specify/specs/mtgoa-menu-skeuomorphic-cyoa/
 */
export function CardTable({
  children,
  className = '',
}: {
  children: ReactNode
  /** Layout classes only (padding/grid live on children). */
  className?: string
}) {
  return <div className={`card-table p-4 sm:p-6 ${className}`}>{children}</div>
}
