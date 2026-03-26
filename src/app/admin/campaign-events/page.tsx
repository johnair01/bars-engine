import Link from 'next/link'
import { getAppConfig } from '@/actions/config'
import { listInstances } from '@/actions/instance'
import { listEventArtifactsForStewardship } from '@/actions/campaign-invitation'
import { AddCampaignKernelButton } from '@/components/admin/AddCampaignKernelButton'
import { formatEventScheduleRange } from '@/lib/event-artifact-format'
import type { EventStewardshipRow } from '@/actions/campaign-invitation'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

function rowToListItem(r: EventStewardshipRow): EventArtifactListItem {
  return {
    id: r.id,
    title: r.title,
    startTime: r.startTime,
    endTime: r.endTime,
    timezone: null,
    capacity: null,
    rsvpCount: 0,
    parentEventArtifactId: r.parentEventArtifactId,
  }
}

export default async function AdminCampaignEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ instanceId?: string }>
}) {
  const sp = (await searchParams) || {}
  const config = await getAppConfig()
  const activeId = (config as { activeInstanceId?: string | null }).activeInstanceId ?? null
  const instances = await listInstances()
  const instanceId = sp.instanceId?.trim() || activeId || instances[0]?.id || ''

  let rows: EventStewardshipRow[] = []
  if (instanceId) {
    rows = await listEventArtifactsForStewardship(instanceId)
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans space-y-8 ml-0 sm:ml-64 transition-all duration-300">
      <header className="space-y-2">
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">
          ← Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-white">Campaign events</h1>
        <p className="text-zinc-500 max-w-2xl">
          Edit <span className="font-mono text-zinc-400">EventArtifact</span> rows tied to an instance—metadata,
          schedule, and (as admin) campaign hosts.           See repo runbook <span className="font-mono text-xs text-zinc-400">docs/runbooks/ADMIN_STEWARDSHIP.md</span>.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Instance</h2>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Choose instance</span>
            <select
              name="instanceId"
              defaultValue={instanceId}
              className="bg-black border border-zinc-800 rounded px-3 py-2 text-white min-w-[240px]"
            >
              {instances.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.slug})
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm"
          >
            Load events
          </button>
          {instanceId ? <AddCampaignKernelButton instanceId={instanceId} /> : null}
        </form>
        {activeId && (
          <p className="text-xs text-zinc-600">
            Active instance id: <span className="font-mono text-zinc-400">{activeId}</span>
          </p>
        )}
      </section>

      {!instanceId && (
        <p className="text-zinc-500 text-sm">No instances found. Create one under Admin → Instances.</p>
      )}

      {instanceId && rows.length === 0 && (
        <p className="text-zinc-500 text-sm">No events for this instance yet. Use `/event` → Add gathering or seeds.</p>
      )}

      {instanceId && rows.length > 0 && (
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/40 border-b border-zinc-800">
              <tr>
                <th className="text-left p-3 text-zinc-400 font-bold">Title</th>
                <th className="text-left p-3 text-zinc-400 font-bold">Campaign</th>
                <th className="text-left p-3 text-zinc-400 font-bold">Schedule</th>
                <th className="text-left p-3 text-zinc-400 font-bold">Crew</th>
                <th className="text-right p-3 text-zinc-400 font-bold"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sched = formatEventScheduleRange(rowToListItem(r))
                return (
                  <tr key={r.id} className="border-b border-zinc-800/80 hover:bg-zinc-900/60">
                    <td className="p-3 text-white font-medium">{r.title}</td>
                    <td className="p-3 text-zinc-400 max-w-xs truncate">{r.campaignContext}</td>
                    <td className="p-3 text-zinc-500">{sched}</td>
                    <td className="p-3 text-zinc-600">{r.parentEventArtifactId ? 'yes' : '—'}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/campaign-events/${r.id}?instanceId=${encodeURIComponent(instanceId)}`}
                        className="text-amber-400 hover:text-amber-300 font-bold"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
