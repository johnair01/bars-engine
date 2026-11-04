/**
 * Sample mornings for the Not chosen view, shown only with ?view=unchosen&sample=1 so a preview link can show a line the
 * council's read composted (muted as residue) before any real week has been read. Labelled as a sample on the page;
 * none of it is his.
 */
import type { UnchosenLine } from './unchosen'

const lines: UnchosenLine[] = [
  { key: '2026-10-20:b:0', day: '2026-10-20', text: 'Walk the garden before calls', fate: 'unpicked' },
  { key: '2026-10-20:b:1', day: '2026-10-20', text: 'Text Maya about the podcast', fate: 'raw' },
  { key: '2026-10-17:b:0', day: '2026-10-17', text: 'Plant the garlic in the back garden', fate: 'raw', residue: true },
  { key: '2026-10-17:b:1', day: '2026-10-17', text: 'Fix the bike light', fate: 'composted', residue: true },
  { key: '2026-10-14:b:0', day: '2026-10-14', text: 'Garden beds need a plan', fate: 'unpicked' },
  { key: '2026-10-13:b:0', day: '2026-10-13', text: 'Record a podcast intro', fate: 'raw' },
]

export const UNCHOSEN_SAMPLE = { lines }
