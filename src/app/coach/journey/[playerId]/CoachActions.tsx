'use client'
import { useState } from 'react'

/** Add a move made on paper, and close the program by hand. Closing offers the player's copy first, then deletes the pages. */
export function CoachActions({ playerId, startsOn, endsOn, moves }: { playerId: string; startsOn: string; endsOn: string; moves: { id: string; label: string }[] }) {
  const [move, setMove] = useState(moves[0]?.id ?? '')
  const [on, setOn] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [copy, setCopy] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function addMove() {
    const r = await fetch(`/api/journey/${playerId}/moves`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ move, on }) })
    if (r.ok) { setNote('Added.'); location.reload() } else setNote('That did not save.')
  }
  async function closeProgram() {
    const r = await fetch(`/api/journey/${playerId}/close`, { method: 'POST' })
    if (!r.ok) return setNote('That did not close.')
    const j = (await r.json()) as { copy: string }
    setCopy(j.copy || 'There were no pages.')
    setConfirming(false)
  }

  return (
    <section className="mt-8 space-y-6">
      <div>
        <h2 className="text-sm font-medium text-zinc-300">A move made on paper</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <select value={move} onChange={e => setMove(e.target.value)} className="rounded bg-zinc-800 px-2 py-1">
            {moves.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <input type="date" value={on} min={startsOn} max={endsOn} onChange={e => setOn(e.target.value)} className="rounded bg-zinc-800 px-2 py-1" />
          <button onClick={addMove} className="rounded bg-zinc-700 px-3 py-1">Add</button>
        </div>
      </div>
      <div>
        <h2 className="text-sm font-medium text-zinc-300">Close the program</h2>
        <p className="mt-1 text-sm text-zinc-400">The pages come back here once for the player&apos;s copy, then they are deleted. The furnishings, the woodpile, the places and the residents stay.</p>
        {copy === null ? (
          confirming
            ? <button onClick={closeProgram} className="mt-2 rounded bg-zinc-700 px-3 py-1 text-sm">Yes, close it and delete the pages</button>
            : <button onClick={() => setConfirming(true)} className="mt-2 rounded bg-zinc-700 px-3 py-1 text-sm">Close the program</button>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-zinc-300">Closed. Copy this for the player now; it is not kept.</p>
            <textarea readOnly value={copy} className="mt-2 h-48 w-full rounded bg-zinc-900 p-2 text-sm" />
          </div>
        )}
      </div>
      {note && <p className="text-sm text-zinc-400">{note}</p>}
    </section>
  )
}
