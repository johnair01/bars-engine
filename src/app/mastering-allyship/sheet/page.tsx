import type { Metadata } from 'next'
import Link from 'next/link'
import { CharacterSheetNudge } from './CharacterSheetNudge'

/**
 * @page /mastering-allyship/sheet
 * @entity CAMPAIGN
 * @description The character sheet from Appendix H — print PDF, fillable PDF, and the
 *   interactive teaching version. **Ungated on purpose**: the printed book says these
 *   live at masteringallyship.com, so they are a debt rather than a lead magnet, and
 *   charging an email for something already promised in print is the move the book
 *   spends nine chapters teaching people to spot. The only ask on the page is the
 *   optional quarterly re-fill reminder, which is Appendix H's own instruction.
 * @permissions public
 * @relationships /mastering-allyship/myths-read (line 3), /superpower (line 1),
 *   FunnelSignup (intent: character-sheet), Kit tag source:character-sheet
 * @dimensions WHO:reader, WHAT:artifact, WHERE:mastering-allyship, ENERGY:practice
 * @example /mastering-allyship/sheet
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
  title: 'The Character Sheet — Mastering the Game of Allyship',
  description:
    'The thirteen-line character sheet from Appendix H. Print version, fillable version, and an interactive one that teaches each line. Free, no email required.',
}

const DOWNLOADS = [
  {
    href: '/mastering-allyship/MTGOA_Character_Sheet_print.pdf',
    title: 'The print sheet',
    detail: 'One page, black and white. The version to put on a wall and fill in by hand.',
    primary: true,
  },
  {
    href: '/mastering-allyship/MTGOA_Character_Sheet_fillable.pdf',
    title: 'The fillable sheet',
    detail: 'Twenty-nine form fields. Type into it, save it, date it, keep the file.',
    primary: false,
  },
] as const

export default function CharacterSheetPage() {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-12 text-[#e8e6e0] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <nav className="text-xs text-zinc-500">
          <Link href="/mastering-allyship" className="hover:text-zinc-300">
            Mastering the Game of Allyship
          </Link>
          <span aria-hidden="true"> / </span>
          <span>The character sheet</span>
        </nav>

        <header className="space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400">
            Appendix H sent you here
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Thirteen lines, and the date you filled them in.
          </h1>
          <p className="text-base leading-relaxed text-[#a09e98]">
            The book says the print artwork and the fillable version live here, so here they
            are. Both are free and neither asks for an email address. Line one is your Home
            Face, line three is your Myth, and the other eleven are the ones the chapters
            teach.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Download it</h2>
          {DOWNLOADS.map((file) => (
            <a
              key={file.href}
              href={file.href}
              className={`flex min-h-[44px] flex-col gap-1 rounded-2xl border p-5 transition-colors ${
                file.primary
                  ? 'border-amber-600/50 bg-amber-950/20 hover:border-amber-500'
                  : 'border-zinc-800 bg-black/30 hover:border-zinc-600'
              }`}
            >
              <span className="text-base font-bold text-white">{file.title} (PDF) →</span>
              <span className="text-sm leading-relaxed text-zinc-400">{file.detail}</span>
            </a>
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-black/30 p-6">
          <h2 className="text-lg font-bold">Or fill it in here</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            The interactive version opens one line at a time and explains what each is asking
            before you answer it. Nothing you type leaves your browser, and it prints when you
            are done.
          </p>
          <a
            href="/mastering-allyship/character-sheet.html"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-600 px-5 font-bold text-white transition-colors hover:bg-violet-500"
          >
            Open the interactive sheet →
          </a>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Two lines you can fill in right now</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/superpower"
              className="rounded-2xl border border-zinc-800 bg-black/30 p-5 transition-colors hover:border-zinc-600"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Line 1
              </span>
              <span className="mt-1 block text-base font-bold text-white">Home Face →</span>
              <span className="mt-1 block text-sm text-zinc-400">
                The Superpower quiz scores all seven and names the one you avoid.
              </span>
            </Link>
            <Link
              href="/mastering-allyship/myths-read"
              className="rounded-2xl border border-zinc-800 bg-black/30 p-5 transition-colors hover:border-zinc-600"
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                Line 3
              </span>
              <span className="mt-1 block text-base font-bold text-white">Myth →</span>
              <span className="mt-1 block text-sm text-zinc-400">
                The Myths Read sorts the ten and tells you which one is running.
              </span>
            </Link>
          </div>
        </section>

        <CharacterSheetNudge />
      </div>
    </main>
  )
}
