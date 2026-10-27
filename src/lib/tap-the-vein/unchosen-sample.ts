/**
 * Sample mornings for the Not chosen view, shown only with ?view=unchosen&sample=1 so a preview link can show the
 * council's weekly read before any real week has been read. Labelled as a sample on the page; none of it is his.
 */
import type { PitchView } from './unchosen-read'
import { unchosenPatterns, type UnchosenLine } from './unchosen'

const lines: UnchosenLine[] = [
  { day: '2026-10-20', text: 'Walk the garden before calls', fate: 'unpicked' },
  { day: '2026-10-20', text: 'Text Maya about the podcast', fate: 'raw' },
  { day: '2026-10-17', text: 'Plant the garlic in the back garden', fate: 'raw' },
  { day: '2026-10-17', text: 'Fix the bike light', fate: 'composted' },
  { day: '2026-10-14', text: 'Garden beds need a plan', fate: 'unpicked' },
  { day: '2026-10-13', text: 'Record a podcast intro', fate: 'raw' },
]

const pitches: PitchView[] = [
  {
    id: 'sample-garden',
    word: 'garden',
    face: 'shaman',
    kernel: 'The garden keeps asking for your hands in the morning, before the screen.',
    pitch: 'Put ten minutes in the back garden on the next dry morning, before the first call.',
    quotes: [
      { day: '2026-10-20', text: 'Walk the garden before calls' },
      { day: '2026-10-17', text: 'Plant the garlic in the back garden' },
      { day: '2026-10-14', text: 'Garden beds need a plan' },
    ],
    weekOf: '2026-10-19',
    composted: [{ pitch: 'Sketch the garden beds on paper.', weekOf: '2026-10-12' }],
  },
  {
    id: 'sample-podcast',
    word: 'podcast',
    face: 'diplomat',
    kernel: 'The podcast wants another voice in it, not more planning alone.',
    pitch: 'Ask Maya for one twenty-minute call about the next episode.',
    quotes: [
      { day: '2026-10-20', text: 'Text Maya about the podcast' },
      { day: '2026-10-13', text: 'Record a podcast intro' },
    ],
    weekOf: '2026-10-19',
    composted: [],
  },
]

export const UNCHOSEN_SAMPLE = { lines, patterns: unchosenPatterns(lines), pitches }
