'use client'

/**
 * BeginFunnel — the vibey choose-your-own-adventure onboarding funnel.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * intro → superpower (reuse SuperpowerQuiz) → myths → domain → offered quests →
 * "create your character". On finish, records a CampaignLead (source automated)
 * and hands off to character creation. No sign-up wall.
 */
import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { SuperpowerQuiz } from '@/components/superpowers/SuperpowerQuiz'
import { AllyshipMyths } from './AllyshipMyths'
import { submitAutomatedLead } from '@/actions/campaign-leads'
import { ALLYSHIP_DOMAINS, getDomainLabel, type AllyshipDomainKey } from '@/lib/allyship-domains'
import type { SuperpowerIntakeOutcome } from '@/lib/superpowers/routing'

const PURPLE = 'var(--bars-liminal)'

interface QuestOption {
  id: string
  title: string
  domain: string | null
}

type Step = 'intro' | 'superpower' | 'myths' | 'domain' | 'offers' | 'create' | 'done'

const btn = 'rounded-xl px-5 py-3 text-[15px] font-semibold text-white'

export function BeginFunnel({
  campaignRef,
  campaignName,
  questPool,
}: {
  campaignRef: string
  campaignName: string
  questPool: QuestOption[]
}) {
  const [step, setStep] = useState<Step>('intro')
  const [outcome, setOutcome] = useState<SuperpowerIntakeOutcome | null>(null)
  const [mythsSeen, setMythsSeen] = useState<string[]>([])
  const [domain, setDomain] = useState<AllyshipDomainKey | null>(null)
  const [name, setName] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const superpower = outcome?.routing.superpower ?? null
  const orientation = outcome?.routing.orientation ?? null

  const offeredQuests = useMemo(() => {
    if (!domain) return []
    const matching = questPool.filter((q) => q.domain === domain)
    return (matching.length > 0 ? matching : questPool).slice(0, 3)
  }, [questPool, domain])

  function finish() {
    if (!superpower || !domain) return
    setError(null)
    startTransition(async () => {
      const res = await submitAutomatedLead({
        campaignRef,
        name: name.trim() || undefined,
        superpower,
        superpowerOrientation: orientation,
        mythsSeen,
        domain,
        offeredQuestIds: offeredQuests.map((q) => q.id),
      })
      if (res.ok) setStep('done')
      else setError(res.error)
    })
  }

  const characterHref = `/character/create?ref=${encodeURIComponent(campaignRef)}${
    superpower ? `&superpower=${encodeURIComponent(superpower)}` : ''
  }${domain ? `&domain=${encodeURIComponent(domain)}` : ''}`

  return (
    <div className="flex w-full max-w-[480px] flex-col gap-6">
      {step === 'intro' && (
        <div className="flex flex-col gap-5">
          <p className="text-[15px] leading-relaxed text-[#cfcdc6]">
            You found a doorway into <span className="font-semibold text-[#f4f2ec]">{campaignName}</span>.
            In a few minutes you’ll discover your allyship superpower, shed a myth or two, choose where
            you want to work, and walk away as a character with a first move to make.
          </p>
          <p className="text-[12px] text-[#6b6862]">No sign-up. Your result shows the moment you finish.</p>
          <button onClick={() => setStep('superpower')} className={`${btn} self-start`} style={{ background: PURPLE }}>
            Begin →
          </button>
        </div>
      )}

      {step === 'superpower' && (
        <div className="flex flex-col gap-4">
          <SuperpowerQuiz campaignRef={campaignRef} onComplete={setOutcome} />
          {outcome && (
            <button onClick={() => setStep('myths')} className={`${btn} self-end`} style={{ background: PURPLE }}>
              Continue →
            </button>
          )}
        </div>
      )}

      {step === 'myths' && (
        <AllyshipMyths
          domain={domain}
          onDone={(ids) => {
            setMythsSeen(ids)
            setStep('domain')
          }}
        />
      )}

      {step === 'domain' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[21px] font-bold text-[#f4f2ec]">Where do you want to work?</h2>
          <p className="text-[13.5px] text-[#a09e98]">
            Four domains, one cause. Your superpower{superpower ? ` (${superpower})` : ''} works in any of
            them — pick where you feel the pull.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALLYSHIP_DOMAINS.map((d) => (
              <button
                key={d.key}
                onClick={() => {
                  setDomain(d.key as AllyshipDomainKey)
                  setStep('offers')
                }}
                className="rounded-xl border border-white/12 px-4 py-4 text-left text-[15px] font-semibold text-[#f4f2ec] hover:border-[#8b5cf6]"
                style={{ background: '#121210' }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'offers' && domain && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[21px] font-bold text-[#f4f2ec]">Your first moves in {getDomainLabel(domain)}</h2>
          {offeredQuests.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {offeredQuests.map((q) => (
                <li
                  key={q.id}
                  className="rounded-xl border border-white/[0.08] p-4 text-[14px] text-[#e6e4de]"
                  style={{ background: '#121210' }}
                >
                  {q.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-white/[0.08] p-4 text-[13px] text-[#a09e98]">
              Your steward will hand-pick your first quests — you’ll get them when you claim your
              character.
            </p>
          )}
          <button onClick={() => setStep('create')} className={`${btn} self-end`} style={{ background: PURPLE }}>
            These are mine →
          </button>
        </div>
      )}

      {step === 'create' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[21px] font-bold text-[#f4f2ec]">Name your character</h2>
          <p className="text-[13.5px] text-[#a09e98]">
            {superpower ? `A ${superpower}` : 'An ally'} working in{' '}
            {domain ? getDomainLabel(domain) : 'the cause'}. What should we call you?
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or handle (optional)"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[14px] text-[#f4f2ec] placeholder:text-[#6b6862] focus:border-[#8b5cf6] focus:outline-none"
          />
          {error && <p className="text-[13px] text-red-400">{error}</p>}
          <button onClick={finish} disabled={pending} className={`${btn} self-start disabled:opacity-50`} style={{ background: PURPLE }}>
            {pending ? 'Creating…' : 'Create my character →'}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[23px] font-bold text-[#f4f2ec]">You’re in ✦</h2>
          <p className="text-[15px] leading-relaxed text-[#cfcdc6]">
            {name ? `${name}, your` : 'Your'} character is created — a{' '}
            <span className="font-semibold text-[#f4f2ec]">{superpower}</span> working in{' '}
            <span className="font-semibold text-[#f4f2ec]">{domain ? getDomainLabel(domain) : ''}</span>. The
            steward of {campaignName} will see you and reach out with your first quests.
          </p>
          <Link href={characterHref} className={`${btn} self-start`} style={{ background: PURPLE }}>
            Finish creating your character →
          </Link>
          <Link href={`/campaign/${campaignRef}`} className="text-[13px] font-semibold" style={{ color: PURPLE }}>
            Or explore {campaignName} first →
          </Link>
        </div>
      )}
    </div>
  )
}
