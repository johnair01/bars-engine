'use client'

import { useState, useActionState, useEffect } from 'react'
import { createCharacter } from '@/actions/conclave'
import { checkEmail, checkContactAvailability, login } from '@/actions/conclave-auth'
import { useRouter } from 'next/navigation'
import { ArchetypeWorldbookCard, NationWorldbookCard } from '@/components/worldbook/WorldbookCards'

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
                        <NationWorldbookCard
                            key={nation.id}
                            nation={nation}
                            selected={nationId === nation.id}
                            expanded={expandedNation === nation.id}
                            onToggle={() => {
                                setNationId(nation.id)
                                setExpandedNation(expandedNation === nation.id ? null : nation.id)
                            }}
                            detailHref={`/nation/${nation.id}?from=${encodeURIComponent(returnToWizard)}`}
                            detailLabel="📜 Read Full Nation Guidebook ↗"
                            openInNewTab
                        />
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
                    <ArchetypeWorldbookCard
                        key={playbook.id}
                        archetype={playbook}
                        selected={playbookId === playbook.id}
                        expanded={expandedPlaybook === playbook.id}
                        onToggle={() => {
                            setPlaybookId(playbook.id)
                            setExpandedPlaybook(expandedPlaybook === playbook.id ? null : playbook.id)
                        }}
                        detailHref={`/archetype/${playbook.id}?from=${encodeURIComponent(returnToWizard)}`}
                        detailLabel="📘 Tell me more about this archetype ↗"
                        openInNewTab
                    />
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
