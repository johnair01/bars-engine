'use client'

import { useEffect, useState } from 'react'
import { keepOntologyClaims, previewOntologyClaims } from '@/actions/ontology-claim'

type View = { title: string; sentence: string; words: string }

export function ClaimCarry({ signedIn }: { signedIn: boolean }) {
  const [code, setCode] = useState('')
  const [views, setViews] = useState<View[] | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    let c = window.location.hash.slice(1)
    try { if (!c) c = sessionStorage.getItem('oag-claim-code') || ''; else sessionStorage.setItem('oag-claim-code', c) } catch {}
    setCode(c)
    if (!c) return
    previewOntologyClaims(c).then((r) => {
      if ('views' in r && r.views) setViews(r.views)
      else if ('error' in r && r.error) setError(r.error)
    })
  }, [])

  const keep = async () => {
    const r = await keepOntologyClaims(code)
    if ('error' in r && r.error) setError(r.error)
    else if ('ok' in r) {
      try { sessionStorage.removeItem('oag-claim-code') } catch {}
      setDone(r.written === 0 ? 'Already kept.' : 'Kept.')
    }
  }

  return (
    <main className="mx-auto max-w-xl min-h-screen space-y-4 bg-zinc-950 p-6 text-zinc-100">
      {views && views.length > 0 && !done && (
        <>
          {views.map((v, i) => (
            <section key={i} className="rounded-lg border border-zinc-700 p-4">
              <h2 className="text-2xl font-semibold">{v.title}</h2>
              <p className="mt-2">{v.sentence}</p>
              {v.words && <p className="mt-2 italic opacity-80">{v.words}</p>}
            </section>
          ))}
          {signedIn ? (
            <button className="rounded bg-emerald-600 px-4 py-2" onClick={keep}>Keep these</button>
          ) : (
            <a className="rounded bg-emerald-600 px-4 py-2 inline-block" href="/login?returnTo=/claim">Sign in to keep these</a>
          )}
        </>
      )}
      {done && <p>{done}</p>}
      {error && <p role="alert" className="text-red-400">{error}</p>}
      {!code && !error && <p>Nothing to carry here. Press "Carry this to the engine" at the end of a cycle in the game.</p>}
    </main>
  )
}
