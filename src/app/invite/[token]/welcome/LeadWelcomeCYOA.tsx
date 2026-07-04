'use client'

/**
 * LeadWelcomeCYOA — the warm invitee's personalized orientation adventure.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * welcome → orientation cards (how the system works) → "how you're helping"
 * (the tasks the owner matched to THIS invitee) → claim your character (the
 * existing invite signup form, passed in as `signupSlot`). On claim, createCharacter
 * assigns the matched starter quests (see lib/campaign-leads/claim.ts).
 */
import { useState, type ReactNode } from 'react'
import { ORIENTATION_CARDS } from '@/lib/campaign-leads/orientation'

const PURPLE = 'var(--bars-liminal)'
const btn = 'rounded-xl px-5 py-3 text-[15px] font-semibold text-white'

export interface HowYouHelp {
  domainLabel: string | null
  actions: string[]
  questTitles: string[]
}

type Step = 'welcome' | 'orient' | 'help' | 'claim'

export function LeadWelcomeCYOA({
  campaignName,
  forgerName,
  inviteeName,
  message,
  help,
  signupSlot,
}: {
  campaignName: string
  forgerName: string | null
  inviteeName: string | null
  message: string | null
  help: HowYouHelp
  signupSlot: ReactNode
}) {
  const [step, setStep] = useState<Step>('welcome')
  const [orientIdx, setOrientIdx] = useState(0)

  const inviter = forgerName || 'Someone'
  const hasTasks = help.actions.length > 0 || help.questTitles.length > 0

  return (
    <main
      className="flex min-h-screen justify-center px-5 pb-16"
      style={{
        background: 'radial-gradient(125% 85% at 50% -10%, #15110c 0%, var(--bars-bg-base) 60%)',
        fontFamily: 'var(--bars-font-display)',
      }}
    >
      <div className="flex w-full max-w-[480px] flex-col pt-[30px]">
        <header className="flex flex-col gap-[11px] pb-4">
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.28em', color: 'var(--bars-gold)' }}
          >
            {campaignName} · A personal invitation
          </span>
        </header>

        {step === 'welcome' && (
          <div className="flex flex-col gap-5">
            <h1 className="text-[30px] font-bold" style={{ letterSpacing: '-.02em', lineHeight: 1.05, color: 'var(--bars-text-primary)' }}>
              {inviteeName ? `${inviteeName}, you’re` : 'You’re'} invited into {campaignName}
            </h1>
            {message ? (
              <blockquote
                className="rounded-xl border-l-2 pl-4 text-[15px] italic leading-relaxed"
                style={{ borderColor: PURPLE, color: '#d6d4ce' }}
              >
                “{message}”
                <footer className="mt-2 text-[12px] not-italic text-[#a09e98]">— {inviter}</footer>
              </blockquote>
            ) : (
              <p className="text-[15px] leading-relaxed text-[#cfcdc6]">
                {inviter} hand-picked you to help with {campaignName}. Take two minutes to see how it
                works and exactly how you’d be helping.
              </p>
            )}
            <button onClick={() => setStep('orient')} className={`${btn} self-start`} style={{ background: PURPLE }}>
              Show me how this works →
            </button>
          </div>
        )}

        {step === 'orient' && (
          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between text-[10px] uppercase" style={{ letterSpacing: '.18em', color: '#a09e98' }}>
              <span>{ORIENTATION_CARDS[orientIdx]!.kicker}</span>
              <span style={{ color: '#d4a017' }}>{orientIdx + 1} / {ORIENTATION_CARDS.length}</span>
            </div>
            <div className="rounded-2xl border border-white/[0.08] p-6" style={{ background: '#121210' }}>
              <h2 className="text-[21px] font-bold leading-snug text-[#f4f2ec]">
                {ORIENTATION_CARDS[orientIdx]!.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#d6d4ce]">
                {ORIENTATION_CARDS[orientIdx]!.body}
              </p>
            </div>
            <div className="flex items-center justify-between">
              {orientIdx > 0 ? (
                <button onClick={() => setOrientIdx((i) => i - 1)} className="text-[12px] font-semibold text-[#a09e98]">
                  ← Back
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={() => (orientIdx < ORIENTATION_CARDS.length - 1 ? setOrientIdx((i) => i + 1) : setStep('help'))}
                className={`${btn}`}
                style={{ background: PURPLE }}
              >
                {orientIdx < ORIENTATION_CARDS.length - 1 ? 'Next →' : 'How I’m helping →'}
              </button>
            </div>
          </div>
        )}

        {step === 'help' && (
          <div className="flex flex-col gap-5">
            <h2 className="text-[23px] font-bold text-[#f4f2ec]">How you’re helping</h2>
            {help.domainLabel && (
              <p className="text-[13px] uppercase tracking-wide" style={{ color: '#d4a017' }}>
                {help.domainLabel}
              </p>
            )}
            {hasTasks ? (
              <div className="flex flex-col gap-4">
                {help.actions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6862]">Your first actions</p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {help.actions.map((a, i) => (
                        <li
                          key={i}
                          className="rounded-xl border border-white/[0.08] p-4 text-[14px] text-[#e6e4de]"
                          style={{ background: '#121210' }}
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {help.questTitles.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b6862]">
                      Starter quests waiting for you
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {help.questTitles.map((t, i) => (
                        <li
                          key={i}
                          className="rounded-xl border p-4 text-[14px] text-[#e6e4de]"
                          style={{ borderColor: 'color-mix(in srgb, var(--bars-liminal) 27%, transparent)', background: 'rgba(139,92,246,0.06)' }}
                        >
                          ✦ {t}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[12px] text-[#a09e98]">
                      These land in your hand the moment you claim your character.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-xl border border-white/[0.08] p-4 text-[14px] text-[#cfcdc6]" style={{ background: '#121210' }}>
                {inviter} will hand you your first tasks once you’re in. Claim your character to get started.
              </p>
            )}
            <button onClick={() => setStep('claim')} className={`${btn} self-start`} style={{ background: PURPLE }}>
              I’m in — claim my character →
            </button>
          </div>
        )}

        {step === 'claim' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[23px] font-bold text-[#f4f2ec]">Claim your character</h2>
            <p className="text-[13.5px] text-[#a09e98]">
              Create your character to join {campaignName}. Your matched quests come with you.
            </p>
            {signupSlot}
          </div>
        )}
      </div>
    </main>
  )
}
