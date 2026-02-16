'use client'

import { useMemo, useState, useTransition } from 'react'
import { assistStoryQuest, pickUpBar } from '@/actions/pick-up-bar'
import { generateStoryClockQuestText } from '@/actions/story-clock'

type StoryClockQuestView = {
    id: string
    title: string
    description: string
    creatorName: string
    canClaim: boolean
    cubeState: string | null
    cubeRequirementLabel: string | null
    completionFraming: string | null
    requiresAssist: boolean
    hexagramId: number | null
    hexagramName: string | null
    upperTrigram: string | null
    lowerTrigram: string | null
    eligibleArchetypes: string[]
    nationTonePrimary: string | null
    nationToneSecondary: string | null
    faceContext: string | null
    status: string
    claimWindowExpiry: string | null
    aiBody: string | null
    aiFallback: boolean
    playerFacing?: {
        title?: string
        action: string
        done_when: string
        ally_help?: string
    } | null
    summary?: {
        title?: string
        action: string
        done_when: string
        ally_help?: string
    } | null
    questSource?: string | null
    phaseId?: number | null
    kotterStage?: number | null
}

interface StoryClockQuestSurfaceProps {
    quests: StoryClockQuestView[]
    showActions?: boolean
}

type GeneratedBodyState = {
    aiBody: string
    isFallback: boolean
}

type PlayerFacingQuestView = {
    title?: string
    action: string
    done_when: string
    ally_help?: string
    debug: {
        parseStatus: 'player_facing' | 'short_schema' | 'story_payload' | 'legacy_payload' | 'plain_text' | 'fallback'
        questSource: string | null
        hexagramId: number | null
        cubeState: string | null
        phaseId: number | null
        kotterStage: number | null
        aiBodyLength: number
        rawAiPreview: string
        parseError: string | null
    }
}

function humanizeCubeState(raw: string | null) {
    if (!raw) return null
    const parts = raw.split('_').filter(Boolean)
    if (parts.length !== 3) return raw
    return parts
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1).toLowerCase())
        .join(' • ')
}

function normalizeWhitespace(value: string) {
    return value.replace(/\s+/g, ' ').trim()
}

function clampText(value: string, limit: number) {
    const normalized = normalizeWhitespace(value)
    if (normalized.length <= limit) return normalized
    return normalized.slice(0, limit).trim()
}

