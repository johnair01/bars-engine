import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveDemoOrientationLink } from '@/lib/demo-orientation/resolve'
import { DemoOrientationClient } from './DemoOrientationClient'

export const metadata: Metadata = {
  title: 'Orientation preview — BARs',
  description: 'Try a slice of the campaign orientation before creating an account.',
}

export default async function DemoOrientationPage(props: {
  searchParams: Promise<{ t?: string; s?: string }>
}) {
  const sp = await props.searchParams
  const resolved = await resolveDemoOrientationLink({
    token: sp.t,
    publicSlug: sp.s,
  })
  if (!resolved) {
    notFound()
  }

  return <DemoOrientationClient config={resolved} />
}
