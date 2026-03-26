'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { EventInviteEndingCta, EventInviteStory } from '@/lib/event-invite-story/schema'
import { EVENT_INVITE_DEFAULT_CTAS } from '@/lib/event-invite-story/default-cta'

export type { EventInviteEndingCta }

type Props = {
    barTitle: string
    barDescription: string
    story: EventInviteStory
    /** When set (e.g. server branch for returning players), overrides `story.start` for initial passage and restart. */
    initialPassageId?: string
    /** `undefined` = default footer; `null` = hide; string = custom note */
    footerNote?: string | null
    /** Override default ending CTAs (Partiful, donate, hub, etc.) */
    endingCtas?: readonly EventInviteEndingCta[]
}

export function EventInviteStoryReader({
    barTitle,
    barDescription,
    story,
    initialPassageId,
    footerNote,
    endingCtas,
}: Props) {
    const byId = useMemo(() => new Map(story.passages.map((p) => [p.id, p])), [story.passages])
    const effectiveStart = initialPassageId ?? story.start
    const [currentId, setCurrentId] = useState(effectiveStart)
    const [history, setHistory] = useState<string[]>([])

    useEffect(() => {
        setCurrentId(effectiveStart)
        setHistory([])
    }, [effectiveStart, story.id])

    const passage = byId.get(currentId)
    if (!passage) {
        return (
            <p className="text-red-400 text-sm">Story is misconfigured (missing passage). Please try again later.</p>
        )
    }

    const restart = () => {
        setHistory([])
        setCurrentId(effectiveStart)
    }

    const goToPassage = (nextId: string) => {
        setHistory((h) => [...h, currentId])
        setCurrentId(nextId)
    }

    const goBack = () => {
        setHistory((h) => {
            if (h.length === 0) return h
            const prev = h[h.length - 1]!
            setCurrentId(prev)
            return h.slice(0, -1)
        })
    }

    const blocksBack = !!(passage.ending || passage.confirmation)
    const canGoBack = history.length > 0 && !blocksBack

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <header className="text-center space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Event invite</p>
                <h1 className="text-2xl font-bold text-white">{barTitle}</h1>
                {barDescription ? (
                    <p className="text-sm text-zinc-500 max-w-lg mx-auto">{barDescription}</p>
                ) : null}
            </header>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8">
                {canGoBack ? (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={goBack}
                            className="text-xs text-zinc-500 hover:text-amber-400/90 underline underline-offset-2"
                        >
                            ← Back
                        </button>
                    </div>
                ) : null}
                <div className="prose prose-invert prose-zinc prose-sm max-w-none">
                    <ReactMarkdown>{passage.text}</ReactMarkdown>
                </div>

                {passage.ending ? (
                    <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
                        <p className="text-xs uppercase tracking-widest text-purple-400">Your path</p>
                        <p className="text-lg font-semibold text-white">{passage.ending.role}</p>
                        <p className="text-zinc-400 text-sm">{passage.ending.description}</p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                            {(endingCtas ?? EVENT_INVITE_DEFAULT_CTAS).map((c) => (
                                <Link
                                    key={c.href}
                                    href={c.href}
                                    className={`inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${c.className}`}
                                >
                                    {c.label}
                                </Link>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={restart}
                            className="text-xs text-zinc-600 hover:text-zinc-400 underline underline-offset-2"
                        >
                            Play through again
                        </button>
                    </div>
                ) : (
                    <div className="mt-8 flex flex-col gap-3">
                        {passage.choices?.map((c) => (
                            <button
                                key={c.next + c.label}
                                type="button"
                                onClick={() => goToPassage(c.next)}
                                className="w-full text-left px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 hover:border-amber-700/60 hover:bg-zinc-800 text-zinc-100 text-sm font-medium transition-colors"
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {footerNote !== null ? (
                <p className="text-center text-[10px] text-zinc-600">
                    {footerNote ??
                        'No account needed for this preview. Save the link for April 5.'}
                </p>
            ) : null}
        </div>
    )
}