function clampSentence(value: string, limit: number) {
    const normalized = normalizeWhitespace(value)
    if (normalized.length <= limit) return normalized
    const window = normalized.slice(0, limit + 1)
    const punctuation = Math.max(window.lastIndexOf('.'), window.lastIndexOf('!'), window.lastIndexOf('?'))
    if (punctuation >= Math.floor(limit * 0.5)) {
        return window.slice(0, punctuation + 1).trim()
    }
    const space = window.lastIndexOf(' ')
    if (space >= Math.floor(limit * 0.6)) {
        return window.slice(0, space).trim()
    }
    return normalized.slice(0, limit).trim()
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripLeadingLabels(value: string, labels: string[]) {
    let cleaned = normalizeWhitespace(value.replace(/^[-*•]\s*/, '').replace(/^["']|["']$/g, ''))
    let changed = true
    while (changed) {
        changed = false
        for (const label of labels) {
            const pattern = new RegExp(`^${escapeRegex(label).replace(/\s+/g, '\\s*')}\\s*:?\\s*`, 'i')
            if (pattern.test(cleaned)) {
                cleaned = normalizeWhitespace(cleaned.replace(pattern, ''))
                changed = true
            }
        }
    }
    return cleaned
}

function sanitizeTitle(value: string | null) {
    if (!value) return null
    const cleaned = clampText(stripLeadingLabels(value, ['title']), 40)
    if (!cleaned) return null
    if (/^(oracle stub|reading|upper trigram|lower trigram|main characters?:|awakening\s*-)/i.test(cleaned)) return null
    return cleaned
}

function sanitizeAction(value: string | null) {
    if (!value) return null
    const cleaned = clampSentence(
        stripLeadingLabels(value, ['action', 'main move', 'main character move', 'do']),
        140
    )
    if (!cleaned) return null
    return cleaned
}

function sanitizeDoneWhen(value: string | null) {
    if (!value) return null
    const cleaned = clampSentence(
        stripLeadingLabels(value, ['done when', 'done_when', 'completion signal', 'success when']),
        90
    )
    if (!cleaned) return null
    return cleaned
}

function sanitizeAllyHelp(value: string | null) {
    if (!value) return null
    const cleaned = clampSentence(
        stripLeadingLabels(value, ['ally help', 'ally_help', 'ally', 'assist', 'assist signal']),
        90
    )
    if (!cleaned) return null
    return cleaned
}

function looksLikeScaffolding(line: string) {
    const normalized = normalizeWhitespace(line)
    if (!normalized) return true
    if (/^[A-Z]+_[A-Z]+_[A-Z]+$/.test(normalized)) return true
    if (/^(oracle stub|reading|upper trigram|lower trigram|main character move|constraints?|template_id|cube|hexagram|main characters?:|awakening\s*-|phase|kotter)\b/i.test(normalized)) return true
    if (/^(done when|done_when|ally help|ally_help|title)\s*:/i.test(normalized)) return true
    if (/^\{.*\}$/.test(normalized)) return true
    return false
}

function extractLabelValue(rawText: string, labels: string[], sanitizer: (value: string | null) => string | null) {
    const lines = rawText.split('\n')
    for (const rawLine of lines) {
        const line = normalizeWhitespace(rawLine.replace(/^[-*•]\s*/, ''))
        if (!line) continue
        for (const label of labels) {
            const pattern = new RegExp(`^${escapeRegex(label).replace(/\s+/g, '\\s*')}\\s*:?\\s*(.+)$`, 'i')
            const match = line.match(pattern)
            if (match && match[1]) {
                const cleaned = sanitizer(match[1])
                if (cleaned) return cleaned
            }
        }
    }
    return null
}

function firstActionableLine(rawText: string) {
    const lines = rawText.split('\n')
    for (const rawLine of lines) {
        const line = normalizeWhitespace(rawLine)
        if (!line || looksLikeScaffolding(line)) continue
        const action = sanitizeAction(line)
        if (action && action.length >= 12) return action
    }
    return null
}

function tryParseJson(raw: string | null): { value: unknown; parseError: string | null } {
    if (!raw || raw.trim().length === 0) return { value: null, parseError: null }
    try {
        return { value: JSON.parse(raw) as unknown, parseError: null }
    } catch (error) {
        return {
            value: null,
            parseError: error instanceof Error ? error.message : 'Invalid JSON payload'
        }
    }
}

function pickFirstNonEmpty(values: Array<unknown>) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim()
        }
    }
    return null
}

function readPlayerFacingBlock(source: unknown) {
    if (!source || typeof source !== 'object') return null
    const record = source as Record<string, unknown>
    const title = sanitizeTitle(pickFirstNonEmpty([record.title]))
    const action = sanitizeAction(pickFirstNonEmpty([record.action, record.mainAction, record.main_action]))
    const doneWhen = sanitizeDoneWhen(pickFirstNonEmpty([record.done_when, record.doneWhen]))
    const allyHelp = sanitizeAllyHelp(pickFirstNonEmpty([record.ally_help, record.allyHelp]))
    if (!action || !doneWhen) return null
    return {
        title: title || undefined,
        action,
        done_when: doneWhen,
        ally_help: allyHelp || undefined
    }
}

function readFirstAllyAsk(value: unknown) {
    if (!Array.isArray(value)) return null
    for (const item of value) {
        if (item && typeof item === 'object' && typeof (item as { ask?: unknown }).ask === 'string') {
            return (item as { ask: string }).ask
        }
    }
    return null
}

function toPlayerFacingQuest(quest: StoryClockQuestView, rawAiBody: string | null): PlayerFacingQuestView {
    const aiBody = typeof rawAiBody === 'string' ? rawAiBody : ''
    const preferredPlayerFacing = readPlayerFacingBlock(quest.playerFacing) || readPlayerFacingBlock(quest.summary)
    const baseDebug = {
        questSource: quest.questSource || null,
        hexagramId: quest.hexagramId ?? null,
        cubeState: quest.cubeState || null,
        phaseId: quest.phaseId ?? null,
        kotterStage: quest.kotterStage ?? null,
        aiBodyLength: aiBody.length,
        rawAiPreview: clampText(aiBody, 500),
        parseError: null as string | null,
    }

    if (preferredPlayerFacing) {
        return {
            ...preferredPlayerFacing,
            debug: { ...baseDebug, parseStatus: 'player_facing' }
        }
    }

    const parsedResult = tryParseJson(aiBody)
    const parsed = parsedResult.value
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, any>

        const shortSchema = readPlayerFacingBlock(obj)
            || readPlayerFacingBlock(obj.player_facing)
            || readPlayerFacingBlock(obj.playerFacing)
            || readPlayerFacingBlock(obj.summary)
        if (shortSchema) {
            return {
                ...shortSchema,
                debug: { ...baseDebug, parseStatus: 'short_schema', parseError: parsedResult.parseError }
            }
        }

        const questBlock = obj.quest
        if (questBlock && typeof questBlock === 'object') {
            const action = sanitizeAction(pickFirstNonEmpty([
                questBlock?.main_character_move?.do,
                questBlock?.pitch,
            ]))
            const doneWhen = sanitizeDoneWhen(pickFirstNonEmpty([
                questBlock?.main_character_move?.done_when,
            ]))
            const allyHelp = sanitizeAllyHelp(readFirstAllyAsk(questBlock?.ally_moves))
            const title = sanitizeTitle(pickFirstNonEmpty([questBlock?.title, quest.title]))

            if (action && doneWhen && !looksLikeScaffolding(action)) {
                return {
                    title: title || undefined,
                    action,
                    done_when: doneWhen,
                    ally_help: allyHelp || undefined,
                    debug: { ...baseDebug, parseStatus: 'story_payload', parseError: parsedResult.parseError }
                }
            }
        }

        const legacyAction = sanitizeAction(pickFirstNonEmpty([
            Array.isArray(obj.moves) ? obj.moves[0] : null,
            Array.isArray(obj.paragraphs) ? obj.paragraphs[0] : null,
            obj.description,
            obj.omen
        ]))
        const fallbackLegacyAction = firstActionableLine(aiBody)
        const action = legacyAction && !looksLikeScaffolding(legacyAction)
            ? legacyAction
            : fallbackLegacyAction
        if (action) {
            const doneWhen = extractLabelValue(aiBody, ['done when', 'done_when', 'completion signal'], sanitizeDoneWhen)
                || 'Marked complete in the app.'
            const allyHelp = extractLabelValue(aiBody, ['ally help', 'ally_help', 'assist', 'ally'], sanitizeAllyHelp)
                || 'Allies can back you with a vibulon or a BAR.'
            return {
                title: sanitizeTitle(pickFirstNonEmpty([obj.title, quest.title])) || undefined,
                action,
                done_when: doneWhen,
                ally_help: allyHelp,
                debug: { ...baseDebug, parseStatus: 'legacy_payload', parseError: parsedResult.parseError }
            }
        }
    }

    if (aiBody.trim().length > 0) {
        const plainLine = firstActionableLine(aiBody)

        if (plainLine) {
            return {
                title: sanitizeTitle(quest.title) || undefined,
                action: plainLine,
                done_when: extractLabelValue(aiBody, ['done when', 'done_when'], sanitizeDoneWhen) || 'Marked complete in the app.',
                ally_help: extractLabelValue(aiBody, ['ally help', 'ally_help', 'assist', 'ally'], sanitizeAllyHelp)
                    || 'Allies can back you with a vibulon or a BAR.',
                debug: { ...baseDebug, parseStatus: 'plain_text', parseError: parsedResult.parseError }
            }
        }
    }

    return {
        title: 'Next Move',
        action: 'Take one concrete step that advances the Big Score.',
        done_when: 'Marked complete in the app.',
        ally_help: 'Allies can back you with a vibulon or a BAR.',
        debug: { ...baseDebug, parseStatus: 'fallback', parseError: parsedResult.parseError }
    }
}

