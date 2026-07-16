'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CarouselComposer } from '@/components/raise-awareness/CarouselComposer'
import { loadBriefSession, saveBriefSession, type BriefSessionV1 } from '@/lib/card-to-carousel/session'

export function RaiseAwarenessClient() {
  const [session, setSession] = useState<BriefSessionV1 | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('brief') === 'card-to-carousel' ? loadBriefSession() : null
  })
  if (!session?.post) return <CarouselComposer />
  return <><div className="bg-[#111018] px-4 py-3 text-center text-sm text-zinc-300"><Link className="text-[#e7c98a] underline" href={`/admin/campaigns/${session.brief.campaignId}/brief`}>← Return to brief</Link><span className="ml-3">Source: {session.brief.source.perspective} · {session.brief.source.note}</span></div><CarouselComposer key={session.updatedAt} initialPost={session.post} onPostChange={(post) => { const next = { ...session, post, updatedAt: new Date().toISOString() }; setSession(next); saveBriefSession(next) }} /></>
}
