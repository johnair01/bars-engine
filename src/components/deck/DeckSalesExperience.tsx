'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { FindYourPath } from './FindYourPath'
import { MovePip } from './MovePip'
import { FaceBadge } from './FaceBadge'
import type { MoveCard, BasicMove, Operation } from '@/lib/allyship-deck/types'
import {
  DOMAIN_LABELS,
  FACE_COLOR,
  MOVE_LABELS,
  OPERATION_LABELS,
  themeForMove,
} from '@/lib/allyship-deck/card-visuals'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'

type PartKey = 'title' | 'move' | 'face' | 'domain' | 'prompt' | 'meta'

const CTA_HREF = '/launch'
const BOOK_HREF = '/book/sales'
const PRICE_LINE = 'price · format · what is included - pending'
const GUARANTEE_LINE = 'honest-terms guarantee - e.g. carry it a week; if not one move lands, send it back - pending'
const CTA_PRICE = 'cta destination + price - pending'

const FACES: Operation[] = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage']
const MOVES: BasicMove[] = ['wake_up', 'open_up', 'clean_up', 'grow_up', 'show_up']
const DOMAINS = ['gather resources', 'raise awareness', 'direct action', 'skillful organizing']

const FACE_CARDS = [
  { name: 'the shaman', element: 'water', desc: "feels what's happening before it's named. notices the signal in the room." },
  { name: 'the challenger', element: 'fire', desc: 'says the thing. names the harm and makes the move.' },
  { name: 'the regent', element: 'earth', desc: 'holds the line over time. turns a one-off into a practice.' },
  { name: 'the architect', element: 'metal', desc: 'finds the leverage. builds the structure that makes the right thing repeatable.' },
  { name: 'the diplomat', element: 'wood', desc: 'keeps people whole. moves with care, invites instead of extracts, stays close without disappearing.' },
  { name: 'the sage', element: 'liminal', desc: 'witnesses. lets the truth be true, and pulls the lasting lesson from it.' },
] as const

const PARTS: Record<PartKey, { label: string; tag: string; desc: string }> = {
  title: {
    label: 'the title',
    tag: 'the move, named',
    desc: 'A short, memorable name for the move - the handle you grab in the moment so you can call it to mind without re-reading the card.',
  },
  move: {
    label: 'the move',
    tag: 'one of five',
    desc: "Wake Up, Open Up, Clean Up, Grow Up, or Show Up - the kind of action the card asks for. The icon and the card's color name it; the label spells it out.",
  },
  face: {
    label: 'the face',
    tag: 'who casts it',
    desc: 'Which of the six allies is leading - shown by its initial and named below. The challenger names the harm; the diplomat keeps everyone whole while the hard thing gets done.',
  },
  domain: {
    label: 'the domain',
    tag: 'where it lives',
    desc: 'Which arena of the work the move belongs to: Gather Resources, Raise Awareness, Direct Action, or Skillful Organizing. Marked with ◇.',
  },
  prompt: {
    label: 'the prompt',
    tag: 'the one question you answer, live',
    desc: 'The single question you answer, out loud or in your head, right now. This is the card doing its job - not analysis, a move.',
  },
  meta: {
    label: 'the footer',
    tag: 'time, number & reward',
    desc: "Roughly how long the move takes, the card's number in the 120, and the ♦ vibeulons you bank for completing it.",
  },
}

const OBJECTIONS = [
  {
    q: "Isn't this just one more framework to add to the pile?",
    a: "No. A framework is something you collect to prove you have it. A deck is something you reach into to do something. You felt the difference a minute ago - you didn't study those three cards, you used them.",
  },
  {
    q: "I already know this stuff. Won't the cards be obvious?",
    a: "The knowing was never the problem - the reaching was. The cards aren't there to teach you something new; they're there to hand you the move you already know in the ten seconds you'd otherwise go quiet.",
  },
  {
    q: '120 cards sounds like a lot to learn.',
    a: "You don't learn them. You read your first few, see the shape, and after that you just draw. The deck does the finding - you only answer the one question in your hand.",
  },
  {
    q: 'Do I need the book, or the app, to use it?',
    a: 'No. The deck plays complete on its own. The book is the deeper door if you want the world behind the moves; the app is there when your hands are full. Both optional.',
  },
  {
    q: "What if it doesn't work for me?",
    a: GUARANTEE_LINE,
  },
] as const