function hasShortQuestContract(quest: StoryClockQuestView) {
    const fromPlayerFacing = quest.playerFacing?.action && quest.playerFacing?.done_when
    const fromSummary = quest.summary?.action && quest.summary?.done_when
    return Boolean(fromPlayerFacing || fromSummary)
}

export function StoryClockQuestSurface({ quests, showActions = true }: StoryClockQuestSurfaceProps) {
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null)
    const [isGenerating, startGenerating] = useTransition()
    const [generatedById, setGeneratedById] = useState<Record<string, GeneratedBodyState>>({})

    const selectedQuest = useMemo(
        () => quests.find((quest) => quest.id === selectedQuestId) || null,
        [quests, selectedQuestId]
    )

    const openQuestModal = (quest: StoryClockQuestView) => {
        setSelectedQuestId(quest.id)
        if (hasShortQuestContract(quest)) return
        const existingBody = generatedById[quest.id]?.aiBody || quest.aiBody
        if (existingBody && existingBody.trim().length > 0) return

        startGenerating(async () => {
            const result = await generateStoryClockQuestText(quest.id)
            if ('error' in result) {
                setGeneratedById((prev) => ({
                    ...prev,
                    [quest.id]: {
                        aiBody: '',
                        isFallback: true,
                    }
                }))
                return
            }

            setGeneratedById((prev) => ({
                ...prev,
                [quest.id]: {
                    aiBody: result.aiBody,
                    isFallback: result.isFallback,
                }
            }))
        })
    }

    const handlePickUp = async (formData: FormData) => {
        await pickUpBar(formData)
    }

    const handleAssist = async (formData: FormData) => {
        await assistStoryQuest(formData)
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quests.map((quest) => {
                    const generated = generatedById[quest.id]
                    const aiBody = generated?.aiBody || quest.aiBody
                    const display = toPlayerFacingQuest(quest, aiBody)

                    return (
                        <div
                            key={quest.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => openQuestModal(quest)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    openQuestModal(quest)
                                }
                            }}
                            className="bg-zinc-900 border border-cyan-900/60 rounded-xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                        >
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-bold text-white text-lg">{display.title || quest.title}</h3>
                                    <span className="text-[10px] bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded uppercase tracking-widest">
                                        Story
                                    </span>
                                </div>

                                <div className="text-xs text-zinc-500">
                                    From {quest.creatorName}
                                </div>

                                <p className="text-sm text-zinc-300 line-clamp-2">{display.action}</p>
                                <p className="text-xs text-zinc-400 line-clamp-1">Done when: {display.done_when}</p>
                                {display.ally_help ? <p className="text-xs text-zinc-500 line-clamp-1">Ally help: {display.ally_help}</p> : null}

                                {quest.requiresAssist ? (
                                    <div className="rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
                                        Requires at least one Assist Signal before completion.
                                    </div>
                                ) : null}

                                <div className="text-[11px] text-zinc-500 uppercase tracking-widest">Tap card to open details</div>

                                {showActions ? (
                                    quest.canClaim ? (
                                        <form
                                            action={handlePickUp}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <input type="hidden" name="barId" value={quest.id} />
                                            <button
                                                type="submit"
                                                className="w-full py-2 rounded-lg font-bold transition-all bg-cyan-900/40 border border-cyan-700 text-cyan-200 hover:bg-cyan-900/60"
                                            >
                                                Accept Story Quest
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
                                            <form action={handleAssist}>
                                                <input type="hidden" name="barId" value={quest.id} />
                                                <input type="hidden" name="assistNote" value={`Assist volunteered for ${quest.title}`} />
                                                <button
                                                    type="submit"
                                                    className="w-full py-2 rounded-lg font-bold transition-all bg-zinc-900 border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                                                >
                                                    Send Assist Signal
                                                </button>
                                            </form>
                                            <div className="w-full py-2 rounded-lg font-bold text-center bg-zinc-900 border border-zinc-700 text-zinc-400">
                                                Assist Only (archetype not eligible to claim)
                                            </div>
                                        </div>
                                    )
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>

            {selectedQuest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedQuestId(null)} />
                    <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-zinc-800 flex items-start justify-between gap-3">
                            <div>
                                {(() => {
                                    const generated = generatedById[selectedQuest.id]
                                    const body = generated?.aiBody || selectedQuest.aiBody
                                    const display = toPlayerFacingQuest(selectedQuest, body)
                                    return (
                                        <>
                                            <h3 className="text-lg font-bold text-white">{display.title || selectedQuest.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-1">Hexagram #{selectedQuest.hexagramId ?? '?'}</p>
                                        </>
                                    )
                                })()}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedQuestId(null)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            {(() => {
                                const generated = generatedById[selectedQuest.id]
                                const body = generated?.aiBody || selectedQuest.aiBody
                                const display = toPlayerFacingQuest(selectedQuest, body)

                                return (
                                    <section className="space-y-4">
                                        {(!body || body.trim().length === 0) && isGenerating ? (
                                            <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3 text-sm text-zinc-400">
                                                Generating...
                                            </div>
                                        ) : null}

                                        <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-4">
                                            <p className="text-sm text-zinc-200 leading-relaxed">{display.action}</p>
                                            <p className="text-xs text-zinc-400">Done when: {display.done_when}</p>
                                            {display.ally_help ? (
                                                <p className="text-xs text-zinc-500">Ally help: {display.ally_help}</p>
                                            ) : null}
                                        </div>

                                        <details className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-3">
                                            <summary className="cursor-pointer text-xs uppercase tracking-widest text-zinc-400">Debug</summary>
                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                <Detail label="questSource" value={display.debug.questSource || 'N/A'} />
                                                <Detail label="hexagram_id" value={display.debug.hexagramId != null ? String(display.debug.hexagramId) : 'N/A'} />
                                                <Detail label="cube_signature" value={humanizeCubeState(display.debug.cubeState) || 'N/A'} />
                                                <Detail label="heist_phase" value={display.debug.phaseId != null ? String(display.debug.phaseId) : 'N/A'} />
                                                <Detail label="kotter_stage" value={display.debug.kotterStage != null ? String(display.debug.kotterStage) : 'N/A'} />
                                                <Detail label="parse_status" value={display.debug.parseStatus} />
                                                <Detail label="parse_error" value={display.debug.parseError || 'N/A'} />
                                                <Detail label="ai_body_length" value={String(display.debug.aiBodyLength)} />
                                                <Detail label="raw_ai_preview" value={display.debug.rawAiPreview || 'N/A'} />
                                            </div>
                                        </details>
                                    </section>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950/70 p-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
            <p className="text-zinc-200 mt-1 break-words">{value}</p>
        </div>
    )
}
