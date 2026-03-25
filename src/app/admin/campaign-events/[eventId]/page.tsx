import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { listEventArtifactsForStewardship } from '@/actions/campaign-invitation'
import { AdminEventStewardshipEditForm } from '@/components/admin/AdminEventStewardshipEditForm'

export default async function AdminCampaignEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ instanceId?: string }>
}) {
  const { eventId } = await params
  const sp = await searchParams
  const instanceId = sp.instanceId?.trim()
  if (!instanceId) {
    return (
      <div className="ml-0 sm:ml-64 p-6 space-y-4 text-zinc-300">
        <p>Missing <span className="font-mono">instanceId</span> query parameter.</p>
        <Link href="/admin/campaign-events" className="text-amber-400 hover:text-amber-300">
          ← Back to campaign events
        </Link>
      </div>
    )
  }

  const rows = await listEventArtifactsForStewardship(instanceId)
  const row = rows.find((r) => r.id === eventId)
  if (!row) notFound()

  const full = await db.eventArtifact.findUnique({
    where: { id: eventId },
    select: {
      title: true,
      description: true,
      eventType: true,
      locationType: true,
      locationDetails: true,
      visibility: true,
      status: true,
      startTime: true,
      endTime: true,
      timezone: true,
      capacity: true,
      linkedCampaignId: true,
    },
  })
  if (!full) notFound()

  const hostsCsv = row.hostActorIds.join(', ')

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans space-y-8 ml-0 sm:ml-64 transition-all duration-300">
      <header className="space-y-2">
        <Link href={`/admin/campaign-events?instanceId=${encodeURIComponent(instanceId)}`} className="text-sm text-zinc-500 hover:text-white">
          ← Campaign events
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit event</h1>
        <p className="text-zinc-500 font-mono text-xs">{eventId}</p>
      </header>

      <AdminEventStewardshipEditForm
        instanceId={instanceId}
        eventId={eventId}
        campaignId={full.linkedCampaignId}
        initial={{
          title: full.title,
          description: full.description,
          eventType: full.eventType,
          locationType: full.locationType,
          locationDetails: full.locationDetails,
          visibility: full.visibility,
          status: full.status,
          startTime: full.startTime,
          endTime: full.endTime,
          timezone: full.timezone,
          capacity: full.capacity,
        }}
        initialHostsCsv={hostsCsv}
      />
    </div>
  )
}
