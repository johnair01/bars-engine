/**
 * Run: npx tsx src/lib/__tests__/feedback-title.test.ts
 *
 * Regression cover for the bug that titled 73 of 77 rows `Site signal: [admin]`.
 */

import {
  buildFeedbackTitle,
  displayTitleForRow,
  extractComplaintText,
} from '@/lib/feedback/feedback-title'
import { formatSiteSignalFeedbackBlock } from '@/lib/feedback/site-signal-schema'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

/** Reproduces `descriptionBlock` in persist-player-feedback-to-backlog. */
function withFooter(feedback: string, source: string): string {
  return [
    feedback,
    '',
    '---',
    `source: ${source}`,
    'questId: system-feedback',
    'passageName: Site signal (nav)',
    'playerName: Admin (God Mode)',
    'playerId: test-admin',
  ].join('\n')
}

function run() {
  // --- The original bug: admin tag + snapshot header swallowed the title ---
  const adminBlock = formatSiteSignalFeedbackBlock({
    pageUrl: 'https://masteringallyship.com/world/lobby/card-club',
    pathname: '/world/lobby/card-club',
    message: 'Big problems on iPhone. The buttons can’t be pressed.',
    isAdmin: true,
  })
  const adminStored = withFooter(adminBlock, 'site_signal_nav')

  assert(
    extractComplaintText(adminStored) === 'Big problems on iPhone. The buttons can’t be pressed.',
    'complaint extracted from admin site-signal block',
  )
  const adminTitle = buildFeedbackTitle('site_signal_nav', undefined, adminStored)
  assert(adminTitle.startsWith('Site signal: Big problems'), 'title uses the complaint')
  assert(!adminTitle.includes('[admin]'), 'title never shows the admin tag')
  assert(!adminTitle.includes('Page snapshot'), 'title never shows the snapshot header')

  // Non-admin rows previously titled `Site signal: --- Page snapshot ---`.
  const playerStored = withFooter(
    formatSiteSignalFeedbackBlock({
      pageUrl: 'https://masteringallyship.com/campaign/board',
      pathname: '/campaign/board',
      message: 'Only the Gather Resources region shows available quests',
    }),
    'site_signal_nav',
  )
  assert(
    buildFeedbackTitle('site_signal_nav', undefined, playerStored) ===
      'Site signal: Only the Gather Resources region shows available quests',
    'non-admin title uses the complaint',
  )

  // --- Footer must never leak into the complaint ---
  assert(!extractComplaintText(adminStored).includes('playerId'), 'footer stripped')
  assert(!extractComplaintText(adminStored).includes('source:'), 'source line stripped')

  // A complaint containing its own `---` line still keeps its text.
  const dashy = withFooter(
    formatSiteSignalFeedbackBlock({
      pageUrl: 'https://x.test/a',
      pathname: '/a',
      message: 'first thought\n---\nsecond thought',
    }),
    'site_signal_nav',
  )
  assert(extractComplaintText(dashy).includes('second thought'), 'inner --- survives')

  // --- Screenshot section sits between snapshot and complaint ---
  const shot = withFooter(
    formatSiteSignalFeedbackBlock({
      pageUrl: 'https://x.test/b',
      pathname: '/b',
      message: 'passage not found',
      imageUrl: 'https://abc.public.blob.vercel-storage.com/signal-feedback/p/1.png',
    }),
    'site_signal_nav',
  )
  assert(extractComplaintText(shot) === 'passage not found', 'complaint found past screenshot')

  // --- Share Your Signal shape ---
  const sys = withFooter(
    'Resonance: Amber (Static present) | Clarity: Foggy\n\nTransmission: The vault modal never opens\n\nScreenshot: https://abc.public.blob.vercel-storage.com/p/2.png',
    'share_your_signal',
  )
  assert(
    extractComplaintText(sys) === 'The vault modal never opens',
    'transmission preferred over resonance line',
  )
  assert(
    buildFeedbackTitle('share_your_signal', undefined, sys) ===
      'Share Your Signal: The vault modal never opens',
    'share-your-signal title',
  )

  // Empty transmission falls back to the ratings rather than going blank.
  const empty = withFooter('Resonance: Obsidian | Clarity: Blind', 'share_your_signal')
  assert(
    extractComplaintText(empty).startsWith('Resonance: Obsidian'),
    'ratings used when transmission is absent',
  )

  // --- Sources without scaffolding pass through ---
  const manual = 'I need to learn how I can contribute to the goal of raising $3000.'
  assert(extractComplaintText(manual) === manual, 'manual rows unchanged')
  assert(
    buildFeedbackTitle('certification', 'cert-existing-players-character-v1', manual).startsWith(
      'Cert: cert-existing-players-character-v1: I need to learn',
    ),
    'cert label keeps questId',
  )

  // --- Truncation ---
  const long = withFooter(
    formatSiteSignalFeedbackBlock({
      pageUrl: 'https://x.test/c',
      pathname: '/c',
      message: 'x'.repeat(300),
    }),
    'site_signal_nav',
  )
  const longTitle = buildFeedbackTitle('site_signal_nav', undefined, long)
  assert(longTitle.length <= 200, 'title capped at 200')
  assert(longTitle.endsWith('…'), 'long title ellipsised')

  // --- displayTitleForRow rescues rows stored before the fix ---
  const legacy = {
    title: 'Site signal: [admin]',
    description: adminStored,
    source: 'site_signal_nav',
    contextJson: null,
  }
  assert(
    displayTitleForRow(legacy).startsWith('Site signal: Big problems'),
    'legacy row title derived at render time',
  )

  // A row with genuinely no recoverable text keeps its stored title.
  const opaque = { title: 'Player feedback: kept', description: '', source: 'manual', contextJson: null }
  assert(displayTitleForRow(opaque) === 'Player feedback: kept', 'falls back to stored title')

  console.log('feedback-title tests passed')
}

run()
