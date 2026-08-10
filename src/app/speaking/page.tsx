import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * @page /speaking
 * @entity CAMPAIGN
 * @description Speaking and workshops — the promise Chapter 9's *What Comes Next*
 *   makes in print. Fees are on the page rather than behind an enquiry, because a
 *   page that hides the number is asking the reader to spend a conversation
 *   finding out she cannot afford it. Two one-sheets attach: corporate and
 *   field/outdoor.
 * @permissions public
 * @relationships /succession, /mastering-allyship, public/speaking/*.pdf
 * @dimensions WHO:organizer, WHAT:offer, WHERE:speaking, ENERGY:invite
 * @example /speaking
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
  title: 'Speaking & workshops — Wendell Britt',
  description:
    'A talk, a half-day, or an outdoor session. Fees are listed on the page. Two one-sheets to download and one address to write to.',
}

const FORMATS = [
  {
    name: 'The talk',
    fee: '$2,500',
    detail:
      'One session. The argument the book makes, made to your people, with the moves named so they can be practiced after you leave.',
  },
  {
    name: 'The half-day',
    fee: '$4,500',
    detail:
      'The talk, plus the practice. People leave having run at least one move rather than having agreed with one.',
  },
  {
    name: 'Outdoor and experiential',
    fee: '$95 per seat, sliding to $75',
    detail:
      'Priced per seat rather than per session, so a small organization pays a small number. The sliding figure is the one to ask for if the top of the range is what stops you.',
  },
] as const

const ONE_SHEETS = [
  {
    href: '/speaking/Wendell_Britt_Speaker_One_Sheet.pdf',
    label: 'Speaker one-sheet',
    detail: 'For a conference, a company, or a keynote slot.',
  },
  {
    href: '/speaking/Wendell_Britt_Field_Staff_Training.pdf',
    label: 'Field and staff training one-sheet',
    detail: 'For outdoor programs, field staff, and season-opening training.',
  },
] as const

export default function SpeakingPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Speaking</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Chapter 9 sent you here
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            A talk, a half-day, or a day outside.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            The book argues that allyship is a set of moves a person can practice, miss, and
            practice again, rather than a verdict she waits to receive. A talk makes that
            argument to your people. A half-day gets them running it. The fees are below, so
            you can decide whether to write before you spend an email finding out.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">What it costs</h2>
          {FORMATS.map((format) => (
            <div key={format.name} className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-bold text-white">{format.name}</h3>
                <span className="font-mono text-sm tabular-nums text-amber-300">{format.fee}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{format.detail}</p>
            </div>
          ))}
          <p className="text-sm leading-relaxed text-zinc-500">
            Travel is on top and gets quoted honestly. If a budget is the obstacle, say the
            number you have and I will tell you what fits it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">The one-sheets</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Two pages each, for forwarding to whoever signs off.
          </p>
          {ONE_SHEETS.map((sheet) => (
            <a
              key={sheet.href}
              href={sheet.href}
              className="flex min-h-[44px] flex-col gap-1 rounded-2xl border border-zinc-800 bg-black/30 p-5 transition-colors hover:border-zinc-600"
            >
              <span className="text-base font-bold text-white">{sheet.label} (PDF) →</span>
              <span className="text-sm leading-relaxed text-zinc-400">{sheet.detail}</span>
            </a>
          ))}
        </section>

        <section className="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-6">
          <h2 className="text-lg font-bold">The ask</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            One address, answered by me. Tell me who the audience is, the date you are holding,
            and the budget you have. A reply from this address is always a person.
          </p>
          <a
            href="mailto:wendell@masteringallyship.com?subject=Speaking%20enquiry"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-600 px-5 font-bold text-black transition-colors hover:bg-amber-500"
          >
            wendell@masteringallyship.com
          </a>
        </section>
      </div>
    </main>
  )
}
