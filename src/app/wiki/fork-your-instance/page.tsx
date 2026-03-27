import Link from 'next/link'

/**
 * @page /wiki/fork-your-instance
 * @entity WIKI
 * @description Wiki page - Fork Your Instance guide - 6-step guide to fork repo, deploy to Vercel, and run your own BARs Engine
 * @permissions public
 * @relationships documents GitHub fork, database setup, environment variables, Vercel deployment, config import, instance creation
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+fork_guide, ENERGY:N/A, PERSONAL_THROUGHPUT:show_up
 * @example /wiki/fork-your-instance
 * @agentDiscoverable true
 */
const STEPS = [
  {
    title: '1. Fork the repository',
    content:
      'Go to the BARs Engine GitHub repository and click Fork. This creates your own copy of the codebase under your GitHub account.',
    link: {
      label: 'github.com/johnair01/bars-engine',
      href: 'https://github.com/johnair01/bars-engine',
    },
  },
  {
    title: '2. Set up your database',
    content:
      "Create a free PostgreSQL database on Railway, Supabase, or Neon. Copy the connection string — you'll need it as DATABASE_URL.",
  },
  {
    title: '3. Configure environment variables',
    content:
      "You'll need: DATABASE_URL (PostgreSQL), OPENAI_API_KEY (for AI generation), NEXTAUTH_SECRET (any random string), and ENABLE_LOBBY=true (to access your Game Lobby).",
  },
  {
    title: '4. Deploy to Vercel',
    content:
      'Connect your forked repo to Vercel. Add your environment variables in the Vercel dashboard. Vercel will build and deploy automatically.',
  },
  {
    title: '5. Import your config bundle',
    content:
      'If you were given a config bundle by the host, go to /admin and use the import tool to seed your instance with the same configuration.',
  },
  {
    title: '6. Create your first instance',
    content:
      'Go to /lobby (as an admin) and click "Create new instance" to run the Instance Creation Wizard. Your game is live.',
  },
]

export default function ForkYourInstancePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">
            Wiki
          </Link>{' '}
          / Fork Your Instance
        </div>
        <h1 className="text-3xl font-bold text-white">Fork Your Instance</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Run your own copy of the BARs Engine. This guide walks you through forking the repo,
          configuring your environment, and deploying to Vercel in under 30 minutes.
        </p>
      </header>

      <div className="space-y-4">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2"
          >
            <h2 className="text-sm font-semibold text-white">{step.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{step.content}</p>
            {step.link && (
              <a
                href={step.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition"
              >
                {step.link.label} →
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/fork-wizard"
          className="px-4 py-2 text-sm rounded-lg bg-emerald-800/30 border border-emerald-700/40 text-emerald-300 hover:bg-emerald-700/30 transition"
        >
          Start fork wizard →
        </Link>
        <Link
          href="/wiki"
          className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
        >
          ← Wiki
        </Link>
      </div>
    </div>
  )
}
