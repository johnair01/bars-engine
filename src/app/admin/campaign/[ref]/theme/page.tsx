import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { CampaignThemeEditor } from '@/components/campaign/theme/CampaignThemeEditor'
import type { CampaignBorderTokens, CampaignDensityTokens } from '@/lib/ui/campaign-skin-tokens'
import type { CampaignThemeRecord } from '@/actions/campaign-theme'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

async function isGlobalAdmin(playerId: string): Promise<boolean> {
  const row = await db.playerRole.findFirst({
    where: { playerId, role: { key: 'admin' } },
  })
  return !!row
}

async function isStewardPlusForInstance(
  playerId: string,
  instanceId: string,
): Promise<boolean> {
  if (await isGlobalAdmin(playerId)) return true

  const membership = await db.instanceMembership.findUnique({
    where: {
      instanceId_playerId: { instanceId, playerId },
    },
  })

  return membership?.roleKey === 'owner' || membership?.roleKey === 'steward'
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * @page /admin/campaign/:ref/theme
 * @entity CAMPAIGN_THEME
 * @description L2 visual theming editor for campaign skins — color pickers, font selectors, preview panel
 * @permissions steward, owner, admin
 * @params ref:string (path, required) - campaign slug
 * @dimensions WHO:steward+, WHAT:CAMPAIGN_THEME, WHERE:campaign, PERSONAL_THROUGHPUT:show-up
 * @example /admin/campaign/bruised-banana/theme
 * @agentDiscoverable true
 */
export default async function CampaignThemePage({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  const campaignSlug = decodeURIComponent(ref)

  // Auth check
  const playerId = await getPlayerId()
  if (!playerId) redirect('/login')

  // Fetch campaign with theme
  const campaign = await db.campaign.findFirst({
    where: { slug: campaignSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      instanceId: true,
      theme: true,
    },
  })

  if (!campaign) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-white">Campaign not found</h1>
        <p className="text-sm text-zinc-400">
          No campaign with slug &quot;{campaignSlug}&quot; exists.
        </p>
        <Link
          href="/admin/campaigns"
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          Back to campaigns
        </Link>
      </div>
    )
  }

  // Authorization — steward+ for campaign's instance
  const allowed = await isStewardPlusForInstance(playerId, campaign.instanceId)
  if (!allowed) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-white">Not authorized</h1>
        <p className="text-sm text-zinc-400">
          You need steward or higher access on this campaign&apos;s instance to edit its theme.
        </p>
      </div>
    )
  }

  // Transform Prisma theme to the CampaignThemeRecord expected by the editor
  const existingTheme: CampaignThemeRecord | null = campaign.theme
    ? {
        id: campaign.theme.id,
        campaignId: campaign.theme.campaignId,
        bgGradient: campaign.theme.bgGradient,
        bgDeep: campaign.theme.bgDeep,
        titleColor: campaign.theme.titleColor,
        accentPrimary: campaign.theme.accentPrimary,
        accentSecondary: campaign.theme.accentSecondary,
        accentTertiary: campaign.theme.accentTertiary,
        greenAccent: campaign.theme.greenAccent,
        surfaceColor: campaign.theme.surfaceColor,
        surfaceHoverColor: campaign.theme.surfaceHoverColor,
        borderColor: campaign.theme.borderColor,
        borderHoverColor: campaign.theme.borderHoverColor,
        textPrimary: campaign.theme.textPrimary,
        textSecondary: campaign.theme.textSecondary,
        textMuted: campaign.theme.textMuted,
        ctaBg: campaign.theme.ctaBg,
        ctaText: campaign.theme.ctaText,
        ctaHoverBg: campaign.theme.ctaHoverBg,
        fontDisplayKey: campaign.theme.fontDisplayKey,
        fontBodyKey: campaign.theme.fontBodyKey,
        posterImageUrl: campaign.theme.posterImageUrl,
        borderTokens: (campaign.theme.borderTokens as CampaignBorderTokens) ?? null,
        densityTokens: (campaign.theme.densityTokens as CampaignDensityTokens) ?? null,
        cssVarOverrides: (campaign.theme.cssVarOverrides as Record<string, string>) ?? null,
        narrativeConfig: campaign.theme.narrativeConfig,
        createdAt: campaign.theme.createdAt,
        updatedAt: campaign.theme.updatedAt,
      }
    : null

  // Editable status banner
  const isEditable = campaign.status === 'DRAFT' || campaign.status === 'REJECTED'

  return (
    <div className="space-y-6">
      {/* Breadcrumb + status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link
            href="/admin/campaigns"
            className="hover:text-zinc-300 transition-colors"
          >
            Campaigns
          </Link>
          <span>/</span>
          <Link
            href={`/admin/campaign/${encodeURIComponent(campaignSlug)}/author`}
            className="hover:text-zinc-300 transition-colors"
          >
            {campaign.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-400">Theme</span>
        </div>

        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            campaign.status === 'LIVE'
              ? 'bg-emerald-500/15 text-emerald-300'
              : campaign.status === 'DRAFT'
                ? 'bg-amber-950/40 border border-amber-800/40 text-amber-300'
                : campaign.status === 'REJECTED'
                  ? 'bg-red-950/40 border border-red-800/40 text-red-300'
                  : 'bg-zinc-700/40 text-zinc-400'
          }`}
        >
          {campaign.status}
        </span>
      </div>

      {/* Non-editable warning */}
      {!isEditable && (
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-sm text-amber-300">
          This campaign is <strong>{campaign.status.toLowerCase()}</strong>.
          Theme editing is only available for campaigns in DRAFT or REJECTED status.
        </div>
      )}

      {/* Main editor */}
      {isEditable ? (
        <CampaignThemeEditor
          campaignId={campaign.id}
          campaignName={campaign.name}
          campaignSlug={campaign.slug}
          campaignDescription={campaign.description}
          existingTheme={existingTheme}
        />
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-center">
          <p className="text-sm text-zinc-400">
            Theme editing is locked for {campaign.status.toLowerCase()} campaigns.
          </p>
        </div>
      )}
    </div>
  )
}
