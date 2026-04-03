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
import { isCalendarEventCampaignType } from '@/lib/event-campaign-types'
import { getWorldVenueEntryForInstance } from '@/actions/spatial-maps'
import { getCampaignSkin } from '@/lib/ui/campaign-skin'
import { EventHero } from '@/components/event/EventHero'
import { EventScheduleCard } from '@/components/event/EventScheduleCard'
import { EventAdminToolbar } from '@/components/event/EventAdminToolbar'
import { StickyRsvpBar } from '@/components/event/StickyRsvpBar'
import { BruisedBananaApr2026EventBlocks } from './BruisedBananaApr2026EventBlocks'
import { formatEventScheduleRange } from './EditEventScheduleButton'
import { EditEventScheduleButton } from './EditEventScheduleButton'
import { EditEventDetailsButton } from './EditEventDetailsButton'
import { EventCampaignEditor } from './EventCampaignEditor'
import { EventProgressUpdater } from './EventProgressUpdater'
import { CreateEventButton } from './CreateEventButton'
import { InviteToEventButton } from './InviteToEventButton'
import { LibraryRequestButton } from '@/components/LibraryRequestButton'

export const metadata: Metadata = {
  title: 'Campaign',
  description: 'Campaign hub — story, events, and ways to contribute.',
}

function formatUsdCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * @page /event
 * @entity EVENT
 * @description Campaign hub — hero, schedule, story, and contribute
 * @permissions public (view), authenticated (RSVP/donate), admin (edit toolbar)
 * @agentDiscoverable true
 */
