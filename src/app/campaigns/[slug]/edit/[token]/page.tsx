/**
 * @route /campaigns/[slug]/edit/[token]
 * @entity CAMPAIGN
 * @description The campaign owner's private page: fill in every field of her
 *   campaign page and see who has joined. The token in the URL is the credential,
 *   like `/ally/mine/[leadId]`; no account.
 * @permissions holder of the campaign's edit link
 * @dimensions WHO:the campaign's owner, WHAT:edit campaign copy + supporter list,
 *   WHERE:hosted campaign, ENERGY:show_up
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveHosted, tokenMatches } from '@/lib/hosted-campaigns/campaigns'
import { getHostedStore } from '@/lib/hosted-campaigns/server'
import { listHostedSupporters } from '@/actions/hosted-campaign'
import { EditForm } from './EditForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Edit your campaign page',
  robots: { index: false, follow: false },
}

export default async function EditHostedCampaign({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params
  const store = await getHostedStore()
  const campaign = resolveHosted(slug, store)
  if (!campaign || !tokenMatches(store[campaign.slug]?.editToken, token)) notFound()
  const supporters = (await listHostedSupporters(campaign.slug, token)) ?? []

  return (
    <main className="flex min-h-screen justify-center" style={{ background: 'var(--bars-bg-base)', fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)' }}>
      <div className="flex w-full max-w-[680px] flex-col gap-8 px-5 pb-20 pt-10">
        <EditForm slug={campaign.slug} token={token} initial={campaign.fields} savedAt={store[campaign.slug]?.updatedAt ?? null} />
        <section className="flex flex-col gap-3">
          <h2 style={{ fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-xl)' }}>Who has joined ({supporters.length})</h2>
          {supporters.length === 0 ? (
            <p style={{ color: 'var(--bars-text-secondary)' }}>Nobody yet. When someone taps &ldquo;I&apos;m in&rdquo; on your page, they show up here with how to reach them.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {supporters.map((s) => (
                <li key={s.id} className="rounded-lg p-3 text-sm" style={{ background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)' }}>
                  <p className="font-semibold">{s.name} <span className="font-normal" style={{ color: 'var(--bars-text-secondary)' }}>· {s.contact}</span></p>
                  <p style={{ color: 'var(--bars-text-secondary)' }}>
                    {s.domain?.replace(/_/g, ' ').toLowerCase()} · {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  {s.note && <p className="mt-1">{s.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
