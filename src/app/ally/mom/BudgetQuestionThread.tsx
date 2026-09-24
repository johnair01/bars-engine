'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { answerBudgetLineQuestion } from '@/actions/family-support'

type Question = { id: string; body: string; status: string; participant: { displayName: string | null }; answers: { id: string; body: string; participant: { displayName: string | null } }[] }

export function BudgetQuestionThread({ questions }: { questions: Question[] }) {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState<string | null>(null)
  if (questions.length === 0) return null
  const answer = (questionId: string) => startTransition(async () => {
    const result = await answerBudgetLineQuestion({ questionId, body: drafts[questionId] ?? '' })
    setNotice(result.ok ? 'Answer shared with the room.' : result.error)
    if (result.ok) { setDrafts((current) => ({ ...current, [questionId]: '' })); router.refresh() }
  })
  return <div className="grid gap-3"><p className="text-sm font-semibold">Shared questions</p>{questions.map((question) => <div key={question.id} className="rounded-xl border border-white/10 p-3 text-sm"><p>{question.body}</p><p className="mt-1 text-xs text-[#aaa3af]">{question.participant.displayName || 'Room participant'} · {question.status}</p>{question.answers.map((answer) => <div key={answer.id} className="mt-3 border-l-2 border-[#d4a017]/50 pl-3"><p>{answer.body}</p><p className="mt-1 text-xs text-[#aaa3af]">{answer.participant.displayName || 'Room participant'}</p></div>)}<textarea value={drafts[question.id] ?? ''} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: event.target.value }))} className="mt-3 min-h-16 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm" placeholder="Add a shared answer…" /><button disabled={pending || (drafts[question.id] ?? '').trim().length < 2} onClick={() => answer(question.id)} className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold disabled:opacity-60">Post answer</button></div>)}{notice && <p role="status" className="text-sm text-[#f7e0a0]">{notice}</p>}</div>
}
