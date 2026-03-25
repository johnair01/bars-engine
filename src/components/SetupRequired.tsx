'use client'

import Link from 'next/link'
import { logout } from '@/actions/logout'

/**
 * Shown when DB is behind the Prisma schema (P2021 missing tables, P2022 missing columns). Run migrations.
 */
export function SetupRequired() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black text-white font-mono p-8">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-amber-400">Database setup required</h1>
        <p className="text-zinc-400">
          The database is out of sync with the app (missing tables or columns). Apply migrations for the same{' '}
          <code className="text-zinc-300">DATABASE_URL</code> as dev, then seed if needed:
        </p>
        <pre className="text-left text-sm bg-zinc-900 p-4 rounded-lg overflow-x-auto">
          npx tsx scripts/with-env.ts &quot;prisma migrate deploy&quot;
          {'\n'}npm run setup
        </pre>
        <p className="text-zinc-500 text-sm">
          Local Docker: ensure <code className="text-zinc-400">npm run switch -- local</code> first so migrate targets your local DB.
        </p>
        <div className="flex flex-col gap-3">
          <form action={logout}>
            <button
              type="submit"
              className="w-full py-3 px-6 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 rounded-lg"
            >
              Clear session and return home
            </button>
          </form>
          <Link
            href="/"
            className="text-zinc-500 text-sm hover:text-zinc-400"
          >
            Refresh after running setup
          </Link>
        </div>
      </div>
    </div>
  )
}
