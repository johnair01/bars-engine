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
import { DOMAIN_PRIMERS } from '@/lib/ally-campaign/allies'
import type { AllyInvite, AllyMyth, UnderstandingPanel } from '@/lib/ally-campaign/allies'
import {
  findNeed,
  groupNeedEntries,
  needsForSuperpower,
  superpowerFootprint,
  workstreamForNeed,
  type NeedEntry,
  type Workstream,
  type WorkstreamNeed,
} from '@/lib/ally-campaign/workstreams'
import {
  INPUTS,
  campaignTotals,
  printEconomics,
  repaymentPlan,
  repaymentPlanDigital,
  usd,
} from '@/lib/ally-campaign/economics'
import { submitAllyIntake, offerToCollective } from '@/actions/ally-campaign'
import { PlanScreen } from './PlanScreen'

const PURPLE = 'var(--bars-liminal)'
const GOLD = '#d4a017'
const INK = '#f4f2ec'
const DIM = '#a09e98'
const FAINT = '#6b6862'
const PANEL = '#121210'

type Step =
  | 'intro'
  | 'superpower'
  | 'superpower-result'
  | 'myths'
  | 'understanding'
  | 'plan'
  | 'domains-primer'
  | 'domain'
  | 'workstream'
  | 'needs'
  | 'checkout'
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
}: {
  /** All prose arrives resolved — authored defaults with any admin edits already
   *  merged in by the server. This component never reads the content modules
   *  directly, so an edit shows up without touching the funnel. */
  invite: AllyInvite
  myths: AllyMyth[]
  understanding: UnderstandingPanel[]
  workstreams: Workstream[]
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

  // The page is statically rendered, so localStorage cannot be read during SSR.
  // `useSyncExternalStore` with a null server snapshot is the sanctioned way to
  // hydrate a client-only value without a setState-in-effect cascade.
  const storedLeadId = useSyncExternalStore(subscribeToStorage, readStoredLeadId, () => null)
  const returningLeadId = leadId ?? storedLeadId

  /** Workstreams in one domain, from the resolved prop rather than the module. */
  const streamsFor = useCallback(
    (d: AllyshipDomainKey) => workstreams.filter((w) => w.domain === d),
    [workstreams],
  )

  const plan = useMemo(() => repaymentPlan(), [])
  const planDigital = useMemo(() => repaymentPlanDigital(), [])
  const print = useMemo(() => printEconomics(), [])
  const totals = useMemo(() => campaignTotals(), [])

  /** Where their superpower lands across all four domains — the quiz's receipt. */
  const footprint = useMemo(() => superpowerFootprint(superpower, orientation), [superpower, orientation])

  /** Needs for the chosen workstream, best-matched first, slices grouped. */
  const offeredEntries = useMemo<NeedEntry[]>(() => {
    if (!workstream) return []
    const matched = needsForSuperpower(superpower, orientation, { domain: workstream.domain })
    // Keep only this workstream's needs, in match order.
    const inWorkstream = new Set(workstream.needs.map((n) => n.id))
    return groupNeedEntries(matched.filter((n) => inWorkstream.has(n.id)))
  }, [workstream, superpower, orientation])

  const toggle = useCallback((id: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /**
   * Hold exactly `count` slices of a divisible ask.
   *
   * Slices are claimed lowest-index-first so two people filling the same group
   * from different tabs collide on a row the server can arbitrate, rather than
   * both quietly "having" the ask.
   *
   * `resolve` receives the count currently held so callers can express a DELTA
   * without reading state at render time. A stepper that computes `count + 1`
   * from its render closure silently drops increments when clicks land faster
   * than React re-renders — three quick taps become one share.
   */
  const setShareCount = useCallback(
    (entry: Extract<NeedEntry, { kind: 'group' }>, resolve: number | ((held: number) => number)) => {
      setPicked((prev) => {
        const next = new Set(prev)
        const held = entry.slices.filter((s) => next.has(s.id)).length
        const wanted = typeof resolve === 'function' ? resolve(held) : resolve
        const clamped = Math.max(0, Math.min(entry.slices.length, wanted))
        if (clamped === held) return prev
        entry.slices.forEach((s) => next.delete(s.id))
        entry.slices.slice(0, clamped).forEach((s) => next.add(s.id))
        return next
      })
    },
    [],
  )

  /** Drop a whole checkout line — for a share line, every slice in it. */
  const removeLine = useCallback((needIds: string[]) => {
    setPicked((prev) => {
      const next = new Set(prev)
      needIds.forEach((id) => next.delete(id))
      return next
    })
  }, [])

  /** Everything they're holding, grouped for the checkout view. */
  const cart = useMemo(() => summarizeCart(picked), [picked])

  function finish() {
    if (!superpower || !domain) return
    setError(null)
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
        // Route the offer to the workstream their FIRST pick belongs to — picks
        // can now span several, so "the last one they looked at" would be wrong.
        const primary = [...picked].map((id) => workstreamForNeed(id)).find(Boolean) ?? workstream
        await offerToCollective({
          leadId: res.leadId,
          campaignRef: primary ? `mobility-quest-${primary.key}` : undefined,
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
            end — it decides which of the jobs on this page you get shown, and in what order.
          </Sub>
          {/* `suppressReveal`: the stock reveal ends in Crossing CTAs, which would
              route the reader out of this letter halfway through it. We render
              our own result on the next step instead. */}
          <SuperpowerQuiz
            campaignRef="mobility-quest"
            suppressReveal
            onComplete={(o) => {
              setOutcome(o)
              setStep('superpower-result')
            }}
          />
        </div>
      )}

      {/* ── superpower result — ours, not the stock reveal ─────────────────── */}
      {step === 'superpower-result' && superpower && (
        <SuperpowerResult
          superpower={superpower}
          orientation={orientation}
          onContinue={() => setStep('myths')}
          onRetake={() => {
            setOutcome(null)
            setStep('superpower')
          }}
        />
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
                if (panelIndex < understanding.length - 1) setPanelIndex((i) => i + 1)
                else setStep(invite.showPlan ? 'plan' : 'domains-primer')
              }}
            >
              {panelIndex >= understanding.length - 1
                ? invite.showPlan
                  ? 'Show me the numbers →'
                  : 'Show me the work →'
                : 'Go on →'}
            </button>
            <Counter now={panelIndex + 1} total={understanding.length} />
          </Row>
        </Panel>
      )}

      {/* ── plan (invite-gated) ───────────────────────────────────────────── */}
      {step === 'plan' && <PlanScreen onContinue={() => setStep('domains-primer')} />}

      {/* ── domains primer — teach the frame before asking them to use it ──── */}
      {step === 'domains-primer' && <DomainsPrimer onContinue={() => setStep('domain')} />}

      {/* ── domain ────────────────────────────────────────────────────────── */}
      {step === 'domain' && (
        <div className="flex flex-col gap-4">
          <Heading>Where do you want to work?</Heading>
          <Sub>
            Everything you&apos;ve answered so far points somewhere, so here is exactly where. Each
            domain shows how much of its work is typed to your superpower
            {superpower ? <strong style={{ color: INK }}> ({labelize(superpower)})</strong> : null}, and
            how many of the myths you just turned over were blocking it. Every domain has work you can
            do — the matching only decides what you meet first.
          </Sub>
          <div className="grid grid-cols-1 gap-2.5">
            {ALLYSHIP_DOMAINS.map((d) => {
              const key = d.key as AllyshipDomainKey
              const streams = streamsFor(key)
              if (streams.length === 0) return null
              const foot = footprint.find((f) => f.domain === key)
              const mythsHere = myths.filter((m) => m.domainHint === key)
              return (
                <button
                  key={d.key}
                  onClick={() => {
                    setDomain(key)
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
                  {/* The receipt for the quiz and the myths: this is what those
                      two steps actually bought the reader. */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {foot && foot.matched > 0 && (
                      <Tag accent>
                        {foot.matched} matched to your superpower
                      </Tag>
                    )}
                    <Tag>{foot?.total ?? 0} jobs here</Tag>
                    {mythsHere.length > 0 && (
                      <Tag>
                        {mythsHere.length === 1 ? '1 myth pointed here' : `${mythsHere.length} myths pointed here`}
                      </Tag>
                    )}
                  </div>
                  {foot?.exemplar && (
                    <p className="mt-2 text-[12.5px] leading-snug" style={{ color: FAINT }}>
                      e.g. {foot.exemplar.title}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
          {picked.size > 0 && (
            <Row>
              <button
                className={ghost}
                style={{ color: PURPLE, border: '1px solid rgba(139,92,246,.4)' }}
                onClick={() => setStep('checkout')}
              >
                Review what I&apos;ve picked ({picked.size}) →
              </button>
            </Row>
          )}
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
            {offeredEntries.map((entry) =>
              entry.kind === 'group' ? (
                <ShareCard
                  key={entry.key}
                  entry={entry}
                  picked={picked}
                  isMatch={entry.need.superpower === superpower}
                  onSetCount={(n) => setShareCount(entry, n)}
                />
              ) : (
                <NeedCard
                  key={entry.key}
                  need={entry.need}
                  on={picked.has(entry.need.id)}
                  isMatch={entry.need.superpower === superpower}
                  onToggle={() => toggle(entry.need.id)}
                />
              ),
            )}
          </div>
          <Row>
            <button className={cta} style={{ background: PURPLE }} onClick={() => setStep('checkout')}>
              {picked.size > 0 ? `Review my ${picked.size} →` : 'Continue →'}
            </button>
            {/* Taking more from elsewhere is a first-class move, not a back button. */}
            <button
              className={ghost}
              style={{ color: DIM, border: '1px solid rgba(255,255,255,.12)' }}
              onClick={() => setStep('domain')}
            >
              + Look at another area
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

      {/* ── checkout ──────────────────────────────────────────────────────── */}
      {step === 'checkout' && (
        <div className="flex flex-col gap-4">
          <Heading>Here&apos;s everything you&apos;re holding</Heading>
          {cart.lines.length === 0 ? (
            <>
              <Sub>
                Nothing selected — which is a complete answer, not an empty cart. You can go back and
                add something, or keep going and tell me what you actually think.
              </Sub>
              <Row>
                <button className={cta} style={{ background: PURPLE }} onClick={() => setStep('offer')}>
                  Continue with nothing →
                </button>
                <button
                  className={ghost}
                  style={{ color: DIM, border: '1px solid rgba(255,255,255,.12)' }}
                  onClick={() => setStep('domain')}
                >
                  ← Look again
                </button>
              </Row>
            </>
          ) : (
            <>
              <Sub>
                Everything in one place before it becomes real. Remove anything that looks bigger in
                daylight than it did a minute ago — that&apos;s what this screen is for.
              </Sub>

              {cart.groups.map((g) => (
                <div key={g.workstreamKey} className="flex flex-col gap-2">
                  <span
                    className="text-[10px] uppercase"
                    style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.22em', color: GOLD }}
                  >
                    {g.workstreamTitle}
                  </span>
                  {g.lines.map((line) => (
                    <div
                      key={line.key}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.10] px-4 py-3"
                      style={{ background: PANEL }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[14.5px] font-semibold" style={{ color: INK }}>
                          {line.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {line.quantity > 1 ? (
                            <Tag>
                              {line.quantity} × {line.costLabel}
                            </Tag>
                          ) : (
                            <Tag>{line.costLabel}</Tag>
                          )}
                          {line.subtotalLabel && <Tag accent>{line.subtotalLabel}</Tag>}
                          <Tag>{line.vibeulons} vibeulons</Tag>
                        </div>
                      </div>
                      <button
                        onClick={() => removeLine(line.needIds)}
                        className="shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-semibold"
                        style={{ color: DIM, border: '1px solid rgba(255,255,255,.12)' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {/* Units are reported apart and never summed — the Six Faces ruling.
                  A single blended "total contribution" would let money dwarf the
                  hours and the inner work, which is the exact failure this
                  campaign is arguing against everywhere else. */}
              <div
                className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] p-5"
                style={{ background: PANEL }}
              >
                <span
                  className="text-[10px] uppercase"
                  style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.22em', color: GOLD }}
                >
                  your total, in its own units
                </span>
                <div className="flex flex-col gap-1.5">
                  {cart.totalCurrency > 0 && (
                    <TotalRow label="Money" value={usd(cart.totalCurrency * 100)} />
                  )}
                  {cart.totalHours > 0 && (
                    <TotalRow label="Time" value={`${cart.totalHours} ${cart.totalHours === 1 ? 'hour' : 'hours'}`} />
                  )}
                  {cart.totalActions > 0 && (
                    <TotalRow
                      label="Actions"
                      value={`${cart.totalActions} ${cart.totalActions === 1 ? 'thing' : 'things'}`}
                    />
                  )}
                  <TotalRow label="Energy to the collective" value={`${cart.totalVibeulons} vibeulons`} accent />
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: FAINT }}>
                  These are listed separately on purpose and never added together. An hour is not
                  worth some number of dollars here, and pretending otherwise is how the money
                  quietly becomes the only contribution that counts.
                </p>
              </div>

              <Row>
                <button className={cta} style={{ background: PURPLE }} onClick={() => setStep('offer')}>
                  This is right →
                </button>
                <button
                  className={ghost}
                  style={{ color: DIM, border: '1px solid rgba(255,255,255,.12)' }}
                  onClick={() => setStep('domain')}
                >
                  + Add from another area
                </button>
                <button
                  className={ghost}
                  style={{ color: FAINT }}
                  onClick={() => setPicked(new Set())}
                >
                  Clear it all
                </button>
              </Row>
              <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
                Nothing here is committed until the last screen — and even after that, your own page
                lets you hand anything back with no explanation required.
              </p>
            </>
          )}
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
            <button className={ghost} style={{ color: FAINT }} onClick={() => setStep('checkout')}>
              ← Back to my list
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
          {/* Last honest look at the commitment before it lands. */}
          {cart.lines.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg p-4" style={{ background: 'rgba(139,92,246,.08)' }}>
              <p className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: PURPLE }}>
                you&apos;re taking
              </p>
              {cart.lines.map((l) => (
                <p key={l.key} className="text-[13.5px] leading-relaxed" style={{ color: INK }}>
                  {l.quantity > 1 ? `${l.quantity} × ` : ''}
                  {l.title}
                </p>
              ))}
              <button
                className="self-start pt-1 text-[12.5px] font-semibold"
                style={{ color: PURPLE }}
                onClick={() => setStep('checkout')}
              >
                ← Change it
              </button>
            </div>
          )}
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
              It&apos;s on the board ✦
            </h2>
            {result && result.claimed > 0 ? (
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

          <Numbers plan={plan} planDigital={planDigital} print={print} totals={totals} />

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

// ── Superpower result — ours, so the reader isn't routed out mid-letter ─────

function SuperpowerResult({
  superpower,
  orientation,
  onContinue,
  onRetake,
}: {
  superpower: string
  orientation: 'internal' | 'external' | null
  onContinue: () => void
  onRetake: () => void
}) {
  const footprint = useMemo(
    () => superpowerFootprint(superpower, orientation),
    [superpower, orientation],
  )
  const totalMatched = footprint.reduce((s, f) => s + f.matched, 0)

  return (
    <Panel>
      <Eyebrow>saved — this changes what you get shown</Eyebrow>
      <h2 className="text-[25px] font-bold capitalize" style={{ color: INK }}>
        {labelize(superpower)}
      </h2>
      <p className="text-[15px] leading-relaxed" style={{ color: '#cfcdc6' }}>
        {orientation === 'internal'
          ? 'Turned inward — the work wants to happen in you before it happens around you.'
          : 'Turned outward — the work wants to move resources, people, and story.'}
      </p>
      <div className="flex flex-col gap-2 rounded-lg p-4" style={{ background: 'rgba(139,92,246,.08)' }}>
        <p className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: PURPLE }}>
          what it just did
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: INK }}>
          <strong>{totalMatched}</strong> of the jobs on this board are typed to your answer. They get
          sorted to the top of every list you see from here, in every domain:
        </p>
        <div className="flex flex-col gap-1 pt-1">
          {footprint.map((f) => (
            <div key={f.domain} className="flex items-baseline justify-between gap-3">
              <span className="text-[13.5px]" style={{ color: DIM }}>
                {getDomainLabel(f.domain)}
              </span>
              <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: f.matched > 0 ? GOLD : FAINT }}>
                {f.matched} of {f.total}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[13px] leading-relaxed" style={{ color: FAINT }}>
        Note that no domain is empty. The quiz decides the <em>order</em> you meet the work in, never
        whether there&apos;s work for you — a router, not a gate.
      </p>
      <Row>
        <button className={cta} style={{ background: PURPLE }} onClick={onContinue}>
          Continue →
        </button>
        <button className={ghost} style={{ color: FAINT }} onClick={onRetake}>
          ↺ Retake
        </button>
      </Row>
    </Panel>
  )
}

// ── Domains primer ──────────────────────────────────────────────────────────

function DomainsPrimer({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Heading>Four domains — and the trick is counterintuitive</Heading>
      <Sub>
        A domain is named by <em>what&apos;s missing</em>, not by what the work looks like. Two people
        doing identical-looking things can be in different domains, and the same task can move domains
        as the situation changes. Worth ninety seconds before you choose.
      </Sub>
      {DOMAIN_PRIMERS.map((p) => (
        <div
          key={p.key}
          className="flex flex-col gap-2 rounded-xl border border-white/[0.10] px-4 py-4"
          style={{ background: PANEL }}
        >
          <div className="text-[16px] font-semibold" style={{ color: INK }}>
            {p.label}
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: '#cfcdc6' }}>
            {p.definition}
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: PURPLE }}>
            {p.test}
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: DIM }}>
            {p.everyday}
          </p>
          <p
            className="rounded-lg px-3 py-2 text-[13px] leading-relaxed"
            style={{ background: 'rgba(212,160,23,.08)', color: '#e8c98a' }}
          >
            <strong style={{ color: GOLD }}>Here:</strong> {p.here}
          </p>
        </div>
      ))}
      <Row>
        <button className={cta} style={{ background: PURPLE }} onClick={onContinue}>
          Got it — show me where I fit →
        </button>
      </Row>
    </div>
  )
}

// ── Need cards ──────────────────────────────────────────────────────────────

function NeedCard({
  need,
  on,
  isMatch,
  onToggle,
}: {
  need: WorkstreamNeed
  on: boolean
  isMatch: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
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
        <span className="mt-0.5 shrink-0 text-[16px]" style={{ color: on ? PURPLE : FAINT }} aria-hidden>
          {on ? '✦' : '○'}
        </span>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: DIM }}>
        {need.detail}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Tag>{costLabel(need)}</Tag>
        <Tag>{need.orientation === 'internal' ? 'inner work' : 'outer work'}</Tag>
        {isMatch && <Tag accent>your superpower</Tag>}
        {need.needsHelp && <Tag accent>nobody on this yet</Tag>}
      </div>
    </button>
  )
}

/**
 * A divisible ask, as one card with a quantity — never as N near-identical rows.
 * Taking 2 of 10 shares is a complete, unembarrassing answer, and the card says
 * so rather than making a partial contribution feel like a partial commitment.
 */
function ShareCard({
  entry,
  picked,
  isMatch,
  onSetCount,
}: {
  entry: Extract<NeedEntry, { kind: 'group' }>
  picked: Set<string>
  isMatch: boolean
  onSetCount: (resolve: number | ((held: number) => number)) => void
}) {
  const count = entry.slices.filter((s) => picked.has(s.id)).length
  const on = count > 0
  const total = entry.slices.length
  return (
    <div
      className="rounded-xl border px-4 py-4 transition-colors"
      style={{
        background: on ? 'rgba(139,92,246,.10)' : PANEL,
        borderColor: on ? PURPLE : 'rgba(255,255,255,.10)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[15.5px] font-semibold" style={{ color: INK }}>
          {entry.need.title}
        </span>
        <span className="mt-0.5 shrink-0 text-[16px]" style={{ color: on ? PURPLE : FAINT }} aria-hidden>
          {on ? '✦' : '○'}
        </span>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: DIM }}>
        {entry.need.detail}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <StepBtn label="−" onClick={() => onSetCount((held) => held - 1)} disabled={count <= 0} />
          <span
            className="min-w-[104px] text-center text-[13.5px] font-semibold tabular-nums"
            style={{ color: on ? INK : FAINT }}
          >
            {count} of {total} shares
          </span>
          <StepBtn label="+" onClick={() => onSetCount((held) => held + 1)} disabled={count >= total} />
        </div>
        <button
          onClick={() => onSetCount(total)}
          className="rounded-lg px-2.5 py-1 text-[12px] font-semibold"
          style={{ color: DIM, border: '1px solid rgba(255,255,255,.12)' }}
        >
          All {total}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {/* Shares are not always money — a brigade case is five copies, not $5.
            Currency shows the price beside the label; everything else lets the
            label speak, since "5 actions per share · 5 copies" says it twice. */}
        <Tag>
          {entry.need.unit === 'currency'
            ? `${usd(entry.sliceValue * 100)} per share · ${entry.sliceLabel}`
            : `${entry.sliceLabel} per share`}
        </Tag>
        {count > 0 && (
          <Tag accent>
            you:{' '}
            {entry.need.unit === 'currency'
              ? usd(count * entry.sliceValue * 100)
              : `${count * entry.sliceValue} ${sliceNoun(entry.sliceLabel)}`}
          </Tag>
        )}
        {isMatch && <Tag accent>your superpower</Tag>}
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
        Split into {total} shares so nobody carries the whole thing. One share is a real contribution
        and is treated as one.
      </p>
    </div>
  )
}

function StepBtn({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label === '+' ? 'Add a share' : 'Remove a share'}
      className="h-8 w-8 rounded-lg text-[16px] font-semibold disabled:opacity-30"
      style={{ color: INK, border: '1px solid rgba(255,255,255,.16)' }}
    >
      {label}
    </button>
  )
}

// ── Cart ────────────────────────────────────────────────────────────────────

interface CartLine {
  key: string
  title: string
  costLabel: string
  quantity: number
  vibeulons: number
  /** Every underlying need id — a share line carries several. */
  needIds: string[]
  /** Line total once quantity is applied, when that isn't the unit cost. */
  subtotalLabel?: string
}

interface CartGroup {
  workstreamKey: string
  workstreamTitle: string
  lines: CartLine[]
}

/**
 * Turn the flat set of claimed need ids into something a person can read: slices
 * collapsed back into one line with a quantity, lines grouped by workstream, and
 * totals kept strictly per unit.
 */
function summarizeCart(picked: Set<string>): {
  lines: CartLine[]
  groups: CartGroup[]
  totalCurrency: number
  totalHours: number
  totalActions: number
  totalVibeulons: number
} {
  const byLine = new Map<string, CartLine>()
  const lineWorkstream = new Map<string, { key: string; title: string }>()

  for (const id of picked) {
    const need = findNeed(id)
    if (!need) continue
    const ws = workstreamForNeed(id)
    const lineKey = need.share?.groupId ?? need.id
    const existing = byLine.get(lineKey)
    if (existing) {
      existing.quantity += 1
      existing.vibeulons += need.bountyVibeulons
      existing.needIds.push(id)
    } else {
      byLine.set(lineKey, {
        key: lineKey,
        title: need.title,
        // A share states its own unit ("5 copies"); only fall back to the
        // generic unit label for needs that aren't divisible.
        costLabel: need.share ? need.share.sliceLabel : costLabel(need),
        quantity: 1,
        vibeulons: need.bountyVibeulons,
        needIds: [id],
      })
      lineWorkstream.set(lineKey, { key: ws?.key ?? 'other', title: ws?.title ?? 'Elsewhere' })
    }
  }

  const lines = [...byLine.values()]

  // A per-unit price beside a "×4" makes the reader do the multiplication. Say it.
  for (const line of lines) {
    if (line.quantity <= 1) continue
    const need = findNeed(line.needIds[0])
    if (!need) continue
    if (need.unit === 'currency') {
      line.subtotalLabel = usd(need.value * line.quantity * 100)
    } else if (need.unit === 'hours') {
      const hours = need.value * line.quantity
      line.subtotalLabel = `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    } else if (need.share) {
      line.subtotalLabel = `${need.value * line.quantity} ${sliceNoun(need.share.sliceLabel)}`
    }
  }

  const groups: CartGroup[] = []
  for (const line of lines) {
    const ws = lineWorkstream.get(line.key)!
    let group = groups.find((g) => g.workstreamKey === ws.key)
    if (!group) {
      group = { workstreamKey: ws.key, workstreamTitle: ws.title, lines: [] }
      groups.push(group)
    }
    group.lines.push(line)
  }

  let totalCurrency = 0
  let totalHours = 0
  let totalActions = 0
  let totalVibeulons = 0
  for (const id of picked) {
    const need = findNeed(id)
    if (!need) continue
    totalVibeulons += need.bountyVibeulons
    if (need.unit === 'currency') totalCurrency += need.value
    else if (need.unit === 'hours') totalHours += need.value
    else totalActions += need.value
  }

  return { lines, groups, totalCurrency, totalHours, totalActions, totalVibeulons }
}

function TotalRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[13.5px]" style={{ color: accent ? INK : DIM }}>
        {label}
      </span>
      <span className="text-[14px] font-semibold tabular-nums" style={{ color: accent ? GOLD : INK }}>
        {value}
      </span>
    </div>
  )
}

// ── The numbers panel ───────────────────────────────────────────────────────

function Numbers({
  plan,
  planDigital,
  print,
  totals,
}: {
  plan: ReturnType<typeof repaymentPlan>
  planDigital: ReturnType<typeof repaymentPlanDigital>
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
          {plural(planDigital.workshopsNeeded, 'workshop')} and{' '}
          {plural(planDigital.copiesNeeded, 'digital copy', 'digital copies')} over{' '}
          {INPUTS.repaymentMonths} months — about <strong>{usd(planDigital.monthlyCents)}/month</strong>.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: DIM }}>
          Paper covers the run at <strong style={{ color: INK }}>{print.breakEvenUnits} copies</strong> of
          the {print.sellableUnits} left after the {print.obligationUnits} already owed
          {print.coversRunFromSellable ? ', so it fits' : ", which it does not have"}. Paper earns a
          little more per copy; digital at {usd(INPUTS.digitalPriceCents)} earns a little less and has
          no ceiling, so digital is what answers a good month. Copy counts here are net of what it
          costs to find a reader, not gross margin.
        </p>
        <p className="text-[13px] leading-relaxed" style={{ color: FAINT }}>
          {planDigital.demandCaveat}
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
            {/* Each myth obstructs a specific domain. Naming it here is what makes
                the domain choice two screens later feel earned rather than random. */}
            {myth.domainHint && (
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
                <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
                  this myth blocks
                </span>
                <Tag accent>{getDomainLabel(myth.domainHint)}</Tag>
              </div>
            )}
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
  return unitAmount(need.unit, need.value)
}

/**
 * A quantity in its own unit. Kept separate from `costLabel` so a share card can
 * format multiples (4 shares, 20 copies) without inventing a fake need.
 */
function unitAmount(unit: WorkstreamNeed['unit'], value: number): string {
  if (unit === 'currency') return usd(value * 100)
  if (unit === 'hours') return `${value} ${value === 1 ? 'hour' : 'hours'}`
  return value === 1 ? 'one action' : `${value} actions`
}

/** "5 copies" → "copies", so a running total can be stated in the ask's own noun. */
function sliceNoun(sliceLabel: string): string {
  return sliceLabel.replace(/^\s*[\d.,]+\s*/, '').trim() || 'shares'
}

function labelize(key: string): string {
  return key.replace(/_/g, ' ')
}

/** "1 workshop" / "5 workshops" — derived counts land in prose, so they agree. */
function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}
