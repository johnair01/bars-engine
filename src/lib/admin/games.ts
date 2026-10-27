/**
 * The games on bars-engine, for the development dashboard at /admin/games.
 *
 * One entry per game: where to play it, the states worth opening directly, where its source
 * lives, how it is built and tested, and the council callsheet that tracks its open work.
 * Add a game here when it gets a route; the dashboard reads nothing else.
 */

const REPO = 'https://github.com/johnair01/bars-engine'
const COUNCIL = 'https://github.com/wendell-britt/Six-faces-council/blob/main/council/callsheets'

export type GameLink = { label: string; href: string }

export type DevGame = {
  id: string
  title: string
  blurb: string
  /** Where a player opens it. */
  play: string
  /** Who can open it: everyone, a signed-in player, or only Wendell. */
  access: 'public' | 'sign-in' | 'owner'
  /** Other states worth opening straight away. */
  jumps: GameLink[]
  /** Source folders and design docs, as repo paths. */
  source: string[]
  build?: string
  tests: string[]
  callsheets: string[]
  /** Words to find its pull requests by. */
  prSearch: string
}

export const DEV_GAMES: DevGame[] = [
  {
    id: 'cave',
    title: 'Cave of Lessons',
    blurb: 'The block work walked inside the body map: daemons, spirits, trust and W.A.V.E.',
    play: '/ontology-game/cave',
    access: 'public',
    jumps: [
      { label: 'Big Mind cave', href: '/ontology-game/big-mind' },
      { label: 'Body map', href: '/ontology-game/body' },
    ],
    source: ['content/ontology-game/cave', 'content/ontology-game/cave/DESIGN.md', 'content/ontology-game/cave/LEVELS.md'],
    build: 'npm run build:ontology-game',
    tests: ['node content/ontology-game/cave/cave-test.mjs', 'node content/ontology-game/bigmind/bigmind-test.mjs'],
    callsheets: ['cave-of-lessons', 'big-mind-cave', 'cave-levels', 'spirits-in-caves'],
    prSearch: 'Cave of Lessons',
  },
  {
    id: 'ontology',
    title: 'Ontology Alchemy Game',
    blurb: 'The card game of moves and feelings. /wave opens it with W.A.V.E. as the practice.',
    play: '/ontology-game',
    access: 'public',
    jumps: [{ label: 'Open with W.A.V.E.', href: '/ontology-game/wave' }],
    source: ['content/ontology-game/game.jsx', 'scripts/build-ontology-game.mjs'],
    build: 'npm run build:ontology-game',
    tests: ['node content/ontology-game/browser-test.mjs'],
    callsheets: ['ontology-flows', 'wave-room'],
    prSearch: 'ontology game',
  },
  {
    id: 'between',
    title: 'The Between',
    blurb: 'A garden two people tend together, in a hollow under a great tree.',
    play: '/ontology-game/between',
    access: 'sign-in',
    jumps: [],
    source: ['public/between', 'src/lib/between/rules.ts', 'src/app/ontology-game/between/route.ts'],
    tests: ['npm run test:between'],
    callsheets: ['relationship-creature'],
    prSearch: 'Between',
  },
  {
    id: 'passport',
    title: 'Calrunian passport (dev view)',
    blurb: 'Developer view of the record that crosses Calrunia’s places. Players never see this page; they see their spirit waiting on the ship.',
    play: '/passport',
    access: 'owner',
    jumps: [{ label: 'Sample passport', href: '/passport?demo=1' }],
    source: ['schema/passport.schema.json', 'public/passport/guest.js', 'src/lib/passport', 'src/app/passport/route.ts'],
    tests: ['npx vitest run src/lib/__tests__/passport-contract.test.ts'],
    callsheets: ['calrunia-world'],
    prSearch: 'passport',
  },
  {
    id: 'vein',
    title: 'Tap the Vein',
    blurb: 'The daily morning ritual: free-write, then pick a seed from the menu.',
    play: '/tap-the-vein',
    access: 'sign-in',
    jumps: [{ label: 'Embed (Morning tab)', href: '/tap-the-vein/embed' }],
    source: ['src/app/tap-the-vein', 'src/lib/tap-the-vein'],
    tests: ['npm run test:ttv-menu', 'npm run test:ttv-history'],
    callsheets: ['morning-menu'],
    prSearch: 'Tap the Vein',
  },
  {
    id: 'understood',
    title: 'Understood',
    blurb: 'The standalone Understood game, built into the site.',
    play: '/understood/play',
    access: 'public',
    jumps: [{ label: 'Demo', href: '/understood/demo' }],
    source: ['understood-game', 'scripts/build-understood.mjs'],
    build: 'npm run build:understood',
    tests: [],
    callsheets: [],
    prSearch: 'understood',
  },
  {
    id: 'play',
    title: 'MTGOA game',
    blurb: 'Charge, Scene Atlas, I Ching: the short guided creative loop.',
    play: '/play',
    access: 'sign-in',
    jumps: [],
    source: ['mtgoa-game', 'scripts/build-game.mjs', 'src/app/play'],
    build: 'npm run build:game',
    tests: [],
    callsheets: ['game-demo'],
    prSearch: 'mtgoa-game',
  },
  {
    id: 'inner-garden',
    title: 'Inner Garden',
    blurb: "The Shaman's garden: capture BARs grown into cultivations.",
    play: '/inner-garden',
    access: 'sign-in',
    jumps: [{ label: 'Play', href: '/inner-garden/play' }],
    source: ['src/app/inner-garden', 'public/inner-garden-game'],
    tests: ['npm run test:inner-garden-game'],
    callsheets: ['inner-creatures'],
    prSearch: 'inner garden',
  },
]

export const repoPath = (path: string) => `${REPO}/tree/main/${path}`
export const callsheetUrl = (name: string) => `${COUNCIL}/${name}.md`
export const prSearchUrl = (words: string) =>
  `${REPO}/pulls?q=${encodeURIComponent(`is:pr is:open ${words}`)}`
