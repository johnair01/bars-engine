import { logout } from '@/actions/logout'

/**
 * Shown when Prisma cannot reach Postgres (P1001 / P1000), e.g. Docker Postgres not started.
 */
export function DatabaseUnreachable() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black text-white font-mono p-8">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-red-400">Database unreachable</h1>
        <p className="text-zinc-400">
          The app cannot connect to Postgres (usually port 5432). Start your local database, then seed if needed.
        </p>
        <pre className="text-left text-sm bg-zinc-900 p-4 rounded-lg overflow-x-auto text-zinc-300">
          make db-local{'\n'}npm run db:seed
        </pre>
        <p className="text-zinc-500 text-sm">
          See <span className="text-zinc-400">docs/SYNTHETIC_VS_REAL.md</span> for local vs Vercel DB. Or run{' '}
          <code className="text-zinc-400">npm run switch -- vercel</code> if you use a hosted database.
        </p>
        <div className="flex flex-col gap-3">
          <form action={logout}>
            <button
              type="submit"
              className="w-full py-3 px-6 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 rounded-lg"
            >
              Clear session and retry
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
