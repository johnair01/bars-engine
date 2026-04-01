import Link from 'next/link'
import type { Metadata } from 'next'
import { CampaignDonateButton } from '@/components/campaign/CampaignDonateButton'
import { getActiveInstance } from '@/actions/instance'
import { getCurrentPlayer } from '@/lib/auth'
import {
  canCreateCampaignOnInstance,
  canInviteToAnyEventOnInstance,
  listEventArtifactsForInstance,
} from '@/actions/campaign-invitation'
import { getEventCampaignsForInstance } from '@/actions/event-campaign-engine'
import {
  EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN,
  isCalendarEventCampaignType,
} from '@/lib/event-campaign-types'
import { getWorldVenueEntryForInstance } from '@/actions/spatial-maps'
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
import { EventCrewSurface } from '@/components/event/EventCrewSurface'
import { CreateEventButton } from './CreateEventButton'
import { CreateAwarenessRunButton } from './CreateAwarenessRunButton'
import { PartyMiniGameInModal } from '@/components/party-mini-game/PartyMiniGameInModal'
import {
  BB_APR2026_EVENT_STORE_KEY,
  BB_APR4_DANCE_BINGO,
  BB_APR5_SCHEMING_BINGO,
  BB_INVITE_PRIMING,
} from '@/lib/party-mini-game/definitions'
import { EventHero } from './EventHero'
import { NightCard } from './NightCard'
import { WhatToExpect } from './WhatToExpect'
import { HowItWorks } from './HowItWorks'
import { EventAdminToolbar } from './EventAdminToolbar'

/**
 * @page /event
 * @entity EVENT
 * @description Campaign hub — redesigned as Midnight Playbill.
 *   Hero → Weekend split → What to expect → How it works → Support → Footer
 * @permissions public (guest view), authenticated (actions), admin (floating toolbar)
 * @agentDiscoverable true
 */
