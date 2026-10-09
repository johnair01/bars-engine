import { redirect } from 'next/navigation'
import { loadLensesOnboardingState } from '@/lib/lenses/onboarding-data'
import { isLensDomainKey } from '@/lib/lenses/domains'
import { LensesOnboardingClient } from './LensesOnboardingClient'

export default async function LensesOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>
}) {
  const initialState = await loadLensesOnboardingState()
  if (!initialState) redirect('/login')

  const { domain } = await searchParams
  const focusDomain = domain && isLensDomainKey(domain) ? domain : null

  return <LensesOnboardingClient initialState={initialState} focusDomain={focusDomain} />
}