export default async function EventPage() {
  const instance = await getActiveInstance()
  const player = await getCurrentPlayer()

  if (!instance) {
    return (
      <div className="cs-wrapper flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--cs-title, white)' }}>No active campaign</h1>
          <p className="cs-text-secondary text-sm">No instance is active. Admins can set one under Admin → Instances.</p>
          <Link href="/" className="cs-cta-secondary inline-block text-sm">Back to app</Link>
        </div>
      </div>
    )
  }

  // ── Data fetching ──────────────────────────────────────────
  const skin = getCampaignSkin(instance.campaignRef)
  const cssVars = skin?.cssVars ?? {}
  const goal = instance.goalAmountCents ?? 0
  const current = instance.currentAmountCents ?? 0
  const pct = goal > 0 ? Math.max(0, Math.min(1, current / goal)) : 0
  const isAdmin = !!player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')
  const eventArtifacts = await listEventArtifactsForInstance(instance.id)
  const eventCampaigns = await getEventCampaignsForInstance(instance.id)
  const calendarEventCampaigns = eventCampaigns.filter((c) => isCalendarEventCampaignType(c.campaignType))
  const canSendEventInvites = !!player && (await canInviteToAnyEventOnInstance(player.id, instance.id))
  const canCreateCampaign = !!player && (await canCreateCampaignOnInstance(player.id, instance.id))
  const rootEvents = eventArtifacts.filter((e) => !e.parentEventArtifactId)
  const childrenOf = (parentId: string) => eventArtifacts.filter((e) => e.parentEventArtifactId === parentId)
  const worldVenue = await getWorldVenueEntryForInstance(instance.id)
  const refForDonate = instance.campaignRef?.trim() || instance.slug?.trim() || 'bruised-banana'
  const donatePath = `/event/donate/wizard?ref=${encodeURIComponent(refForDonate)}&source=event`

  // ── Derived display values ─────────────────────────────────
  const wakeUpContent = instance.wakeUpContent ?? 'The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers.'
  const showUpContent = instance.showUpContent ?? 'Contribute money (Donate) or play the game by signing up and choosing your domains.'
  const hasFundraiser = goal > 0 && instance.isEventMode
  const totalRsvps = eventArtifacts.reduce((sum, e) => sum + (e.rsvpCount ?? 0), 0)

  // Date summary from root events
  const dateSummary = rootEvents.length > 0
    ? rootEvents.map((e) => formatEventScheduleRange(e)).filter(Boolean).join(' + ')
    : null

  // Find next upcoming event
  const now = new Date()
  const nextEventIdx = rootEvents.findIndex((e) => e.startTime && new Date(e.startTime) >= now)

  return (
    <div className="cs-wrapper" style={cssVars}>
      <div className="max-w-lg mx-auto px-4 pb-28 space-y-6">

        {/* ── HERO ─────────────────────────────────────── */}
        <EventHero
          campaignName={skin?.displayName ?? instance.name}
          theme={instance.theme ?? null}
          targetDescription={instance.targetDescription ?? null}
          dateSummary={dateSummary}
          progressPct={hasFundraiser ? pct : null}
          currentFormatted={hasFundraiser ? formatUsdCents(current) : null}
          goalFormatted={hasFundraiser ? formatUsdCents(goal) : null}
          donatePath={donatePath}
          rsvpUrl={skin?.rsvpUrl ?? null}
          partifulUrl={(instance as { partifulInviteToken?: string }).partifulInviteToken
            ? `https://partiful.com/e/${(instance as { partifulInviteToken?: string }).partifulInviteToken}`
            : null}
          rsvpCount={totalRsvps}
        />

        {/* ── SCHEDULE ─────────────────────────────────── */}
        <hr className="cs-rule-accent-3" />

        {rootEvents.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-pixel cs-title text-xs tracking-[0.2em]">Schedule</h2>
            {rootEvents.map((ev, i) => (
              <EventScheduleCard
                key={ev.id}
                event={ev}
                children={childrenOf(ev.id)}
                isNext={i === (nextEventIdx >= 0 ? nextEventIdx : 0)}
                anchorId={ev.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}
                isAuthenticated={!!player}
              />
            ))}
          </section>
        ) : (
          <p className="cs-text-muted text-sm text-center py-4">No events scheduled yet.</p>
        )}

        {/* ── BB CAMPAIGN BLOCKS (bingo, etc) ──────────── */}
        {instance.campaignRef === 'bruised-banana' && <BruisedBananaApr2026EventBlocks />}

        {/* ── STORY & CONTRIBUTE (progressive disclosure) ─ */}
        <hr className="cs-rule-accent-2" />

        <details className="cs-details">
          <summary>The story (Wake Up)</summary>
          <div className="py-3 space-y-3">
            <p className="cs-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{wakeUpContent}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/wiki" className="cs-text-accent-2 hover:underline">Learn more →</Link>
              {instance.campaignRef === 'bruised-banana' && (
                <Link href="/campaign/twine" className="cs-text-accent-2 hover:underline">Browse initiation story →</Link>
              )}
              {player && instance.campaignRef && (
                <LibraryRequestButton context={{ campaignRef: instance.campaignRef }} />
              )}
            </div>
          </div>
        </details>

        <details className="cs-details">
          <summary>Ways to contribute (Show Up)</summary>
          <div className="py-3 space-y-3">
            <p className="cs-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{showUpContent}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={donatePath} className="cs-cta-secondary text-sm">Donate</Link>
              {player ? (
                <Link href="/" className="cs-cta-secondary text-sm">Dashboard</Link>
              ) : (
                <Link href="/conclave/guided" className="cs-cta-secondary text-sm">Play the game</Link>
              )}
            </div>
          </div>
        </details>

        {/* ── FOOTER LINKS ─────────────────────────────── */}
        <hr className="cs-rule-accent-1" />

        <footer className="flex flex-wrap gap-4 text-xs cs-text-muted py-2 justify-center">
          {worldVenue && (
            <Link href={worldVenue.href} className="hover:cs-text-secondary transition">Pixel venue →</Link>
          )}
          <Link href="/wiki" className="hover:cs-text-secondary transition">Wiki</Link>
          <Link href="/" className="hover:cs-text-secondary transition">Dashboard</Link>
          {player && <Link href="/hand" className="hover:cs-text-secondary transition">Vault</Link>}
        </footer>

        {/* ── ADMIN TOOLBAR (floating) ─────────────────── */}
        {isAdmin && (
          <EventAdminToolbar
            instanceId={instance.id}
            instanceName={instance.name}
            events={eventArtifacts}
          >
            <EventCampaignEditor
              instanceId={instance.id}
              initialWakeUp={wakeUpContent}
              initialShowUp={showUpContent}
              initialStoryBridge={instance.storyBridgeCopy ?? ''}
              initialTheme={instance.theme ?? ''}
              initialTargetDescription={instance.targetDescription ?? ''}
            />
            {hasFundraiser && (
              <EventProgressUpdater
                instanceId={instance.id}
                initialCurrentCents={current}
                initialGoalCents={goal}
              />
            )}
            <CreateEventButton
              instanceId={instance.id}
              instanceName={instance.name}
              campaigns={calendarEventCampaigns}
              canCreateCampaign={canCreateCampaign}
            />
            {canSendEventInvites && (
              <InviteToEventButton
                instanceId={instance.id}
                instanceName={instance.name}
                events={eventArtifacts}
              />
            )}
          </EventAdminToolbar>
        )}

        {/* ── STICKY RSVP BAR (non-admin, mobile) ──────── */}
        {!isAdmin && (
          <StickyRsvpBar
            donatePath={donatePath}
            rsvpUrl={(instance as { partifulInviteToken?: string }).partifulInviteToken
              ? `https://partiful.com/e/${(instance as { partifulInviteToken?: string }).partifulInviteToken}`
              : null}
          />
        )}

      </div>
    </div>
  )
}
