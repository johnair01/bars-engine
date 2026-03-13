import Link from 'next/link'

const FRONTEND_STACK = [
  {
    name: 'Next.js 16 + React 19',
    role: 'App framework & UI runtime',
    description:
      'Server components, App Router, and React 19 concurrent features. Most pages are server-rendered for auth-aware data fetching; client components handle interactive UI.',
  },
  {
    name: 'TypeScript 5',
    role: 'Type safety',
    description:
      'Strict typing across the entire frontend. Types flow from Prisma schema → server actions → components, reducing the surface for runtime surprises.',
  },
  {
    name: 'Tailwind CSS 4',
    role: 'Styling',
    description:
      'Utility-first CSS. The dark zinc palette (zinc-900/zinc-800 cards, white text) is the design system. No separate component library — just Tailwind.',
  },
  {
    name: 'Prisma 5',
    role: 'ORM & database client',
    description:
      'Schema-first ORM. The source of truth for the data model lives in prisma/schema.prisma. Run npm run db:sync after schema changes.',
  },
  {
    name: 'Vercel AI SDK',
    role: 'AI streaming',
    description:
      'Used on the frontend for streaming AI responses (charge capture, quest generation). Pairs with the OpenAI provider on the backend side of Next.js API routes.',
  },
]

const BACKEND_STACK = [
  {
    name: 'FastAPI',
    role: 'Python web framework',
    description:
      'Async HTTP server for domain-specific AI endpoints. Lives in /backend and runs separately from the Next.js app. Currently has a health endpoint; domain routes are being built out.',
  },
  {
    name: 'SQLAlchemy 2.0 (async)',
    role: 'Python ORM',
    description:
      'Async-first ORM for the Python backend. Models mirror the Prisma schema so both apps share one PostgreSQL database. Alembic handles migrations.',
  },
  {
    name: 'Pydantic 2',
    role: 'Data validation',
    description:
      'The universal translator between raw data and clean Python objects. Every FastAPI request/response is validated through Pydantic models. Type hints are the source of truth — if it type-checks, the data is valid.',
  },
  {
    name: 'Pydantic AI',
    role: 'AI agent framework',
    description:
      'Wraps LLM calls (GPT, Claude, Gemini) in typed, testable Python code. Agents get tools (Python functions the AI can call), dependencies (DB connections, API keys), and structured output (validated Pydantic models returned from the LLM). The app/agents/ directory is the planned home.',
  },
  {
    name: 'Logfire',
    role: 'Observability',
    description:
      'Pydantic\'s observability layer, built on OpenTelemetry. Two lines of setup gives full traces of every agent run — what the AI said, what tools it called, how many tokens it used. Optional in dev, recommended in prod.',
  },
  {
    name: 'UV',
    role: 'Python package manager',
    description:
      'Rust-powered replacement for pip + virtualenv. 10–100x faster installs. Used instead of pip in the backend Dockerfile and local dev setup.',
  },
]

const DATA_STACK = [
  {
    name: 'PostgreSQL 16',
    role: 'Primary database',
    description:
      'Single Postgres instance shared by both the Next.js app (via Prisma) and the Python backend (via SQLAlchemy). Runs locally via Docker; hosted on Neon/Vercel Postgres in production.',
  },
  {
    name: 'Vercel Blob',
    role: 'File storage',
    description: 'Used for storing uploaded assets (voice recordings, images, artifacts).',
  },
]

const AI_CONCEPTS = [
  {
    name: 'Agents',
    description:
      'An Agent wraps a model, gives it instructions, tools, and an expected output type. Created once at startup, reused per request. Think of it as the "app" for an LLM.',
  },
  {
    name: 'Structured Output',
    description:
      'Instead of raw text, agents return validated Pydantic models. If the model returns invalid data, Pydantic AI tells it to retry. Quest proposals, emotional first aid summaries, and charge captures all use this pattern.',
  },
  {
    name: 'Tools',
    description:
      'Python functions decorated with @agent.tool that the AI can choose to call mid-run. The function signature and docstring become the tool schema. Example: a tool that looks up a player\'s active quests before generating a suggestion.',
  },
  {
    name: 'Dependencies',
    description:
      'Database sessions, API keys, and HTTP clients injected into tool functions at runtime. In tests, swap in fakes. In prod, pass real connections. The agent code never changes.',
  },
  {
    name: 'Logfire Tracing',
    description:
      'Every agent.run() produces a structured trace: messages, tool calls, token usage, latency. Two lines to enable. Crucial for understanding what the AI actually did in a given run.',
  },
]

export default function TechStackPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Tech Stack</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Tech Stack</h1>
        <p className="text-zinc-400 text-sm">
          How BARs Engine is built — frontend, backend, data layer, and AI infrastructure.
        </p>
      </header>

      {/* Frontend */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400">Frontend (Next.js App)</h2>
        <div className="space-y-3">
          {FRONTEND_STACK.map((item) => (
            <div
              key={item.name}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-1"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-semibold text-white">{item.name}</span>
                <span className="text-xs text-zinc-500">{item.role}</span>
              </div>
              <p className="text-zinc-300 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Backend */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400">Backend (Python / FastAPI)</h2>
        <div className="space-y-3">
          {BACKEND_STACK.map((item) => (
            <div
              key={item.name}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-1"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-semibold text-white">{item.name}</span>
                <span className="text-xs text-zinc-500">{item.role}</span>
              </div>
              <p className="text-zinc-300 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400">Data Layer</h2>
        <div className="space-y-3">
          {DATA_STACK.map((item) => (
            <div
              key={item.name}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-1"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-semibold text-white">{item.name}</span>
                <span className="text-xs text-zinc-500">{item.role}</span>
              </div>
              <p className="text-zinc-300 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pydantic AI concepts */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-400">Pydantic AI — Key Concepts</h2>
        <p className="text-zinc-400 text-sm">
          The Python backend uses Pydantic AI as its agent framework. These are the five concepts worth knowing.
        </p>
        <div className="space-y-3">
          {AI_CONCEPTS.map((item) => (
            <div
              key={item.name}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-1"
            >
              <span className="font-semibold text-white">{item.name}</span>
              <p className="text-zinc-300 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Full field guide:{' '}
          <span className="text-zinc-400 font-mono">docs/PYDANTIC_ECOSYSTEM_RESEARCH.md</span>
        </p>
      </section>

      {/* Architecture summary */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">How the two apps connect</h2>
        <p className="text-zinc-300 text-sm">
          The Next.js app is the primary player-facing interface — quests, BARs, emotional first aid,
          campaigns, wiki. It talks directly to Postgres via Prisma.
        </p>
        <p className="text-zinc-300 text-sm">
          The Python backend (FastAPI) handles AI-heavy operations: agent runs, structured extractions,
          multi-step workflows. It exposes a REST API that the Next.js app calls for those features.
          Both apps share the same Postgres database.
        </p>
        <p className="text-zinc-300 text-sm">
          The split exists because Pydantic AI&apos;s agent framework and Python&apos;s AI ecosystem
          are richer than the Node.js equivalents for complex agent workflows. Simple streaming AI
          (charge capture, quick generation) stays in Next.js API routes using the Vercel AI SDK.
        </p>
      </section>
    </div>
  )
}
