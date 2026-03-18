"use client"

import { useActionState, useState, useTransition, useMemo } from "react"
import { updatePassage, generateSinglePassage, linkPassageToQuest, unlinkPassageFromQuest } from "./actions"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BridgeGapModal } from "./BridgeGapModal"
import { ChoiceBuilder, type Choice } from "@/components/admin/ChoiceBuilder"
import { logNarrativeQualityFeedback } from "@/actions/narrative-quality-feedback"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
            {pending ? "Saving..." : "Save Passage"}
        </button>
    )
}

type PassageItem = { id: string; nodeId: string }

type QuestItem = {
    id: string
    title: string
    description: string
    storyContent: string | null
    docQuestMetadata: string | null
}

export function EditPassageForm({
    adventureId,
    passage,
    passages,
    faceLabel,
    faceBg,
    faceText,
    linkedQuest: initialLinkedQuest,
    quests,
}: {
    adventureId: string
    passage: { id: string; nodeId: string; text: string; choices: string; linkedQuestId?: string | null }
    passages: PassageItem[]
    faceLabel?: string
    faceBg?: string
    faceText?: string
    linkedQuest?: { id: string; title: string; description: string } | null
    quests?: QuestItem[]
}) {
    const [state, formAction] = useActionState(updatePassage, { success: false, message: "" })
    const [text, setText] = useState(passage.text)
    const [isAiDraft, setIsAiDraft] = useState(false)
    const [generateError, setGenerateError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [linkedQuest, setLinkedQuest] = useState(initialLinkedQuest ?? null)
    const [questSearch, setQuestSearch] = useState("")
    const [questLinkPending, startQuestLinkTransition] = useTransition()
    const [questLinkError, setQuestLinkError] = useState<string | null>(null)
    const router = useRouter()
    const [bridgeTarget, setBridgeTarget] = useState<{ toNodeId: string; choiceLabel: string } | null>(null)
    const [needsWorkOpen, setNeedsWorkOpen] = useState(false)
    const [needsWorkText, setNeedsWorkText] = useState("")
    const [needsWorkPending, setNeedsWorkPending] = useState(false)
    const [explicitFeedbackOpen, setExplicitFeedbackOpen] = useState(false)
    const [explicitFeedbackText, setExplicitFeedbackText] = useState("")
    const [explicitFeedbackPending, setExplicitFeedbackPending] = useState(false)
    const [ratingResult, setRatingResult] = useState<{ ok?: boolean; msg?: string } | null>(null)

    const initialChoices = useMemo(() => {
        try {
            const parsed = JSON.parse(passage.choices || "[]")
            const arr = Array.isArray(parsed) ? parsed.filter((c: unknown) => c && typeof c === "object" && "text" in c && "targetId" in c) : []
            return arr as Choice[]
        } catch {
            return []
        }
    }, [passage.choices])

    const [choices, setChoices] = useState<Choice[]>(initialChoices)
    const targetOptions = passages.filter((p) => p.nodeId !== passage.nodeId).map((p) => p.nodeId)

    function handleGenerate() {
        setGenerateError(null)
        startTransition(async () => {
            const result = await generateSinglePassage(passage.id)
            if ('error' in result) {
                setGenerateError(result.error)
            } else {
                setText(result.text)
                setIsAiDraft(true)
            }
        })
    }

    function handleImportQuest(quest: QuestItem) {
        // 3.3: prefer storyContent if it's plain text, otherwise description
        const importText = (quest.storyContent && !quest.storyContent.startsWith('{'))
            ? quest.storyContent
            : quest.description
        setText(importText)
        setIsAiDraft(false)
    }

    function handleLinkQuest(quest: QuestItem) {
        setQuestLinkError(null)
        startQuestLinkTransition(async () => {
            const r = await linkPassageToQuest(passage.id, quest.id)
            if ('error' in r) {
                setQuestLinkError(r.error)
            } else {
                setLinkedQuest({ id: quest.id, title: quest.title, description: quest.description })
                router.refresh()
            }
        })
    }

    function handleUnlinkQuest() {
        setQuestLinkError(null)
        startQuestLinkTransition(async () => {
            const r = await unlinkPassageFromQuest(passage.id)
            if ('error' in r) {
                setQuestLinkError(r.error)
            } else {
                setLinkedQuest(null)
                router.refresh()
            }
        })
    }

    async function handleAccept() {
        setRatingResult(null)
        const r = await logNarrativeQualityFeedback({
            type: "rating",
            passageId: passage.id,
            adventureId,
            nodeId: passage.nodeId,
            rating: "accept",
        })
        if (r.error) setRatingResult({ ok: false, msg: r.error })
        else setRatingResult({ ok: true, msg: "Logged as Accept" })
    }

    async function handleNeedsWork() {
        if (!needsWorkOpen) {
            setNeedsWorkOpen(true)
            return
        }
        setRatingResult(null)
        setNeedsWorkPending(true)
        const r = await logNarrativeQualityFeedback({
            type: "rating",
            passageId: passage.id,
            adventureId,
            nodeId: passage.nodeId,
            rating: "needs_work",
            feedback: needsWorkText.trim() || undefined,
        })
        setNeedsWorkPending(false)
        if (r.error) setRatingResult({ ok: false, msg: r.error })
        else {
            setRatingResult({ ok: true, msg: "Logged as Needs work" })
            setNeedsWorkOpen(false)
            setNeedsWorkText("")
        }
    }

    async function handleExplicitFeedback() {
        if (!explicitFeedbackOpen) {
            setExplicitFeedbackOpen(true)
            return
        }
        setRatingResult(null)
        setExplicitFeedbackPending(true)
        const r = await logNarrativeQualityFeedback({
            type: "explicit",
            passageId: passage.id,
            adventureId,
            nodeId: passage.nodeId,
            feedback: explicitFeedbackText.trim() || undefined,
        })
        setExplicitFeedbackPending(false)
        if (r.error) setRatingResult({ ok: false, msg: r.error })
        else {
            setRatingResult({ ok: true, msg: "Feedback logged" })
            setExplicitFeedbackOpen(false)
            setExplicitFeedbackText("")
        }
    }

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="passageId" value={passage.id} />
            <input type="hidden" name="adventureId" value={adventureId} />

            {state?.message && !state.success && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm">
                    {state.message}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="nodeId" className="block text-sm font-medium text-zinc-300 mb-1.5">
                        Node ID
                    </label>
                    <input
                        type="text"
                        name="nodeId"
                        id="nodeId"
                        required
                        pattern="^[a-zA-Z0-9_-]+$"
                        defaultValue={passage.nodeId}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                        placeholder="e.g. Center_Witness"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">No spaces. Used for linking passages (e.g., targetId in choices).</p>
                    {state?.errors?.nodeId && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.nodeId[0]}</p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="text" className="block text-sm font-medium text-zinc-300">
                            Passage Text (Markdown + Macros)
                        </label>
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isPending}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${faceBg ?? 'bg-violet-500/15'} ${faceText ?? 'text-violet-300'} border-current hover:opacity-80`}
                        >
                            {isPending ? (
                                <>
                                    <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    Generating…
                                </>
                            ) : (
                                <>✦ Generate with {faceLabel ?? 'GM'}</>
                            )}
                        </button>
                    </div>
                    {isAiDraft && (
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            AI draft — review before saving
                        </div>
                    )}
                    {generateError && (
                        <p className="mb-1.5 text-xs text-red-400">{generateError}</p>
                    )}
                    <textarea
                        name="text"
                        id="text"
                        required
                        rows={12}
                        value={text}
                        onChange={e => { setText(e.target.value); setIsAiDraft(false) }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono text-sm"
                        placeholder="Type your story here..."
                    />
                    {state?.errors?.text && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.text[0]}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Choices</label>
                    <ChoiceBuilder
                        choices={choices}
                        onChange={setChoices}
                        targetOptions={targetOptions}
                        name="choices"
                    />
                    {state?.errors?.choicesJson && (
                        <p className="text-red-400 text-sm mt-1">{state.errors.choicesJson[0]}</p>
                    )}
                    {choices.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Bridge this gap</p>
                            <div className="space-y-2">
                                {choices.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                        <span className="text-sm text-zinc-300 truncate">
                                            {c.text} → <span className="font-mono text-indigo-400">{c.targetId}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setBridgeTarget({ toNodeId: c.targetId, choiceLabel: c.text })}
                                            className="shrink-0 px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-purple-100 border border-purple-700/50 hover:border-purple-500 rounded-lg transition-colors"
                                        >
                                            Bridge
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Quest Picker — Phase 3 */}
                {quests && quests.length > 0 && (
                    <details className="border border-zinc-800 rounded-xl overflow-hidden">
                        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none text-sm text-zinc-400 hover:text-zinc-200 transition-colors list-none bg-zinc-900">
                            <span className="font-medium text-zinc-300">Quest</span>
                            {linkedQuest ? (
                                <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-sky-300 border border-sky-500/20">
                                    🔗 {linkedQuest.title}
                                </span>
                            ) : (
                                <span className="text-xs text-zinc-600">Import or link a quest</span>
                            )}
                            <span className="ml-auto text-xs text-zinc-600">▾</span>
                        </summary>
                        <div className="px-4 pb-4 pt-3 space-y-3 border-t border-zinc-800 bg-zinc-900/50">
                            {/* Linked quest badge */}
                            {linkedQuest && (
                                <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                                    <div className="text-sm min-w-0">
                                        <div className="font-medium text-sky-300 truncate">{linkedQuest.title}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{linkedQuest.description}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUnlinkQuest}
                                        disabled={questLinkPending}
                                        className="shrink-0 text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                        Unlink
                                    </button>
                                </div>
                            )}

                            {/* Search */}
                            <input
                                type="text"
                                value={questSearch}
                                onChange={(e) => setQuestSearch(e.target.value)}
                                placeholder="Search quests…"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />

                            {/* Results */}
                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                {quests
                                    .filter((q) =>
                                        questSearch.trim() === "" ||
                                        q.title.toLowerCase().includes(questSearch.toLowerCase()) ||
                                        q.description.toLowerCase().includes(questSearch.toLowerCase())
                                    )
                                    .slice(0, 20)
                                    .map((q) => {
                                        const isBook = Boolean(q.docQuestMetadata)
                                        return (
                                            <div key={q.id} className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-sm font-medium text-zinc-200 truncate">{q.title}</span>
                                                        {isBook && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300">
                                                                Book
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{q.description}</p>
                                                </div>
                                                <div className="shrink-0 flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImportQuest(q)}
                                                        className="px-2 py-1 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md transition-colors"
                                                    >
                                                        Import
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleLinkQuest(q)}
                                                        disabled={questLinkPending || linkedQuest?.id === q.id}
                                                        className="px-2 py-1 text-xs font-medium text-sky-400 hover:text-sky-300 border border-sky-700/50 hover:border-sky-500 rounded-md transition-colors disabled:opacity-40"
                                                    >
                                                        Link
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                            </div>

                            {questLinkError && (
                                <p className="text-xs text-red-400">{questLinkError}</p>
                            )}
                        </div>
                    </details>
                )}
            </div>
            {bridgeTarget && (
                <BridgeGapModal
                    adventureId={adventureId}
                    fromNodeId={passage.nodeId}
                    toNodeId={bridgeTarget.toNodeId}
                    choiceLabel={bridgeTarget.choiceLabel}
                    onClose={() => setBridgeTarget(null)}
                />
            )}

            <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-4">
                <SubmitButton />
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                    <input type="checkbox" name="logAsFeedback" value="true" className="rounded border-zinc-600 bg-zinc-950 text-indigo-500 focus:ring-indigo-500/50" />
                    Log this edit as feedback
                </label>
                <Link
                    href={`/admin/adventures/${adventureId}`}
                    className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                >
                    Cancel
                </Link>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-3">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Narrative quality</p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleAccept}
                        className="px-3 py-1.5 text-sm font-medium text-green-400 hover:text-green-300 border border-green-700/50 hover:border-green-500 rounded-lg transition-colors"
                    >
                        Accept
                    </button>
                    <button
                        type="button"
                        onClick={handleNeedsWork}
                        disabled={needsWorkPending}
                        className="px-3 py-1.5 text-sm font-medium text-amber-400 hover:text-amber-300 border border-amber-700/50 hover:border-amber-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {needsWorkPending ? "Logging…" : "Needs work"}
                    </button>
                    <button
                        type="button"
                        onClick={handleExplicitFeedback}
                        disabled={explicitFeedbackPending}
                        className="px-3 py-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 border border-purple-700/50 hover:border-purple-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {explicitFeedbackPending ? "Logging…" : "Log this as feedback"}
                    </button>
                </div>
                {needsWorkOpen && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                        <label htmlFor="needs-work-feedback" className="block text-xs text-zinc-500">
                            What needs work? (optional)
                        </label>
                        <textarea
                            id="needs-work-feedback"
                            value={needsWorkText}
                            onChange={(e) => setNeedsWorkText(e.target.value)}
                            placeholder="e.g. too corporate, nonsensical"
                            rows={2}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        <button
                            type="button"
                            onClick={handleNeedsWork}
                            disabled={needsWorkPending}
                            className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                )}
                {explicitFeedbackOpen && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                        <label htmlFor="explicit-feedback" className="block text-xs text-zinc-500">
                            Describe what to log
                        </label>
                        <textarea
                            id="explicit-feedback"
                            value={explicitFeedbackText}
                            onChange={(e) => setExplicitFeedbackText(e.target.value)}
                            placeholder="e.g. Good arc, presence-first tone"
                            rows={2}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <button
                            type="button"
                            onClick={handleExplicitFeedback}
                            disabled={explicitFeedbackPending}
                            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg disabled:opacity-50"
                        >
                            Submit
                        </button>
                    </div>
                )}
                {ratingResult && (
                    <p className={`text-sm ${ratingResult.ok ? "text-green-400" : "text-red-400"}`}>
                        {ratingResult.msg}
                    </p>
                )}
            </div>
        </form>
    )
}
