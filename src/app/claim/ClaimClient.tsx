'use client'

import { useEffect, useState } from 'react'
import { keepOntologyClaims } from '@/actions/ontology-claim'
import { decodeClaimCode, SATISFIED_NAME, SATISFIED_SENTENCES, type Claim } from '@/lib/ontology-game/claim-code'

export default function ClaimClient() {
  const [code, setCode] = useState<string | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [problem, setProblem] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const frag = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!frag) {
      setProblem('Nothing to keep here. Open this page from the game.')
      return
    }
    // The browser has no node:crypto, so the checksum is verified on the server when kept.
    // Here the body is only read so the player can see what they are about to keep.
    try {
      const rest = frag.replace(/^OAG2\./, '')
      const body = rest.slice(0, rest.lastIndexOf('.'))
      const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')))
      setClaims(
        payload.k.map((r: [number, string, string, string, string]) => ({
          at: r[0], channel: r[1], lens: r[2], named: r[3], words: r[4] || '',
        })),
      )
      setCode(frag)
    } catch {
      setProblem('This code did not copy cleanly.')
    }
  }, [])

  const keep = async () => {
    if (!code) return
    setBusy(true)
    const res = await keepOntologyClaims(code)
    setBusy(false)
    if (res.ok) setDone(res.written > 0 ? 'Kept.' : 'Already kept.')
    else setProblem(res.reason)
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '2rem 1rem' }}>
      {problem && <p role="alert">{problem}</p>}
      {claims.map((c, i) => (
        <section key={i} data-claim-card style={{ margin: '1rem 0', padding: '1rem', borderLeft: '4px solid #888' }}>
          <h2>{SATISFIED_NAME[c.channel] ?? c.channel}</h2>
          <p>{SATISFIED_SENTENCES[c.channel]?.[c.named]}</p>
          {c.words && <p><em>{c.words}</em></p>}
        </section>
      ))}
      {code && !done && (
        <button data-keep-claims onClick={keep} disabled={busy}>Keep these</button>
      )}
      {done && <p data-kept>{done}</p>}
    </main>
  )
}
