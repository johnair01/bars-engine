import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChapterOneLeadForm } from './ChapterOneLeadForm'
import {
  AWAKEN_BOOK_SALES_HREF,
  AWAKEN_DECK_SALES_HREF,
} from '@/lib/awaken/content'

export const metadata: Metadata = {
  title: 'Read Chapter 1 - Mastering the Game of Allyship',
  description:
    'Get the first chapter of Mastering the Game of Allyship and begin practicing allyship as a learnable game.',
}

const BODY = 'var(--bars-font-body)'
const DISPLAY = 'var(--bars-font-display)'
const MONO = 'var(--bars-font-mono)'

const pathCards = [
  {
    n: '1',
    title: 'Download Chapter 1',
    body:
      'Start with the part where I admit the book was late because I was trying to write about allyship from inside the exact scarcity trap the book is here to undo.',
    href: '#chapter-one-form',
    cta: 'Send me the chapter',
  },
  {
    n: '2',
    title: 'Buy the full book',
    body:
      'If Chapter 1 names the arcade, the book gives you the map: six roles, their shadows, and a way to stop playing the unwinnable version.',
    href: AWAKEN_BOOK_SALES_HREF,
    cta: 'Buy on Gumroad',
  },
  {
    n: '3',
    title: 'Practice with the tools',
    body:
      'The deck gives you one concrete move. The Dojo and 1:1 work give you a room where the move can become something you actually do.',
    href: '/launch#choose',
    cta: 'See the practice paths',
  },
]

