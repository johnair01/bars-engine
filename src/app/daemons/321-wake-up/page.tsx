import { redirect } from 'next/navigation'

// The 321 Wake Up flow is now unified at /shadow/321
// All 321 variants follow the same scene card grammar
export default function WakeUp321Page() {
  redirect('/shadow/321')
}
