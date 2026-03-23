import { redirect } from 'next/navigation'

/** @deprecated Use `/campaign/hub` — canonical residency hub (8 spokes). */
export default async function CampaignLobbyRedirectPage(props: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref: urlRef } = await props.searchParams
  const q = urlRef ? `?ref=${encodeURIComponent(urlRef)}` : ''
  redirect(`/campaign/hub${q}`)
}
