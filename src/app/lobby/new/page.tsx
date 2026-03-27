import Link from 'next/link'
import { zoneBackgroundStyle } from '@/lib/ui/zone-surfaces'
import { InstanceCreationWizard } from './InstanceCreationWizard'

/**
 * @page /lobby/new
 * @entity CAMPAIGN
 * @description Create new campaign instance wizard - optionally copy from existing instance
 * @permissions authenticated, admin
 * @searchParams copyFrom:string (optional) - Instance slug to copy config from
 * @relationships creates new CAMPAIGN instance, optionally copies from existing instance
 * @energyCost 0 (admin creation wizard)
 * @dimensions WHO:admin, WHAT:CAMPAIGN, WHERE:lobby, ENERGY:N/A, PERSONAL_THROUGHPUT:create
 * @example /lobby/new?copyFrom=bruised-banana
 * @agentDiscoverable false
 */
export default async function NewInstancePage({
  searchParams,
}: {
  searchParams: Promise<{ copyFrom?: string }>
}) {
  const { copyFrom } = await searchParams
  return (
    <div className="min-h-screen text-zinc-200 font-sans" style={zoneBackgroundStyle('lobby')}>
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