export const metadata: Metadata = {
  title: 'The Bruised Banana — Birthday Quest Weekend',
  description: 'April 4–5, 2026 · Portland. Enter curious. Follow signals. Play the game.',
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
      <div className="event-page min-h-screen flex items-center justify-center" style={{ background: 'var(--ep-base)' }}>
        <div className="max-w-xl w-full space-y-6 text-center p-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ep-text)' }}>No active campaign</h1>
          <p style={{ color: 'var(--ep-text-muted)' }}>
            No instance is set as active. Admins can set one under Admin.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/" className="px-4 py-2 rounded-lg border" style={{ background: 'var(--ep-surface)', borderColor: 'var(--ep-border)', color: 'var(--ep-text)' }}>
              Back
            </Link>
            <Link href="/conclave" className="event-hero-cta px-4 py-2 text-sm">
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
  const calendarEventCampaigns = eventCampaigns.filter((c) => isCalendarEventCampaignType(c.campaignType))
  const awarenessContentRuns = eventCampaigns.filter(
    (c) => c.campaignType === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN
  )
  const canSendEventInvites =
    !!player && (await canInviteToAnyEventOnInstance(player.id, instance.id))
  const canCreateCampaign =
    !!player && (await canCreateCampaignOnInstance(player.id, instance.id))
  const rootEvents = eventArtifacts.filter((e) => !e.parentEventArtifactId)
  const childrenOf = (parentId: string) =>
    eventArtifacts.filter((e) => e.parentEventArtifactId === parentId)
  const worldVenue = await getWorldVenueEntryForInstance(instance.id)
  const wakeUpContent = instance.wakeUpContent ?? ''
  const showUpContent = instance.showUpContent ?? ''
  const refForDonate = instance.campaignRef?.trim() || instance.slug?.trim() || 'bruised-banana'
  const isBB = instance.campaignRef === 'bruised-banana'
  const partyMiniGamePlayerId = player?.id ?? null

  return (
    <div className="event-page" style={{ background: 'var(--ep-base)', color: 'var(--ep-text)' }}>

      {/* ─── 1. HERO ──────────────────────────────────────────────────────── */}
      <EventHero
        title={instance.name}
        isLoggedIn={!!player}
        campaignRef={instance.campaignRef}
      />

      {/* ─── 2. THE WEEKEND ───────────────────────────────────────────────── */}
      <section id="weekend" className="event-section" style={{ background: 'var(--ep-base)' }}>
        <div className="event-section-inner">
          <h2 className="event-section-title">The Weekend</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

            {/* Friday */}
            <div className="space-y-4" id="apr-4">
              <NightCard
                variant="friday"
                label="Friday · Signal Drop"
                title="Dance Night"
                description="A public dance party — DJs, movement, strangers welcome. Low pressure, high vibe. No agenda; presence is enough."
                when="Friday, April 4 · Evening"
                where="Kai's Place — address after RSVP"
                status="Location revealed after RSVP"
                ctaLabel="Pre-experience (invite story)"
                ctaHref="/invite/event/bb-event-invite-apr4-dance"
                secondaryLinks={[
                  { label: 'Enter the 8 paths', href: '/campaign/hub?ref=bruised-banana' },
                ]}
              />
              {isBB && (
                <div className="space-y-2" id="bb-invite-bingo-apr4">
                  <PartyMiniGameInModal
                    game={BB_APR4_DANCE_BINGO}
                    eventKey={BB_APR2026_EVENT_STORE_KEY}
                    sectionId="apr-4-bingo"
                    playerId={partyMiniGamePlayerId}
                    buttonLabel="Open dance night bingo"
                    anchorId="apr-4-bingo-anchor"
                    buttonClassName="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Saturday */}
            <div className="space-y-4" id="apr-5">
              <NightCard
                variant="saturday"
                label="Saturday · The Game"
                title="Collaborators & Donors"
                description="Quests, roles, BARs, and the engine in the room. For people who want to build with us — curiosity beats expertise."
                when="Saturday, April 5 · Daytime"
                where="Shared after RSVP"
                status="Details unlock Friday night"
                ctaLabel="Pre-experience (invite story)"
                ctaHref="/invite/event/bb-event-invite-apr26"
                secondaryLinks={[
                  { label: 'Enter the 8 paths', href: '/campaign/hub?ref=bruised-banana' },
                  { label: 'Donate', href: `/event/donate/wizard?ref=${refForDonate}` },
                ]}
              />
              {isBB && (
                <div className="space-y-2" id="bb-invite-bingo-apr5">
                  <PartyMiniGameInModal
                    game={BB_APR5_SCHEMING_BINGO}
                    eventKey={BB_APR2026_EVENT_STORE_KEY}
                    sectionId="apr-5-bingo"
                    playerId={partyMiniGamePlayerId}
                    buttonLabel="Open scheming day bingo"
                    anchorId="apr-5-bingo-anchor"
                    buttonClassName="inline-flex min-h-11 w-full sm:w-auto items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Invite bingo — full width below the two cards */}
          {isBB && (
            <div className="mt-6" id="bb-invite-bingo">
              <PartyMiniGameInModal
                game={BB_INVITE_PRIMING}
                eventKey={BB_APR2026_EVENT_STORE_KEY}
                sectionId="bb-invite-bingo-grid"
                playerId={partyMiniGamePlayerId}
                buttonLabel="Open invite bingo card"
                anchorId="bb-invite-bingo"
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. WHAT TO EXPECT ────────────────────────────────────────────── */}
      <WhatToExpect />

      {/* ─── 4. HOW IT WORKS ──────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ─── 5. SUPPORT THE QUEST (fundraiser) ────────────────────────────── */}
      {goal > 0 && instance.isEventMode && (
        <section className="event-section" style={{ background: 'var(--ep-base)' }}>
          <div className="event-section-inner space-y-5">
            <h2 className="event-section-title">Support the Quest</h2>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-2xl font-bold" style={{ color: 'var(--ep-text)' }}>
                  {formatUsdCents(current)}{' '}
                  <span style={{ color: 'var(--ep-text-muted)' }}>/</span>{' '}
                  <span style={{ color: 'var(--ep-text-secondary)' }}>{formatUsdCents(goal)}</span>
                </div>
              </div>
              <div className="text-sm font-mono" style={{ color: 'var(--ep-text-muted)' }}>
                {Math.round(pct * 100)}%
              </div>
            </div>
            <div className="fundraiser-bar-track">
              <div className="fundraiser-bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
            </div>
            <CampaignDonateButton
              campaignRef={refForDonate}
              className="event-hero-cta text-sm px-6 py-3"
            >
              {instance.donationButtonLabel?.trim() || 'Donate'}
            </CampaignDonateButton>
          </div>
        </section>
      )}

      {/* ─── 6. THE STORY (collapsed — for those who want depth) ───────── */}
      {wakeUpContent && (
        <section className="event-section" style={{ background: 'var(--ep-surface)' }}>
          <div className="event-section-inner">
            <h2 className="event-section-title">The Story</h2>
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--ep-text-secondary)', maxWidth: '65ch' }}
            >
              {wakeUpContent}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Link
                href="/wiki"
                className="text-sm font-medium hover:underline underline-offset-2"
                style={{ color: 'var(--ep-cyan)' }}
              >
                Learn more
              </Link>
              {isBB && (
                <Link
                  href="/campaign/twine"
                  className="text-sm font-medium hover:underline underline-offset-2"
                  style={{ color: 'var(--ep-cyan)' }}
                >
                  Browse initiation story
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── 7. FOOTER ────────────────────────────────────────────────────── */}
      <footer className="event-section" style={{ background: 'var(--ep-base)', borderTop: '1px solid var(--ep-border)' }}>
        <div className="event-section-inner space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            {player ? (
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'var(--ep-surface)', color: 'var(--ep-text)', border: '1px solid var(--ep-border)' }}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href={`/campaign?ref=${refForDonate}`}
                  className="event-hero-cta text-sm px-5 py-3"
                >
                  Play the Game
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--ep-surface)', color: 'var(--ep-text)', border: '1px solid var(--ep-border)' }}
                >
                  Log In
                </Link>
              </>
            )}
            <InviteButton />
          </div>

          {/* Deep links for existing anchors */}
          <div className="text-xs space-x-4" style={{ color: 'var(--ep-text-muted)' }}>
            <a href="#apr-4" className="hover:underline underline-offset-2">Friday</a>
            <a href="#apr-5" className="hover:underline underline-offset-2">Saturday</a>
            {isBB && <a href="#bb-invite-bingo" className="hover:underline underline-offset-2">Invite bingo</a>}
          </div>

          <p className="text-xs" style={{ color: 'var(--ep-text-muted)' }}>
            Portland 2026 · One Weekend · Level Up or Lose
          </p>
        </div>
      </footer>

      {/* ─── ADMIN TOOLBAR (floating, separated from guest UX) ────────── */}
      {isAdmin && (
        <EventAdminToolbar>
          <div className="space-y-2">
            <EventCampaignEditor
              instanceId={instance.id}
              initialWakeUp={wakeUpContent}
              initialShowUp={showUpContent}
              initialStoryBridge={instance.storyBridgeCopy ?? ''}
              initialTheme={instance.theme ?? ''}
              initialTargetDescription={instance.targetDescription ?? ''}
            />
            <EventProgressUpdater
              instanceId={instance.id}
              initialCurrentCents={current}
              initialGoalCents={goal}
            />
            {canCreateCampaign && (
              <CreateAwarenessRunButton instanceId={instance.id} instanceName={instance.name} />
            )}
            {canSendEventInvites && (
              <CreateEventButton
                instanceId={instance.id}
                instanceName={instance.name}
                campaigns={calendarEventCampaigns}
                canCreateCampaign={canCreateCampaign}
              />
            )}
          </div>

          {/* Event artifacts list — admin view */}
          {eventArtifacts.length > 0 && (
            <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--ep-border)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--ep-text-muted)' }}>Events</span>
              {(rootEvents.length > 0 ? rootEvents : eventArtifacts).map((ev) => (
                <div key={ev.id} className="text-sm space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate" style={{ color: 'var(--ep-text-secondary)' }}>{ev.title}</span>
                    <div className="flex gap-1 shrink-0">
                      <EditEventDetailsButton instanceId={instance.id} event={ev} />
                      <EditEventScheduleButton instanceId={instance.id} event={ev} />
                    </div>
                  </div>
                  <span className="text-xs block" style={{ color: 'var(--ep-text-muted)' }}>
                    {formatEventScheduleRange(ev)}
                    {formatEventCapacityLine(ev) ? ` · ${formatEventCapacityLine(ev)}` : ''}
                  </span>
                  <EventGuestsPanel instanceId={instance.id} eventId={ev.id} />
                  {childrenOf(ev.id).map((sub) => (
                    <div key={sub.id} className="pl-3 text-xs space-y-1" style={{ borderLeft: '1px solid var(--ep-border)' }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate" style={{ color: 'var(--ep-text-muted)' }}>{sub.title}</span>
                        <div className="flex gap-1 shrink-0">
                          <EditEventDetailsButton instanceId={instance.id} event={sub} />
                          <EditEventScheduleButton instanceId={instance.id} event={sub} />
                        </div>
                      </div>
                      <EventGuestsPanel instanceId={instance.id} eventId={sub.id} />
                    </div>
                  ))}
                </div>
              ))}
              {canSendEventInvites && (
                <InviteToEventButton
                  instanceId={instance.id}
                  instanceName={instance.name}
                  events={eventArtifacts}
                />
              )}
            </div>
          )}

          {/* Awareness runs — admin view */}
          {awarenessContentRuns.length > 0 && (
            <div className="space-y-1 pt-2" style={{ borderTop: '1px solid var(--ep-border)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--ep-text-muted)' }}>Awareness runs</span>
              {awarenessContentRuns.map((run) => (
                <div key={run.id} className="text-xs" style={{ color: 'var(--ep-text-secondary)' }}>
                  {run.campaignContext}
                  {run.productionThreadId && (
                    <Link
                      href={`/admin/journeys/thread/${encodeURIComponent(run.productionThreadId)}`}
                      className="ml-2 hover:underline"
                      style={{ color: 'var(--ep-cyan)' }}
                    >
                      Thread
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Crew surface — admin view */}
          <EventCrewSurface
            eventArtifacts={eventArtifacts}
            instanceId={instance.id}
            player={player}
            canSendEventInvites={canSendEventInvites}
          />

          {/* World venue — admin view */}
          {worldVenue && (
            <div className="pt-2" style={{ borderTop: '1px solid var(--ep-border)' }}>
              <Link
                href={worldVenue.href}
                className="text-xs hover:underline"
                style={{ color: 'var(--ep-cyan)' }}
              >
                Pixel venue: {worldVenue.mapName}
              </Link>
            </div>
          )}
        </EventAdminToolbar>
      )}
    </div>
  )
}
