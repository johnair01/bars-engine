import Link from 'next/link'
import type { Metadata } from 'next'
import { getActiveInstance } from '@/actions/instance'
import { getCurrentPlayer } from '@/lib/auth'
import {
  canCreateCampaignOnInstance,
  canInviteToAnyEventOnInstance,
  listEventArtifactsForInstance,
} from '@/actions/campaign-invitation'
import { getEventCampaignsForInstance } from '@/actions/event-campaign-engine'
import { getWorldVenueEntryForInstance } from '@/actions/spatial-maps'
import { KOTTER_STAGES } from '@/lib/kotter'
import { InviteButton } from './InviteButton'
import { InviteToEventButton } from './InviteToEventButton'
import {
  EditEventScheduleButton,
  formatEventCapacityLine,
  formatEventScheduleRange,
} from './EditEventScheduleButton'
import { EditEventDetailsButton } from './EditEventDetailsButton'
import { EventGuestsPanel } from './EventGuestsPanel'
import { EventCampaignEditor } from './EventCampaignEditor'
import { EventProgressUpdater } from './EventProgressUpdater'
import { LibraryRequestButton } from '@/components/LibraryRequestButton'
import { EventCrewSurface } from '@/components/event/EventCrewSurface'
import { BruisedBananaApr2026EventBlocks } from './BruisedBananaApr2026EventBlocks'
import { CreateEventButton } from './CreateEventButton'

/**
 * @page /event
 * @entity EVENT
 * @description Campaign hub - story (Wake Up), fundraiser progress, scheduled events, invite management
 * @permissions public (Wake Up section), authenticated (Show Up actions), admin (event editing)
 * @relationships displays active CAMPAIGN instance, lists EventArtifacts, manages event invites, links to spatial world venue
 * @energyCost 0 (campaign hub navigation)
 * @dimensions WHO:playerId+admin, WHAT:EVENT, WHERE:campaign_hub, ENERGY:fundraiser+kotter_stage, PERSONAL_THROUGHPUT:wake_up+show_up
 * @example /event
 * @agentDiscoverable true
 */
const DEFAULT_WAKE_UP = `The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers.
Your awareness and participation help the collective thrive.`

const DEFAULT_SHOW_UP = `Contribute money (Donate above) or play the game by signing up and choosing your domains.
This instance runs on quests, BARs, vibeulons, and story clock.`

export const metadata: Metadata = {
  title: 'Campaign',
  description: 'Campaign hub — story, events, and ways to contribute.',
}

function formatUsdCents(cents: number) {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars)
}

