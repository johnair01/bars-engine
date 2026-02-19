import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAppConfig, updateFeatures, updateHeroText, updateOrientationQuest, getRecentAuditLogs } from '@/actions/config'
import Link from 'next/link'

export default async function AdminConfigPage() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) redirect('/')

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    const isAdmin = player?.roles.some(r => r.role.key === 'admin')
    if (!isAdmin) redirect('/')

    const config = await getAppConfig()
    const auditLogs = await getRecentAuditLogs(10)

    // Fetch available Twine stories for orientation
    const twineStories = await db.twineStory.findMany({
        where: { isPublished: true },
        select: { id: true, title: true }
    })

    // Parse features safely
    let features: Record<string, boolean> = {}
    try {
        features = JSON.parse(config.features || '{}')
    } catch {
        features = {}
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-8 max-w-4xl mx-auto space-y-12">
            <header className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">← Back to Admin</Link>
                    <h1 className="text-3xl font-bold text-white mt-2">App Configuration</h1>
                    <div className="text-zinc-500">Feature flags and system-wide settings</div>
                </div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* FEATURE FLAGS */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">Feature Flags</h2>
                    <form action={async (formData) => { 'use server'; await updateFeatures(formData) }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            {['wallet', 'iching', 'quests', 'story', 'customBars'].map(feature => (
                                <label key={feature} className="flex items-center gap-3 p-2 hover:bg-zinc-800 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name={`feature_${feature}`}
                                        defaultChecked={features[feature] !== false}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-zinc-300 capitalize text-sm">{feature}</span>
                                </label>
                            ))}
                        </div>
                        <input type="hidden" name="features" id="featuresJson" />
                        <button
                            type="submit"
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded"
                            onClick={(e) => {
                                // Collect checkboxes into JSON
                                const form = (e.target as HTMLButtonElement).closest('form')!
                                const checkboxes = form.querySelectorAll('input[type=checkbox]')
                                const features: Record<string, boolean> = {}
                                checkboxes.forEach(cb => {
                                    const input = cb as HTMLInputElement
                                    const name = input.name.replace('feature_', '')
                                    features[name] = input.checked
                                })
                                form.querySelector<HTMLInputElement>('#featuresJson')!.value = JSON.stringify(features)
                            }}
                        >
                            Save Features
                        </button>
                    </form>
                </section>

                {/* ORIENTATION QUEST CONFIG */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">Onboarding Ritual</h2>
                    <form action={async (formData) => { 'use server'; await updateOrientationQuest(formData) }} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs uppercase text-zinc-500">Active Orientation Ritual</label>
                            <select
                                name="orientationQuestId"
                                defaultValue={config.orientationQuestId || ''}
                                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            >
                                <option value="">Standard Selection (No Ritual)</option>
                                {twineStories.map(story => (
                                    <option key={story.id} value={story.id}>
                                        {story.title}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-zinc-500 italic">
                                Set which Twine story begins a player's journey.
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded"
                        >
                            Update Ritual
                        </button>
                    </form>
                </section>

                {/* HERO TEXT */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 h-fit">
                    <h2 className="text-lg font-bold text-white">Landing Page</h2>
                    <form action={async (formData) => { 'use server'; await updateHeroText(formData) }} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs uppercase text-zinc-500">Hero Title</label>
                            <input
                                type="text"
                                name="heroTitle"
                                defaultValue={config.heroTitle || ''}
                                placeholder="BARS ENGINE"
                                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs uppercase text-zinc-500">Hero Subtitle</label>
                            <input
                                type="text"
                                name="heroSubtitle"
                                defaultValue={config.heroSubtitle || ''}
                                placeholder="A quest system for the vibrational convergence"
                                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded"
                        >
                            Save Hero Text
                        </button>
                    </form>
                </section>
            </div>

            {/* AUDIT LOG */}
            <section className="space-y-4">
                <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800 pb-2">
                    System Audit Trail
                </h2>
                <div className="space-y-1">
                    {auditLogs.map(log => (
                        <div key={log.id} className="bg-zinc-900/50 p-2 rounded border border-zinc-800/50 text-xs flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.action === 'feature_toggle' ? 'bg-purple-900/30 text-purple-400' :
                                        log.action === 'config_update' ? 'bg-blue-900/30 text-blue-400' :
                                            'bg-zinc-800 text-zinc-500'
                                    }`}>
                                    {log.action.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className="text-zinc-500 font-mono text-[10px]">
                                    {log.target && <span className="mr-1">{log.target}</span>}
                                </span>
                            </div>
                            <div className="text-zinc-600 text-[10px]">
                                {new Date(log.createdAt).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {auditLogs.length === 0 && (
                        <div className="text-zinc-600 italic text-sm">No changes recorded yet.</div>
                    )}
                </div>
            </section>
        </div>
    )
}
