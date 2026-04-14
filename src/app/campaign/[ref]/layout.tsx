import type { ReactNode } from 'react'
import { resolveCampaignPageSkin, toSerializableSkin } from '@/lib/ui/resolve-campaign-skin'
import { CampaignSkinProvider } from '@/lib/ui/campaign-skin-provider'

/**
 * Campaign layout — resolves the campaign skin server-side and wraps
 * all child routes in CampaignSkinProvider.
 *
 * This layout covers all /campaign/:slug/* routes:
 *   - /campaign/:slug (landing page)
 *   - /campaign/:slug/home (member home)
 *   - /campaign/:slug/join (join flow)
 *   - /campaign/:slug/share (share page)
 *   - /campaign/:slug/fundraising (fundraising settings)
 *   - /campaign/:slug/spoke/:n (spoke CYOA)
 *
 * The resolved skin injects CSS custom properties (--cs-*) on a wrapper div
 * so all descendant components can reference campaign colors via var(--cs-*).
 *
 * Three-layer merge (lowest → highest priority):
 *   1. Default (MINIMAL_DARK) — always-present baseline
 *   2. Static skin (getCampaignSkin) — code-defined (e.g. Bruised Banana)
 *   3. DB theme (CampaignTheme) — L2 wizard overrides
 *
 * If the campaign doesn't exist (null skin), defaults to MINIMAL_DARK.
 * The child page.tsx is responsible for notFound() — this layout always renders.
 *
 * @see src/lib/ui/campaign-skin-provider.tsx — CampaignSkinProvider + useCampaignSkin
 * @see src/lib/ui/resolve-campaign-skin.ts — resolution pipeline
 * @see UI_COVENANT.md — three-channel encoding
 */
export default async function CampaignRefLayout({
  params,
  children,
}: {
  params: Promise<{ ref: string }>
  children: ReactNode
}) {
  const { ref } = await params
  const slug = decodeURIComponent(ref)

  // Resolve campaign skin server-side (DB + static skin merge)
  // Returns null if campaign doesn't exist — child page handles notFound()
  const resolvedSkin = await resolveCampaignPageSkin(slug)

  // Convert to serializable form for client boundary crossing
  const serializedSkin = resolvedSkin ? toSerializableSkin(resolvedSkin) : null

  return (
    <CampaignSkinProvider skin={serializedSkin}>
      {children}
    </CampaignSkinProvider>
  )
}