export function DeckSalesExperience({ cards }: { cards: MoveCard[] }) {
  const [anaIdx, setAnaIdx] = useState(0)
  const [activePart, setActivePart] = useState<PartKey>('title')
  const [selected, setSelected] = useState<MoveCard | null>(null)

  const heroCards = useMemo(() => {
    const pick = (move: BasicMove) => cards.find((card) => card.move === move) ?? cards[0]!
    return [pick('grow_up'), pick('show_up'), pick('wake_up')] as const
  }, [cards])

  const anatomyCards = useMemo(() => {
    const preferred = [
      ['show_up', 'challenger'],
      ['wake_up', 'shaman'],
      ['grow_up', 'regent'],
      ['open_up', 'diplomat'],
    ] as const

    return preferred
      .map(([move, operation]) => cards.find((card) => card.move === move && card.operation === operation))
      .filter((card): card is MoveCard => Boolean(card))
  }, [cards])

  const anatomyCard = anatomyCards[anaIdx % Math.max(anatomyCards.length, 1)] ?? cards[0]!

  return (
    <main className="deck-sales">
      <header className="deck-sales-topbar">
        <Link href="/deck/sales" className="deck-sales-brand">
          <span className="deck-sales-brand-mark">B</span>
          <span>the allyship deck</span>
        </Link>
        <Link href={CTA_HREF} className="deck-sales-top-cta">
          get the deck
        </Link>
      </header>

      <section className="deck-sales-hero">
        <div className="deck-sales-hero-glow" />
        <div className="deck-sales-col deck-sales-hero-copy">
          <h1 className="deck-sales-h1">
            you have all the answers.
            <br />
            <span>you just can&apos;t reach them when it counts.</span>
          </h1>
          <p>A deck of moves you keep on you - so the answer arrives in the moment, not at 2am.</p>
        </div>
        <div className="deck-sales-fan" aria-hidden>
          {heroCards.map((card, index) => (
            <div className={`deck-sales-fan-card deck-sales-fan-card-${index + 1}`} key={card.id}>
              <SalesCardMini card={card} />
            </div>
          ))}
        </div>
      </section>

      <Band>
        <div className="deck-sales-col">
          <Label>you&apos;ve read the books</Label>
          <p className="deck-sales-p">
            All of them. And the understanding is real - replay a conversation afterward and you can see exactly what happened, who it landed on, what you wish you&apos;d said.
          </p>
          <p className="deck-sales-p">
            You&apos;re not missing the analysis. You&apos;re missing it <em>in time</em>. It arrives late - in the car, at 2am, three days later in the shower - never in the ten seconds when saying something would have changed the room. In those ten seconds, you go quiet.
          </p>
          <p className="deck-sales-statement">
            Knowing and doing turned out to be two different skills. No one told you the second one was separate.
          </p>
        </div>
      </Band>

      <section className="deck-sales-section">
        <div className="deck-sales-col deck-sales-center deck-sales-wide">
          <Label>so don&apos;t take my word for it</Label>
          <h2 className="deck-sales-h2">name what&apos;s actually happening for you right now.</h2>
          <p className="deck-sales-sub">The deck pulls three moves for it - yours to keep, before you decide anything.</p>
        </div>
        <PhoneFrame cards={cards} onSelectCard={setSelected} />
      </section>

      <Band>
        <div className="deck-sales-col deck-sales-grid-copy">
          <Label>those three weren&apos;t a sample reel</Label>
          <p className="deck-sales-p">
            They&apos;re three of a hundred and twenty. The deck is built so there&apos;s always one that meets the moment you&apos;re in: five basic moves - wake up, open up, clean up, grow up, show up - across six faces of the work. Thirty places to stand, every one alive in all four domains of allyship. Whatever&apos;s happening, there&apos;s a card for where you&apos;re standing in it.
          </p>
        </div>
        <DeckMathGrid />
      </Band>

      <section className="deck-sales-section">
        <div className="deck-sales-col deck-sales-grid-copy">
          <Label>how to read a card</Label>
          <p className="deck-sales-p">Every card is the same shape once you&apos;ve seen one.</p>
        </div>
        <div className="deck-sales-anatomy">
          <div className="deck-sales-anatomy-card">
            <AnatomyCard card={anatomyCard} activePart={activePart} onPart={setActivePart} />
          </div>
          <div className="deck-sales-anatomy-panel">
            <AnatomyPanel activePart={activePart} onPart={setActivePart} />
            <div className="deck-sales-anatomy-actions">
              <button type="button" className="deck-sales-gold-button" onClick={() => setAnaIdx((idx) => idx + 1)}>
                draw another →
              </button>
              <span>hover any part to learn it</span>
            </div>
          </div>
        </div>
        <div className="deck-sales-col deck-sales-grid-copy deck-sales-after-anatomy">
          <p className="deck-sales-p">
            The tags up top place the move: which of the five it is, which of the six faces casts it, which arena of the work it belongs to. The title names the move. The line beneath is the prompt - the one question you answer, in the moment, out loud or in your head. The last line tells you what the move is for.
          </p>
          <p className="deck-sales-p">That&apos;s the whole card. You&apos;ll read your first few. After that, you just draw.</p>
        </div>
      </section>

      <Band>
        <div className="deck-sales-col deck-sales-grid-copy">
          <Label>the six faces</Label>
          <p className="deck-sales-p">
            Every card is cast by one of six faces - six ways to meet a moment. Six allies you already have, each good at something the others aren&apos;t. The deck just puts whichever one the moment needs in your hand.
          </p>
        </div>
        <div className="deck-sales-face-grid">
          {FACE_CARDS.map((face) => (
            <FaceCard key={face.name} {...face} />
          ))}
        </div>
        <div className="deck-sales-col deck-sales-grid-copy deck-sales-faces-close">
          <p className="deck-sales-p">
            Some moments need the challenger. Some need the diplomat, to keep everyone whole while the hard thing gets done. The deck doesn&apos;t make you guess - the path you just pulled was already cast from the faces your problem called for.
          </p>
        </div>
      </Band>

      <section className="deck-sales-section deck-sales-center">
        <div className="deck-sales-col">
          <Label>what it is</Label>
          <h2 className="deck-sales-h2 deck-sales-large-h2">120 cards.</h2>
          <p className="deck-sales-sub deck-sales-format">Physical, so they&apos;re in your bag when the phone isn&apos;t the move - and in bars-engine when your hands are full.</p>
          <div className="deck-sales-dashed">{PRICE_LINE}</div>
        </div>
      </section>

      <Band>
        <div className="deck-sales-col deck-sales-grid-copy">
          <Label>the deck plays complete on its own</Label>
          <p className="deck-sales-p">You don&apos;t need to read anything first. You already did the reading - this is the part that was missing.</p>
          <p className="deck-sales-p">
            If you want the world these moves came from - why these five, where the six faces come from, what game you&apos;ve been playing all along - that&apos;s the book. The deeper door. Recommended, never required.
          </p>
          <div className="deck-sales-dashed deck-sales-left-dashed">{GUARANTEE_LINE}</div>
        </div>
      </Band>

      <section className="deck-sales-section deck-sales-choice">
        <div className="deck-sales-choice-glow" />
        <div className="deck-sales-col deck-sales-center deck-sales-choice-copy">
          <Label>the choice</Label>
          <p className="deck-sales-sub deck-sales-choice-lead">You were never short on care, or on understanding. You were short a move in the ten seconds it mattered.</p>
          <h2 className="deck-sales-h2 deck-sales-choice-title">put a hundred and twenty of them in your bag.</h2>
          <Link href={CTA_HREF} className="deck-sales-final-cta">
            get the deck →
          </Link>
          <div className="deck-sales-price">{CTA_PRICE}</div>
        </div>
      </section>

      <section className="deck-sales-section deck-sales-objections">
        <div className="deck-sales-col deck-sales-objections-col">
          <div className="deck-sales-ember-label">before you go</div>
          <h2 className="deck-sales-h2 deck-sales-objections-title">the honest questions.</h2>
          <div className="deck-sales-objection-stack">
            {OBJECTIONS.map((objection) => (
              <article className="deck-sales-objection" key={objection.q}>
                <p>“{objection.q}”</p>
                <span>{objection.a}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="deck-sales-section deck-sales-book-section">
        <div className="deck-sales-book-panel">
          <div>
            <div className="deck-sales-book-kicker">the deeper door</div>
            <h2 className="deck-sales-h2 deck-sales-book-title">want the world these moves came from?</h2>
            <p>The field guide is the full playbook - why these five moves, where the six faces come from, and the game you&apos;ve been playing all along. Recommended, never required. Get both together.</p>
          </div>
          <Link href={BOOK_HREF} className="deck-sales-book-cta">
            explore the book →
          </Link>
        </div>
      </section>

      <footer className="deck-sales-footer">
        <span>the allyship deck · mastering the game of allyship · © wendell britt</span>
        <Link href={BOOK_HREF}>the book</Link>
      </footer>

      {selected && (
        <div className="deck-sales-modal" onClick={() => setSelected(null)}>
          <div className="deck-sales-modal-inner" onClick={(event) => event.stopPropagation()}>
            <AnatomyCard card={selected} activePart={activePart} onPart={setActivePart} />
            <button type="button" onClick={() => setSelected(null)}>
              close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

function Band({ children }: { children: ReactNode }) {
  return <section className="deck-sales-section deck-sales-band">{children}</section>
}

function Label({ children }: { children: ReactNode }) {
  return <div className="deck-sales-label">{children}</div>
}

function PhoneFrame({ cards, onSelectCard }: { cards: MoveCard[]; onSelectCard: (card: MoveCard) => void }) {
  return (
    <div className="deck-sales-phone-wrap">
      <div className="deck-sales-phone">
        <div className="deck-sales-phone-screen">
          <div className="deck-sales-status">
            <span>9:41</span>
            <span className="deck-sales-notch" />
            <span>◗ ▮</span>
          </div>
          <div className="deck-sales-phone-scroll">
            <FindYourPath cards={cards} subject="self" onSelectCard={onSelectCard} />
          </div>
          <div className="deck-sales-home-indicator">
            <span />
          </div>
        </div>
      </div>
      <p>the live deck · find your path</p>
    </div>
  )
}

function DeckMathGrid() {
  return (
    <div className="deck-sales-math-scroll">
      <div className="deck-sales-math-grid">
        <div className="deck-sales-grid-head">
          <div />
          {FACES.map((face) => (
            <div key={face}>{OPERATION_LABELS[face].toLowerCase()}</div>
          ))}
        </div>
        {MOVES.map((move) => (
          <div className="deck-sales-grid-row" key={move}>
            <div>{MOVE_LABELS[move].toLowerCase()}</div>
            {FACES.map((face) => (
              <div className="deck-sales-grid-cell" key={`${move}-${face}`}>
                <span />
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        ))}
        <div className="deck-sales-domain-legend">
          <span>every cell lives in all four domains:</span>
          {DOMAINS.map((domain) => (
            <span key={domain}>
              <i />
              {domain}
            </span>
          ))}
        </div>
        <div className="deck-sales-equation">
          <span>5 moves</span>
          <b>×</b>
          <span>6 faces</span>
          <b>×</b>
          <span>4 domains</span>
          <b>=</b>
          <strong>120 cards</strong>
        </div>
      </div>
    </div>
  )
}

function AnatomyPanel({ activePart, onPart }: { activePart: PartKey; onPart: (part: PartKey) => void }) {
  const active = PARTS[activePart]

  return (
    <div className="deck-sales-panel-copy">
      <div>
        <span>{active.tag}</span>
        <h3>{active.label}</h3>
      </div>
      <p>{active.desc}</p>
      <div>
        {(Object.keys(PARTS) as PartKey[]).map((key) => (
          <button
            type="button"
            className={activePart === key ? 'is-active' : undefined}
            key={key}
            onMouseEnter={() => onPart(key)}
            onClick={() => onPart(key)}
          >
            {PARTS[key].label}
          </button>
        ))}
      </div>
    </div>
  )
}

function AnatomyCard({
  card,
  activePart,
  onPart,
}: {
  card: MoveCard
  activePart: PartKey
  onPart: (part: PartKey) => void
}) {
  const t = themeForMove(card.move)
  const face = FACE_COLOR[card.operation]

  const regionProps = (part: PartKey) => ({
    className: `deck-sales-card-region ${activePart === part ? 'is-active' : ''}`,
    onMouseEnter: () => onPart(part),
    onClick: () => onPart(part),
  })

  return (
    <article
      className="deck-sales-anatomy-real-card"
      style={{
        '--card-grad-from': t.gradFrom,
        '--card-grad-to': t.gradTo,
        '--card-glow': t.glow,
        '--card-frame': t.frame,
        '--card-gem': t.gem,
        '--face-color': face,
      } as CSSProperties}
    >
      <div
        className={`deck-sales-card-region deck-sales-card-title ${activePart === 'title' ? 'is-active' : ''}`}
        onMouseEnter={() => onPart('title')}
        onClick={() => onPart('title')}
      >
        <h3>{card.title}</h3>
      </div>
      <div className="deck-sales-card-marks">
        <div {...regionProps('move')}>
          <MovePip move={card.move} size={38} />
          <span style={{ color: t.gem }}>{MOVE_LABELS[card.move]}</span>
        </div>
        <div {...regionProps('face')}>
          <FaceBadge operation={card.operation} size={38} />
          <span>{OPERATION_LABELS[card.operation]}</span>
        </div>
      </div>
      <div
        className={`deck-sales-card-region deck-sales-card-domain ${activePart === 'domain' ? 'is-active' : ''}`}
        onMouseEnter={() => onPart('domain')}
        onClick={() => onPart('domain')}
      >
        ◇ {DOMAIN_LABELS[card.domain]}
      </div>
      <div
        className={`deck-sales-card-region deck-sales-card-prompt ${activePart === 'prompt' ? 'is-active' : ''}`}
        onMouseEnter={() => onPart('prompt')}
        onClick={() => onPart('prompt')}
      >
        <p>{card.primaryQuestion}</p>
      </div>
      <div
        className={`deck-sales-card-region deck-sales-card-meta ${activePart === 'meta' ? 'is-active' : ''}`}
        onMouseEnter={() => onPart('meta')}
        onClick={() => onPart('meta')}
      >
        <span>10 MIN · #{card.num}</span>
        <b>♦ 2</b>
      </div>
    </article>
  )
}

function SalesCardMini({ card }: { card: MoveCard }) {
  const t = themeForMove(card.move)
  return (
    <article
      className="deck-sales-mini-card"
      style={{
        '--card-grad-from': t.gradFrom,
        '--card-grad-to': t.gradTo,
        '--card-glow': t.glow,
        '--card-frame': t.frame,
        '--card-gem': t.gem,
      } as CSSProperties}
    >
      <div>
        <h3>{card.title}</h3>
      </div>
      <div>
        <MovePip move={card.move} size={28} />
        <span>{MOVE_LABELS[card.move]}</span>
      </div>
      <p>{card.primaryQuestion}</p>
      <footer>
        <span>◇ {DOMAIN_LABELS[card.domain].toLowerCase()}</span>
        <b>{card.remediation}</b>
      </footer>
    </article>
  )
}

function FaceCard({ name, element, desc }: { name: string; element: string; desc: string }) {
  const colors =
    element === 'liminal'
      ? { frame: '#6d52c9', glow: '#7c3aed', gem: '#c8a9f5' }
      : ELEMENT_TOKENS[element as keyof typeof ELEMENT_TOKENS]

  return (
    <article
      className="deck-sales-face-card"
      style={{
        '--face-frame': colors.frame,
        '--face-glow': colors.glow,
        '--face-gem': colors.gem,
      } as CSSProperties}
    >
      <h3>{name}</h3>
      <p>{desc}</p>
    </article>
  )
}
