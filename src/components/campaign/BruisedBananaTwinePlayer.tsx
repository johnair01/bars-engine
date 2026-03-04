'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'
import { parseTwee } from '@/lib/twee-parser'
import {
    extractTokenSets,
    findInputSpecs,
    replaceInputPlaceholders,
} from '@/lib/onboarding-tokens'
import { createOnboardingBar } from '@/actions/onboarding-bar'
import { CampaignAuthForm } from '@/app/campaign/components/CampaignAuthForm'
import type { ParsedPassage } from '@/lib/twine-parser'

const CAMPAIGN_ID = 'bruised-banana'
const EXTERNAL_DONATE_PLACEHOLDER = 'EXTERNAL_DONATE_URL'

async function logOnboardingEvent(event: string, payload?: Record<string, unknown>) {
    try {
        await fetch('/api/onboarding/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, payload: { ...payload, campaignId: CAMPAIGN_ID } }),
        })
    } catch {
        // Best-effort logging
    }
}

interface BruisedBananaTwinePlayerProps {
    tweeSource: string
}

export function BruisedBananaTwinePlayer({ tweeSource }: BruisedBananaTwinePlayerProps) {
    const router = useRouter()
    const [story, setStory] = useState<ReturnType<typeof parseTwee> | null>(null)
    const [currentPassage, setCurrentPassage] = useState<ParsedPassage | null>(null)
    const [state, setState] = useState<Record<string, string>>({})
    const [history, setHistory] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [showSignup, setShowSignup] = useState(false)

    useEffect(() => {
        const parsed = parseTwee(tweeSource)
        setStory(parsed)
        const start = parsed.passages.find((p) => p.name === parsed.startPassage) ?? parsed.passages[0]
        if (start) setCurrentPassage(start)
    }, [tweeSource])

    const applyPassage = useCallback(
        (passage: ParsedPassage) => {
            const { displayText, tokenSets } = extractTokenSets(passage.text)
            const updates: Record<string, string> = {}
            for (const { key, value } of tokenSets) {
                updates[key] = value
            }
            setState((s) => ({ ...s, ...updates }))

            // Fire analytics based on passage
            if (passage.name.startsWith('SetLens') && updates.lens) {
                logOnboardingEvent('onboarding_lens_selected', { lens: updates.lens })
            }
            if (passage.name.startsWith('Quadrant') && updates.quadrant) {
                logOnboardingEvent('onboarding_quadrant_selected', { quadrant: updates.quadrant })
            }
            if (passage.name.startsWith('GM_') && updates.gm) {
                logOnboardingEvent('onboarding_gm_selected', { gm: updates.gm })
            }
            if (passage.name.startsWith('KB_')) {
                logOnboardingEvent('onboarding_kb_opened', { kb_page: passage.name })
            }
            if (passage.name.startsWith('Donate_') && !passage.name.includes('DonateSmall') && !passage.name.includes('DonateMedium') && !passage.name.includes('DonateLarge')) {
                if (updates.donationSource) {
                    logOnboardingEvent('onboarding_donate_intent_started', { donationSource: updates.donationSource })
                }
            }
            if (passage.name === 'DonateSmall' || passage.name === 'DonateMedium' || passage.name === 'DonateLarge') {
                if (updates.donationTier) {
                    logOnboardingEvent('onboarding_donate_tier_selected', {
                        donationSource: state.donationSource,
                        donationTier: updates.donationTier,
                    })
                }
            }

            return displayText
        },
        [state.donationSource]
    )

    const navigateTo = useCallback(
        async (target: string, linkLabel?: string) => {
            if (!story) return
            setError(null)

            // Signup: show auth form
            if (target === 'Signup') {
                logOnboardingEvent('onboarding_signup_started', { lens: state.lens, gm: state.gm })
                setShowSignup(true)
                return
            }

            // Preview: open dashboard
            if (target === 'Preview') {
                logOnboardingEvent('onboarding_preview_opened', {})
                router.push('/')
                return
            }

            // External donate: intercept link click (handled in render)
            if (target.startsWith(EXTERNAL_DONATE_PLACEHOLDER)) {
                // This is handled by the link click handler
                return
            }

            // Publish it: create BAR (when navigating from Claim to Structure)
            const isPublishIt = target === 'Structure' && (linkLabel === 'Publish it' || history[history.length - 1] === 'Claim')
            if (isPublishIt) {
                const refinedSignal = state.refinedSignal?.trim()
                const lens = state.lens
                const quadrant = state.quadrant
                if (!refinedSignal || !lens || !quadrant) {
                    setError('Please complete the signal and quadrant steps first.')
                    return
                }
                setIsPending(true)
                const payload = {
                    title: refinedSignal.slice(0, 40),
                    content: refinedSignal,
                    rawSignal: state.rawSignal ?? refinedSignal,
                    lens,
                    quadrant,
                    campaignId: CAMPAIGN_ID,
                }
                const result = await createOnboardingBar(payload)
                setIsPending(false)
                if (result && 'error' in result) {
                    setError(result.error)
                    return
                }
                if (result && 'pending' in result && result.pending) {
                    setState((s) => ({
                        ...s,
                        barPublished: 'true',
                        pendingBar: JSON.stringify({
                            refinedSignal,
                            rawSignal: state.rawSignal ?? refinedSignal,
                            lens,
                            quadrant,
                            campaignId: CAMPAIGN_ID,
                        }),
                    }))
                } else if (result && 'barId' in result) {
                    setState((s) => ({ ...s, barPublished: 'true' }))
                }
                logOnboardingEvent('onboarding_bar_published', { lens, quadrant })
            }

            const next = story.passages.find((p) => p.name === target)
            if (!next) return

            // Structure entry: attach BAR to micro-quest (demo)
            if (next.name === 'Structure' && (state.barPublished === 'true' || isPublishIt)) {
                logOnboardingEvent('onboarding_microquest_attached', { questId: 'onboarding-micro-bruised-banana' })
                setState((s) => ({ ...s, barAttachedToQuest: 'true' }))
            }

            // Mint entry: vibeulon minted (demo)
            if (next.name === 'Mint') {
                logOnboardingEvent('onboarding_vibeulon_minted_demo', {})
                setState((s) => ({ ...s, vibeulonMinted: 'true' }))
            }

            setHistory((h) => [...h, currentPassage?.name ?? ''])
            const displayText = applyPassage(next)
            setCurrentPassage({ ...next, text: displayText, cleanText: displayText })
        },
        [story, state, history, currentPassage?.name, applyPassage, router]
    )

    const handleInputChange = useCallback((key: string, value: string) => {
        setState((s) => ({ ...s, [key]: value }))
        if (key === 'rawSignal') {
            logOnboardingEvent('onboarding_signal_entered', { lens: state.lens })
        }
        if (key === 'refinedSignal') {
            logOnboardingEvent('onboarding_refined_entered', {})
        }
    }, [state.lens])

    const handleExternalDonateClick = useCallback(async () => {
        logOnboardingEvent('onboarding_donate_clicked', {
            donationSource: state.donationSource,
            donationTier: state.donationTier,
            lens: state.lens,
            gm: state.gm,
        })
        const baseUrl = await fetch('/api/onboarding/donation-url')
            .then((r) => (r.ok ? r.json() : { url: null }))
            .then((d) => d?.url)
            .catch(() => null)
        const url = baseUrl || '/event/donate'
        const params = new URLSearchParams({
            source: state.donationSource ?? '',
            tier: state.donationTier ?? '',
            lens: state.lens ?? '',
            gm: state.gm ?? '',
            campaignId: CAMPAIGN_ID,
        })
        const fullUrl = url.startsWith('http') ? `${url}?${params.toString()}` : `${window.location.origin}${url}?${params.toString()}`
        window.open(fullUrl, '_blank', 'noopener,noreferrer')
    }, [state.donationSource, state.donationTier, state.lens, state.gm])

    if (showSignup) {
        let pendingBar: Record<string, string> | undefined
        try {
            pendingBar = state.pendingBar ? (JSON.parse(state.pendingBar) as Record<string, string>) : undefined
        } catch {
            pendingBar = undefined
        }
        const campaignState = {
            ref: CAMPAIGN_ID,
            lens: state.lens,
            gm: state.gm,
            quadrant: state.quadrant,
            rawSignal: state.rawSignal,
            refinedSignal: state.refinedSignal,
            barPublished: state.barPublished === 'true',
            pendingBar,
        }
        return <CampaignAuthForm campaignState={campaignState} />
    }

    if (!currentPassage || !story) {
        return <div className="text-zinc-500 animate-pulse p-8 text-center">Loading...</div>
    }

    const rawPassageText = (currentPassage as { text?: string }).text ?? currentPassage.cleanText
    const displayText = replaceInputPlaceholders(rawPassageText, (key) => `__INPUT_${key}__`)

    // Split content and inject inputs
    const parts: (string | { type: 'input'; key: string; placeholder?: string })[] = []
    const inputRegex = /__INPUT_([A-Za-z0-9_]+)__/g
    let lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = inputRegex.exec(displayText)) !== null) {
        if (m.index > lastIndex) {
            parts.push(displayText.slice(lastIndex, m.index))
        }
        const inputSpec = findInputSpecs(rawPassageText).find((s) => s.key === m![1])
        parts.push({ type: 'input', key: m[1], placeholder: inputSpec?.placeholder })
        lastIndex = m.index + m[0].length
    }
    if (lastIndex < displayText.length) parts.push(displayText.slice(lastIndex))

    const links = currentPassage.links ?? []
    const isExternalDonateLink = (t: string) => t.startsWith(EXTERNAL_DONATE_PLACEHOLDER)
    const externalDonateLink = links.find((l) => isExternalDonateLink(l.target))
    const normalLinks = links.filter((l) => !isExternalDonateLink(l.target) && l.target !== 'Signup' && l.target !== 'Preview')

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in relative min-h-[60vh] flex flex-col items-center justify-center p-8 border border-zinc-800 bg-zinc-950/50 rounded-2xl shadow-2xl">
            <div className="text-xs text-zinc-600 font-mono uppercase tracking-widest">{currentPassage.name}</div>

            <div className="prose prose-invert prose-lg max-w-none w-full text-left font-sans space-y-4">
                {parts.map((part, i) =>
                    typeof part === 'string' ? (
                        <ReactMarkdown
                            key={i}
                            components={{
                                a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                                        {children}
                                    </a>
                                ),
                            }}
                        >
                            {part}
                        </ReactMarkdown>
                    ) : (
                        <div key={i} className="my-4">
                            <input
                                type="text"
                                value={state[part.key] ?? ''}
                                onChange={(e) => handleInputChange(part.key, e.target.value)}
                                placeholder={part.placeholder ?? ''}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            />
                        </div>
                    )
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg w-full">{error}</div>
            )}

            <div className="w-full pt-8 flex flex-col gap-3 max-w-md">
                {normalLinks.map((link, i) => (
                    <button
                        key={i}
                        onClick={() => navigateTo(link.target, link.label)}
                        disabled={isPending}
                        className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm flex justify-between items-center group relative overflow-hidden"
                    >
                        <span className="relative z-10">{link.label}</span>
                        <span className="text-purple-500/0 group-hover:text-purple-500 transition-colors relative z-10">→</span>
                    </button>
                ))}
                {externalDonateLink && (
                    <button
                        onClick={handleExternalDonateClick}
                        disabled={isPending}
                        className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm flex justify-between items-center group relative overflow-hidden"
                    >
                        <span className="relative z-10">{externalDonateLink.label}</span>
                        <span className="text-purple-500/0 group-hover:text-purple-500 transition-colors relative z-10">→</span>
                    </button>
                )}
                {links.some((l) => l.target === 'Signup') && !normalLinks.some((l) => l.target === 'Signup') && (
                    <button
                        onClick={() => navigateTo('Signup')}
                        disabled={isPending}
                        className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm"
                    >
                        Join the Beta Instance →
                    </button>
                )}
                {links.some((l) => l.target === 'Preview') && !normalLinks.some((l) => l.target === 'Preview') && (
                    <button
                        onClick={() => navigateTo('Preview')}
                        disabled={isPending}
                        className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm"
                    >
                        Look around first →
                    </button>
                )}
            </div>

            {history.length > 0 && (
                <button
                    onClick={() => {
                        const prev = history[history.length - 1]
                        setHistory((h) => h.slice(0, -1))
                        const p = story.passages.find((x) => x.name === prev)
                        if (p) {
                            const { displayText: dt } = extractTokenSets(p.text)
                            setCurrentPassage({ ...p, text: dt, cleanText: dt })
                        }
                    }}
                    className="py-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors"
                >
                    ← Back
                </button>
            )}
        </div>
    )
}
