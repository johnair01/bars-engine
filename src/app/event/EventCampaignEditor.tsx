'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateInstanceCampaignCopy } from '@/actions/instance'
import { improveCopyWithAI, type CopyTarget } from '@/actions/copy-improvement'

const DEFAULT_WAKE_UP = `The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers.
Your awareness and participation help the collective thrive.`

const DEFAULT_SHOW_UP = `Contribute money (Donate above) or play the game by signing up and choosing your domains.
This instance runs on quests, BARs, vibeulons, and story clock.`

const DEFAULT_STORY_BRIDGE = `This residency is your Conclave; the fundraiser is the heist; your contribution powers the construct; vibeulons are the emotional energy that moves through this space.`

function ImproveWithAIButton({
  target,
  currentCopy,
  onImproved,
  disabled,
}: {
  target: CopyTarget
  currentCopy: string
  onImproved: (copy: string) => void
  disabled?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!currentCopy.trim()) return
    setLoading(true)
    setError(null)
    const result = await improveCopyWithAI(target, currentCopy)
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    onImproved(result.improvedCopy)
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !currentCopy.trim()}
        className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Improving…' : 'Improve with AI'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}

type Props = {
  instanceId: string
  initialWakeUp: string
  initialShowUp: string
  initialStoryBridge?: string
  initialTheme: string
  initialTargetDescription: string
}

export function EventCampaignEditor({
  instanceId,
  initialWakeUp,
  initialShowUp,
  initialStoryBridge = '',
  initialTheme,
  initialTargetDescription,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wakeUpContent, setWakeUpContent] = useState(initialWakeUp)
  const [showUpContent, setShowUpContent] = useState(initialShowUp)
  const [storyBridgeCopy, setStoryBridgeCopy] = useState(initialStoryBridge)
  const [theme, setTheme] = useState(initialTheme)
  const [targetDescription, setTargetDescription] = useState(initialTargetDescription)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await updateInstanceCampaignCopy(instanceId, {
      wakeUpContent: wakeUpContent || null,
      showUpContent: showUpContent || null,
      storyBridgeCopy: storyBridgeCopy || null,
      theme: theme || null,
      targetDescription: targetDescription || null,
    })
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-800/50 transition-colors"
      >
        Edit campaign
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white">Edit campaign copy</h2>
                <div className="flex gap-2">
                  <Link
                    href="/admin/instances"
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Edit in Admin
                  </Link>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-zinc-500 hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>

              <p className="text-xs text-zinc-500">
                Paste from ChatGPT or edit directly. Changes appear on the event page after save.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                    Story bridge (game ↔ real world)
                  </label>
                  <textarea
                    value={storyBridgeCopy}
                    onChange={(e) => setStoryBridgeCopy(e.target.value)}
                    rows={2}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder={DEFAULT_STORY_BRIDGE}
                  />
                  <p className="text-[10px] text-zinc-600 mt-0.5">Shown in CYOA intro. Connects Conclave/heist to residency/fundraiser.</p>
                  <ImproveWithAIButton
                    target="instance_storyBridgeCopy"
                    currentCopy={storyBridgeCopy}
                    onImproved={setStoryBridgeCopy}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                    Wake Up: Learn the story
                  </label>
                  <textarea
                    value={wakeUpContent}
                    onChange={(e) => setWakeUpContent(e.target.value)}
                    rows={4}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder={DEFAULT_WAKE_UP}
                  />
                  <ImproveWithAIButton
                    target="instance_wakeUpContent"
                    currentCopy={wakeUpContent}
                    onImproved={setWakeUpContent}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                    Show Up: Contribute to the campaign
                  </label>
                  <textarea
                    value={showUpContent}
                    onChange={(e) => setShowUpContent(e.target.value)}
                    rows={4}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder={DEFAULT_SHOW_UP}
                  />
                  <ImproveWithAIButton
                    target="instance_showUpContent"
                    currentCopy={showUpContent}
                    onImproved={setShowUpContent}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                    Theme
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="e.g. Heist at Construct Conclave"
                  />
                  <ImproveWithAIButton
                    target="instance_theme"
                    currentCopy={theme}
                    onImproved={setTheme}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                    Target description
                  </label>
                  <input
                    type="text"
                    value={targetDescription}
                    onChange={(e) => setTargetDescription(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="e.g. Raise $3000 for Bruised Banana Residency Fund"
                  />
                  <ImproveWithAIButton
                    target="instance_targetDescription"
                    currentCopy={targetDescription}
                    onImproved={setTargetDescription}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
