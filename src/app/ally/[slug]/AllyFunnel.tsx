'use client'

/**
 * AllyFunnel — the warm CYOA.
 *
 *   intro → superpower → myths → understanding → domain → workstream → needs
 *         → offer → sign → done
 *
 * Reuses the existing deterministic instruments rather than reinventing them:
 * `SuperpowerQuiz` (7 superpowers + orientation) and the authored myth/workstream
 * content. No AI anywhere in this flow — the Portland community's allergy is real
 * and this page is aimed at someone's mother besides.
 *
 * Accountless: nothing here requires or creates a login. `submitAllyIntake` writes
 * a `CampaignLead` plus conditional claims on each chosen `MilestoneNeed`.
 *
 * A note on the shape: every screen states its own cost and its own "done."
 * The one thing this flow must never do is make declining feel like failing, so
 * the needs step carries an explicit "None of these are mine" styled as a peer of
 * the CTA (not a hidden skip link), the workstream step can always back out to a
 * different domain, and every field on the sign step is optional.
 */

import { useCallback, useMemo, useState, useSyncExternalStore, useTransition } from 'react'
import Link from 'next/link'
import { SuperpowerQuiz } from '@/components/superpowers/SuperpowerQuiz'
import { offerHref } from '@/lib/launch/offers'
import { ALLYSHIP_DOMAINS, getDomainLabel, type AllyshipDomainKey } from '@/lib/allyship-domains'
import type { SuperpowerIntakeOutcome } from '@/lib/superpowers/routing'
import type { AllyInvite, AllyMyth, UnderstandingPanel } from '@/lib/ally-campaign/allies'
import {
  needsForSuperpower,
  type Workstream,
  type WorkstreamNeed,
} from '@/lib/ally-campaign/workstreams'
import { INPUTS, campaignTotals, printEconomics, repaymentPlan, usd } from '@/lib/ally-campaign/economics'
import { submitAllyIntake, offerToCollective } from '@/actions/ally-campaign'

const PURPLE = 'var(--bars-liminal)'
const GOLD = '#d4a017'
const INK = '#f4f2ec'
const DIM = '#a09e98'
const FAINT = '#6b6862'
const PANEL = '#121210'

type Step =
  | 'intro'
  | 'superpower'
  | 'myths'
  | 'understanding'
  | 'domain'
  | 'workstream'
  | 'needs'
  | 'offer'
  | 'sign'
  | 'done'

const cta =
  'rounded-xl px-5 py-3 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50'
const ghost = 'rounded-xl px-4 py-3 text-[14px] font-semibold transition-colors'

/** Where a returning ally's way back in is remembered. */
const LEAD_STORAGE_KEY = 'ally_lead_id'

/** `storage` only fires for OTHER tabs, which is exactly the case worth catching. */
function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function readStoredLeadId(): string | null {
  try {
    return window.localStorage.getItem(LEAD_STORAGE_KEY)
  } catch {
    // Private browsing / storage disabled — the resume banner just won't show.
    return null
  }
}

