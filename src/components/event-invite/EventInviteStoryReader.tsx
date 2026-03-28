'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { EventInviteEndingCta, EventInviteStory } from '@/lib/event-invite-story/schema'
import { EVENT_INVITE_DEFAULT_CTAS } from '@/lib/event-invite-story/default-cta'
import { CopyableProse } from '@/components/ui/CopyableProse'
import { CopyTextButton } from '@/components/ui/CopyTextButton'
import { submitAllyshipIntake } from '@/actions/allyship-intake'

export type { EventInviteEndingCta }

export type AllyshipChoiceStep = {
    passageId: string
    choiceLabel: string
    nextPassageId: string
}

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
    /** ECI: persist interview path when guest reaches an ending (Thunder / allyship-intake-* stories). */
    barId?: string
    persistAllyshipIntake?: boolean
    /** From invite URL `?note=` — stored on intake for stewards. */
    senderNote?: string | null
}

function intakeStorageKey(barId: string, storyId: string) {
    return `eci-intake-submitted:${barId}:${storyId}`
}

export function EventInviteStoryReader({
    barTitle,
    barDescription,
    story,
    initialPassageId,
    footerNote,
    endingCtas,
    barId,
    persistAllyshipIntake = false,
    senderNote = null,
}: Props) {
    const byId = useMemo(() => new Map(story.passages.map((p) => [p.id, p])), [story.passages])
    const effectiveStart = initialPassageId ?? story.start
    const [currentId, setCurrentId] = useState(effectiveStart)
    const [history, setHistory] = useState<string[]>([])
    const [choiceSteps, setChoiceSteps] = useState<AllyshipChoiceStep[]>([])
    const [clientSessionId, setClientSessionId] = useState<string | undefined>(undefined)

    useEffect(() => {
        setCurrentId(effectiveStart)
        setHistory([])
        setChoiceSteps([])
    }, [effectiveStart, story.id])

    useEffect(() => {
        if (!persistAllyshipIntake || !barId || typeof window === 'undefined') return
        const k = `allyship-intake-csid-${barId}`
        let v = localStorage.getItem(k)
        if (!v) {
            v = crypto.randomUUID()
            localStorage.setItem(k, v)
        }
        setClientSessionId(v)
    }, [persistAllyshipIntake, barId])

    const passage = byId.get(currentId)

    useEffect(() => {
        if (!passage?.ending || !persistAllyshipIntake || !barId) return
        if (typeof window === 'undefined') return
        const sk = intakeStorageKey(barId, story.id)
        const existing = sessionStorage.getItem(sk)
        if (existing && existing !== 'pending') return
        if (existing === 'pending') return
        sessionStorage.setItem(sk, 'pending')

        void (async () => {
            const r = await submitAllyshipIntake({
                barId,
                storyId: story.id,
                endingPassageId: currentId,
                steps: choiceSteps,
                clientSessionId,
                senderNote: senderNote ?? undefined,
            })
            if (r.ok) {
                sessionStorage.setItem(sk, r.id)
            } else {
                sessionStorage.removeItem(sk)
                console.warn('[allyship-intake]', r.error)
            }
        })()
    }, [
        passage?.ending,
        persistAllyshipIntake,
        barId,
        story.id,
        currentId,
        choiceSteps,
        clientSessionId,
        senderNote,
    ])

    if (!passage) {
        const misconfiguredMsg = 'Story is misconfigured (missing passage). Please try again later.'
        return (
            <div className="flex justify-end items-start gap-2">
                <p className="text-red-400 text-sm flex-1">{misconfiguredMsg}</p>
                <CopyTextButton text={misconfiguredMsg} aria-label="Copy message" />
            </div>
        )
    }

    const restart = () => {
        setHistory([])
        setChoiceSteps([])
        setCurrentId(effectiveStart)
        if (typeof window !== 'undefined' && barId) {
            sessionStorage.removeItem(intakeStorageKey(barId, story.id))
        }
    }

    const goToPassage = (nextId: string, choiceLabel: string) => {
        setChoiceSteps((s) => [...s, { passageId: currentId, choiceLabel, nextPassageId: nextId }])
        setHistory((h) => [...h, currentId])
        setCurrentId(nextId)
    }

    const goBack = () => {
        setHistory((h) => {
            if (h.length === 0) return h
            const prev = h[h.length - 1]!
            setCurrentId(prev)
            setChoiceSteps((st) => st.slice(0, -1))
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
                <div className="flex justify-end max-w-lg mx-auto w-full">
                    <CopyTextButton
                        text={barDescription.trim() ? `${barTitle}\n\n${barDescription}` : barTitle}
                        aria-label="Copy event title and description"
                    />
                </div>
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
                <CopyableProse
                    textToCopy={passage.text}
                    copyAriaLabel="Copy passage text"
                    className="prose prose-invert prose-zinc prose-sm max-w-none"
                >
                    <ReactMarkdown>{passage.text}</ReactMarkdown>
                </CopyableProse>

                {passage.ending ? (
                    <div className="mt-8 pt-6 border-t border-zinc-800 space-y-4">
                        <div className="flex justify-end">
                            <CopyTextButton
                                text={`Your path\n\n${passage.ending.role}\n\n${passage.ending.description}`}
                                aria-label="Copy ending summary"
                            />
                        </div>
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
                                onClick={() => goToPassage(c.next, c.label)}
                                className="w-full text-left px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 hover:border-amber-700/60 hover:bg-zinc-800 text-zinc-100 text-sm font-medium transition-colors"
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {footerNote !== null ? (
                <div className="flex flex-col items-center gap-1 max-w-lg mx-auto">
                    <div className="flex justify-end w-full">
                        <CopyTextButton
                            text={
                                footerNote ??
                                'No account needed for this preview. Save the link for April 5.'
                            }
                            aria-label="Copy footer note"
                        />
                    </div>
                    <p className="text-center text-[10px] text-zinc-600">
                        {footerNote ??
                            'No account needed for this preview. Save the link for April 5.'}
                    </p>
                </div>
            ) : null}
        </div>
    )
}
