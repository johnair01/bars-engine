import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMvpProfileSetupData, saveMvpProfileSetup } from '@/actions/mvp-onboarding'

const ERROR_MESSAGES: Record<string, string> = {
    missing: 'Please choose both a nation and an archetype.',
    invalid: 'That selection is no longer available. Please choose again.',
    save_failed: 'Could not save your profile. Please retry.',
}

export default async function MvpProfileSetupPage({
    searchParams
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = await searchParams
    const data = await getMvpProfileSetupData()

    if ('error' in data) {
        redirect('/login')
    }

    const { player, nations, playbooks } = data
    const errorMessage = error ? ERROR_MESSAGES[error] || 'Unable to update profile.' : null

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-6 sm:p-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                    <Link href="/" className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                        ← Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
                    <p className="text-zinc-400">
                        Select your nation and archetype to unlock quest creation, BAR creation, and transfer actions.
                    </p>
                </div>

                {errorMessage && (
                    <div className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                        {errorMessage}
                    </div>
                )}

                <form action={saveMvpProfileSetup} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Nation</label>
                        <select
                            name="nationId"
                            defaultValue={player.nationId || ''}
                            required
                            className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        >
                            <option value="" disabled>Select a nation</option>
                            {nations.map((nation) => (
                                <option key={nation.id} value={nation.id}>
                                    {nation.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-2">
                            Sets your cultural resonance and basic move lens.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2">Archetype</label>
                        <select
                            name="playbookId"
                            defaultValue={player.playbookId || ''}
                            required
                            className="w-full rounded-lg border border-zinc-700 bg-black px-4 py-3 text-white"
                        >
                            <option value="" disabled>Select an archetype</option>
                            {playbooks.map((playbook) => (
                                <option key={playbook.id} value={playbook.id}>
                                    {playbook.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-2">
                            Determines your role expression and move style.
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-purple-600 hover:bg-purple-500 py-3 font-bold text-white transition-colors"
                    >
                        Save and Continue
                    </button>
                </form>
            </div>
        </div>
    )
}