export function AllyFunnel({
  invite,
  myths,
  understanding,
  workstreams,
  testMode = false,
  testTargetLabel,
}: {
  /** All prose arrives resolved — authored defaults with any admin edits already
   *  merged in by the server. This component never reads the content modules
   *  directly, so an edit shows up without touching the funnel. */
  invite: AllyInvite
  myths: AllyMyth[]
  understanding: UnderstandingPanel[]
  workstreams: Workstream[]
  /** Dry run — walk the whole thing, persist nothing. See TEST_SLUG_PREFIX. */
  testMode?: boolean
  /** The invite being rehearsed, for the banner's "you are testing X" line. */
  testTargetLabel?: string
}) {
  const [step, setStep] = useState<Step>('intro')
  const [outcome, setOutcome] = useState<SuperpowerIntakeOutcome | null>(null)
  const [mythIndex, setMythIndex] = useState(0)
  const [mythFlipped, setMythFlipped] = useState(false)
  const [panelIndex, setPanelIndex] = useState(0)
  const [domain, setDomain] = useState<AllyshipDomainKey | null>(null)
  const [workstream, setWorkstream] = useState<Workstream | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [offerBody, setOfferBody] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [leadId, setLeadId] = useState<string | null>(null)
  const [result, setResult] = useState<{ claimed: number; skipped: string[]; vibeulons: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const superpower = outcome?.routing.superpower ?? null
  const orientation = outcome?.routing.orientation ?? null

  // localStorage cannot be read during SSR. `useSyncExternalStore` with a null
  // server snapshot is the sanctioned way to hydrate a client-only value without
  // a setState-in-effect cascade.
  const storedLeadId = useSyncExternalStore(subscribeToStorage, readStoredLeadId, () => null)
  const returningLeadId = leadId ?? storedLeadId

  /** Workstreams in one domain, from the resolved prop rather than the module. */
  const streamsFor = useCallback(
    (d: AllyshipDomainKey) => workstreams.filter((w) => w.domain === d),
    [workstreams],
  )

  const plan = useMemo(() => repaymentPlan(), [])
  const print = useMemo(() => printEconomics(), [])
  const totals = useMemo(() => campaignTotals(), [])

  /** Needs for the chosen workstream, best-matched to her superpower first. */
  const offeredNeeds = useMemo<WorkstreamNeed[]>(() => {
    if (!workstream) return []
    const matched = needsForSuperpower(superpower, orientation, { domain: workstream.domain })
    // Keep only this workstream's needs, in match order.
    const inWorkstream = new Set(workstream.needs.map((n) => n.id))
    return matched.filter((n) => inWorkstream.has(n.id))
  }, [workstream, superpower, orientation])

  const toggle = useCallback((id: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  function finish() {
    if (!superpower || !domain) return
    setError(null)

    // Dry run: compute what WOULD have happened and stop. No lead, no claims, no
    // offer. Rehearsing on the live link would otherwise mark real needs as taken
    // — claims are conditional on `status: 'open'`, and there are only 24 of them.
    if (testMode) {
      const wouldClaim = [...picked]
      setResult({
        claimed: wouldClaim.length,
        skipped: [],
        vibeulons: offeredNeeds
          .filter((n) => picked.has(n.id))
          .reduce((sum, n) => sum + n.bountyVibeulons, 0),
      })
      setStep('done')
      return
    }

    startTransition(async () => {
      const res = await submitAllyIntake({
        allySlug: invite.slug,
        name: name.trim() || undefined,
        contact: contact.trim() || undefined,
        superpower,
        superpowerOrientation: orientation,
        mythsSeen: myths.map((m) => m.id),
        domain,
        commitments: [...picked],
        notes: notes.trim() || undefined,
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      // The offer is secondary — a failure here must not lose the intake above.
      if (offerBody.trim().length > 2) {
        await offerToCollective({
          leadId: res.leadId,
          campaignRef: workstream ? `mobility-quest-${workstream.key}` : undefined,
          body: offerBody.trim(),
          domain: domain ?? undefined,
          superpower,
        })
      }
      // Their way back in. No account exists, so the lead id IS the credential —
      // remembered locally so a returning visitor isn't stranded if they lose the
      // link, and shown explicitly on the finish screen so they can bookmark it.
      try {
        window.localStorage.setItem(LEAD_STORAGE_KEY, res.leadId)
      } catch {
        // Private browsing / storage disabled — the on-screen link still works.
      }
      setLeadId(res.leadId)
      setResult({ claimed: res.claimed, skipped: res.skipped, vibeulons: res.vibeulons })
      setStep('done')
    })
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Visible on every screen, not just the first — the whole risk of a dry run
          is forgetting you're in one and believing the result. */}
      {testMode && (
        <div
          className="sticky top-0 z-10 flex flex-col gap-1 rounded-xl border px-4 py-3"
          style={{
            background: 'rgba(212,160,23,.12)',
            borderColor: 'rgba(212,160,23,.4)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.24em', color: GOLD }}
          >
            test run — nothing is recorded
          </span>
          <span className="text-[13px] leading-relaxed" style={{ color: '#e6e4de' }}>
            {testTargetLabel
              ? `You're walking the real ${testTargetLabel} letter. `
              : 'You&apos;re walking the real flow. '}
            No lead is created, no task is claimed, and nothing reaches the board. Send the link
            without <code style={{ color: GOLD }}>test-</code> when it&apos;s for real.
          </span>
        </div>
      )}

      <Eyebrow>{invite.eyebrow}</Eyebrow>

      {/* ── intro ─────────────────────────────────────────────────────────── */}
      {step === 'intro' && (
        <Panel>
          {/* Someone who already did this shouldn't be made to do it again just
              because they lost the link. */}
          {returningLeadId && (
            <div
              className="flex flex-col gap-2 rounded-lg p-4"
              style={{ background: 'rgba(139,92,246,.10)' }}
            >
              <p className="text-[13.5px] leading-relaxed" style={{ color: INK }}>
                You&apos;ve been here before — your page is still where you left it.
              </p>
              <Link
                href={`/ally/mine/${returningLeadId}`}
                className="text-[13.5px] font-semibold"
                style={{ color: PURPLE }}
              >
                Go to my page →
              </Link>
            </div>
          )}
          <Prose text={invite.opening} />
          <Row>
            <button className={cta} style={{ background: PURPLE }} onClick={() => setStep('superpower')}>
              {returningLeadId ? 'Start over →' : 'Start →'}
            </button>
          </Row>
        </Panel>
      )}

      {/* ── superpower ────────────────────────────────────────────────────── */}
      {step === 'superpower' && (
        <div className="flex flex-col gap-4">
          <Heading>First: what do you actually bring?</Heading>
          <Sub>
            Seven allyship superpowers. This isn&apos;t a personality quiz with a flattering answer at the
            end — it decides which of the twenty jobs on this page you get shown.
          </Sub>
          <SuperpowerQuiz campaignRef="mobility-quest" onComplete={setOutcome} />
          {outcome && (
            <Row>
              <button className={cta} style={{ background: PURPLE }} onClick={() => setStep('myths')}>
                Continue →
              </button>
            </Row>
          )}
        </div>
      )}

      {/* ── myths ─────────────────────────────────────────────────────────── */}
      {step === 'myths' && (
        <MythCard
          myths={myths}
          index={mythIndex}
          flipped={mythFlipped}
          onFlip={() => setMythFlipped(true)}
          onNext={() => {
            if (mythIndex >= myths.length - 1) {
              setStep('understanding')
              return
            }
            setMythIndex((i) => i + 1)
            setMythFlipped(false)
          }}
        />
      )}

      {/* ── understanding ─────────────────────────────────────────────────── */}
      {step === 'understanding' && (
        <Panel>
          <Eyebrow>{understanding[panelIndex].kicker}</Eyebrow>
          <h2 className="text-[23px] font-bold leading-snug" style={{ color: INK }}>
            {understanding[panelIndex].heading}
          </h2>
          <Prose text={understanding[panelIndex].body} />
          <Row>
            <button
              className={cta}
              style={{ background: PURPLE }}
              onClick={() => {
                if (panelIndex >= understanding.length - 1) setStep('domain')
                else setPanelIndex((i) => i + 1)
              }}
            >
              {panelIndex >= understanding.length - 1 ? 'Show me the work →' : 'Go on →'}
            </button>
            <Counter now={panelIndex + 1} total={understanding.length} />
          </Row>
        </Panel>
      )}

      {/* ── domain ────────────────────────────────────────────────────────── */}
      {step === 'domain' && (
        <div className="flex flex-col gap-4">
          <Heading>Where do you want to work?</Heading>
          <Sub>
            Four domains. Each one is defined by what&apos;s <em>missing</em>, not by what the work looks
            like — that&apos;s the whole trick of the framework. Your superpower
            {superpower ? ` (${labelize(superpower)})` : ''} works in all four.
          </Sub>
          <div className="grid grid-cols-1 gap-2.5">
            {ALLYSHIP_DOMAINS.map((d) => {
              const streams = streamsFor(d.key as AllyshipDomainKey)
              if (streams.length === 0) return null
              return (
                <button
                  key={d.key}
                  onClick={() => {
                    setDomain(d.key as AllyshipDomainKey)
                    setStep('workstream')
                  }}
                  className="rounded-xl border border-white/[0.10] px-4 py-4 text-left hover:border-[#8b5cf6]"
                  style={{ background: PANEL }}
                >
                  <div className="text-[16px] font-semibold" style={{ color: INK }}>
                    {d.label}
                  </div>
                  <div className="mt-1 text-[13px] leading-relaxed" style={{ color: DIM }}>
                    {streams.map((s) => s.title).join(' · ')}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── workstream ────────────────────────────────────────────────────── */}
      {step === 'workstream' && domain && (
        <div className="flex flex-col gap-4">
          <Heading>{getDomainLabel(domain)}</Heading>
          <Sub>
            <strong style={{ color: GOLD }}>Why this domain:</strong>{' '}
            {streamsFor(domain)[0]?.emergentProblem}
          </Sub>
          {streamsFor(domain).map((w) => (
            <Panel key={w.key}>
              <Eyebrow>{w.eyebrow}</Eyebrow>
              <h3 className="text-[21px] font-bold" style={{ color: INK }}>
                {w.title}
              </h3>
              <Prose text={w.narrative} />
              <div
                className="rounded-lg border-l-2 px-4 py-3 text-[14px] leading-relaxed"
                style={{ borderColor: GOLD, background: 'rgba(212,160,23,.07)', color: INK }}
              >
                <strong>The ask:</strong> {w.theAsk}
              </div>
              <Row>
                <button
                  className={cta}
                  style={{ background: PURPLE }}
                  onClick={() => {
                    setWorkstream(w)
                    setStep('needs')
                  }}
                >
                  Show me what I could do →
                </button>
              </Row>
            </Panel>
          ))}
          <button className={ghost} style={{ color: DIM }} onClick={() => setStep('domain')}>
            ← A different domain
          </button>
        </div>
      )}

      {/* ── needs ─────────────────────────────────────────────────────────── */}
      {step === 'needs' && workstream && (
        <div className="flex flex-col gap-4">
          <Heading>{workstream.title} — pick what&apos;s yours</Heading>
          <Sub>
            Sorted to put your superpower first. Take one, take several, or take none and keep going —
            all three are real answers.
          </Sub>
          <div className="flex flex-col gap-2.5">
            {offeredNeeds.map((need) => {
              const on = picked.has(need.id)
              const match = need.superpower === superpower
              return (
                <button
                  key={need.id}
                  onClick={() => toggle(need.id)}
                  className="rounded-xl border px-4 py-4 text-left transition-colors"
                  style={{
                    background: on ? 'rgba(139,92,246,.10)' : PANEL,
                    borderColor: on ? PURPLE : 'rgba(255,255,255,.10)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[15.5px] font-semibold" style={{ color: INK }}>
                      {need.title}
                    </span>
                    <span
                      className="mt-0.5 shrink-0 text-[16px]"
                      style={{ color: on ? PURPLE : FAINT }}
                      aria-hidden
                    >
                      {on ? '✦' : '○'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: DIM }}>
                    {need.detail}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Tag>{costLabel(need)}</Tag>
                    <Tag>{need.orientation === 'internal' ? 'inner work' : 'outer work'}</Tag>
                    {match && <Tag accent>your superpower</Tag>}
                    {need.needsHelp && <Tag accent>nobody on this yet</Tag>}
                  </div>
                </button>
              )
            })}
          </div>
          <Row>
            <button className={cta} style={{ background: PURPLE }} onClick={() => setStep('offer')}>
              {picked.size > 0 ? `Take ${picked.size} →` : 'Continue →'}
            </button>
            {/* Declining is a peer of accepting, not a hidden escape hatch. */}
            <button
              className={ghost}
              style={{ color: DIM, border: '1px solid rgba(255,255,255,.12)' }}
              onClick={() => {
                setPicked(new Set())
                setStep('offer')
              }}
            >
              None of these are mine →
            </button>
            <button className={ghost} style={{ color: FAINT }} onClick={() => setStep('workstream')}>
              ← Back
            </button>
          </Row>
          <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
            Taking nothing is a complete answer. I&apos;d rather have a clear no today than a soft yes
            I&apos;m quietly counting on in March.
          </p>
        </div>
      )}

      {/* ── offer ─────────────────────────────────────────────────────────── */}
      {step === 'offer' && (
        <div className="flex flex-col gap-4">
          <Heading>Anything I didn&apos;t think to ask for?</Heading>
          <Sub>
            Everything above is something I already knew I needed. This box is for the thing I
            didn&apos;t — a person you know, a room, a skill, an objection. It goes to the collective, not
            just to me.
          </Sub>
          <textarea
            value={offerBody}
            onChange={(e) => setOfferBody(e.target.value)}
            rows={4}
            placeholder="Optional. In your own words."
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[14px] leading-relaxed focus:border-[#8b5cf6] focus:outline-none"
            style={{ color: INK }}
          />
          <Row>
            <button className={cta} style={{ background: PURPLE }} onClick={() => setStep('sign')}>
              Continue →
            </button>
          </Row>
        </div>
      )}

      {/* ── sign ──────────────────────────────────────────────────────────── */}
      {step === 'sign' && (
        <div className="flex flex-col gap-4">
          <Heading>Last thing</Heading>
          <Sub>
            No account, no password, no list. Just a name so I know who took what — and a way to reach
            you if you took something.
          </Sub>
          <Field label="Your name" value={name} onChange={setName} placeholder="Optional" />
          <Field
            label="Best way to reach you"
            value={contact}
            onChange={setContact}
            placeholder="Phone, email — optional"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
              Anything you want to say to me
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Including 'no' — that's a complete answer and I meant it."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[14px] leading-relaxed focus:border-[#8b5cf6] focus:outline-none"
              style={{ color: INK }}
            />
          </div>
          {error && <p className="text-[13px] text-red-400">{error}</p>}
          <Row>
            <button className={cta} style={{ background: PURPLE }} disabled={pending} onClick={finish}>
              {pending ? 'Sending…' : 'Send it to Wendell →'}
            </button>
          </Row>
        </div>
      )}

      {/* ── done ──────────────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="flex flex-col gap-6">
          <Panel>
            <h2 className="text-[25px] font-bold" style={{ color: INK }}>
              {testMode ? 'End of the test run' : "It's on the board ✦"}
            </h2>

            {/* Say what WOULD have happened, then say plainly that it didn't. */}
            {testMode ? (
              <div className="flex flex-col gap-3">
                <p className="text-[15px] leading-relaxed" style={{ color: '#cfcdc6' }}>
                  On the real link this would have created a lead
                  {result && result.claimed > 0 ? (
                    <>
                      {' '}
                      and claimed <strong style={{ color: INK }}>{result.claimed}</strong>{' '}
                      {result.claimed === 1 ? 'task' : 'tasks'} worth{' '}
                      <strong style={{ color: GOLD }}>{result.vibeulons} vibeulons</strong>
                    </>
                  ) : (
                    ' with no tasks claimed'
                  )}
                  .
                </p>
                <p
                  className="rounded-lg px-4 py-3 text-[14px] leading-relaxed"
                  style={{ background: 'rgba(212,160,23,.12)', color: '#e6e4de' }}
                >
                  <strong style={{ color: GOLD }}>None of it happened.</strong> No lead was written,
                  no task was claimed, and the board is exactly as you left it.
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: FAINT }}>
                  The closing letter below is what she&apos;d read. Everything above this panel — the
                  quiz, the myths, the numbers, the tasks — was the real thing.
                </p>
              </div>
            ) : result && result.claimed > 0 ? (
              <p className="text-[15px] leading-relaxed" style={{ color: '#cfcdc6' }}>
                You took <strong style={{ color: INK }}>{result.claimed}</strong>{' '}
                {result.claimed === 1 ? 'thing' : 'things'}, worth{' '}
                <strong style={{ color: GOLD }}>{result.vibeulons} vibeulons</strong> of energy to the
                collective when they&apos;re done. They now show as yours on my dashboard, which means
                nobody else gets handed them and I stop wondering who&apos;s got it.
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed" style={{ color: '#cfcdc6' }}>
                You read the whole thing and didn&apos;t take a job. That&apos;s a real answer and I&apos;m
                genuinely not being gracious about it — an honest no costs me a great deal less than a
                soft yes.
              </p>
            )}
            {result && result.skipped.length > 0 && (
              <p className="text-[13px]" style={{ color: FAINT }}>
                {result.skipped.length} of your picks had already been taken by someone else — they&apos;re
                not lost, just already covered.
              </p>
            )}
            <Prose text={invite.closing} />

            {leadId && (
              <div
                className="flex flex-col gap-2 rounded-lg p-4"
                style={{ background: 'rgba(139,92,246,.10)' }}
              >
                <p className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: PURPLE }}>
                  your page — bookmark it
                </p>
                <p className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
                  You can come back any time to see what you&apos;re holding, pick up something else,
                  or <strong style={{ color: INK }}>hand something back</strong> — no explanation
                  needed. There&apos;s no account, so this link is the only way in.
                </p>
                <Link
                  href={`/ally/mine/${leadId}`}
                  className={`${cta} self-start`}
                  style={{ background: PURPLE }}
                >
                  Open my page →
                </Link>
              </div>
            )}
          </Panel>

          <Numbers plan={plan} print={print} totals={totals} />

          <Panel>
            <Eyebrow>if you&apos;d rather just buy something</Eyebrow>
            <h3 className="text-[19px] font-bold" style={{ color: INK }}>
              Every one of these funds the same plan
            </h3>
            <div className="flex flex-col gap-2">
              <Buy href={offerHref('book-physical')} label="Buy the book" note="the physical copy" />
              <Buy href={offerHref('deck-digital')} label="Buy the deck" note="120 cards for the practice" />
              <Buy href={offerHref('coaching')} label="Book a session" note="1:1 coaching with Wendell" />
            </div>
          </Panel>

          <Link href="/mastering-allyship" className="text-[13.5px] font-semibold" style={{ color: PURPLE }}>
            Read the long version of what this is →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── The numbers panel ───────────────────────────────────────────────────────

function Numbers({
  plan,
  print,
  totals,
}: {
  plan: ReturnType<typeof repaymentPlan>
  print: ReturnType<typeof printEconomics>
  totals: ReturnType<typeof campaignTotals>
}) {
  return (
    <Panel>
      <Eyebrow>the whole picture, in numbers</Eyebrow>
      <h3 className="text-[19px] font-bold" style={{ color: INK }}>
        What it takes, and what pays it back
      </h3>

      <div className="flex flex-col divide-y divide-white/[0.06]">
        {totals.lines.map((l) => (
          <div key={l.key} className="flex flex-col gap-0.5 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[14px]" style={{ color: DIM }}>
                {l.label}
                {l.estimate && (
                  <span className="ml-1.5 text-[11px]" style={{ color: FAINT }}>
                    (estimate)
                  </span>
                )}
              </span>
              <span className="text-[14px] font-semibold tabular-nums" style={{ color: INK }}>
                {usd(l.cents)}
              </span>
            </div>
            <span className="text-[12px] leading-snug" style={{ color: FAINT }}>
              {l.recoveryNote}
            </span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 py-2.5">
          <span className="text-[14px] font-semibold" style={{ color: INK }}>
            Has to exist up front
          </span>
          <span className="text-[16px] font-bold tabular-nums" style={{ color: GOLD }}>
            {usd(totals.capitalNeededCents)}
          </span>
        </div>
      </div>

      {/* The number above blends a loan with a sunk cost, so it never stands
          alone. This is the honest reading of what is actually being asked. */}
      <div className="flex flex-col gap-2 rounded-lg p-4" style={{ background: 'rgba(255,255,255,.045)' }}>
        <p className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: GOLD }}>
          But that&apos;s not what it costs
        </p>
        <p className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
          That total is how much money has to <em>exist</em> before any of it comes back — it is not
          how much disappears. Split honestly:
        </p>
        <div className="flex flex-col gap-1.5 pt-1">
          <SplitRow label="Comes back to the lender, on a schedule" cents={totals.repaidCents} />
          <SplitRow label="Comes back out of book sales" cents={totals.recoupedCents} />
          <SplitRow label="Genuinely spent" cents={totals.spentCents} accent />
        </div>
        <p className="pt-1 text-[13.5px] leading-relaxed" style={{ color: INK }}>
          So the real cost of a year of this is{' '}
          <strong style={{ color: GOLD }}>{usd(totals.spentCents)}</strong>. The rest is timing.
        </p>
      </div>

      <div className="mt-2 flex flex-col gap-2 rounded-lg p-4" style={{ background: 'rgba(139,92,246,.08)' }}>
        <p className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: PURPLE }}>
          How the car gets paid back
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: INK }}>
          The loan is <strong>{usd(INPUTS.carLoanCents)}</strong>. Paying it back takes{' '}
          {plural(plan.workshopsNeeded, 'workshop')} and {plural(plan.booksNeeded, 'book')} over{' '}
          {INPUTS.repaymentMonths} months — about <strong>{usd(plan.monthlyCents)}/month</strong>.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: DIM }}>
          The print run breaks even at <strong style={{ color: INK }}>{print.breakEvenUnits} copies</strong>{' '}
          of {INPUTS.printRunUnits}. The {INPUTS.unitsHeldForEvents} event copies alone are worth{' '}
          {usd(print.eventRevenuePotentialCents)} at cover. Books are counted at the run&apos;s blended
          margin, not the better hand-to-hand margin — the less flattering of the two.
        </p>
        {!plan.withinCapacity && (
          <p
            className="rounded-lg px-3 py-2 text-[13px] leading-relaxed"
            style={{ background: 'rgba(204,136,136,.14)', color: '#f0d0d0' }}
          >
            Worth saying plainly: at these numbers the plan needs {plan.booksNeeded} copies and the run
            only prints {plan.booksAvailable}. Either the run gets bigger or the split shifts toward
            workshops. I&apos;d rather you see that than not.
          </p>
        )}
      </div>

      <p className="text-[12px] leading-relaxed" style={{ color: FAINT }}>
        Figures marked <em>estimate</em> are placeholders pending real quotes. Everything else is
        derived from them — when a real number lands, every line here changes with it.
      </p>
    </Panel>
  )
}

// ── Myth card ───────────────────────────────────────────────────────────────

function MythCard({
  myths,
  index,
  flipped,
  onFlip,
  onNext,
}: {
  myths: AllyMyth[]
  index: number
  flipped: boolean
  onFlip: () => void
  onNext: () => void
}) {
  const myth = myths[index]
  return (
    <div className="flex flex-col gap-5">
      <div
        className="flex items-baseline justify-between text-[10px] uppercase"
        style={{ letterSpacing: '.18em', color: DIM }}
      >
        <span>
          Myth {index + 1} / {myths.length}
        </span>
        <span style={{ color: GOLD }}>Reframe</span>
      </div>

      <div
        className="rounded-2xl border border-white/[0.08] p-6"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, #1a1526 0%, #121210 60%)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#cc8888' }}>
          The myth
        </p>
        <p className="mt-1 text-[19px] font-semibold leading-snug" style={{ color: INK }}>
          “{myth.myth}”
        </p>

        {flipped && (
          <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                The truth
              </p>
              <p className="mt-1 text-[15px] leading-relaxed" style={{ color: '#e6e4de' }}>
                {myth.truth}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: PURPLE }}>
                The reframe
              </p>
              <p className="mt-1 text-[15px] leading-relaxed" style={{ color: '#e6e4de' }}>
                {myth.reframe}
              </p>
            </div>
          </div>
        )}
      </div>

      <Row>
        {flipped ? (
          <button className={cta} style={{ background: PURPLE }} onClick={onNext}>
            {index >= myths.length - 1 ? 'Done with the myths →' : 'Next myth →'}
          </button>
        ) : (
          <button className={cta} style={{ background: PURPLE }} onClick={onFlip}>
            Turn it over →
          </button>
        )}
      </Row>
    </div>
  )
}

// ── Small presentational pieces ─────────────────────────────────────────────

function SplitRow({ label, cents, accent }: { label: string; cents: number; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13.5px]" style={{ color: accent ? INK : DIM }}>
        {label}
      </span>
      <span
        className="text-[14px] font-semibold tabular-nums"
        style={{ color: accent ? GOLD : INK }}
      >
        {usd(cents)}
      </span>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] p-6"
      style={{ background: PANEL }}
    >
      {children}
    </div>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[23px] font-bold leading-snug" style={{ color: INK }}>
      {children}
    </h2>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] leading-relaxed" style={{ color: DIM }}>
      {children}
    </p>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] uppercase"
      style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.26em', color: GOLD }}
    >
      {children}
    </span>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 pt-1">{children}</div>
}

