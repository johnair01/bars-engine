'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'
import { parseTwee } from '@/lib/twee-parser'
import {
    extractTokenSets,
    findInputSpecs,
    interpolate,
    replaceInputPlaceholders,
} from '@/lib/onboarding-tokens'
import { createOnboardingBar } from '@/actions/onboarding-bar'
import { CampaignAuthForm } from '@/app/campaign/components/CampaignAuthForm'
import { applyCampaignStateFormAction } from '@/app/campaign/actions/campaign'
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
    hasPlayer?: boolean
}

export function BruisedBananaTwinePlayer({ tweeSource, hasPlayer = false }: BruisedBananaTwinePlayerProps) {
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

    /** Extract event names from passage tags, e.g. emits:nation_selected or emits:bar_created intended_impact_bar_attached */
    const extractEmitsFromTags = useCallback((tags: string[]) => {
        const emitTag = tags.find((t) => t.startsWith('emits:'))
        if (!emitTag) return []
        const value = emitTag.slice(6).trim()
        return value ? value.split(/\s+/).filter(Boolean) : []
    }, [])

    const applyPassage = useCallback(
        (passage: ParsedPassage) => {
            const { displayText, tokenSets } = extractTokenSets(passage.text)
            const updates: Record<string, string> = {}
            for (const { key, value } of tokenSets) {
                updates[key] = value
            }
            setState((s) => ({ ...s, ...updates }))

            // Flow-simulator-aligned events (bruised-banana-onboarding-draft)
            if (passage.name === 'Arrival') {
                logOnboardingEvent('orientation_viewed', {})
            }
            const tags = passage.tags ?? []
            const emits = extractEmitsFromTags(tags)
            const isChoiceResult = tags.some((t) => t === 'choice' || t.includes('emotional-alchemy'))
            const isResultFromChoice = tags.some((t) => t === 'result')

            if (isChoiceResult || isResultFromChoice) {
                logOnboardingEvent('choice_selected', { passage: passage.name, ...updates })
            } else if (emits.length === 0 && !passage.name.startsWith('SetLens') && !passage.name.startsWith('Quadrant') && !passage.name.startsWith('GM_') && !passage.name.startsWith('Donate')) {
                logOnboardingEvent('prompt_viewed', { passage: passage.name })
            }

            for (const ev of emits) {
                if (ev === 'bar_created' || ev === 'intended_impact_bar_attached') continue
                logOnboardingEvent(ev, { passage: passage.name, ...updates })
            }

            // Legacy flow (bruise-banana-initiation)
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
        [state.donationSource, extractEmitsFromTags]
    )

    const navigateTo = useCallback(
        async (target: string, linkLabel?: string) => {
            if (!story) return
            setError(null)

            // BeginPlay: redirect to sign-in or dashboard (bruised-banana-onboarding-draft)
            if (target === 'BeginPlay') {
                logOnboardingEvent('begin_play', {})
                if (hasPlayer) {
                    router.push('/')
                    return
                }
                setShowSignup(true)
                return
            }

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

            // Create a BAR → Onboarding Complete: create BAR first (bruised-banana-onboarding-draft)
            const isBarSubmit = target === 'Onboarding Complete' && (currentPassage?.name === 'Create a BAR' || history[history.length - 1] === 'Create a BAR')
            if (isBarSubmit) {
                const barContent = state.barContent?.trim()
                if (!barContent) {
                    setError('Please share what you\'d like to see become possible through your participation.')
                    return
                }
                setIsPending(true)
                try {
                    const payload = {
                        title: barContent.slice(0, 40),
                        content: barContent,
                        rawSignal: barContent,
                        lens: state.developmental_lens ?? state.gm ?? '',
                        quadrant: state.intended_impact ?? '',
                        campaignId: CAMPAIGN_ID,
                    }
                    const result = await createOnboardingBar(payload)
                    if (result && 'error' in result) {
                        setError(result.error)
                        return
                    }
                    if (result && 'pending' in result && result.pending) {
                        setState((s) => ({
                            ...s,
                            barPublished: 'true',
                            pendingBar: JSON.stringify({
                                barContent,
                                nation: state.nation,
                                archetype: state.archetype,
                                developmental_lens: state.developmental_lens,
                                gm: state.gm,
                                intended_impact: state.intended_impact,
                                campaignId: CAMPAIGN_ID,
                            }),
                        }))
                    } else if (result && 'barId' in result) {
                        setState((s) => ({ ...s, barPublished: 'true' }))
                    }
                    logOnboardingEvent('bar_created', {})
                    logOnboardingEvent('intended_impact_bar_attached', {})
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to place BAR. Please try again.')
                } finally {
                    setIsPending(false)
                }
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
                try {
                    const payload = {
                        title: refinedSignal.slice(0, 40),
                        content: refinedSignal,
                        rawSignal: state.rawSignal ?? refinedSignal,
                        lens,
                        quadrant,
                        campaignId: CAMPAIGN_ID,
                    }
                    const result = await createOnboardingBar(payload)
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
                } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to publish BAR. Please try again.')
                } finally {
                    setIsPending(false)
                }
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
        [story, state, history, currentPassage?.name, applyPassage, router, hasPlayer]
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
            emotional_alchemy: state.emotional_alchemy,
            nation: state.nation,
            playbook: state.playbook,
            archetype: state.archetype,
            developmental_lens: state.developmental_lens,
            intended_impact: state.intended_impact,
        }

        if (hasPlayer) {
            return (
                <div className="w-full max-w-md mx-auto bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">✨</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Continue to Campaign</h1>
                        <p className="text-zinc-400 text-sm">You&apos;re already signed in. Apply your campaign choices and unlock quests.</p>
                    </div>
                    <form action={applyCampaignStateFormAction as unknown as (formData: FormData) => Promise<void>} className="space-y-4">
                        <input type="hidden" name="campaignState" value={JSON.stringify(campaignState)} />
                        <button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-purple-900/20"
                        >
                            Continue to campaign →
                        </button>
                    </form>
                </div>
            )
        }

        return <CampaignAuthForm campaignState={campaignState} />
    }

    if (!currentPassage || !story) {
        return <div className="text-zinc-500 animate-pulse p-8 text-center">Loading...</div>
    }

    // Prefer cleanText (strips [[links]]) over raw text to avoid showing [[Continue|...]] artifacts
    const rawPassageText = currentPassage.cleanText ?? (currentPassage as { text?: string }).text ?? ''
    const displayText = replaceInputPlaceholders(rawPassageText, (key) => `__INPUT_${key}__`)

    // Emotional-alchemy copy variation: {{key}} and {{emotional_alchemy_framing}} from state
    const displayState = { ...state }
    const framing: Record<string, string> = {
        aligned: "You're ready to place your intention.",
        curious: "Name what draws you—you can refine it as you go.",
        skeptical: "Try it. The next steps are simple enough to test whether the structure holds.",
    }
    displayState.emotional_alchemy_framing = state.emotional_alchemy ? (framing[state.emotional_alchemy] ?? '') : ''

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
                            {interpolate(part, displayState)}
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

            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                {isPending && (
                    <span className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Placing…
                    </span>
                )}
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
                        disabled={isPending}
                        className="py-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Back
                    </button>
                )}
            </div>
        </div>
    )
}
