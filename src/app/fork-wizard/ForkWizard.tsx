'use client'

import { useState } from 'react'

const ENV_VARS = [
  {
    key: 'DATABASE_URL',
    desc: 'PostgreSQL connection string (Railway, Supabase, or Neon)',
  },
  {
    key: 'OPENAI_API_KEY',
    desc: 'For AI-generated BARs, nations, and archetypes',
  },
  {
    key: 'NEXTAUTH_SECRET',
    desc: 'Any random 32-char string (openssl rand -base64 32)',
  },
  {
    key: 'ENABLE_LOBBY',
    desc: 'Set to "true" to unlock /lobby host console',
  },
]

export function ForkWizard() {
  const [step, setStep] = useState(0)
  const [repoForked, setRepoForked] = useState(false)
  const [envChecked, setEnvChecked] = useState<Record<string, boolean>>({})
  const [deployed, setDeployed] = useState(false)
  const [deployedUrl, setDeployedUrl] = useState('')

  const allEnvChecked = ENV_VARS.every((v) => envChecked[v.key])

  const STEPS = [
    {
      title: 'Fork the repository',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Click the link below to fork the BARs Engine repo to your GitHub account.
          </p>
          <a
            href="https://github.com/johnair01/bars-engine/fork"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm hover:bg-zinc-700 transition"
          >
            Fork on GitHub →
          </a>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={repoForked}
              onChange={(e) => setRepoForked(e.target.checked)}
              className="accent-emerald-500"
            />
            <span className="text-sm text-zinc-400">I&apos;ve forked the repo</span>
          </label>
        </div>
      ),
      canAdvance: repoForked,
    },
    {
      title: 'Configure environment variables',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            In your Vercel project settings, add these environment variables:
          </p>
          <div className="space-y-2">
            {ENV_VARS.map((v) => (
              <label key={v.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!envChecked[v.key]}
                  onChange={(e) =>
                    setEnvChecked({ ...envChecked, [v.key]: e.target.checked })
                  }
                  className="accent-emerald-500 mt-0.5"
                />
                <div>
                  <p className="text-sm font-mono text-zinc-200">{v.key}</p>
                  <p className="text-xs text-zinc-500">{v.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ),
      canAdvance: allEnvChecked,
    },
    {
      title: 'Deploy to Vercel',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Connect your forked repo to Vercel and deploy.
          </p>
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm hover:bg-zinc-700 transition"
          >
            Deploy on Vercel →
          </a>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Your deployed URL</label>
            <input
              value={deployedUrl}
              onChange={(e) => setDeployedUrl(e.target.value)}
              placeholder="https://your-app.vercel.app"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deployed}
              onChange={(e) => setDeployed(e.target.checked)}
              className="accent-emerald-500"
            />
            <span className="text-sm text-zinc-400">My app is live</span>
          </label>
        </div>
      ),
      canAdvance: deployed && deployedUrl.startsWith('https://'),
    },
    {
      title: 'Import config bundle (optional)',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            If you were given a config bundle JSON, you can import it to pre-seed your instance.
          </p>
          <p className="text-xs text-zinc-600">Skip this step if you&apos;re starting fresh.</p>
        </div>
      ),
      canAdvance: true,
    },
    {
      title: "You're live!",
      content: (
        <div className="space-y-4 text-center">
          <p className="text-3xl">&#127881;</p>
          <p className="text-sm text-zinc-300">Your BARs Engine is running.</p>
          {deployedUrl && (
            <a
              href={`${deployedUrl}/lobby`}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2.5 rounded-lg bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 text-sm hover:bg-emerald-700/40 transition"
            >
              Go to your Lobby →
            </a>
          )}
        </div>
      ),
      canAdvance: false,
    },
  ]

  const current = STEPS[step]

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">{current.title}</h2>
        {current.content}
      </div>

      <div className="flex gap-2">
        {step > 0 && step < STEPS.length - 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            ← Back
          </button>
        )}
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!current.canAdvance}
            className="flex-1 py-2 rounded-lg bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium hover:bg-emerald-700/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === STEPS.length - 2 ? 'Finish →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  )
}
