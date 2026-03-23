'use client'

import { useState, useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCustomBar, getActivePlayers, getLinkableQuests, getGatingOptions } from '@/actions/create-bar'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import type { Shadow321NameFields } from '@/lib/shadow321-name-resolution'
import { usePostActionRouter } from '@/hooks/usePostActionRouter'
import { NAV } from '@/lib/navigation-contract'

type Player = { id: string; name: string }
type LinkableQuest = { id: string; title: string }

export type CreateBarPrefill = {
    title?: string
    description?: string
    tags?: string[]
    linkedQuestId?: string
    /** BDE: tweet-like draft */
    source321FullText?: string
    moveType?: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
    systemTitle?: string
    barDraftFrom321?: boolean
}
export type CreateBar321Session = {
  phase3Snapshot?: string
  phase2Snapshot?: string
  shadow321Name?: Shadow321NameFields
}

export function CreateBarForm({
    setup,
    prefill,
    session321,
    quickFrom321,
    sceneGridBind,
    onSceneGridBound,
    onCancel,
}: {
    setup?: boolean
    prefill?: CreateBarPrefill
    session321?: CreateBar321Session
    /** Tweet-like compose from 321 — domain required; gating in Advanced */
    quickFrom321?: boolean
    sceneGridBind?: {
        instanceId: string
        cardId: string
        instanceSlug: string
        promptTitle: string
        promptExcerpt: string
        /** Resolved cell label (row × rank lens). */
        displayTitle: string
        suit: string
        rank: number
        rowLabel: string
    } | null
    onSceneGridBound?: () => void
    onCancel?: () => void
}) {
    const router = useRouter()
    const privateRouter = usePostActionRouter(NAV['create_bar_private'])
    const publicRouter = usePostActionRouter(NAV['create_bar_public'])
    const [isOpen, setIsOpen] = useState(setup || !!prefill || !!sceneGridBind || !!quickFrom321 || false)
    const [showAdvanced321, setShowAdvanced321] = useState(false)
    const [domainError, setDomainError] = useState<string | null>(null)
    const [players, setPlayers] = useState<Player[]>([])
    const [linkableQuests, setLinkableQuests] = useState<LinkableQuest[]>([])
    const [visibility, setVisibility] = useState<'public' | 'private'>('private')
    const [moveType, setMoveType] = useState<'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | null>(null)
    const [showStory, setShowStory] = useState(false)
    const [storyMood, setStoryMood] = useState<string | null>(null)
    const [applyFirstAidLens, setApplyFirstAidLens] = useState(false)
    const [selectedNations, setSelectedNations] = useState<string[]>([])
    const [selectedArchetypeKeys, setSelectedArchetypeKeys] = useState<string[]>([])
    const [allyshipDomain, setAllyshipDomain] = useState<string | null>(null)
    const [campaignRef, setCampaignRef] = useState<string | null>(null)
    const [campaignGoal, setCampaignGoal] = useState('')
    const [gatingOptions, setGatingOptions] = useState<{ nations: string[]; archetypeKeys: string[] }>({
        nations: [],
        archetypeKeys: [],
    })
    const [state, formAction, isPending] = useActionState<any, FormData>(createCustomBar, null)
    /** Scene Atlas full vault: tabbed panels (P3 — avoid single long scroll). */
    const [atlasVaultTab, setAtlasVaultTab] = useState<'core' | 'layers' | 'advanced'>('core')

    useEffect(() => {
        if (prefill || session321 || quickFrom321) setIsOpen(true)
    }, [prefill, session321, quickFrom321])

    useEffect(() => {
        if (prefill?.moveType) {
            setMoveType(prefill.moveType)
        }
    }, [prefill?.moveType])

    useEffect(() => {
        if (isOpen) {
            Promise.all([getActivePlayers(), getLinkableQuests(), getGatingOptions()]).then(([activePlayers, quests, options]) => {
                setPlayers(activePlayers)
                setLinkableQuests(quests)
                setGatingOptions(options)
            })
        }
    }, [isOpen, players.length, linkableQuests.length])

    useEffect(() => {
        if (state?.success) {
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('shadow321_progress')
                sessionStorage.removeItem('shadow321_metadata')
                sessionStorage.removeItem('shadow321_session')
            }
            if (sceneGridBind) {
                onSceneGridBound?.()
                router.refresh()
                return
            }
            queueMicrotask(() => {
                setIsOpen(false)
                const finalVisibility = state.visibility || visibility
                if (finalVisibility === 'private') {
                    privateRouter.navigate({ barId: state.barId })
                } else {
                    publicRouter.navigate({ barId: state.barId })
                }
            })
        }
    }, [state, visibility, sceneGridBind, onSceneGridBound, router, privateRouter, publicRouter])

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full p-4 border border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
            >
                <span className="text-xl">+</span>
                <span>Create a Bar</span>
            </button>
        )
    }

    return (
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-white text-lg">
                        {sceneGridBind
                            ? 'Create a BAR for this Scene Atlas cell'
                            : quickFrom321
                              ? 'Post from your 321'
                              : setup
                                ? 'The Setup'
                                : 'Create a new Bar'}
                    </h3>
                    {quickFrom321 && !sceneGridBind && (
                        <p className="text-xs text-zinc-500">
                            <Link href="/shadow/321" className="text-teal-400 hover:text-teal-300">
                                ← Back to 321
                            </Link>
                            {' · '}
                            Your session stays until you save this BAR.
                        </p>
                    )}
                    {sceneGridBind && (
                        <p className="text-xs text-amber-400/90 leading-relaxed max-w-md">
                            <span className="text-zinc-500 block mb-1">Template: Scene Atlas cell BAR (compost structure in description).</span>
                            Uses the same BAR form as Vault → BARs. When you save, this BAR is placed on{' '}
                            <span className="text-amber-200">{sceneGridBind.displayTitle}</span>. Stay private unless you
                            intentionally publish. <span className="text-zinc-500">Use tabs below to reduce scrolling — one submit.</span>
                        </p>
                    )}
                    {setup && (
                        <p className="text-amber-500 font-serif italic max-w-md">
                            "The stakes are infinite. The cost to you is zero. What is your first high-stakes move?"
                        </p>
                    )}
                </div>
                {!setup && (
                    <button
                        type="button"
                        onClick={() => (sceneGridBind ? onCancel?.() : setIsOpen(false))}
                        className="text-zinc-500 hover:text-white"
                    >
                        ✕
                    </button>
                )}
            </div>

            <form
                action={formAction}
                className="space-y-4"
                onSubmit={(e) => {
                    if (quickFrom321 && !sceneGridBind && !allyshipDomain) {
                        e.preventDefault()
                        setDomainError('Choose an allyship domain — where does this work live?')
                        return
                    }
                    setDomainError(null)
                }}
            >
                {quickFrom321 && !sceneGridBind ? <input type="hidden" name="quickFrom321" value="true" /> : null}
                {sceneGridBind ? (
                    <>
                        <input type="hidden" name="sceneGridInstanceId" value={sceneGridBind.instanceId} />
                        <input type="hidden" name="sceneGridCardId" value={sceneGridBind.cardId} />
                        <input type="hidden" name="sceneGridInstanceSlug" value={sceneGridBind.instanceSlug} />
                        <input type="hidden" name="sceneGridSuit" value={sceneGridBind.suit} />
                        <input type="hidden" name="sceneGridRank" value={String(sceneGridBind.rank)} />
                    </>
                ) : null}
                {prefill && (
                    <input type="hidden" name="metadata321" value={JSON.stringify(prefill)} />
                )}
                {session321?.phase3Snapshot && (
                    <input type="hidden" name="phase3Snapshot" value={session321.phase3Snapshot} />
                )}
                {session321?.phase2Snapshot && (
                    <input type="hidden" name="phase2Snapshot" value={session321.phase2Snapshot} />
                )}
                {session321?.shadow321Name && (
                    <input type="hidden" name="shadow321Name" value={JSON.stringify(session321.shadow321Name)} />
                )}
                {sceneGridBind ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-zinc-500">Title</label>
                            <input
                                name="title"
                                type="text"
                                placeholder="e.g. Share a Secret"
                                required
                                defaultValue={prefill?.title}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base min-h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-zinc-500">Description / Prompt</label>
                            <textarea
                                name="description"
                                placeholder="What should the player do?"
                                required
                                rows={2}
                                defaultValue={prefill?.description}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                            />
                        </div>
                        <div
                            className="flex flex-wrap gap-1 border-b border-zinc-800"
                            role="tablist"
                            aria-label="Vault form sections"
                        >
                            {(
                                [
                                    { id: 'core' as const, label: 'Core' },
                                    { id: 'layers' as const, label: 'Layers' },
                                    { id: 'advanced' as const, label: 'Advanced' },
                                ] as const
                            ).map(({ id, label }) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="tab"
                                    aria-selected={atlasVaultTab === id}
                                    onClick={() => setAtlasVaultTab(id)}
                                    className={`px-4 py-3 text-sm font-medium rounded-t-lg border border-b-0 min-h-11 transition-colors touch-manipulation ${
                                        atlasVaultTab === id
                                            ? 'border-zinc-600 bg-zinc-800/80 text-amber-200 border-b-transparent -mb-px z-[1]'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div
                            role="tabpanel"
                            id="atlas-vault-core"
                            aria-hidden={atlasVaultTab !== 'core'}
                            className={`space-y-4 pt-3 ${atlasVaultTab !== 'core' ? 'hidden' : ''}`}
                        >
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-zinc-500">Tags (Optional)</label>
                                <input
                                    name="tags"
                                    type="text"
                                    placeholder="ritual, onboarding, logistics"
                                    defaultValue={prefill?.tags?.join(', ')}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base min-h-11"
                                />
                            </div>
                            <div className="space-y-3 border-t border-zinc-800 pt-4">
                                <label className="text-xs uppercase text-zinc-500">Quest Visibility</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVisibility('public')
                                            const select = document.querySelector(
                                                'select[name="targetPlayerId"]'
                                            ) as HTMLSelectElement
                                            if (select) select.value = ''
                                        }}
                                        className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition min-h-11 ${
                                            visibility === 'public'
                                                ? 'bg-green-900/30 border-green-600 text-green-400'
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span>🌍 Public</span>
                                            <span className="text-[10px] text-green-500/80 font-mono">Cost: 1v Stake</span>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVisibility('private')}
                                        className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition min-h-11 ${
                                            visibility === 'private'
                                                ? 'bg-purple-900/30 border-purple-600 text-purple-400'
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                        }`}
                                    >
                                        🔒 Private
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-600">
                                    {visibility === 'public'
                                        ? 'Anyone can pick up and complete this quest.'
                                        : 'Only you can see this. Share it with a specific player.'}
                                </p>
                                <input type="hidden" name="visibility" value={visibility} />
                            </div>
                        </div>
                        <div
                            role="tabpanel"
                            id="atlas-vault-layers"
                            aria-hidden={atlasVaultTab !== 'layers'}
                            className={`space-y-4 pt-3 ${atlasVaultTab !== 'layers' ? 'hidden' : ''}`}
                        >
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setShowStory(!showStory)}
                                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2 min-h-11"
                                >
                                    <span>{showStory ? '▼' : '▶'}</span>
                                    <span>🎭 Add Story (Optional)</span>
                                </button>
                                {showStory ? (
                                    <div className="space-y-3 pl-4 border-l-2 border-purple-800">
                                        <textarea
                                            name="storyContent"
                                            placeholder="Write the narrative for this quest... (Markdown supported)"
                                            rows={4}
                                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base font-mono text-sm"
                                        />
                                        <div className="flex gap-2 flex-wrap">
                                            {[
                                                { key: 'dramatic', emoji: '🎭', label: 'Dramatic' },
                                                { key: 'playful', emoji: '✨', label: 'Playful' },
                                                { key: 'serious', emoji: '⚔️', label: 'Serious' },
                                                { key: 'mysterious', emoji: '🌙', label: 'Mysterious' },
                                            ].map((mood) => (
                                                <button
                                                    key={mood.key}
                                                    type="button"
                                                    onClick={() =>
                                                        setStoryMood(storyMood === mood.key ? null : mood.key)
                                                    }
                                                    className={`px-3 py-2 rounded-full text-xs transition min-h-11 ${
                                                        storyMood === mood.key
                                                            ? 'bg-purple-900/50 border border-purple-600 text-purple-300'
                                                            : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                    }`}
                                                >
                                                    {mood.emoji} {mood.label}
                                                </button>
                                            ))}
                                        </div>
                                        <input type="hidden" name="storyMood" value={storyMood || ''} />
                                    </div>
                                ) : (
                                    <input type="hidden" name="storyMood" value={storyMood || ''} />
                                )}
                            </div>
                            <div className="space-y-3 border-t border-zinc-800 pt-4">
                                <label className="text-xs uppercase text-zinc-500">Quest Type (Optional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { key: 'wakeUp', label: '👁 Wake Up', desc: 'Awareness' },
                                        { key: 'cleanUp', label: '🧹 Clean Up', desc: 'Shadow Work' },
                                        { key: 'growUp', label: '🌱 Grow Up', desc: 'Development' },
                                        { key: 'showUp', label: '🎯 Show Up', desc: 'Action' },
                                    ].map((mt) => (
                                        <button
                                            key={mt.key}
                                            type="button"
                                            onClick={() =>
                                                setMoveType(moveType === mt.key ? null : (mt.key as typeof moveType))
                                            }
                                            className={`py-2 px-3 rounded-lg border text-sm transition min-h-11 ${
                                                moveType === mt.key
                                                    ? 'bg-amber-900/30 border-amber-600 text-amber-400'
                                                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                            }`}
                                        >
                                            <span className="font-medium">{mt.label}</span>
                                            <span className="block text-xs text-zinc-500">{mt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                                <input type="hidden" name="moveType" value={moveType || ''} />
                            </div>
                            <div className="space-y-3 border-t border-zinc-800 pt-4">
                                <label className="text-xs uppercase text-zinc-500 block">Allyship Domain (Optional)</label>
                                <p className="text-xs text-zinc-600">
                                    WHERE the work happens. Distinct from moves (how you get it done).
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {ALLYSHIP_DOMAINS.map((d) => (
                                        <button
                                            key={d.key}
                                            type="button"
                                            onClick={() =>
                                                setAllyshipDomain(allyshipDomain === d.key ? null : d.key)
                                            }
                                            className={`px-3 py-2 rounded-lg border text-xs transition min-h-11 ${
                                                allyshipDomain === d.key
                                                    ? 'bg-teal-900/40 border-teal-600 text-teal-300'
                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                                <input type="hidden" name="allyshipDomain" value={allyshipDomain || ''} />
                            </div>
                        </div>
                        <div
                            role="tabpanel"
                            id="atlas-vault-advanced"
                            aria-hidden={atlasVaultTab !== 'advanced'}
                            className={`space-y-4 pt-3 ${atlasVaultTab !== 'advanced' ? 'hidden' : ''}`}
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-zinc-500">Response Type</label>
                                    <select
                                        name="inputType"
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base min-h-11"
                                    >
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-zinc-500">Response Label</label>
                                    <input
                                        name="inputLabel"
                                        type="text"
                                        defaultValue="Response"
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base min-h-11"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 border-t border-zinc-800 pt-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-zinc-500 block">
                                        Restrict to nations (optional)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {gatingOptions.nations.map((nation) => (
                                            <button
                                                key={nation}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedNations((prev) =>
                                                        prev.includes(nation)
                                                            ? prev.filter((n) => n !== nation)
                                                            : [...prev, nation]
                                                    )
                                                }
                                                className={`px-3 py-2 rounded-lg border text-xs transition min-h-11 ${
                                                    selectedNations.includes(nation)
                                                        ? 'bg-blue-900/40 border-blue-600 text-blue-300'
                                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                            >
                                                {nation}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="allowedNations"
                                        value={selectedNations.length > 0 ? JSON.stringify(selectedNations) : ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-zinc-500 block">
                                        Restrict to archetypes (optional)
                                    </label>
                                    <p className="text-[10px] text-zinc-600">
                                        Only players whose playbook matches one of these archetype labels (short name
                                        from each playbook).
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {gatingOptions.archetypeKeys.map((key) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedArchetypeKeys((prev) =>
                                                        prev.includes(key)
                                                            ? prev.filter((t) => t !== key)
                                                            : [...prev, key]
                                                    )
                                                }
                                                className={`px-3 py-2 rounded-lg border text-xs transition min-h-11 ${
                                                    selectedArchetypeKeys.includes(key)
                                                        ? 'bg-purple-900/40 border-purple-600 text-purple-300'
                                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="allowedTrigrams"
                                        value={
                                            selectedArchetypeKeys.length > 0
                                                ? JSON.stringify(selectedArchetypeKeys)
                                                : ''
                                        }
                                    />
                                </div>
                            </div>
                            <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 min-h-11">
                                <input
                                    type="checkbox"
                                    checked={applyFirstAidLens}
                                    onChange={(e) => setApplyFirstAidLens(e.target.checked)}
                                    className="mt-1 h-4 w-4 min-h-4 min-w-4"
                                />
                                <span className="text-xs text-zinc-300">
                                    Apply latest Emotional First Aid lens to this quest.
                                </span>
                            </label>
                            <input type="hidden" name="applyFirstAidLens" value={applyFirstAidLens ? 'true' : 'false'} />
                        </div>
                    </>
                ) : quickFrom321 ? (
                    <>
                        <p className="text-sm text-zinc-400">
                            Lead with your words — like a post. The list title below is optional; we default one for you.
                        </p>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-zinc-500">What you want to share</label>
                            <textarea
                                name="description"
                                placeholder="Say it in your voice…"
                                required
                                rows={6}
                                defaultValue={prefill?.description}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base leading-relaxed"
                            />
                        </div>
                        {prefill?.source321FullText ? (
                            <details className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-500">
                                <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">
                                    Show original 321 export
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap font-sans text-zinc-500">{prefill.source321FullText}</pre>
                            </details>
                        ) : null}

                        <div className="space-y-3 pt-2 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500 block">
                                Allyship domain <span className="text-red-400">*</span>
                            </label>
                            <p className="text-xs text-zinc-600">WHERE the work happens — required for BARs from 321.</p>
                            <div className="flex flex-wrap gap-2">
                                {ALLYSHIP_DOMAINS.map((d) => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() => {
                                            setAllyshipDomain(allyshipDomain === d.key ? null : d.key)
                                            setDomainError(null)
                                        }}
                                        className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                            allyshipDomain === d.key
                                                ? 'bg-teal-900/40 border-teal-600 text-teal-300'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="allyshipDomain" value={allyshipDomain || ''} />
                            {domainError ? <p className="text-sm text-red-400">{domainError}</p> : null}
                        </div>

                        <div className="space-y-3 pt-2 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500">Move (from 321)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'wakeUp', label: '👁 Wake Up' },
                                    { key: 'cleanUp', label: '🧹 Clean Up' },
                                    { key: 'growUp', label: '🌱 Grow Up' },
                                    { key: 'showUp', label: '🎯 Show Up' },
                                ].map((mt) => (
                                    <button
                                        key={mt.key}
                                        type="button"
                                        onClick={() =>
                                            setMoveType(moveType === mt.key ? null : (mt.key as 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'))
                                        }
                                        className={`py-2 px-3 rounded-lg border text-sm transition ${
                                            moveType === mt.key
                                                ? 'bg-amber-900/30 border-amber-600 text-amber-400'
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                        }`}
                                    >
                                        {mt.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="moveType" value={moveType || ''} />
                        </div>

                        <input
                            type="hidden"
                            name="tags"
                            value={prefill?.tags?.join(', ') ?? ''}
                        />

                        <div className="space-y-3 pt-2 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500">Quest Visibility</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setVisibility('public')}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition ${
                                        visibility === 'public'
                                            ? 'bg-green-900/30 border-green-600 text-green-400'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                                >
                                    🌍 Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVisibility('private')}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition ${
                                        visibility === 'private'
                                            ? 'bg-purple-900/30 border-purple-600 text-purple-400'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                                >
                                    🔒 Private
                                </button>
                            </div>
                            <input type="hidden" name="visibility" value={visibility} />
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAdvanced321(!showAdvanced321)}
                            className="text-sm text-zinc-500 hover:text-zinc-300"
                        >
                            {showAdvanced321 ? '▼' : '▶'} Advanced — list label & audience gating
                        </button>
                        {showAdvanced321 ? (
                            <div className="space-y-4 pl-3 border-l border-zinc-700">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-zinc-500">
                                        List label (optional)
                                    </label>
                                    <p className="text-[10px] text-zinc-600">
                                        Shown in lists and search. Defaults to a dated label if you leave this blank.
                                    </p>
                                    <input
                                        name="title"
                                        type="text"
                                        placeholder={prefill?.systemTitle ?? prefill?.title ?? 'Optional short label'}
                                        defaultValue={prefill?.title ?? prefill?.systemTitle}
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-zinc-500 block">
                                        Restrict to nations (optional)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {gatingOptions.nations.map((nation) => (
                                            <button
                                                key={nation}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedNations((prev) =>
                                                        prev.includes(nation)
                                                            ? prev.filter((n) => n !== nation)
                                                            : [...prev, nation]
                                                    )
                                                }
                                                className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                                    selectedNations.includes(nation)
                                                        ? 'bg-blue-900/40 border-blue-600 text-blue-300'
                                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                            >
                                                {nation}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="allowedNations"
                                        value={selectedNations.length > 0 ? JSON.stringify(selectedNations) : ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase text-zinc-500 block">
                                        Restrict to archetypes (optional)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {gatingOptions.archetypeKeys.map((key) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedArchetypeKeys((prev) =>
                                                        prev.includes(key)
                                                            ? prev.filter((t) => t !== key)
                                                            : [...prev, key]
                                                    )
                                                }
                                                className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                                    selectedArchetypeKeys.includes(key)
                                                        ? 'bg-purple-900/40 border-purple-600 text-purple-300'
                                                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="allowedTrigrams"
                                        value={
                                            selectedArchetypeKeys.length > 0
                                                ? JSON.stringify(selectedArchetypeKeys)
                                                : ''
                                        }
                                    />
                                </div>
                            </div>
                        ) : (
                            <input
                                type="hidden"
                                name="title"
                                defaultValue={prefill?.systemTitle ?? prefill?.title ?? ''}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs uppercase text-zinc-500">Title</label>
                            <input
                                name="title"
                                type="text"
                                placeholder="e.g. Share a Secret"
                                required
                                defaultValue={prefill?.title}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase text-zinc-500">Description / Prompt</label>
                            <textarea
                                name="description"
                                placeholder="What should the player do?"
                                required
                                rows={2}
                                defaultValue={prefill?.description}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                            />
                        </div>

                        {/* Story Section */}
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowStory(!showStory)}
                                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2"
                            >
                                <span>{showStory ? '▼' : '▶'}</span>
                                <span>🎭 Add Story (Optional)</span>
                            </button>

                            {showStory && (
                                <div className="space-y-3 pl-4 border-l-2 border-purple-800">
                                    <textarea
                                        name="storyContent"
                                        placeholder="Write the narrative for this quest... (Markdown supported)"
                                        rows={4}
                                        className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base font-mono text-sm"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {[
                                            { key: 'dramatic', emoji: '🎭', label: 'Dramatic' },
                                            { key: 'playful', emoji: '✨', label: 'Playful' },
                                            { key: 'serious', emoji: '⚔️', label: 'Serious' },
                                            { key: 'mysterious', emoji: '🌙', label: 'Mysterious' },
                                        ].map((mood) => (
                                            <button
                                                key={mood.key}
                                                type="button"
                                                onClick={() =>
                                                    setStoryMood(storyMood === mood.key ? null : mood.key)
                                                }
                                                className={`px-3 py-1 rounded-full text-xs transition ${
                                                    storyMood === mood.key
                                                        ? 'bg-purple-900/50 border border-purple-600 text-purple-300'
                                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                }`}
                                            >
                                                {mood.emoji} {mood.label}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="hidden" name="storyMood" value={storyMood || ''} />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-zinc-500">Response Type</label>
                                <select
                                    name="inputType"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                                >
                                    <option value="text">Short Text</option>
                                    <option value="textarea">Long Text</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase text-zinc-500">Response Label</label>
                                <input
                                    name="inputLabel"
                                    type="text"
                                    defaultValue="Response"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                                />
                            </div>
                        </div>

                        {/* Visibility Selection */}
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500">Quest Visibility</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVisibility('public')
                                        const select = document.querySelector(
                                            'select[name="targetPlayerId"]'
                                        ) as HTMLSelectElement
                                        if (select) select.value = ''
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition ${
                                        visibility === 'public'
                                            ? 'bg-green-900/30 border-green-600 text-green-400'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <span>🌍 Public</span>
                                        <span className="text-[10px] text-green-500/80 font-mono">Cost: 1v Stake</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setVisibility('private')}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition ${
                                        visibility === 'private'
                                            ? 'bg-purple-900/30 border-purple-600 text-purple-400'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                    }`}
                                >
                                    🔒 Private
                                </button>
                            </div>
                            <p className="text-xs text-zinc-600">
                                {visibility === 'public'
                                    ? 'Anyone can pick up and complete this quest.'
                                    : 'Only you can see this. Share it with a specific player.'}
                            </p>
                            <input type="hidden" name="visibility" value={visibility} />
                        </div>

                        <div className="space-y-2 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500">Link to Quest (Optional)</label>
                            <select
                                name="linkedQuestId"
                                defaultValue={prefill?.linkedQuestId ?? ''}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                            >
                                <option value="">No quest link</option>
                                {linkableQuests.map((quest) => (
                                    <option key={quest.id} value={quest.id}>
                                        {quest.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-zinc-600">
                                Tie this BAR to an existing quest for traceability in MVP.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase text-zinc-500">Tags (Optional)</label>
                            <input
                                name="tags"
                                type="text"
                                placeholder="ritual, onboarding, logistics"
                                defaultValue={prefill?.tags?.join(', ')}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                            />
                        </div>

                        {/* Move Type Selection */}
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500">Quest Type (Optional)</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'wakeUp', label: '👁 Wake Up', desc: 'Awareness' },
                                    { key: 'cleanUp', label: '🧹 Clean Up', desc: 'Shadow Work' },
                                    { key: 'growUp', label: '🌱 Grow Up', desc: 'Development' },
                                    { key: 'showUp', label: '🎯 Show Up', desc: 'Action' },
                                ].map((mt) => (
                                    <button
                                        key={mt.key}
                                        type="button"
                                        onClick={() =>
                                            setMoveType(moveType === mt.key ? null : (mt.key as any))
                                        }
                                        className={`py-2 px-3 rounded-lg border text-sm transition ${
                                            moveType === mt.key
                                                ? 'bg-amber-900/30 border-amber-600 text-amber-400'
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                        }`}
                                    >
                                        <span className="font-medium">{mt.label}</span>
                                        <span className="block text-xs text-zinc-500">{mt.desc}</span>
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="moveType" value={moveType || ''} />
                        </div>

                        {/* Allyship Domain (WHERE) */}
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500 block">Allyship Domain (Optional)</label>
                            <p className="text-xs text-zinc-600">
                                WHERE the work happens. Distinct from moves (how you get it done).
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {ALLYSHIP_DOMAINS.map((d) => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() =>
                                            setAllyshipDomain(allyshipDomain === d.key ? null : d.key)
                                        }
                                        className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                            allyshipDomain === d.key
                                                ? 'bg-teal-900/40 border-teal-600 text-teal-300'
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                            <input type="hidden" name="allyshipDomain" value={allyshipDomain || ''} />
                        </div>

                        {/* Link to Campaign (Optional) */}
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500 block">Link to Campaign (Optional)</label>
                            <p className="text-xs text-zinc-600">
                                Tag this quest with a campaign goal so it can be folded into the campaign and added as a
                                subquest on the gameboard.
                            </p>
                            <div className="space-y-2">
                                <select
                                    name="campaignRef"
                                    value={campaignRef ?? ''}
                                    onChange={(e) => setCampaignRef(e.target.value || null)}
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                                >
                                    <option value="">No campaign</option>
                                    <option value="bruised-banana">Bruised Banana</option>
                                </select>
                                <input
                                    name="campaignGoal"
                                    type="text"
                                    value={campaignGoal}
                                    onChange={(e) => setCampaignGoal(e.target.value)}
                                    placeholder="e.g. throw a party, raise funds"
                                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                                />
                            </div>
                        </div>

                        {/* Nation & archetype gating */}
                        <div className="space-y-4 pt-4 border-t border-zinc-800">
                            <div className="space-y-2">
                                <label className="text-xs uppercase text-zinc-500 block">
                                    Restrict to nations (optional)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {gatingOptions.nations.map((nation) => (
                                        <button
                                            key={nation}
                                            type="button"
                                            onClick={() =>
                                                setSelectedNations((prev) =>
                                                    prev.includes(nation)
                                                        ? prev.filter((n) => n !== nation)
                                                        : [...prev, nation]
                                                )
                                            }
                                            className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                                selectedNations.includes(nation)
                                                    ? 'bg-blue-900/40 border-blue-600 text-blue-300'
                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                        >
                                            {nation}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="hidden"
                                    name="allowedNations"
                                    value={selectedNations.length > 0 ? JSON.stringify(selectedNations) : ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase text-zinc-500 block">
                                    Restrict to archetypes (optional)
                                </label>
                                <p className="text-[10px] text-zinc-600">
                                    Only players whose playbook matches one of these archetype labels (short name from
                                    each playbook).
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {gatingOptions.archetypeKeys.map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() =>
                                                setSelectedArchetypeKeys((prev) =>
                                                    prev.includes(key)
                                                        ? prev.filter((t) => t !== key)
                                                        : [...prev, key]
                                                )
                                            }
                                            className={`px-3 py-1.5 rounded-lg border text-xs transition ${
                                                selectedArchetypeKeys.includes(key)
                                                    ? 'bg-purple-900/40 border-purple-600 text-purple-300'
                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="hidden"
                                    name="allowedTrigrams"
                                    value={
                                        selectedArchetypeKeys.length > 0
                                            ? JSON.stringify(selectedArchetypeKeys)
                                            : ''
                                    }
                                />
                            </div>
                        </div>

                        <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                            <input
                                type="checkbox"
                                checked={applyFirstAidLens}
                                onChange={(e) => setApplyFirstAidLens(e.target.checked)}
                                className="mt-1 h-4 w-4"
                            />
                            <span className="text-xs text-zinc-300">
                                Apply latest Emotional First Aid lens to this quest.
                            </span>
                        </label>
                        <input type="hidden" name="applyFirstAidLens" value={applyFirstAidLens ? 'true' : 'false'} />

                        {/* Assign To Player */}
                        <div className="space-y-2 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500">🎯 Assign To Player (Optional)</label>
                            <select
                                name="targetPlayerId"
                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white text-base"
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setVisibility('private')
                                    }
                                }}
                            >
                                <option value="">Anyone can claim (unassigned)</option>
                                {players.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-zinc-600">
                                {visibility === 'public'
                                    ? 'Public quests go to the "Salad Bowl" for anyone to claim.'
                                    : 'Private assigned quests go directly to the player. They can release it later.'}
                            </p>
                            {players.length === 0 && (
                                <p className="text-xs text-zinc-600 italic">Loading players...</p>
                            )}
                        </div>
                    </>
                )}

                {state?.error && (
                    <div className="text-red-400 text-sm">{state.error}</div>
                )}
                {state?.warning && (
                    <div className="text-yellow-300 text-sm">{state.warning}</div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => (sceneGridBind ? onCancel?.() : setIsOpen(false))}
                        className="px-6 py-3 text-zinc-400 hover:text-white min-h-[44px]"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50 min-h-[44px]"
                    >
                        {isPending ? 'Creating...' : sceneGridBind ? 'Save to Scene Atlas' : 'Create Bar'}
                    </button>
                </div>
            </form>
        </div>
    )
}
