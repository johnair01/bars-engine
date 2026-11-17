import { notFound } from 'next/navigation'
import { currentPlayer, journeyFor } from '@/lib/between/store'
import { composeSummary, type ThreeTwoOnePass } from '@/lib/coaching/three-two-one'
import { countsByMove, daysOf, MOVES, pagesReadable } from '../../../../../public/between/journey.js'
import { CoachActions } from './CoachActions'

export const dynamic = 'force-dynamic'

/**
 * The coach's record (healing-journey spec FR-010 to FR-012): each day of the program as moves made or none made, how
 * many times each move was made, and the diary pages while they may be read. It says what was made and never what was
 * missed: no streak, no score, no warning. Only the coach the program names sees it; anyone else gets a 404.
 */
const MOVE_WORDS: Record<string, string> = {
  floorboards: 'floorboards', window: 'window', chair: "visitor's chair", workbench: 'workbench', doorway: 'doorway', hearth: 'hearth', diary: 'diary',
}

export default async function CoachJourneyPage({ params }: { params: Promise<{ playerId: string }> }) {
  const coach = await currentPlayer()
  const { playerId } = await params
  const found = coach ? await journeyFor(coach.id, playerId) : null
  if (!found) notFound()
  const d = found.doc as Record<string, any>
  const program = d.program ?? {}
  const days = daysOf(d.moves, program.startsOn, program.endsOn) as { on: string; made: string[]; didMake: boolean }[]
  const counts = countsByMove(d.moves) as Record<string, number>
  const today = new Date().toISOString().slice(0, 10)
  const pages = pagesReadable(program, today) ? ((d.pages ?? []) as { id: string; startedOn?: string; pass?: ThreeTwoOnePass }[]) : []
  const closed = !!program.closedAt
  return (
    <div className="min-h-screen bg-zinc-950">
    <main className="mx-auto max-w-2xl px-4 py-8 text-zinc-100">
      <h1 className="text-xl font-semibold">What was made</h1>
      <p className="mt-1 text-sm text-zinc-400">{program.startsOn} to {program.endsOn}{closed ? ', closed' : ''}</p>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-300">Each move, how many times</h2>
        <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
          {MOVES.map((m: string) => <li key={m}>{MOVE_WORDS[m]}: {counts[m]}</li>)}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-300">By day</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {days.filter(day => day.on <= today).map(day => (
            <li key={day.on}>{day.on}: {day.didMake ? day.made.map(m => MOVE_WORDS[m]).join(', ') : 'none made'}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-300">Pages</h2>
        {pages.length === 0 ? <p className="mt-2 text-sm text-zinc-400">No pages to read.</p> : pages.map(p => (
          <pre key={p.id} className="mt-3 whitespace-pre-wrap rounded border border-zinc-700 p-3 text-sm">{`${p.startedOn ?? ''}\n${p.pass ? composeSummary(p.pass) : ''}`.trim()}</pre>
        ))}
      </section>

      <p className="mt-6 text-sm text-zinc-400">For a player on paper: <a className="underline" href="/between/journey-diary-sheet.html" target="_blank" rel="noreferrer">the printable diary sheet</a>. Add a move they made on paper below.</p>

      {!closed && <CoachActions playerId={playerId} startsOn={program.startsOn} endsOn={program.endsOn} moves={MOVES.map((m: string) => ({ id: m, label: MOVE_WORDS[m] }))} />}
    </main>
    </div>
  )
}
