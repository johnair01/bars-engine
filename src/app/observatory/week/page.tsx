import { redirect } from 'next/navigation'

/** Spec alias: `/observatory/week` → calendar level `weekly`. */
export default function ObservatoryWeekAliasPage() {
  redirect('/observatory/weekly')
}
