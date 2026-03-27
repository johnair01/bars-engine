'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { CampaignAuthForm } from './CampaignAuthForm'
import { OnboardingAvatarPreview } from './OnboardingAvatarPreview'
import { CampaignPassageEditModal } from './CampaignPassageEditModal'
import { GuidancePanel } from '@/components/simulation/GuidancePanel'
import { CampaignDonateButton } from '@/components/campaign/CampaignDonateButton'
import { chunkIntoSlides, getBaseNodeId } from '@/lib/slide-chunker'
import { takeQuest } from '@/actions/quest-stewardship'
import { CopyableProse } from '@/components/ui/CopyableProse'
import { CopyTextButton } from '@/components/ui/CopyTextButton'

interface CampaignChoice {
    text: string
    targetId: string
}

interface CampaignNode {
    id: string
    text: string
    choices: CampaignChoice[]
    stepIndex?: number
    totalSteps?: number
    /** Library / book passage — quest BAR to assign via `takeQuest` */
    linkedQuestId?: string
}

/** Pre-signup demo orientation (DOP) — step cap + handoff fields for signup JSON */
export type DemoHandoffConfig = {
    maxSteps: number | null
    endNodeId: string | null
    demoToken: string
    campaignRef: string | null
    inviteId: string | null
}

interface CampaignReaderProps {
    initialNode: CampaignNode
    adventureSlug?: string
    campaignRef?: string
    isAdmin?: boolean
    flowId?: string
    /** When present: after signup redirect to /bar/share/[token] to claim BAR share */
    shareToken?: string
    /** Bounded anonymous preview — see /demo/orientation */
    demoHandoff?: DemoHandoffConfig | null
}

// Helper to evaluate SugarCube-like <<if>> conditions against state
function passesCondition(condition: string, state: Record<string, any>): boolean {
    const clean = condition.trim().replace(/^<<if\s+/, '').replace(/>>$/, '')
    // Basic parser for "A and B" or "A or B" or "A >= B"
    // For safety, we avoid eval() and do a very basic string replacement and Function wrap

    // Replace $var with state.var
    let logicExpr = clean.replace(/\$([a-zA-Z0-9_]+)/g, "state['$1']")
    // Replace 'and' with '&&', 'or' with '||'
    logicExpr = logicExpr.replace(/\band\b/g, '&&').replace(/\bor\b/g, '||')

    try {
        const check = new Function('state', `return !!(${logicExpr});`)
        return check(state)
    } catch (e) {
        console.warn("Failed to evaluate condition:", condition, e)
        return false
    }
}

// Helper to process SugarCube-like macros (<<set ...>>, <<print ...>>) and return clean text + state updates
function processMacros(text: string, currentState: Record<string, any>): { cleanText: string, updates: Record<string, any> } {
    const updates: Record<string, any> = {}
    let cleanText = text

    // Process <<set $var = value>> or <<set $var += value>>
    const setRegex = /<<set\s+\$([a-zA-Z0-9_]+)\s*(\+?=)\s*([^>]+)>>/g
    let match;
    while ((match = setRegex.exec(text)) !== null) {
        const [_, varName, op, valStr] = match
        let val: any = valStr.trim()

        // Parse value
        if (val === 'true') val = true
        else if (val === 'false') val = false
        else if (!isNaN(Number(val))) val = Number(val)
        else if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1)

        if (op === '+=') {
            const currentObj = varName in updates ? updates : currentState
            const currentVal = currentObj[varName] || 0
            updates[varName] = currentVal + val
        } else {
            updates[varName] = val
        }

        cleanText = cleanText.replace(match[0], '')
    }

    // Process <<complete_active_face>> custom macro from user prompt
    if (cleanText.includes('<<complete_active_face>>')) {
        const activeFace = updates.active_face || currentState.active_face
        if (activeFace) {
            updates[`completed_${activeFace}`] = true

            // Recompute altitude count
            let count = 0
            const check = (face: string) => (updates[`completed_${face}`] !== undefined ? updates[`completed_${face}`] : currentState[`completed_${face}`])
            if (check('shaman')) count++
            if (check('challenger')) count++
            if (check('regent')) count++
            if (check('architect')) count++
            if (check('diplomat')) count++
            if (check('sage')) count++

            updates['altitude_count'] = count
            updates['onboarding_vibeulons_minted'] = (updates.onboarding_vibeulons_minted || currentState.onboarding_vibeulons_minted || 0) + 1
            updates['onboarding_unlocked'] = true

            if (check('sage') || count >= 2) {
                updates['unlock_teal_starters'] = true
            }
        }
        cleanText = cleanText.replace('<<complete_active_face>>', '')
    }

    // Process <<print_status_report>> custom macro
    if (cleanText.includes('<<print_status_report>>')) {
        const getVal = (k: string) => (updates[k] !== undefined ? updates[k] : currentState[k])
        const report = `
**Completed Paths:**
- Shaman: ${getVal('completed_shaman') ? '✅' : '❌'}
- Challenger: ${getVal('completed_challenger') ? '✅' : '❌'}
- Regent: ${getVal('completed_regent') ? '✅' : '❌'}
- Architect: ${getVal('completed_architect') ? '✅' : '❌'}
- Diplomat: ${getVal('completed_diplomat') ? '✅' : '❌'}
- Sage: ${getVal('completed_sage') ? '✅' : '❌'}

**Onboarding Unlocked:** ${getVal('onboarding_unlocked') ? 'Yes' : 'No'}
**Teal Starters Unlocked:** ${getVal('unlock_teal_starters') ? 'Yes' : 'No'}
**Vibeulons Earned:** ${getVal('onboarding_vibeulons_minted') || 0} ♦
        `
        cleanText = cleanText.replace('<<print_status_report>>', report)
    }

    // Process <<print $var>>
    const printRegex = /<<print\s+\$([a-zA-Z0-9_]+)>>/g
    cleanText = cleanText.replace(printRegex, (match, varName) => {
        const val = updates[varName] !== undefined ? updates[varName] : currentState[varName]
        return String(val)
    })

    // Handle <<if>>...<<else>>...<</if>> blocks (VERY basic non-nested implementation)
    const ifRegex = /<<if\s+([^>]+)>>([\s\S]*?)(?:<<else>>([\s\S]*?))?<<\/if>>/g
    cleanText = cleanText.replace(ifRegex, (match, condition, ifBody, elseBody) => {
        const mergedState = { ...currentState, ...updates }
        if (passesCondition(`<<if ${condition}>>`, mergedState)) {
            return ifBody
        } else {
            return elseBody || ''
        }
    })

    // Clean up empty lines left behind by macros
    cleanText = cleanText.split('\n').filter(line => line.trim() !== '' || line === '').join('\n')

    return { cleanText, updates }
}

