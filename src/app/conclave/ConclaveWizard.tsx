'use client'

import { useState, useActionState, useEffect } from 'react'
import { createCharacter } from '@/actions/conclave'
import { checkEmail, login } from '@/actions/conclave-auth'
import { useRouter } from 'next/navigation'

type Nation = {
    id: string
    name: string
    description: string
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
    wakeUp?: string | null
    cleanUp?: string | null
    growUp?: string | null
    showUp?: string | null
}

type Step = 'email' | 'login' | 'identity' | 'nation' | 'playbook' | 'setup'

export function ConclaveWizard({
    token,
    theme,
    nations,
    playbooks,
}: {
    token: string
    theme?: string
    nations: Nation[]
    playbooks: Playbook[]
}) {
    const [step, setStep] = useState<Step>('email')

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

    const selectedNation = nations.find(n => n.id === nationId)
    const selectedPlaybook = playbooks.find(p => p.id === playbookId)

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
                    <h1 className="text-3xl font-bold text-white">Enter The Conclave</h1>
                    <p className="text-zinc-400">Identify yourself to begin.</p>
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
                    {isCheckingEmail ? 'Checking...' : 'Continue →'}
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
                    </div>
                    {/* Pronouns removed from P0 requirement, but can check if needed. Keeping simple. */}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setStep('email')}
                        className="flex-1 bg-zinc-800 text-white py-3 rounded-full font-bold"
                    >
                        ← Back
                    </button>
                    <button
                        disabled={!identity.name || !password}
                        onClick={() => setStep('nation')}
                        className="flex-1 bg-white text-black py-3 rounded-full font-bold disabled:opacity-50"
                    >
                        Next: Choose Nation →
                    </button>
                </div>
            </div>
        )
    }

    // --- STEP 3: NATION ---
    if (step === 'nation') {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">Choose Your Nation</h1>
                    <p className="text-zinc-400">Where do you hail from?</p>
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
                                    <MoveDisplay label="Wake Up" emoji="👁" value={nation.wakeUp} />
                                    <MoveDisplay label="Clean Up" emoji="🧹" value={nation.cleanUp} />
                                    <MoveDisplay label="Grow Up" emoji="🌱" value={nation.growUp} />
                                    <MoveDisplay label="Show Up" emoji="🎯" value={nation.showUp} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setStep('identity')} className="flex-1 bg-zinc-800 text-white py-3 rounded-full font-bold">← Back</button>
                    <button disabled={!nationId} onClick={() => setStep('playbook')} className="flex-1 bg-white text-black py-3 rounded-full font-bold disabled:opacity-50">Next: Choose Playbook →</button>
                </div>
            </div>
        )
    }

    // --- STEP 4: PLAYBOOK ---
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-white">Choose Your Playbook</h1>
                <p className="text-zinc-400">How do you move through the world?</p>
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
                                <MoveDisplay label="Wake Up" emoji="👁" value={playbook.wakeUp} />
                                <MoveDisplay label="Clean Up" emoji="🧹" value={playbook.cleanUp} />
                                <MoveDisplay label="Grow Up" emoji="🌱" value={playbook.growUp} />
                                <MoveDisplay label="Show Up" emoji="🎯" value={playbook.showUp} />
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
