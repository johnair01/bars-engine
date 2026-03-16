import Link from 'next/link'
import { InstanceCreationWizard } from './InstanceCreationWizard'

export default async function NewInstancePage({
  searchParams,
}: {
  searchParams: Promise<{ copyFrom?: string }>
}) {
  const { copyFrom } = await searchParams
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-1">
          <Link href="/lobby" className="text-xs text-zinc-600 hover:text-zinc-400 transition">
            ← Lobby
          </Link>
          <h1 className="text-2xl font-bold text-white">Create New Instance</h1>
          {copyFrom && (
            <p className="text-xs text-zinc-500">Copying config template from existing instance.</p>
          )}
        </header>
        <InstanceCreationWizard copyFromSlug={copyFrom} />
      </div>
    </div>
  )
}
