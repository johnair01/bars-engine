import type { CloseRecord } from './types'

export interface MorningSeed {
  /** 'lanterns' when last night closed, 'skipped' when it did not. A skipped night never counts anything. */
  kind: 'lanterns' | 'skipped'
  /** Wins he tapped last night, lit lanterns first. */
  wins: string[]
  /** The one lantern he named for today, if any. */
  lantern?: { title: string; source: string }
}

/** The short banner for the morning's open phase, from yesterday's close. No record, or one still open, shows nothing. */
export function morningSeed(prev: CloseRecord | null): MorningSeed | null {
  if (!prev || prev.status === 'open') return null
  if (prev.status === 'skipped') return { kind: 'skipped', wins: [] }
  const wins = Object.entries(prev.wins)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => prev.items.find(i => i.id === id)?.title)
    .filter((t): t is string => !!t)
  return { kind: 'lanterns', wins, lantern: prev.plan.lantern }
}
