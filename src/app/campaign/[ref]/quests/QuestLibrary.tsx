'use client'

/**
 * QuestLibrary — the campaign's authored quests with queryable alignment tags.
 * Spec: campaign-lead-forge Phase 7.
 */
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { archiveQuest, type AuthoredQuestRow } from '@/actions/quest-studio'
import { getDomainLabel } from '@/lib/allyship-domains'

const DOMAIN_COLOR: Record<string, string> = {
  GATHERING_RESOURCES: '#d4a017',
  DIRECT_ACTION: '#e05a3d',
  RAISE_AWARENESS: '#86b8cc',
  SKILLFUL_ORGANIZING: '#46b06f',
}

export function QuestLibrary({
  quests: initial,
  basePath,
}: {
  quests: AuthoredQuestRow[]
  basePath: string
}) {
  const router = useRouter()
  const [quests, setQuests] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function archive(id: string) {
    setErr(null)
    setBusyId(id)
    startTransition(async () => {
      const res = await archiveQuest(id)
      setBusyId(null)
      if (res.ok) {
        setQuests((qs) => qs.filter((q) => q.id !== id))
        router.refresh()
      } else setErr(res.error)
    })
  }

  return (
    <main
      className="min-h-screen px-4 pb-20 pt-8 sm:px-6"
      style={{ background: 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)' }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase" style={{ letterSpacing: '.28em', color: '#d4a017', fontFamily: 'var(--bars-font-mono)' }}>
              Quest library
            </span>
            <h1 className="mt-1 text-[26px] font-bold text-[#f4f2ec] sm:text-[30px]">Your campaign quests</h1>
          </div>
          <Link href={`${basePath}/new`} className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white" style={{ background: '#8b5cf6' }}>
            + New quest
          </Link>
        </header>

        {err && <p className="text-[13px] text-red-400">{err}</p>}

        {quests.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] p-6 text-center text-[13px] text-[#6b6862]">
            No authored quests yet. Compose your first — aligned to a myth, a superpower, and a face.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {quests.map((q) => (
              <li key={q.id} className="flex flex-col gap-2 rounded-2xl border border-white/[0.07] p-4" style={{ background: '#121210' }}>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[15px] font-bold text-[#f4f2ec]">{q.title}</span>
                  <button onClick={() => archive(q.id)} disabled={pending && busyId === q.id} className="text-[12px] text-[#a09e98] disabled:opacity-40">
                    {pending && busyId === q.id ? '…' : 'Archive'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {q.domain && (
                    <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: DOMAIN_COLOR[q.domain] ?? '#a09e98', borderColor: `${DOMAIN_COLOR[q.domain] ?? '#a09e98'}55` }}>
                      {getDomainLabel(q.domain)}
                    </span>
                  )}
                  {q.mythId && <span className="rounded-full border border-white/12 px-2 py-0.5 text-[10px] uppercase text-[#a09e98]">myth · {q.mythId}</span>}
                  {q.superpower && <span className="rounded-full border border-white/12 px-2 py-0.5 text-[10px] uppercase text-[#b6a3f5]">⚡ {q.superpower}</span>}
                  {q.gmFace && <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase" style={{ color: '#e05a3d', borderColor: 'rgba(224,90,61,0.4)' }}>face · {q.gmFace}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