export default function MasteringAllyshipChapterOnePage() {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#0b0910] text-[#cbc6d0]"
      style={{ fontFamily: BODY }}
    >
      <section className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(100% 70% at 50% -10%,rgba(255,95,168,.22),transparent 60%),linear-gradient(180deg,#1c1030,#0b0910 70%)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="mx-auto w-full max-w-[260px] lg:max-w-[310px]">
            <div className="relative drop-shadow-[0_30px_54px_rgba(0,0,0,.7)]">
              <Image
                src="/mastering-allyship/cover-front.png"
                alt="Mastering the Game of Allyship book cover"
                width={430}
                height={645}
                className="h-auto w-full rounded-[3px_8px_8px_3px]"
                priority
              />
              <div className="absolute inset-y-0 right-0 w-3 rounded-r-lg bg-gradient-to-r from-black/60 to-transparent" />
            </div>
          </div>

          <div className="space-y-7">
            <nav className="text-xs text-zinc-500">
              <Link href="/mastering-allyship" className="hover:text-zinc-300">
                Mastering Allyship
              </Link>
              <span aria-hidden="true"> / </span>
              <span>Chapter 1</span>
            </nav>

            <div className="space-y-5">
              <p
                className="text-[11px] font-bold uppercase text-[#ff5fa8]"
                style={{ fontFamily: MONO, letterSpacing: '.24em' }}
              >
                Free first chapter
              </p>
              <h1
                className="max-w-3xl text-4xl font-bold leading-[1.05] text-white sm:text-6xl"
                style={{ fontFamily: DISPLAY }}
              >
                You are not failing at allyship.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#d6cfdb]">
                You are playing a game that was built to feed on the exact feeling you are
                having right now. Chapter 1 is where I stop pretending I was above that game,
                tell the truth about why this book was late, and hand you the first map out.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#chapter-one-form"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#ff5fa8] to-[#e6b93f] px-6 font-bold text-[#0c0910] shadow-[0_16px_38px_-14px_rgba(255,95,168,.7)]"
                style={{ fontFamily: DISPLAY }}
              >
                Send me Chapter 1
              </a>
              <a
                href={AWAKEN_BOOK_SALES_HREF}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e6b93f]/50 px-6 font-bold text-[#f5e2b0] transition-colors hover:bg-[#e6b93f]/10"
                style={{ fontFamily: DISPLAY }}
              >
                Buy the full book
              </a>
            </div>

            <p className="max-w-2xl text-sm leading-7 text-[#9f98a8]">
              The PDF downloads immediately after signup. No scavenger hunt, no broken
              “coming soon” link. Read the chapter, then decide whether you want the book,
              the deck, or a room where the work becomes practice.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#2a0d06] to-[#180a12] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="space-y-6">
            <p
              className="text-[11px] font-bold uppercase text-[#ff8a5c]"
              style={{ fontFamily: MONO, letterSpacing: '.22em' }}
            >
              What you are actually getting
            </p>
            <h2
              className="max-w-3xl text-3xl font-semibold leading-tight text-[#ffe7d8] sm:text-5xl"
              style={{ fontFamily: DISPLAY }}
            >
              The first chapter is not a teaser. It is the trapdoor.
            </h2>
            <div className="max-w-3xl space-y-5 text-base leading-8 text-[#d6c8c0]">
              <p>
                It starts with the part I would have preferred to skip: the promise I made,
                the delay, and the embarrassing realization that I was making the work smaller,
                slower, and less alive by trying to prove I was doing allyship correctly.
              </p>
              <p>
                That is the whole doorway. Allyship cannot be built from scarcity and
                self-punishment without turning you into a worse ally. Chapter 1 names the
                arcade, shows how it eats your care, and points toward the game underneath:
                one where your satisfaction is not the enemy of the work.
              </p>
              <p className="text-[#ffe0d2]">
                If that lands, the next move is simple: read the book, pull a card from the
                deck, or bring one real situation into practice.
              </p>
            </div>
          </div>

          <aside id="chapter-one-form" className="scroll-mt-8 space-y-4">
            <ChapterOneLeadForm />
            <div className="rounded-2xl border border-[#d9a8f0]/30 bg-[#120a1c]/80 p-5 text-sm leading-7 text-[#cbc2d8]">
              <p className="font-semibold text-[#f0e6fa]">What happens after Chapter 1?</p>
              <p className="mt-2">
                You will get the chapter, then occasional launch notes when there is a real
                next move: the full book, the Allyship Deck, the Dojo, or 1:1 work with me.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={AWAKEN_BOOK_SALES_HREF} className="text-[#e6b93f] underline-offset-4 hover:underline">
                  Buy the book
                </a>
                <Link href={AWAKEN_DECK_SALES_HREF} className="text-[#ff8a5c] underline-offset-4 hover:underline">
                  See the deck
                </Link>
                <Link href="/mastering-allyship/dojo" className="text-[#6fe6b2] underline-offset-4 hover:underline">
                  Explore the Dojo
                </Link>
                <Link href="/mastering-allyship/one-to-one" className="text-[#4fd0e0] underline-offset-4 hover:underline">
                  1:1 work
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#160d05] to-[#0a1418] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p
              className="text-[11px] font-bold uppercase text-[#e6b93f]"
              style={{ fontFamily: MONO, letterSpacing: '.22em' }}
            >
              The path after the PDF
            </p>
            <h2
              className="mt-4 text-3xl font-semibold leading-tight text-[#f5e2b0] sm:text-5xl"
              style={{ fontFamily: DISPLAY }}
            >
              Three doors. Pick the one with your name on it.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pathCards.map((card) => (
              <a
                key={card.n}
                href={card.href}
                className="group flex min-h-[280px] flex-col rounded-2xl border border-[#e6b93f]/20 bg-black/30 p-6 text-left transition hover:-translate-y-1 hover:border-[#e6b93f]/60 hover:bg-[#201406]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6b93f] font-mono text-sm font-bold text-[#12100e]">
                  {card.n}
                </div>
                <h3 className="mt-5 text-2xl font-bold text-[#f5e2b0]" style={{ fontFamily: DISPLAY }}>
                  {card.title}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-7 text-[#cfc2a4]">{card.body}</p>
                <span className="mt-6 font-bold text-[#e6b93f] group-hover:text-[#ffe08a]">
                  {card.cta} →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