export function CampaignReader({
    initialNode,
    adventureSlug = 'wake-up',
    campaignRef,
    isAdmin = false,
    flowId,
    shareToken,
    demoHandoff,
}: CampaignReaderProps) {
    const router = useRouter()
    const [questTakePending, startQuestTake] = useTransition()
    const [questTakeError, setQuestTakeError] = useState<string | null>(null)
    const [currentNode, setCurrentNode] = useState<CampaignNode | null>(null)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [lastFailedNodeId, setLastFailedNodeId] = useState<string | null>(null)
    const [campaignState, setCampaignState] = useState<Record<string, any>>({
        ref: campaignRef ?? undefined,
        shareToken: shareToken ?? undefined,
        completed_shaman: false,
        completed_challenger: false,
        completed_regent: false,
        completed_architect: false,
        completed_diplomat: false,
        completed_sage: false,
        altitude_count: 0,
        onboarding_unlocked: false,
        unlock_teal_starters: false,
        active_face: "",
        tension_bar_id: "",
        action_bar_id: "",
        onboarding_vibeulons_minted: 0,
        step1_done: false,
        step2_done: false
    })

    const [renderedText, setRenderedText] = useState(initialNode.text)
    const [availableChoices, setAvailableChoices] = useState(initialNode.choices)
    const [slideIndex, setSlideIndex] = useState(0)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [demoEnded, setDemoEnded] = useState(false)
    const [demoStepsUsed, setDemoStepsUsed] = useState(0)

    const enrichedCampaignState = useMemo(
        () => ({
            ...campaignState,
            ...(demoHandoff && {
                demoOrientation: true,
                demoOrientationToken: demoHandoff.demoToken,
                ref: demoHandoff.campaignRef,
                inviteId: demoHandoff.inviteId,
            }),
        }),
        [campaignState, demoHandoff]
    )

    const donateCampaignRef = useMemo(
        () =>
            campaignRef ??
            (typeof campaignState.ref === 'string' && campaignState.ref ? campaignState.ref : undefined) ??
            demoHandoff?.campaignRef ??
            undefined,
        [campaignRef, campaignState.ref, demoHandoff?.campaignRef]
    )

    const fetchNode = async (nodeId: string) => {
        setLoading(true)
        setFetchError(null)
        try {
            const refParam = campaignRef ? `?ref=${encodeURIComponent(campaignRef)}` : ''
            // Try fetching from the DB first using the new dynamic route
            let res = await fetch(`/api/adventures/${adventureSlug}/${nodeId}${refParam}`)

            // Fallback to static JSON if DB route 404s (for backwards compatibility while migrating)
            if (!res.ok) {
                res = await fetch(`/api/campaigns/${adventureSlug}/${nodeId}${refParam}`)
            }

            if (res.ok) {
                const node = (await res.json()) as CampaignNode & { linkedQuestId?: string }

                // Process macros right as we load the node
                const { cleanText, updates } = processMacros(node.text, campaignState)

                const newState = { ...campaignState, ...updates }
                setCampaignState(newState)
                setQuestTakeError(null)
                setCurrentNode({
                    id: node.id,
                    text: node.text,
                    choices: node.choices,
                    stepIndex: node.stepIndex,
                    totalSteps: node.totalSteps,
                    linkedQuestId: node.linkedQuestId,
                })
                setRenderedText(cleanText)
                setSlideIndex(0)

                // Filter choices based on their conditions (if they had any, though in this skeleton we use <<if>> blocks in the text instead)
                setAvailableChoices(node.choices)
            } else {
                setLastFailedNodeId(nodeId)
                setFetchError('Could not load this step.')
            }
        } catch (e) {
            console.error(e)
            setLastFailedNodeId(nodeId)
            setFetchError('Something went wrong. Try again or continue later.')
        }
        setLoading(false)
    }

    useEffect(() => {
        // Load the initial map to ensure we have it cached (in a real app)
        // For now, we fetch the start node
        fetchNode(initialNode.id)
    }, [])

    useEffect(() => {
        if (!demoHandoff?.endNodeId || !currentNode) return
        if (currentNode.id === demoHandoff.endNodeId) {
            setDemoEnded(true)
        }
    }, [currentNode?.id, demoHandoff?.endNodeId])

    const handleChoice = (choice: CampaignChoice) => {
        if (choice.targetId === 'Game_Login' || choice.targetId === 'signup') {
            setCurrentNode({ id: 'signup', text: '', choices: [] })
            return
        }

        if (choice.targetId.startsWith('redirect:')) {
            const path = choice.targetId.slice('redirect:'.length)
            if (path) router.push(path)
            return
        }

        if (demoHandoff) {
            const nextStep = demoStepsUsed + 1
            if (demoHandoff.maxSteps != null && nextStep > demoHandoff.maxSteps) {
                setDemoEnded(true)
                return
            }
            setDemoStepsUsed(nextStep)
        }

        fetchNode(choice.targetId)
    }

    if (demoEnded && demoHandoff) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 p-8 border border-zinc-800 bg-zinc-950/50 rounded-2xl">
                <h2 className="text-xl font-bold text-white text-center">Preview complete</h2>
                <p className="text-zinc-400 text-sm text-center leading-relaxed">
                    Create an account to continue your path and unlock quests, BARs, and the full Conclave.
                </p>
                <CampaignAuthForm campaignState={enrichedCampaignState} />
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                    <CampaignDonateButton campaignRef={donateCampaignRef} />
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium border border-zinc-600 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                        Home
                    </Link>
                </div>
            </div>
        )
    }

    if (currentNode?.id === 'signup') {
        return <CampaignAuthForm campaignState={demoHandoff ? enrichedCampaignState : campaignState} />
    }

    if (fetchError && !loading) {
        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 p-8 border border-zinc-800 bg-zinc-950/50 rounded-2xl text-center">
                <p className="text-zinc-400">{fetchError}</p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <button
                        onClick={() => fetchNode(lastFailedNodeId ?? initialNode.id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-sm"
                    >
                        Retry
                    </button>
                    <a
                        href="/event"
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold text-sm border border-zinc-700"
                    >
                        Continue later
                    </a>
                </div>
            </div>
        )
    }

    if (loading || !currentNode) {
        return <div className="text-zinc-500 animate-pulse text-center p-8">Reading timeline...</div>
    }

    const stepIndex = (currentNode as CampaignNode & { stepIndex?: number }).stepIndex
    const totalSteps = (currentNode as CampaignNode & { totalSteps?: number }).totalSteps

    const isPreSplitSlideNode = /^BB_Intro_\d+$|^BB_ShowUp_\d+$/.test(currentNode.id)
    const slides = isPreSplitSlideNode ? [renderedText] : chunkIntoSlides(renderedText)
    const useSlideMode = slides.length > 1
    const displayText = useSlideMode ? slides[slideIndex] : renderedText

    const baseNodeId = getBaseNodeId(currentNode.id)
    const showEdit = isAdmin && !!adventureSlug

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in relative min-h-[60vh] flex flex-col items-center justify-center p-8 border border-zinc-800 bg-zinc-950/50 rounded-2xl shadow-2xl">
            {showEdit && (
                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => setEditModalOpen(true)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition"
                    >
                        Edit
                    </button>
                </div>
            )}
            {campaignRef === 'bruised-banana' && (
                <OnboardingAvatarPreview
                    campaignState={campaignState}
                    currentNodeId={currentNode.id}
                />
            )}
            {stepIndex != null && totalSteps != null && totalSteps > 0 && (
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    <div className="text-xs text-zinc-500 font-mono">
                        Step {stepIndex} of {totalSteps}
                    </div>
                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>
            )}
            <CopyableProse
                textToCopy={displayText}
                copyAriaLabel="Copy passage text"
                className="w-full text-left font-sans"
            >
                <div className="prose prose-invert prose-lg max-w-none w-full text-left font-sans">
                    <ReactMarkdown
                        components={{
                            a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                                    {children}
                                </a>
                            )
                        }}
                    >
                        {displayText}
                    </ReactMarkdown>
                </div>
            </CopyableProse>

            {currentNode.linkedQuestId && (
                <div className="w-full rounded-xl border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 space-y-2">
                    <div className="flex justify-end">
                        <CopyTextButton
                            text={
                                'Practice quest (library)\n\nTake stewardship to track this BAR in your Vault — same quest as the book thread.'
                            }
                            aria-label="Copy practice quest description"
                        />
                    </div>
                    <p className="text-sm font-medium text-emerald-200">Practice quest (library)</p>
                    <p className="text-xs text-zinc-500">
                        Take stewardship to track this BAR in your Vault — same quest as the book thread.
                    </p>
                    {questTakeError && (
                        <div className="flex justify-end items-start gap-2">
                            <p className="text-xs text-red-400 flex-1">{questTakeError}</p>
                            <CopyTextButton text={questTakeError} aria-label="Copy error message" />
                        </div>
                    )}
                    <button
                        type="button"
                        disabled={questTakePending}
                        onClick={() => {
                            setQuestTakeError(null)
                            startQuestTake(async () => {
                                const r = await takeQuest(currentNode.linkedQuestId!)
                                if ('error' in r) {
                                    setQuestTakeError(r.error)
                                    return
                                }
                                router.push(`/bars/${currentNode.linkedQuestId}`)
                            })
                        }}
                        className="inline-flex items-center justify-center rounded-lg bg-emerald-800/80 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
                    >
                        {questTakePending ? 'Working…' : 'Take quest'}
                    </button>
                </div>
            )}

            <div
                className="w-full flex flex-wrap items-center justify-center gap-2 pt-2 pb-1 border-t border-zinc-800/60"
                aria-label="Support the residency"
            >
                <CampaignDonateButton campaignRef={donateCampaignRef} />
                <Link
                    href="/event"
                    className="inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-zinc-700 transition-colors"
                >
                    Event page
                </Link>
            </div>

            {useSlideMode ? (
                <div className="w-full pt-8 flex flex-col gap-3 max-w-md">
                    <button
                        onClick={() => {
                            if (slideIndex < slides.length - 1) {
                                setSlideIndex((i) => i + 1)
                            } else if (availableChoices.length > 0) {
                                handleChoice(availableChoices[0])
                            }
                        }}
                        className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm flex justify-between items-center group relative overflow-hidden"
                    >
                        <span className="relative z-10">Continue</span>
                        <span className="text-purple-500/0 group-hover:text-purple-500 transition-colors relative z-10">→</span>
                    </button>
                    {slideIndex > 0 && (
                        <button
                            onClick={() => setSlideIndex((i) => i - 1)}
                            className="py-2 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors"
                        >
                            ← Back
                        </button>
                    )}
                    {availableChoices.slice(1).map((choice, i) => (
                        <button
                            key={i}
                            onClick={() => handleChoice(choice)}
                            className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm flex justify-between items-center group relative overflow-hidden"
                        >
                            <span className="relative z-10">{choice.text}</span>
                            <span className="text-purple-500/0 group-hover:text-purple-500 transition-colors relative z-10">→</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="w-full pt-8 flex flex-col gap-3 max-w-md">
                {availableChoices.map((choice, i) => (
                    <button
                        key={i}
                        onClick={() => handleChoice(choice)}
                        className="w-full text-left bg-zinc-900 border border-zinc-700 hover:border-purple-500 hover:bg-zinc-800 text-zinc-300 hover:text-white p-4 rounded-xl transition-all font-medium text-sm flex justify-between items-center group relative overflow-hidden"
                    >
                        <span className="relative z-10">{choice.text}</span>
                        <span className="text-purple-500/0 group-hover:text-purple-500 transition-colors relative z-10">→</span>
                    </button>
                    ))}
                </div>
            )}
            {flowId && currentNode && (
                <GuidancePanel
                    flowId={flowId}
                    nodeId={currentNode.id}
                    role="librarian"
                />
            )}
            {showEdit && (
                <CampaignPassageEditModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    nodeId={baseNodeId}
                    adventureSlug={adventureSlug!}
                    initialText={renderedText}
                    initialChoices={availableChoices}
                    onSaved={() => fetchNode(currentNode.id)}
                />
            )}
        </div>
    )
}
