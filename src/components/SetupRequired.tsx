'use client'

import Link from 'next/link'
import { logout } from '@/actions/logout'

/**
 * Shown when DB tables are missing (P2021). Run npm run setup to apply migrations and seed.
 */
export function SetupRequired() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black text-white font-mono p-8">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-amber-400">Database setup required</h1>
        <p className="text-zinc-400">
          The database tables are missing. Apply migrations and seed the database:
        </p>
        <pre className="text-left text-sm bg-zinc-900 p-4 rounded-lg overflow-x-auto">
          npm run setup
        </pre>
        <p className="text-zinc-500 text-sm">
          Or manually: <code className="text-zinc-400">prisma migrate deploy</code> then{' '}
          <code className="text-zinc-400">npm run db:seed</code>
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
