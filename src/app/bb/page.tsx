import { redirect } from 'next/navigation'

/**
 * /bb — short alias for the Bruised Banana event page.
 * Shareable link: bars-engine.vercel.app/bb
 */
export default function BBRedirect() {
  redirect('/event')
}
