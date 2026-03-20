import { redirect } from 'next/navigation'

/** Bookmarks only: canonical 321 + daemon discovery is `Shadow321Runner` at `/shadow/321`. */
export default function WakeUp321RedirectPage() {
  redirect('/shadow/321')
}
