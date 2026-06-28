import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getTheCrossingSupportRole,
  THE_CROSSING_SUPPORT_ROLES,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { CaptureForm } from './CaptureForm'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'

export function generateStaticParams() {
  return THE_CROSSING_SUPPORT_ROLES.map((role) => ({ roleId: role.id }))
}

export async function generateMetadata(props: {
  params: Promise<{ roleId: string }>
}): Promise<Metadata> {
  const { roleId } = await props.params
  const role = getTheCrossingSupportRole(roleId)
  return { title: role ? `Make your move · ${role.label} | The Crossing` : 'The Crossing' }
}

export default async function TheCrossingMovePage(props: {
  params: Promise<{ roleId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { roleId } = await props.params
  const { error } = await props.searchParams
  const role = getTheCrossingSupportRole(roleId)
  if (!role) notFound()

  const tokens = ELEMENT_TOKENS[role.element]

  return (
    <main
      className="min-h-screen px-5 py-6 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[560px] space-y-6">
        <Link
          href={`/campaign/the-crossing/role/${role.id}`}
          className="inline-flex font-mono text-[11px] uppercase tracking-[0.14em] text-[#a09e98] transition-colors hover:text-[#f4f2ec]"
        >
          ← {role.label}
        </Link>

        <header className="space-y-2">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: tokens.gem }}>
            <span aria-hidden className="text-base">{tokens.sigil}</span>
            Make your move
          </p>
          <h1 className="text-[34px] font-bold leading-[1.05] tracking-[-0.02em]">{role.label}</h1>
          <p className="text-[14px] leading-relaxed text-[#cfcdc6]">
            This goes straight to Wendell’s board. He’ll follow up through the contact you leave — no
            account needed.
          </p>
        </header>

        <CaptureForm role={role} error={error} />
      </div>
    </main>
  )
}
