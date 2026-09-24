'use client'

import { useState, useTransition } from 'react'
import { publishReflectionSynthesis, savePrivateReflection } from '@/actions/family-support'

type Reflection = Record<string, string | null | undefined>
type Synthesis = { id: string; participantId: string; publishedSynthesis: string | null; participant: { displayName: string | null } }

const stages = [
  { title: 'Face It · third person', note: 'Meet the charged experience as something you can see.', fields: [['chargeDescription', 'There is something I’m carrying. When I sit with it, I notice…'], ['maskShape', 'If I look at this thing closely, I see…'], ['maskName', 'I’ll call this part of me…']] },
  { title: 'Talk to It · second person', note: 'Let the part name its own logic without agreeing with it.', fields: [['desire', 'I want…'], ['desireOutcome', 'If I got that, then I would have…'], ['lifeState', 'From the perspective of this part, life is…'], ['rootCause', 'For this part to be settled, it would need…'], ['fear', 'At the bottom of it all, I am afraid that…'], ['somaticEcho', 'Optional: where do I feel this part in my body?']] },
  { title: 'Be It · first person', note: 'Let the part speak, then notice what changes when it is held with awareness.', fields: [['interiorVoice', 'I am here, and I want you to know…'], ['integrationShift', 'When I hold this presence with awareness, I notice…'], ['alignedAction', 'One aligned action I can take is…']] },
] as const

export function Reflection321({ initial, shared }: { initial: Reflection | null; shared: Synthesis[] }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(stages.flatMap((stage) => stage.fields).map(([key]) => [key, initial?.[key] ?? ''])))
  const [synthesis, setSynthesis] = useState(initial?.publishedSynthesis ?? '')
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const save = () => startTransition(async () => { const result = await savePrivateReflection(values); setNotice(result.ok ? 'Saved privately. No one else in the room can read these entries.' : result.error ?? 'Unable to save your reflection.') })
  const share = () => startTransition(async () => { const result = await publishReflectionSynthesis({ synthesis }); setNotice(result.ok ? 'Your selected synthesis is now shared. Your full reflection remains private.' : result.error ?? 'Unable to share your synthesis.') })
  return <div className="grid gap-4">
    <section className="rounded-2xl border border-[#d4a017]/30 bg-[#19151f] p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d4a017]">Optional private practice</p><h2 className="mt-2 text-2xl font-semibold">3·2·1: Face It, Talk to It, Be It</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#c6c0ca]">This is your own reflection. It is not visible to Wendell or the other parent. You can pause, leave fields blank, or return to the decision at any time.</p></section>
    {stages.map((stage) => <section key={stage.title} className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5"><h3 className="text-lg font-semibold">{stage.title}</h3><p className="mt-1 text-sm text-[#aaa3af]">{stage.note}</p><div className="mt-4 grid gap-3">{stage.fields.map(([key, prompt]) => <label key={key} className="grid gap-1 text-sm font-medium"><span>{prompt}</span><textarea value={values[key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="min-h-20 rounded-xl border border-white/15 bg-black/20 px-3 py-2 font-normal leading-6 outline-none focus:border-[#d4a017]" /></label>)}</div></section>)}
    <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5"><h3 className="text-lg font-semibold">Share only a chosen synthesis</h3><p className="mt-1 text-sm leading-6 text-[#aaa3af]">If you want to add something to the shared conversation, write it here. This is separate from—and does not reveal—your private entries above.</p><textarea value={synthesis} onChange={(event) => setSynthesis(event.target.value)} className="mt-4 min-h-24 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 leading-6 outline-none focus:border-[#d4a017]" placeholder="What feels useful to share?" /><div className="mt-4 flex flex-wrap gap-3"><button disabled={pending} onClick={save} className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold disabled:opacity-60">Save private reflection</button><button disabled={pending || synthesis.trim().length < 2} onClick={share} className="rounded-xl bg-[#7452b8] px-4 py-3 text-sm font-semibold disabled:opacity-60">Share this synthesis</button></div>{notice && <p role="status" className="mt-3 text-sm text-[#f7e0a0]">{notice}</p>}</section>
    {shared.length > 0 && <section className="rounded-2xl border border-white/10 bg-[#19151f]/90 p-5"><h3 className="text-lg font-semibold">Shared syntheses</h3><div className="mt-3 grid gap-3">{shared.map((item) => <div key={item.id} className="rounded-xl bg-black/20 p-3 text-sm leading-6"><p>{item.publishedSynthesis}</p><p className="mt-1 text-xs text-[#aaa3af]">Shared by {item.participant.displayName || 'a room participant'}</p></div>)}</div></section>}
  </div>
}
