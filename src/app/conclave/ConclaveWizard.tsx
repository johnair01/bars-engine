'use client'

import { useState, useActionState, useEffect } from 'react'
import { createCharacter } from '@/actions/conclave'
import { checkEmail, checkContactAvailability, login } from '@/actions/conclave-auth'
import { useRouter } from 'next/navigation'

type Nation = {
    id: string
    name: string
    description: string
    imgUrl?: string | null
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
}

type Playbook = {
    id: string
    name: string
    description: string
    moves: string
    content?: string | null
    centralConflict?: string | null
    primaryQuestion?: string | null
    vibe?: string | null
    energy?: string | null
    examples?: string | null
    shadowSignposts?: string | null
    lightSignposts?: string | null
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
}

import { WorldOverview } from '@/components/conclave/WorldOverview'
import { ArchetypeOverview } from '@/components/conclave/ArchetypeOverview'

function parseStringList(raw?: string | null): string[] {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item): item is string => typeof item === 'string')
    } catch {
        return []
    }
}

function getHandbookPreview(markdown?: string | null, maxLength = 260): string | null {
    if (!markdown) return null
    const plain = markdown
        .replace(/[#>*_`]/g, '')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
    if (!plain) return null
    if (plain.length <= maxLength) return plain
    return `${plain.slice(0, maxLength).trim()}...`
}

type Step = 'email' | 'login' | 'identity' | 'mode-selection' | 'world-overview' | 'nation' | 'archetype-overview' | 'playbook' | 'setup'

export function ConclaveWizard({
    token,
    theme,
    nations,
    playbooks,
    mode: initialMode,
}: {
    mode?: 'expert' | 'guided'
    token: string
    theme?: string
    nations: Nation[]
    playbooks: Playbook[]
}) {
    const [step, setStep] = useState<Step>('email')
    const [mode, setMode] = useState<'expert' | 'guided' | undefined>(initialMode)

    // Auth State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isCheckingEmail, setIsCheckingEmail] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null)

    // Character State
    const [identity, setIdentity] = useState({ name: '' }) // simplified
    const [nationId, setNationId] = useState<string | null>(null)
    const [playbookId, setPlaybookId] = useState<string | null>(null)
    const [expandedNation, setExpandedNation] = useState<string | null>(null)
    const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>(null)
    const [contactError, setContactError] = useState<string | null>(null)
    const [isValidatingContact, setIsValidatingContact] = useState(false)

    const [serverState, formAction, isPending] = useActionState(createCharacter, null)
    const router = useRouter()

    // Redirect or Success Handling for Creation
    useEffect(() => {
        if (serverState?.success) {
            router.push('/')
        }
    }, [serverState, router])

    const handleEmailCheck = async () => {
        if (!email.includes('@')) return
        setIsCheckingEmail(true)
        const result = await checkEmail(email)
        setIsCheckingEmail(false)

        if (result.exists) {
            setStep('login')
        } else {
            setStep('identity')
        }
    }

    const handleLogin = async () => {
        setLoginError(null)
        const formData = new FormData()
        formData.append('email', email)
        formData.append('password', password)
        const result = await login(formData)
        if (result?.error) {
            setLoginError(result.error)
        } else {
            router.push('/')
        }
    }

    const handleIdentityNext = async () => {
        setContactError(null)
        setIsValidatingContact(true)

        const result = await checkContactAvailability(email)
        setIsValidatingContact(false)

        if (!result.available) {
            if (result.reason === 'account_exists') {
                setContactError('This email already has an account. Please go back and log in.')
            } else {
                setContactError('A character already exists with this email. Please use a different email.')
            }
            return
        }

        // GO TO MODE SELECTION
        setStep('mode-selection')
    }

    const handleModeSelect = (selectedMode: 'expert' | 'guided') => {
        setMode(selectedMode)
        if (selectedMode === 'expert') {
            setStep('nation')
        } else {
            setStep('world-overview')
        }
    }

    const selectedPlaybook = playbooks.find(p => p.id === playbookId)
    const returnToWizard = `/conclave?token=${encodeURIComponent(token)}`

    // Random selection handlers
    const selectRandomNation = () => {
        const randomIndex = Math.floor(Math.random() * nations.length)
        setNationId(nations[randomIndex].id)
        setExpandedNation(nations[randomIndex].id)
    }

    const selectRandomPlaybook = () => {
        const randomIndex = Math.floor(Math.random() * playbooks.length)
        setPlaybookId(playbooks[randomIndex].id)
        setExpandedPlaybook(playbooks[randomIndex].id)
    }

    // Move display helper
    const MoveDisplay = ({ label, emoji, value }: { label: string; emoji: string; value?: string | null }) => {
        if (!value) return null
        const [moveName, ...descParts] = value.split(':')
        return (
            <div className="py-2 border-b border-zinc-800 last:border-0">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <span>{emoji}</span>
                    <span className="text-zinc-500">{label}:</span>
                    <span className="text-white">{moveName.trim()}</span>
                </div>
                {descParts.length > 0 && (
                    <p className="text-xs text-zinc-500 mt-1 ml-6">{descParts.join(':').trim()}</p>
                )}
            </div>
        )
    }

    // --- STEP 1: EMAIL ENTRY ---
    if (step === 'email') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Enter the Conclave</h1>
                    <p className="text-zinc-400 text-sm sm:text-base">Identify yourself to begin.</p>
                </div>

                <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleEmailCheck()}
                            placeholder="you@example.com"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
                            autoFocus
                        />
                    </div>
                </div>

                <button
                    disabled={!email || isCheckingEmail}
                    onClick={handleEmailCheck}
                    className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                >
                    {isCheckingEmail ? 'Checking...' : 'Continue'}
                </button>
            </div>
        )
    }

    // --- STEP 1.5: LOGIN (Existing User) ---
    if (step === 'login') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold text-white">Welcome Back</h1>
                    <p className="text-zinc-400">{email}</p>
                </div>

                <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            placeholder="••••••••"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none"
                            autoFocus
                        />
                    </div>
                    {loginError && (
                        <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded">
                            {loginError}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleLogin}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-full font-bold"
                    >
                        Log In
                    </button>
                    <button
                        onClick={() => setStep('email')}
                        className="w-full text-zinc-500 text-sm hover:text-zinc-300"
                    >
                        ← Use different email
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 2: IDENTITY (New User) ---
    if (step === 'identity') {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-white">New Arrival</h1>
                    <p className="text-zinc-400">Create your identity.</p>
                </div>

                <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Name</label>
                        <input
                            value={identity.name}
                            onChange={e => setIdentity({ ...identity, name: e.target.value })}
                            placeholder="Your Name..."
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Create a password..."
                            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white"
                        />
                        <p className="text-xs text-zinc-500">Must be at least 6 characters</p>
                    </div>
                    {contactError && (
                        <div className="text-red-500 text-sm text-center bg-red-900/20 p-3 rounded">
                            {contactError}
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setStep('email')}
                        className="flex-1 bg-zinc-800 text-white py-3 rounded-full font-bold"
                    >
                        ← Back
                    </button>
                    <button
                        disabled={!identity.name || !password || isValidatingContact}
                        onClick={handleIdentityNext}
                        className="flex-1 bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                    >
                        {isValidatingContact ? 'Checking...' : 'Next: Introduction →'}
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 2.5: MODE SELECTION ---
    if (step === 'mode-selection') {
        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
                <header className="text-center space-y-4">
                    <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        Choose Your Path
                    </h1>
                    <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto">
                        How would you like to begin your journey?
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Guided */}
                    <div onClick={() => handleModeSelect('guided')} className="group cursor-pointer bg-zinc-900/40 border-2 border-purple-900/50 hover:border-purple-500 rounded-2xl p-6 sm:p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20">
                        <div className="space-y-4">
                            <div className="text-4xl sm:text-5xl">📖</div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Guided Story Mode</h2>
                            <p className="text-sm sm:text-base text-zinc-400">
                                Perfect for first-time players. Meet your guide, complete training quests, and discover your role through story.
                            </p>
                            <div className="pt-4">
                                <div className="bg-purple-900/20 text-purple-300 px-4 py-2 rounded-lg text-center text-sm sm:text-base font-medium group-hover:bg-purple-900/30 transition-colors">
                                    Start the Adventure →
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expert */}
                    <div onClick={() => handleModeSelect('expert')} className="group cursor-pointer bg-zinc-900/40 border-2 border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 sm:p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-zinc-900/20">
                        <div className="space-y-4">
                            <div className="text-4xl sm:text-5xl">🎮</div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Expert Mode</h2>
                            <p className="text-sm sm:text-base text-zinc-400">
                                Skip the tutorial and jump straight in.
                            </p>
                            <div className="pt-4">
                                <div className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-center text-sm sm:text-base font-medium group-hover:bg-zinc-700 transition-colors">
                                    Quick Start →
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- STEP 2.5: WORLD OVERVIEW ---
    if (step === 'world-overview') {
        return <WorldOverview onNext={() => setStep('nation')} />
    }

    // --- STEP 3: NATION ---
    if (step === 'nation') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">Choose Your Nation</h1>
                    <p className="text-zinc-400">Where do you hail from?</p>
                    <button
                        type="button"
                        onClick={selectRandomNation}
                        className="text-sm text-purple-400 hover:text-purple-300 underline"
                    >
                        🎲 Choose for me
                    </button>
                </div>

                <div className="space-y-3">
                    {nations.map(nation => (
                        <div key={nation.id} className="rounded-xl border transition-all overflow-hidden"
                            style={{
                                backgroundColor: nationId === nation.id ? 'rgba(126, 34, 206, 0.15)' : 'rgba(39, 39, 42, 0.3)',
                                borderColor: nationId === nation.id ? 'rgb(168, 85, 247)' : 'rgb(39, 39, 42)'
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setNationId(nation.id)
                                    setExpandedNation(expandedNation === nation.id ? null : nation.id)
                                }}
                                className="w-full text-left p-4"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white">{nation.name}</div>
                                        <div className="text-sm text-zinc-500">{nation.description}</div>
                                    </div>
                                    <span className="text-zinc-600 text-xl">
                                        {expandedNation === nation.id ? '−' : '+'}
                                    </span>
                                </div>
                            </button>
                            {expandedNation === nation.id && (
                                <div className="px-4 pb-4 pt-2 border-t border-zinc-800 bg-zinc-900/50">
                                    {nation.imgUrl && (
                                        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800 bg-black">
                                            <img src={nation.imgUrl} alt={nation.name} className="w-full h-36 object-cover" />
                                        </div>
                                    )}
                                    <MoveDisplay label="Wake Up" emoji="👁" value={nation.wakeUp} />
                                    <MoveDisplay label="Clean Up" emoji="🧹" value={nation.cleanUp} />
                                    <MoveDisplay label="Grow Up" emoji="🌱" value={nation.growUp} />
                                    <MoveDisplay label="Show Up" emoji="🎯" value={nation.showUp} />
                                    <div className="mt-4 pt-4 border-t border-zinc-800">
                                        <a
                                            href={`/nation/${nation.id}?from=${encodeURIComponent(returnToWizard)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center py-2 rounded bg-purple-900/30 text-purple-300 text-sm font-bold border border-purple-500/30 hover:bg-purple-900/50 hover:border-purple-500 transition-all"
                                        >
                                            📜 Read Full Nation Guidebook ↗
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setStep('identity')} className="flex-1 bg-zinc-800 text-white py-3 rounded-full font-bold">← Back</button>
                    {/* MODE CHECK: Expert skips Archetype Overview */}
                    <button
                        disabled={!nationId}
                        onClick={() => mode === 'expert' ? setStep('playbook') : setStep('archetype-overview')}
                        className="flex-1 bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                    >
                        Next: Choose Archetype →
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 3.5: ARCHETYPE OVERVIEW ---
    if (step === 'archetype-overview') {
        return <ArchetypeOverview onNext={() => setStep('playbook')} />
    }

    // --- STEP 4: PLAYBOOK ---
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-white">Choose Your Archetype</h1>
                <p className="text-zinc-400">How do you move through the world?</p>
                <button
                    type="button"
                    onClick={selectRandomPlaybook}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                    🎲 Choose for me
                </button>
            </div>

            <div className="space-y-3">
                {playbooks.map(playbook => (
                    <div key={playbook.id} className="rounded-xl border transition-all overflow-hidden"
                        style={{
                            backgroundColor: playbookId === playbook.id ? 'rgba(30, 64, 175, 0.15)' : 'rgba(39, 39, 42, 0.3)',
                            borderColor: playbookId === playbook.id ? 'rgb(59, 130, 246)' : 'rgb(39, 39, 42)'
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setPlaybookId(playbook.id)
                                setExpandedPlaybook(expandedPlaybook === playbook.id ? null : playbook.id)
                            }}
                            className="w-full text-left p-4"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-white text-sm">{playbook.name}</div>
                                    <div className="text-xs text-zinc-500">{playbook.description}</div>
                                </div>
                                <span className="text-zinc-600 text-xl">
                                    {expandedPlaybook === playbook.id ? '−' : '+'}
                                </span>
                            </div>
                        </button>
                        {expandedPlaybook === playbook.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-zinc-800 bg-zinc-900/50">
                                {playbook.vibe && (
                                    <div className="mb-3 p-3 rounded-lg border border-blue-900/40 bg-blue-950/20">
                                        <div className="text-[10px] uppercase tracking-widest text-blue-300 font-bold mb-1">Vibe</div>
                                        <p className="text-sm text-blue-100/90 italic">"{playbook.vibe}"</p>
                                    </div>
                                )}
                                {playbook.energy && (
                                    <div className="mb-3 p-3 rounded-lg border border-indigo-900/40 bg-indigo-950/20">
                                        <div className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold mb-1">Energy</div>
                                        <p className="text-sm text-indigo-100/90 italic">"{playbook.energy}"</p>
                                    </div>
                                )}
                                {playbook.centralConflict && (
                                    <div className="mb-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Central Conflict</div>
                                        <p className="text-sm text-zinc-300">{playbook.centralConflict}</p>
                                    </div>
                                )}
                                {playbook.primaryQuestion && (
                                    <div className="mb-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Primary Question</div>
                                        <p className="text-sm text-zinc-300">{playbook.primaryQuestion}</p>
                                    </div>
                                )}
                                <MoveDisplay label="Wake Up" emoji="👁" value={playbook.wakeUp} />
                                <MoveDisplay label="Clean Up" emoji="🧹" value={playbook.cleanUp} />
                                <MoveDisplay label="Grow Up" emoji="🌱" value={playbook.growUp} />
                                <MoveDisplay label="Show Up" emoji="🎯" value={playbook.showUp} />
                                {(() => {
                                    const preview = getHandbookPreview(playbook.content)
                                    if (!preview) return null
                                    return (
                                        <div className="mt-3 p-3 rounded-lg border border-cyan-900/40 bg-cyan-950/20">
                                            <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-bold mb-1">Worldbook Excerpt</div>
                                            <p className="text-xs text-cyan-100/90 leading-relaxed">{preview}</p>
                                        </div>
                                    )
                                })()}
                                {(() => {
                                    const examples = parseStringList(playbook.examples)
                                    if (examples.length === 0) return null
                                    return (
                                        <div className="mt-3">
                                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Examples</div>
                                            <div className="flex flex-wrap gap-2">
                                                {examples.slice(0, 4).map((example, idx) => (
                                                    <span key={`${playbook.id}-ex-${idx}`} className="px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                        {example}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })()}
                                {(() => {
                                    const shadow = parseStringList(playbook.shadowSignposts)
                                    const light = parseStringList(playbook.lightSignposts)
                                    if (shadow.length === 0 && light.length === 0) return null
                                    return (
                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {shadow.length > 0 && (
                                                <div className="p-2 rounded border border-orange-900/40 bg-orange-950/20">
                                                    <div className="text-[10px] uppercase tracking-widest text-orange-300 font-bold mb-1">Shadow Signs</div>
                                                    <ul className="text-[11px] text-orange-100/90 list-disc pl-4 space-y-1">
                                                        {shadow.slice(0, 3).map((item, idx) => <li key={`${playbook.id}-sh-${idx}`}>{item}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                            {light.length > 0 && (
                                                <div className="p-2 rounded border border-green-900/40 bg-green-950/20">
                                                    <div className="text-[10px] uppercase tracking-widest text-green-300 font-bold mb-1">Light Signs</div>
                                                    <ul className="text-[11px] text-green-100/90 list-disc pl-4 space-y-1">
                                                        {light.slice(0, 3).map((item, idx) => <li key={`${playbook.id}-li-${idx}`}>{item}</li>)}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                                <div className="mt-4 pt-4 border-t border-zinc-800">
                                    <a
                                        href={`/archetype/${playbook.id}?from=${encodeURIComponent(returnToWizard)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-center py-2 rounded bg-blue-900/30 text-blue-300 text-sm font-bold border border-blue-500/30 hover:bg-blue-900/50 hover:border-blue-500 transition-all"
                                    >
                                        📘 Tell me more about this archetype ↗
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button onClick={() => setStep('nation')} className="flex-1 bg-zinc-800 text-white py-3 rounded-full font-bold">← Back</button>
                <form action={formAction} className="flex-1">
                    <input type="hidden" name="token" value={token} />
                    <input type="hidden" name="email" value={email} />
                    <input type="hidden" name="password" value={password} />
                    <input type="hidden" name="identity" value={JSON.stringify({ ...identity, contact: email, password: password })} />
                    <input type="hidden" name="nationId" value={nationId || ''} />
                    <input type="hidden" name="playbookId" value={playbookId || ''} />
                    <button
                        type="submit"
                        disabled={!playbookId || isPending}
                        className="w-full bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                    >
                        {isPending ? 'Creating...' : 'Create Character →'}
                    </button>
                </form>
            </div>
            {serverState?.error && <div className="text-red-500 text-center text-sm">{serverState.error}</div>}
        </div>
    )
}