export default async function EventPage() {
  const instance = await getActiveInstance()
  const player = await getCurrentPlayer()

  if (!instance) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full space-y-6 text-center">
          <div className="text-4xl">🧩</div>
          <h1 className="text-2xl font-bold text-white">No active campaign</h1>
          <p className="text-zinc-500">
            No instance is set as active. Admins can choose one under Admin → Instances → Set Active.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/" className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-200">
              Back to app
            </Link>
            <Link href="/conclave" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold">
              Join
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const goal = instance.goalAmountCents ?? 0
  const current = instance.currentAmountCents ?? 0
  const pct = goal > 0 ? Math.max(0, Math.min(1, current / goal)) : 0
  const isAdmin = !!player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')
  const eventArtifacts = await listEventArtifactsForInstance(instance.id)
  const eventCampaigns = await getEventCampaignsForInstance(instance.id)
  const canSendEventInvites =
    !!player && (await canInviteToAnyEventOnInstance(player.id, instance.id))
  const canCreateCampaign =
    !!player && (await canCreateCampaignOnInstance(player.id, instance.id))
  const rootEvents = eventArtifacts.filter((e) => !e.parentEventArtifactId)
  const childrenOf = (parentId: string) =>
    eventArtifacts.filter((e) => e.parentEventArtifactId === parentId)
  const worldVenue = await getWorldVenueEntryForInstance(instance.id)
  const wakeUpContent = instance.wakeUpContent ?? DEFAULT_WAKE_UP
  const showUpContent = instance.showUpContent ?? DEFAULT_SHOW_UP
  const refForDonate = instance.campaignRef?.trim() || instance.slug?.trim() || 'bruised-banana'
  const donateWizardHref = `/event/donate/wizard?ref=${encodeURIComponent(refForDonate)}`

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="space-y-3">
          <div className="flex justify-between items-start">
            <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back</Link>
            {isAdmin && (
              <EventCampaignEditor
                instanceId={instance.id}
                initialWakeUp={wakeUpContent}
                initialShowUp={showUpContent}
                initialStoryBridge={instance.storyBridgeCopy ?? ''}
                initialTheme={instance.theme ?? ''}
                initialTargetDescription={instance.targetDescription ?? ''}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
              Campaign
            </span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs uppercase tracking-widest text-zinc-500">
              {instance.domainType}
            </span>
            <span className="text-xs text-teal-400">
              Stage {instance.kotterStage ?? 1}: {KOTTER_STAGES[(instance.kotterStage ?? 1) as keyof typeof KOTTER_STAGES]?.name ?? 'Urgency'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white">{instance.name}</h1>
          <p className="text-sm text-zinc-500">
            Fundraiser &amp; story hub for this instance. Scheduled gatherings are listed below—you can invite people to a specific event once it exists.
          </p>
          {instance.theme && (
            <div className="text-lg text-purple-300">{instance.theme}</div>
          )}
          {instance.targetDescription && (
            <p className="text-zinc-400">{instance.targetDescription}</p>
          )}
        </header>

        {/* NEV: story (Wake Up) before fundraiser + BB blocks */}
        <details className="group bg-emerald-950/20 border border-emerald-900/40 rounded-2xl open:pb-2" open>
          <summary className="cursor-pointer list-none p-6 font-bold text-white flex items-center justify-between gap-2">
            <span>Wake Up: Learn the story</span>
            <span className="text-zinc-500 text-sm font-normal group-open:hidden">Show</span>
            <span className="text-zinc-500 text-sm font-normal hidden group-open:inline">Hide</span>
          </summary>
          <div className="px-6 pb-6 space-y-4 -mt-2">
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{wakeUpContent}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/wiki"
                className="inline-block text-sm text-emerald-400 hover:text-emerald-300 transition"
              >
                Learn more →
              </Link>
              {instance.campaignRef === 'bruised-banana' && (
                <>
                  <span className="text-zinc-500 text-sm">•</span>
                  <Link
                    href="/campaign/twine"
                    className="inline-block text-sm text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Browse initiation story (read-only)
                  </Link>
                </>
              )}
              {player && instance.campaignRef && (
                <>
                  <span className="text-zinc-500 text-sm">•</span>
                  <span className="text-zinc-500 text-sm">Have a question?</span>
                  <LibraryRequestButton context={{ campaignRef: instance.campaignRef }} />
                </>
              )}
            </div>
            {(instance.theme || instance.targetDescription) && (
              <details className="mt-1">
                <summary className="text-sm text-emerald-400 cursor-pointer hover:text-emerald-300">
                  Theme &amp; target (extra)
                </summary>
                <div className="mt-3 space-y-2 text-zinc-400 text-sm">
                  {instance.theme && <p>{instance.theme}</p>}
                  {instance.targetDescription && <p>{instance.targetDescription}</p>}
                </div>
              </details>
            )}
          </div>
        </details>

        {goal > 0 && instance.isEventMode && (
          <details
            open
            className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl open:pb-2"
          >
            <summary className="cursor-pointer list-none p-6 font-bold text-white flex items-center justify-between gap-2">
              <span>Fundraiser progress</span>
              <span className="text-zinc-500 text-sm font-normal group-open:hidden">Show</span>
              <span className="text-zinc-500 text-sm font-normal hidden group-open:inline">Hide</span>
            </summary>
            <div className="px-6 pb-6 space-y-4 -mt-2">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formatUsdCents(current)} <span className="text-zinc-500 font-mono">/</span>{' '}
                    {formatUsdCents(goal)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-zinc-500 font-mono">{Math.round(pct * 100)}%</div>
                  {isAdmin && (
                    <EventProgressUpdater
                      instanceId={instance.id}
                      initialCurrentCents={current}
                      initialGoalCents={goal}
                    />
                  )}
                </div>
              </div>

              <div className="h-3 rounded-full bg-black border border-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  style={{ width: `${Math.round(pct * 100)}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href={donateWizardHref}
                  className="flex-1 text-center px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold"
                >
                  Donate
                </Link>
              </div>
            </div>
          </details>
        )}

        {instance.campaignRef === 'bruised-banana' && <BruisedBananaApr2026EventBlocks />}

        <section className="bg-amber-950/15 border border-amber-900/35 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white">Events on this campaign</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Dated gatherings linked to this instance. Invites attach to one of these rows—not to the whole campaign page.
              </p>
            </div>
            {canSendEventInvites && (
              <CreateEventButton
                instanceId={instance.id}
                instanceName={instance.name}
                campaigns={eventCampaigns}
                canCreateCampaign={canCreateCampaign}
              />
            )}
          </div>

          {eventArtifacts.length === 0 ? (
            <div className="rounded-xl bg-black/30 border border-amber-900/20 px-4 py-5 text-sm text-zinc-400">
              <p>No scheduled events yet.</p>
              {isAdmin && (
                <p className="mt-2 text-zinc-500">
                  Add <span className="text-zinc-400 font-mono text-xs">EventArtifact</span> rows tied to this instance (or its event campaign) in Admin or via seed. Then you can invite guests to a specific event from here.
                </p>
              )}
            </div>
          ) : (
            <>
              <ul className="space-y-3 rounded-xl bg-black/20 border border-amber-900/25 p-3">
                {(rootEvents.length > 0 ? rootEvents : eventArtifacts).map((ev) => {
                  const subs = rootEvents.length > 0 ? childrenOf(ev.id) : []
                  const isRoot = !ev.parentEventArtifactId
                  return (
                    <li
                      key={ev.id}
                      className={`rounded-lg border border-amber-900/20 bg-black/25 overflow-hidden ${!isRoot ? 'ml-0' : ''}`}
                    >
                      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium text-amber-100">{ev.title}</span>
                          {!isRoot && (
                            <span className="ml-2 text-[10px] uppercase font-mono text-amber-500/90">
                              pre-production
                            </span>
                          )}
                          <span className="block text-sm text-zinc-500 mt-0.5">
                            {formatEventScheduleRange(ev)}
                          </span>
                          {formatEventCapacityLine(ev) ? (
                            <span className="block text-xs text-amber-700/90 mt-0.5">
                              {formatEventCapacityLine(ev)}
                            </span>
                          ) : null}
                          {player && ev.startTime ? (
                            <a
                              href={`/api/events/${ev.id}/ics`}
                              className="inline-block mt-1 text-xs text-sky-400 hover:text-sky-300"
                            >
                              Add to calendar (.ics)
                            </a>
                          ) : null}
                          {canSendEventInvites ? (
                            <EventGuestsPanel instanceId={instance.id} eventId={ev.id} />
                          ) : null}
                        </div>
                        {canSendEventInvites && (
                          <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                            <EditEventDetailsButton instanceId={instance.id} event={ev} />
                            <EditEventScheduleButton instanceId={instance.id} event={ev} />
                          </div>
                        )}
                      </div>
                      {subs.length > 0 && (
                        <ul className="border-t border-amber-900/20 bg-black/30">
                          {subs.map((sub) => (
                            <li
                              key={sub.id}
                              className="px-4 py-2.5 pl-8 text-sm border-b border-amber-900/10 last:border-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                            >
                              <div>
                                <span className="text-amber-200/90">{sub.title}</span>
                                <span className="ml-2 text-[10px] uppercase font-mono text-amber-600">pre-production</span>
                                <span className="block text-xs text-zinc-500 mt-0.5">
                                  {formatEventScheduleRange(sub)}
                                </span>
                                {formatEventCapacityLine(sub) ? (
                                  <span className="block text-[11px] text-amber-700/85 mt-0.5">
                                    {formatEventCapacityLine(sub)}
                                  </span>
                                ) : null}
                                {player && sub.startTime ? (
                                  <a
                                    href={`/api/events/${sub.id}/ics`}
                                    className="inline-block mt-1 text-[11px] text-sky-400 hover:text-sky-300"
                                  >
                                    Add to calendar (.ics)
                                  </a>
                                ) : null}
                                {canSendEventInvites ? (
                                  <EventGuestsPanel instanceId={instance.id} eventId={sub.id} />
                                ) : null}
                              </div>
                              {canSendEventInvites && (
                                <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                                  <EditEventDetailsButton instanceId={instance.id} event={sub} />
                                  <EditEventScheduleButton instanceId={instance.id} event={sub} />
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
              {canSendEventInvites && (
                <div className="pt-1">
                  <InviteToEventButton
                    instanceId={instance.id}
                    instanceName={instance.name}
                    events={eventArtifacts}
                  />
                </div>
              )}
            </>
          )}
        </section>

        <EventCrewSurface
          eventArtifacts={eventArtifacts}
          instanceId={instance.id}
          player={player}
          canSendEventInvites={canSendEventInvites}
        />

        {(worldVenue || (isAdmin && !worldVenue)) && (
          <section className="bg-zinc-900/25 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">Optional: pixel venue</h2>
            {worldVenue ? (
              <>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Walk the map in-app — <span className="text-zinc-400">{worldVenue.mapName}</span>
                  {worldVenue.roomName ? ` (starts in ${worldVenue.roomName})` : ''}. Separate from invites; you need a game account.
                </p>
                <Link
                  href={worldVenue.href}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-bold border border-zinc-600"
                >
                  Enter the space
                </Link>
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                No spatial map on this instance. Link one in <span className="text-zinc-400">Admin → Instances</span> if you want a Gather-style room (optional).
              </p>
            )}
          </section>
        )}

        <details className="group bg-zinc-900/20 border border-zinc-800 rounded-2xl open:pb-2">
          <summary className="cursor-pointer list-none p-6 font-bold text-white flex items-center justify-between gap-2">
            <span>Show Up: Contribute to the campaign</span>
            <span className="text-zinc-500 text-sm font-normal group-open:hidden">Show</span>
            <span className="text-zinc-500 text-sm font-normal hidden group-open:inline">Hide</span>
          </summary>
          <div className="px-6 pb-6 space-y-4 -mt-2">
            <p className="text-zinc-500 text-sm whitespace-pre-wrap">{showUpContent}</p>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <Link
                href={donateWizardHref}
                className="flex-1 text-center px-5 py-3 rounded-xl bg-green-600/80 hover:bg-green-500/80 text-white font-bold border border-green-500/50"
              >
                Donate
              </Link>
              <InviteButton />
              {player ? (
                <Link href="/" className="flex-1 text-center px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/campaign?ref=bruised-banana"
                    className="flex-1 text-center px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    Play the game
                  </Link>
                  <Link
                    href="/login"
                    className="flex-1 text-center px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-bold"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