function Counter({ now, total }: { now: number; total: number }) {
  return (
    <span className="text-[12px]" style={{ color: FAINT }}>
      {now} / {total}
    </span>
  )
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: accent ? 'rgba(212,160,23,.14)' : 'rgba(255,255,255,.06)',
        color: accent ? GOLD : DIM,
      }}
    >
      {children}
    </span>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[14px] focus:border-[#8b5cf6] focus:outline-none"
        style={{ color: INK }}
      />
    </div>
  )
}

function Buy({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-xl border border-white/[0.10] px-4 py-3 hover:border-[#d4a017]"
      style={{ background: 'rgba(0,0,0,.25)' }}
    >
      <span>
        <span className="text-[15px] font-semibold" style={{ color: INK }}>
          {label}
        </span>
        <span className="ml-2 text-[13px]" style={{ color: DIM }}>
          {note}
        </span>
      </span>
      <span style={{ color: GOLD }}>→</span>
    </a>
  )
}

/** Blank-line-separated paragraphs from an authored string. */
function Prose({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3.5">
      {text.split('\n\n').map((para, i) => (
        <p key={i} className="text-[15px] leading-[1.65]" style={{ color: '#cfcdc6' }}>
          {para}
        </p>
      ))}
    </div>
  )
}

/** "$12,000" / "3 hours" / "one action" — the cost, stated in its own unit. */
function costLabel(need: WorkstreamNeed): string {
  if (need.unit === 'currency') return usd(need.value * 100)
  if (need.unit === 'hours') return `${need.value} ${need.value === 1 ? 'hour' : 'hours'}`
  return need.value === 1 ? 'one action' : `${need.value} actions`
}

function labelize(key: string): string {
  return key.replace(/_/g, ' ')
}

/** "1 workshop" / "5 workshops" — derived counts land in prose, so they agree. */
function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}
