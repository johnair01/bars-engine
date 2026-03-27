import { redirect } from 'next/navigation'

/**
 * @page /campaign/lobby
 * @entity CAMPAIGN
 * @description Deprecated - redirects to /campaign/hub (canonical residency hub with 8 spokes)
 * @permissions authenticated
 * @searchParams ref:string (campaign reference, optional)
 * @relationships CAMPAIGN (hub redirect)
 * @dimensions WHO:player, WHAT:lobby_redirect, WHERE:campaign
 * @example /campaign/lobby?ref=bruised-banana
 * @agentDiscoverable false
 *
 * @deprecated Use `/campaign/hub` — canonical residency hub (8 spokes).
 */
export default async function CampaignLobbyRedirectPage(props: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref: urlRef } = await props.searchParams
  const q = urlRef ? `?ref=${encodeURIComponent(urlRef)}` : ''
  redirect(`/campaign/hub${q}`)
}
