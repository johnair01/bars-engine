import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { GuestOnboardingWizard } from './GuestOnboardingWizard'

/**
 * @page /join/:instanceSlug
 * @entity CAMPAIGN
 * @description Guest onboarding wizard for joining a campaign instance
 * @permissions authenticated
 * @params instanceSlug:string (path, required) - Campaign instance slug
 * @relationships loads CAMPAIGN instance, creates player enrollment, sets up initial profile
 * @energyCost 0 (onboarding wizard)
 * @dimensions WHO:playerId, WHAT:CAMPAIGN, WHERE:onboarding, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /join/bruised-banana
 * @agentDiscoverable false
 */
export default async function JoinPage({
  params,
}: {
  params: Promise<{ instanceSlug: string }>
}) {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value
  if (!playerId) redirect('/login')

  const { instanceSlug } = await params
  const instance = await db.instance.findUnique({
    where: { slug: instanceSlug },
  })
  if (!instance) notFound()

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <header className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Welcome</p>
          <h1 className="text-2xl font-bold text-white">{instance.name}</h1>
          {instance.targetDescription && (
            <p className="text-zinc-400 text-sm">{instance.targetDescription}</p>
          )}
        </header>
        <GuestOnboardingWizard instanceId={instance.id} instanceName={instance.name} />
      </div>
    </div>
  )
}
