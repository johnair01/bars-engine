import { redirect } from 'next/navigation'
import { loadLensesOnboardingState } from '@/lib/lenses/onboarding-data'
import { LensesOnboardingClient } from './LensesOnboardingClient'

export default async function LensesOnboardingPage() {
  const initialState = await loadLensesOnboardingState()
  if (!initialState) redirect('/login')

  return <LensesOnboardingClient initialState={initialState} />
}

