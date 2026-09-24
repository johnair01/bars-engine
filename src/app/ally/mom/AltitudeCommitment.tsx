'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveAltitudeCommitment } from '@/actions/family-support'

const roles = [
  ['shaman', 'Shaman', 'Protect the relationship; name when a pause is needed.'],
  ['challenger', 'Challenger', 'Test assumptions and ask what would change our minds.'],
  ['regent', 'Regent', 'Hold boundaries, approvals, and the weekly rhythm.'],
  ['architect', 'Architect', 'Work with scenarios, runway, and the plan.'],
  ['diplomat', 'Diplomat', 'Help negotiate terms and repair misunderstandings.'],
  ['sage', 'Sage', 'Keep independence and the longer relationship in view.'],
] as const

type Commitment = { id: string; altitude: string; handoffNote: string | null; participantId: string; participant: { displayName: string | null } }

export function AltitudeCommitment({ commitments, participantId }: { commitments: Commitment[]; participantId: string }) {
  const mine = commitments.find((commitment) => commitment.participantId === participantId)
  const [altitude, setAltitude] = useState(mine?.altitude ?? 'architect')
  const [handoffNote, setHandoffNote] = useState(mine?.handoffNote ?? '')
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const save = () => startTransition(async () => { const result = await saveAltitudeCommitment({ altitude, handoffNote }); setNotice(result.ok ? 'Your role and handoff note are shared with the room.' : result.error); if (result.ok) router.refresh() })
  return <section className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4"><h3 className="text-lg font-semibold">Choose how you want to engage</h3><p className="mt-1 text-sm leading-6 text-[#aaa3af]">This is a role preference, not an obligation. You can change it or hand off a concern at any time.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{roles.map(([key, title, body]) => <button type="button" key={key} onClick={() => setAltitude(key)} className={`rounded-lg border p-3 text-left ${altitude === key ? 'border-[#d4a017] bg-[#d4a017]/10' : 'border-white/10'}`}><span className="font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-[#aaa3af]">{body}</span></button>)}</div><label className="mt-4 grid gap-1 text-sm font-medium">Optional handoff or concern<textarea value={handoffNote} onChange={(event) => setHandoffNote(event.target.value)} className="min-h-16 rounded-lg border border-white/15 bg-[#100e14] px-3 py-2 font-normal" placeholder="What should be held by a different role or revisited together?" /></label><button disabled={pending} onClick={save} className="mt-4 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:opacity-60">Save role</button>{notice && <p role="status" className="mt-3 text-sm text-[#f7e0a0]">{notice}</p>}{commitments.length > 0 && <div className="mt-4 border-t border-white/10 pt-3 text-sm"><p className="font-semibold">Roles in the room</p>{commitments.map((commitment) => <p className="mt-2 text-[#d7d0da]" key={commitment.id}>{commitment.participant.displayName || 'Room participant'}: <span className="capitalize">{commitment.altitude}</span>{commitment.handoffNote ? ` — ${commitment.handoffNote}` : ''}</p>)}</div>}</section>
}
