'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import type { AllyshipDomain, MoveCard } from '@/lib/allyship-deck/types'
import type { AlchemyState } from '@/lib/alchemy/alchemy-graph'
import type { EmotionChannel } from '@/lib/alchemy/types'
import type { Superpower } from '@/lib/superpowers/types'
import { SHADOW_VOICE_OPTIONS } from '@/lib/quest-grammar/unpacking-constants'
import {
  DECK_FONTS,
  DECK_GOLD,
  DOMAIN_LABELS,
  LIMINAL,
  MOVE_LABELS,
} from '@/lib/allyship-deck/card-visuals'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import {
  abandonMoveAttempt,
  chooseMoveAttempt,
  completeMoveAttempt,
  markMoveAttemptNeedsFollowup,
  practiceMoveAttempt,
  recommendChargeMetabolismMove,
  reflectMoveAttempt,
  skipMoveAttemptSet,
  type MoveAttemptDraft,
  type MoveRecommendationServiceResult,
} from '@/lib/charge-metabolism'
import {
  buildRecommendationCardViewModel,
  type RecommendationCardViewModel,
} from '@/lib/allyship-deck/recommendation-card-view-model'
import type { CardSubject } from './AllyshipCard'

type PanelStep =
  | 'intro'
  | 'dissatisfaction'
  | 'channel_confirm'
  | 'desired'
  | 'blocker'
  | 'orientation'
  | 'recommendation'
  | 'chosen'
  | 'practiced'
  | 'reflected'
  | 'completed'
  | 'skipped'
  | 'abandoned'
  | 'needs_followup'

type OrientationChoice = 'internal' | 'external'

type DissatisfactionOption = {
  id: string
  label: string
  body: string
  channel: EmotionChannel
  state: AlchemyState
}

type DesiredSatisfactionOption = {
  id: string
  label: string
  body: string
  state: AlchemyState
}

type BlockerChoice = {
  id: string
  kind: 'self_sabotage' | 'domain_need'
  label: string
  body: string
  blockerText: string
  domain?: AllyshipDomain
}

const DISSATISFACTION_OPTIONS: DissatisfactionOption[] = [
  {
    id: 'blocked-desire',
    label: 'Blocked desire',
    body: 'I feel resentful, irritated, crossed, or ready to push.',
    channel: 'anger',
    state: { channel: 'anger', altitude: 'dissatisfied' },
  },
  {
    id: 'loss-distance',
    label: 'Loss or distance',
    body: 'Something I care about feels far away, gone, or unreceived.',
    channel: 'sadness',
    state: { channel: 'sadness', altitude: 'dissatisfied' },
  },
  {
    id: 'threat-scan',
    label: 'Threat scan',
    body: 'I am worried, tense, bracing, or trying to find what is unsafe.',
    channel: 'fear',
    state: { channel: 'fear', altitude: 'dissatisfied' },
  },
  {
    id: 'restless-possibility',
    label: 'Restless possibility',
    body: 'Too many openings, comparison, stimulation, or unfocused aliveness.',
    channel: 'joy',
    state: { channel: 'joy', altitude: 'dissatisfied' },
  },
  {
    id: 'numb-stuck',
    label: 'Numb or stuck',
    body: 'Flat, bored, stalled, apathetic, or unable to feel the next move.',
    channel: 'neutrality',
    state: { channel: 'neutrality', altitude: 'dissatisfied' },
  },
]

const CHANNEL_TEACHING: Record<EmotionChannel, { label: string; job: string; clean: string; satisfied: string }> = {
  anger: {
    label: 'Anger',
    job: 'desire, boundary, agency, and directed force',
    clean: 'Clean Anger',
    satisfied: 'Triumph',
  },
  sadness: {
    label: 'Sadness',
    job: 'care, meaning, distance, and restoring flow toward what matters',
    clean: 'Clean Sadness',
    satisfied: 'Poignance',
  },
  fear: {
    label: 'Fear',
    job: 'discernment, risk, orientation, and clean contact with stakes',
    clean: 'Clean Fear',
    satisfied: 'Excitement',
  },
  joy: {
    label: 'Joy',
    job: 'possibility, aliveness, growth, and participation',
    clean: 'Clean Joy',
    satisfied: 'Bliss',
  },
  neutrality: {
    label: 'Neutral',
    job: 'presence, coherence, stability, and whole-system contact',
    clean: 'Clean Neutrality',
    satisfied: 'Peace',
  },
}

const DESIRED_SATISFACTION_OPTIONS: DesiredSatisfactionOption[] = [
  {
    id: 'fear-satisfied',
    label: 'Excitement',
    body: 'I need clean risk, opportunity, and enough courage to move.',
    state: { channel: 'fear', altitude: 'satisfied' },
  },
  {
    id: 'sadness-satisfied',
    label: 'Poignance',
    body: 'I need contact with what matters and restored flow toward care.',
    state: { channel: 'sadness', altitude: 'satisfied' },
  },
  {
    id: 'joy-satisfied',
    label: 'Bliss',
    body: 'I need aliveness, participation, and love of the game.',
    state: { channel: 'joy', altitude: 'satisfied' },
  },
  {
    id: 'anger-satisfied',
    label: 'Triumph',
    body: 'I need agency, honored boundaries, and clean directed force.',
    state: { channel: 'anger', altitude: 'satisfied' },
  },
  {
    id: 'neutrality-satisfied',
    label: 'Peace',
    body: 'I need coherence, steadiness, and enough settled ground to act.',
    state: { channel: 'neutrality', altitude: 'satisfied' },
  },
]

const DOMAIN_BLOCKER_OPTIONS: BlockerChoice[] = [
  {
    id: 'need-gathering-resources',
    kind: 'domain_need',
    label: 'Need resources',
    body: 'Time, attention, skills, presence, money, materials, or support are missing.',
    blockerText: 'The work needs resources: time, attention, skills, presence, money, materials, or support.',
    domain: 'GATHERING_RESOURCES',
  },
  {
    id: 'need-skillful-organizing',
    kind: 'domain_need',
    label: 'Need organizing',
    body: 'Roles, sequencing, ownership, process, or coordination are unclear.',
    blockerText: 'The work needs organizing: roles, sequencing, ownership, process, or coordination.',
    domain: 'SKILLFUL_ORGANIZING',
  },
  {
    id: 'need-direct-action',
    kind: 'domain_need',
    label: 'Need action',
    body: 'A line, next step, obstacle, or concrete intervention needs movement.',
    blockerText: 'The work needs direct action: a line, next step, obstacle, or concrete intervention.',
    domain: 'DIRECT_ACTION',
  },
  {
    id: 'need-raise-awareness',
    kind: 'domain_need',
    label: 'Need awareness',
    body: 'Something true, possible, or important needs to become visible.',
    blockerText: 'The work needs awareness: something true, possible, or important needs to become visible.',
    domain: 'RAISE_AWARENESS',
  },
]

const SELF_SABOTAGE_BLOCKER_OPTIONS: BlockerChoice[] = SHADOW_VOICE_OPTIONS.map((label) => ({
  id: `belief-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  kind: 'self_sabotage',
  label,
  body: 'An inner belief may be shaping where the work needs attention.',
  blockerText: `A self-sabotage belief is shaping the work: ${label}.`,
}))

export function WorkThisCardButton({
  card,
  subject,
  label = 'Work this card',
  playerSuperpower = null,
}: {
  card: MoveCard
  subject: CardSubject
  label?: string
  playerSuperpower?: Superpower | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={workButton}>
        {label}
      </button>
      {open && (
        <DeckWorkThisCardPanel
          card={card}
          subject={subject}
          playerSuperpower={playerSuperpower}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function DeckWorkThisCardPanel({
  card,
  subject,
  playerSuperpower,
  onClose,
}: {
  card: MoveCard
  subject: CardSubject
  playerSuperpower?: Superpower | null
  onClose: () => void
}) {
  const [step, setStep] = useState<PanelStep>('intro')
  const [selectedDissatisfaction, setSelectedDissatisfaction] = useState<DissatisfactionOption | null>(null)
  const [desiredState, setDesiredState] = useState<AlchemyState | null>(null)
  const [selectedBlocker, setSelectedBlocker] = useState<BlockerChoice | null>(null)
  const [blocker, setBlocker] = useState('')
  const [orientation, setOrientation] = useState<OrientationChoice>('internal')
  const [recommendation, setRecommendation] = useState<MoveRecommendationServiceResult | null>(null)
  const [attempt, setAttempt] = useState<MoveAttemptDraft | null>(null)
  const [artifactText, setArtifactText] = useState('')
  const [reflectionText, setReflectionText] = useState('')
  const [outcomeText, setOutcomeText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const externalSubject = subject === 'campaign' ? 'collective' : 'other'
  const serviceSubject = orientation === 'internal' ? 'self' : externalSubject
  const presentState = selectedDissatisfaction?.state ?? null
  const channelTeaching = selectedDissatisfaction ? CHANNEL_TEACHING[selectedDissatisfaction.channel] : null
  const recommendationDomain = selectedBlocker?.domain ?? card.domain
  const blockerContext = buildBlockerContext(selectedBlocker, blocker)

  const vectorSummary = useMemo(() => {
    const from = recommendation?.presentState
    const to = recommendation?.desiredState
    if (!from || !to) return null
    return `${from.channel}:${from.altitude} -> ${to.channel}:${to.altitude}`
  }, [recommendation])
  const activeMove = attempt?.translationSnapshot ?? recommendation?.primaryRecommendation?.move ?? null

  const resetError = () => setError(null)

  const buildRecommendation = () => {
    resetError()
    const result = recommendChargeMetabolismMove({
      sourceSurface: 'allyship_deck',
      deckCardId: card.id,
      present: presentState,
      desired: desiredState,
      blocker: blockerContext,
      orientation,
      subject: serviceSubject,
      superpower: playerSuperpower ?? 'coach',
      domain: recommendationDomain,
      cardContext: {
        deckCardId: card.id,
        cardFamily: card.move,
        operation: card.operation,
      },
      maxAlternates: 2,
    })

    setRecommendation(result)
    setAttempt(null)

    if (result.routeHandRecommendations.length > 0 || result.primaryRecommendation) {
      setStep('recommendation')
      return
    }

    setError(result.nextQuestion ?? 'The move is not clear yet. Try simpler charge words.')
  }

  const choose = (draft: MoveAttemptDraft | null) => {
    if (!draft) return
    const result = chooseMoveAttempt(draft)
    if (!result.success) {
      setError(result.reason)
      return
    }
    setAttempt(result.attempt)
    setStep('chosen')
    setError(null)
  }

  const skip = () => {
    const result = skipMoveAttemptSet(
      recommendation?.routeHandAttemptDrafts.length
        ? recommendation.routeHandAttemptDrafts
        : [
            recommendation?.metabolizeAttemptDraft ?? recommendation?.attemptDraft,
            recommendation?.satisfactionAttemptDraft,
          ],
    )
    if (!result.success) {
      setError(result.reason)
      return
    }
    setAttempt(result.attempts[0] ?? null)
    setStep('skipped')
    setError(null)
  }

  const practice = () => {
    if (!attempt) return
    const result = practiceMoveAttempt(attempt, {
      ...(artifactText.trim() ? { artifactText: artifactText.trim() } : {}),
      ...(outcomeText.trim() ? { outcome: outcomeText.trim() } : {}),
    })
    if (!result.success) {
      setError(result.reason)
      return
    }
    setAttempt(result.attempt)
    setStep('practiced')
    setError(null)
  }

  const reflect = () => {
    if (!attempt) return
    const text = reflectionText.trim()
    if (!text) {
      setError('Add a reflection before reflecting the move.')
      return
    }
    const result = reflectMoveAttempt(attempt, text)
    if (!result.success) {
      setError(result.reason)
      return
    }
    setAttempt(result.attempt)
    setStep('reflected')
    setError(null)
  }

  const complete = () => {
    if (!attempt) return
    const result = completeMoveAttempt(attempt, {
      ...(artifactText.trim() ? { artifactText: artifactText.trim() } : {}),
      ...(reflectionText.trim() ? { reflectionText: reflectionText.trim() } : {}),
      ...(outcomeText.trim() ? { outcome: outcomeText.trim() } : {}),
    })
    if (!result.success) {
      setError(result.reason)
      return
    }
    setAttempt(result.attempt)
    setStep('completed')
    setError(null)
  }

  const abandon = () => {
    if (!attempt) return
    const result = abandonMoveAttempt(attempt, outcomeText.trim() || 'Not the right move today.')
    if (!result.success) {
      setError(result.reason)
      return
    }
    setAttempt(result.attempt)
    setStep('abandoned')
    setError(null)
  }

  const needsFollowup = () => {
    if (!attempt) return
    const result = markMoveAttemptNeedsFollowup(attempt, outcomeText.trim() || 'This revealed another blocker.')
    if (!result.success) {
      setError(result.reason)
      return
    }
    setAttempt(result.attempt)
    setStep('needs_followup')
    setError(null)
  }

  const routeHandRecommendations = recommendation?.routeHandRecommendations ?? []
  const routeHandAttemptDrafts = recommendation?.routeHandAttemptDrafts ?? []
  const hasRouteHand = routeHandRecommendations.length > 0

  const chooseDissatisfaction = (option: DissatisfactionOption) => {
    setSelectedDissatisfaction(option)
    setDesiredState(null)
    setStep('channel_confirm')
    setError(null)
  }

  return (
    <div style={overlay} onClick={onClose}>
      <section style={panel} onClick={(event) => event.stopPropagation()} aria-label="Work this card">
        <header style={header}>
          <div>
            <p style={kicker}>Work this card</p>
            <h2 style={title}>{card.title}</h2>
            <p style={subtle}>{MOVE_LABELS[card.move]} · {DOMAIN_LABELS[card.domain]}</p>
          </div>
          <button type="button" onClick={onClose} style={closeButton}>Close</button>
        </header>

        {step === 'intro' && (
          <PanelBody
            heading="Turn a live charge into one concrete move."
            body="This card becomes the lens. Start with the kind of stuckness you recognize, then choose where the charge should move."
            action={<button type="button" data-testid="work-this-card-start" style={primaryButton} onClick={() => setStep('dissatisfaction')}>Start</button>}
          />
        )}

        {step === 'dissatisfaction' && (
          <PanelBody
            heading="What kind of stuckness is here?"
            body="Choose the closest dissatisfaction. The system will translate this into an emotional channel."
            fields={
              <OptionGrid>
                {DISSATISFACTION_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.id}
                    active={selectedDissatisfaction?.id === option.id}
                    label={option.label}
                    body={option.body}
                    onClick={() => chooseDissatisfaction(option)}
                  />
                ))}
              </OptionGrid>
            }
            action={<button type="button" style={ghostButton} onClick={onClose}>Close</button>}
          />
        )}

        {step === 'channel_confirm' && selectedDissatisfaction && channelTeaching && (
          <PanelBody
            heading={`This looks like ${channelTeaching.label}.`}
            body={`${channelTeaching.label} is the channel of ${channelTeaching.job}. The clean version is the emotion doing its job, not the defended version.`}
            fields={
              <div style={teachingBox}>
                <p style={smallLabel}>Selected dissatisfaction</p>
                <h3 style={{ ...panelHeading, marginTop: 5 }}>{selectedDissatisfaction.label}</h3>
                <p style={bodyText}>{selectedDissatisfaction.body}</p>
              </div>
            }
            action={
              <div style={actionRow}>
                <button type="button" style={secondaryButton} onClick={() => setStep('dissatisfaction')}>Choose another</button>
                <button type="button" style={primaryButton} onClick={() => setStep('desired')}>Yes, keep going</button>
              </div>
            }
          />
        )}

        {step === 'desired' && selectedDissatisfaction && (
          <PanelBody
            heading="What satisfaction are you moving toward?"
            body="Pick the mood that would resolve the vector. The system will use this target to choose the needed emotional movement."
            fields={
              <OptionGrid>
                {DESIRED_SATISFACTION_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.id}
                    active={stateEquals(desiredState, option.state)}
                    label={option.label}
                    body={option.body}
                    onClick={() => setDesiredState(option.state)}
                  />
                ))}
              </OptionGrid>
            }
            action={<StepActions back={() => setStep('channel_confirm')} next={() => setStep('blocker')} disabled={!desiredState} />}
          />
        )}

        {step === 'blocker' && (
          <PanelBody
            heading="Where does the work need attention?"
            body="Optional. The vector is already resolved; this tells the card whether to work an inner belief or an allyship-domain need."
            fields={
              <div style={{ display: 'grid', gap: 14 }}>
                <OptionGrid>
                  <OptionCard
                    active={!selectedBlocker}
                    label="No clear blocker yet"
                    body="Recommend from the emotional vector and the card context."
                    onClick={() => setSelectedBlocker(null)}
                  />
                </OptionGrid>

                <div style={blockerSection}>
                  <p style={smallLabel}>Inner self-sabotage belief</p>
                  <OptionGrid>
                    {SELF_SABOTAGE_BLOCKER_OPTIONS.map((option) => (
                      <OptionCard
                        key={option.id}
                        active={selectedBlocker?.id === option.id}
                        label={option.label}
                        body={option.body}
                        onClick={() => setSelectedBlocker(option)}
                      />
                    ))}
                  </OptionGrid>
                </div>

                <div style={blockerSection}>
                  <p style={smallLabel}>Allyship-domain need</p>
                  <OptionGrid>
                    {DOMAIN_BLOCKER_OPTIONS.map((option) => (
                      <OptionCard
                        key={option.id}
                        active={selectedBlocker?.id === option.id}
                        label={option.label}
                        body={option.body}
                        onClick={() => setSelectedBlocker(option)}
                      />
                    ))}
                  </OptionGrid>
                </div>

                <TextArea
                  value={blocker}
                  onChange={setBlocker}
                  placeholder="Optional detail: what makes this blocker specific here?"
                />
              </div>
            }
            action={<StepActions back={() => setStep('desired')} next={() => setStep('orientation')} />}
          />
        )}

        {step === 'orientation' && (
          <PanelBody
            heading="Where does the move need to happen first?"
            body="Internal and external moves both count as Show Up when they leave a trace."
            fields={
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <ChoiceButton active={orientation === 'internal'} onClick={() => setOrientation('internal')} label="Within me" />
                <ChoiceButton active={orientation === 'external'} onClick={() => setOrientation('external')} label="In the world" />
              </div>
            }
            action={<StepActions back={() => setStep('blocker')} next={buildRecommendation} nextLabel="Find my move" />}
          />
        )}

        {step === 'recommendation' && hasRouteHand && (
          <PanelBody
            heading={routeHandHeading(routeHandRecommendations.length)}
            body={
              routeHandRecommendations.length > 1
                ? vectorSummary
                  ? `From ${vectorSummary}. Work the cards in order, or choose the card that matches where the charge already is.`
                  : 'Work the cards in order, or choose the card that matches where the charge already is.'
                : vectorSummary
                  ? `From ${vectorSummary}. This card fits the direction of the charge.`
                  : 'This card fits the direction of the charge.'
            }
            fields={
              <div style={recommendationGrid}>
                {routeHandRecommendations.length > 1 && (
                  <div style={teachingBox}>
                    <p style={bodyText}>
                      First, work the charge you have. Then translate into the target channel when needed. Finally, practice the satisfaction.
                    </p>
                  </div>
                )}
                {routeHandRecommendations.map((item, index) => {
                  const draft = routeHandAttemptDrafts[index] ?? null
                  const role = draft?.recommendationRole ?? 'single'
                  const viewModel = buildRecommendationCardViewModel({
                    card,
                    subject,
                    recommendation: item,
                    role,
                    attemptDraft: draft,
                  })
                  return (
                    <RecommendationView
                      key={`${item.edge.vector}-${index}`}
                      kickerLabel={`Card ${index + 1} · ${viewModel.kicker}`}
                      viewModel={viewModel}
                      action={
                        <button
                          type="button"
                          data-testid={`choose-route-hand-card-${index}`}
                          style={primaryButton}
                          onClick={() => choose(draft)}
                        >
                          Choose this card
                        </button>
                      }
                    />
                  )
                })}
              </div>
            }
            action={
              <div style={stackedActions}>
                <button type="button" data-testid="skip-recommendation-set" style={secondaryButton} onClick={skip}>
                  {routeHandRecommendations.length > 1 ? 'Skip these cards for now' : 'Skip for now'}
                </button>
              </div>
            }
          />
        )}

        {step === 'chosen' && activeMove && (
          <PanelBody
            heading="Practice it in a form that leaves a trace."
            body={activeMove.completion}
            fields={
              <>
                <TextArea value={artifactText} onChange={setArtifactText} placeholder="What trace did or will this move leave?" />
                <TextInput value={outcomeText} onChange={setOutcomeText} placeholder="Optional outcome note" />
              </>
            }
            action={
              <div style={actionRow}>
                <button type="button" style={secondaryButton} onClick={abandon}>Not this move today</button>
                <button type="button" style={primaryButton} onClick={practice}>I practiced this</button>
              </div>
            }
          />
        )}

        {step === 'practiced' && activeMove && (
          <PanelBody
            heading="What changed in the charge?"
            body={activeMove.reflectionPrompt}
            fields={<TextArea value={reflectionText} onChange={setReflectionText} placeholder="The charge shifted when..." />}
            action={
              <div style={stackedActions}>
                <button type="button" style={primaryButton} onClick={reflect}>Reflect</button>
                <button type="button" style={secondaryButton} onClick={complete}>Complete with this trace</button>
                <button type="button" style={ghostButton} onClick={needsFollowup}>This revealed another blocker</button>
              </div>
            }
          />
        )}

        {step === 'reflected' && (
          <PanelBody
            heading="Reflection captured."
            body="This can now count as a completed practice move in the prototype."
            action={
              <div style={actionRow}>
                <button type="button" style={secondaryButton} onClick={needsFollowup}>Needs follow-up</button>
                <button type="button" style={primaryButton} onClick={complete}>Complete</button>
              </div>
            }
          />
        )}

        {step === 'needs_followup' && (
          <PanelBody
            heading="Another blocker appeared."
            body="That still counts as useful information. Try the smaller version or close for now."
            fields={<TextInput value={outcomeText} onChange={setOutcomeText} placeholder="What is the smaller follow-up?" />}
            action={
              <div style={actionRow}>
                <button type="button" style={secondaryButton} onClick={onClose}>Close</button>
                <button type="button" style={primaryButton} onClick={practice}>Practice again</button>
              </div>
            }
          />
        )}

        {['completed', 'skipped', 'abandoned'].includes(step) && (
          <PanelBody
            heading={
              step === 'completed'
                ? 'Move completed.'
                : step === 'skipped'
                  ? 'Move skipped.'
                  : 'Move abandoned.'
            }
            body={
              step === 'completed'
                ? 'For this prototype, the result stays here. Persistence comes after the shape feels right.'
                : 'No problem. The card can be worked again when the charge is clearer.'
            }
            action={<button type="button" style={primaryButton} onClick={onClose}>Close</button>}
          />
        )}

        {error && <p style={errorText}>{error}</p>}
      </section>
    </div>
  )
}

function PanelBody({
  heading,
  body,
  fields,
  action,
}: {
  heading: string
  body: string
  fields?: ReactNode
  action: ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h3 style={panelHeading}>{heading}</h3>
        <p style={bodyText}>{body}</p>
      </div>
      {fields}
      {action}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  )
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.45 }}
    />
  )
}

function StepActions({
  back,
  next,
  nextLabel = 'Next',
  disabled = false,
}: {
  back: () => void
  next: () => void
  nextLabel?: string
  disabled?: boolean
}) {
  return (
    <div style={actionRow}>
      <button type="button" style={secondaryButton} onClick={back}>Back</button>
      <button
        type="button"
        data-testid="work-this-card-next"
        style={{ ...primaryButton, opacity: disabled ? 0.45 : 1 }}
        disabled={disabled}
        onClick={next}
      >
        {nextLabel}
      </button>
    </div>
  )
}

function ChoiceButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...secondaryButton,
        color: active ? '#160b02' : SURFACE_TOKENS.textPrimary,
        background: active ? DECK_GOLD : SURFACE_TOKENS.surfaceInset,
      }}
    >
      {label}
    </button>
  )
}

function OptionGrid({ children }: { children: ReactNode }) {
  return <div style={optionGrid}>{children}</div>
}

function OptionCard({
  active,
  label,
  body,
  onClick,
}: {
  active: boolean
  label: string
  body: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...optionCard,
        borderColor: active ? DECK_GOLD : 'rgba(255,255,255,.12)',
        background: active ? 'rgba(230, 184, 90, .16)' : SURFACE_TOKENS.surfaceInset,
      }}
    >
      <span style={optionCardTitle}>{label}</span>
      <span style={optionCardBody}>{body}</span>
    </button>
  )
}

function RecommendationView({
  viewModel,
  kickerLabel = 'Recommended move',
  action,
}: {
  viewModel: RecommendationCardViewModel
  kickerLabel?: string
  action?: ReactNode
}) {
  return (
    <div style={recommendationBox}>
      <p style={{ ...kicker, color: DECK_GOLD }}>{kickerLabel}</p>
      <h3 style={{ ...panelHeading, marginTop: 5 }}>{viewModel.title}</h3>
      <div style={recommendationSection}>
        <p style={smallLabel}>Why this card</p>
        <p style={bodyText}>{viewModel.whyThisCard}</p>
      </div>
      <div style={recommendationMetaGrid}>
        <div style={miniPanel}>
          <p style={smallLabel}>Your vector</p>
          <p style={compactText}>{viewModel.vectorLabel}</p>
        </div>
        <div style={miniPanel}>
          <p style={smallLabel}>Where the work is</p>
          <p style={compactText}>{viewModel.blockerLabel}</p>
        </div>
      </div>
      <div style={recommendationSection}>
        <p style={smallLabel}>Do this now</p>
        <ol style={protocolList}>
          {viewModel.protocolSteps.map((step, index) => (
            <li key={`${viewModel.id}:step:${index}`}>{step}</li>
          ))}
        </ol>
      </div>
      <div style={traceBox}>
        <p style={smallLabel}>Leave this trace</p>
        <p style={compactText}>{viewModel.tracePrompt}</p>
      </div>
      <div style={saveTargetRow} aria-label="Future save targets">
        {viewModel.saveTargets.map((target) => (
          <button key={target.id} type="button" disabled={!target.enabled} style={disabledPill}>
            {target.label}
          </button>
        ))}
      </div>
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  )
}

function stateEquals(left: AlchemyState | null, right: AlchemyState): boolean {
  return !!left && left.channel === right.channel && left.altitude === right.altitude
}

function routeHandHeading(count: number): string {
  if (count === 1) return 'A card came forward.'
  return `${count} cards came forward.`
}

function buildBlockerContext(choice: BlockerChoice | null, detail: string): string {
  const trimmed = detail.trim()
  if (!choice) return trimmed
  if (!trimmed) return choice.blockerText
  return `${choice.blockerText} Detail: ${trimmed}`
}

const workButton: CSSProperties = {
  display: 'block',
  width: '100%',
  fontFamily: DECK_FONTS.display,
  fontWeight: 800,
  fontSize: 15,
  color: '#160b02',
  background: DECK_GOLD,
  padding: '13px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  boxShadow: `inset 0 1px 0 rgba(255,255,255,.28), 0 10px 24px -10px ${DECK_GOLD}`,
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  display: 'grid',
  placeItems: 'center',
  padding: 16,
  background: 'rgba(0,0,0,.74)',
}

const panel: CSSProperties = {
  width: 'min(520px, 94vw)',
  maxHeight: '88vh',
  overflowY: 'auto',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,.12)',
  background: '#0d0c0b',
  color: SURFACE_TOKENS.textPrimary,
  padding: 20,
  boxShadow: `0 30px 80px -30px rgba(0,0,0,.95), 0 0 26px -14px ${LIMINAL.frame}`,
}

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 18,
}

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SURFACE_TOKENS.textMuted,
  margin: 0,
}

const title: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontWeight: 800,
  fontSize: 22,
  color: '#fff',
  margin: '4px 0',
}

const subtle: CSSProperties = {
  fontFamily: DECK_FONTS.body,
  fontSize: 12.5,
  color: SURFACE_TOKENS.textSecondary,
  margin: 0,
}

const closeButton: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: SURFACE_TOKENS.textSecondary,
  cursor: 'pointer',
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const panelHeading: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontSize: 20,
  fontWeight: 800,
  color: '#fff',
  margin: 0,
  lineHeight: 1.18,
}

const bodyText: CSSProperties = {
  fontFamily: DECK_FONTS.body,
  fontSize: 14,
  color: SURFACE_TOKENS.textSecondary,
  lineHeight: 1.5,
  margin: '8px 0 0',
}

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 10,
  background: SURFACE_TOKENS.surfaceInset,
  color: SURFACE_TOKENS.textPrimary,
  fontFamily: DECK_FONTS.body,
  fontSize: 14,
  padding: '12px 13px',
  outline: 'none',
}

const optionGrid: CSSProperties = {
  display: 'grid',
  gap: 10,
}

const optionCard: CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: 5,
  textAlign: 'left',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 10,
  color: SURFACE_TOKENS.textPrimary,
  cursor: 'pointer',
  padding: '12px 13px',
}

const optionCardTitle: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontSize: 14,
  fontWeight: 800,
}

const optionCardBody: CSSProperties = {
  fontFamily: DECK_FONTS.body,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: SURFACE_TOKENS.textSecondary,
}

const teachingBox: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,.12)',
  background: SURFACE_TOKENS.surfaceCard,
  padding: 15,
}

const blockerSection: CSSProperties = {
  display: 'grid',
  gap: 9,
}

const actionRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}

const stackedActions: CSSProperties = {
  display: 'grid',
  gap: 10,
}

const primaryButton: CSSProperties = {
  border: 'none',
  borderRadius: 10,
  background: DECK_GOLD,
  color: '#160b02',
  cursor: 'pointer',
  fontFamily: DECK_FONTS.display,
  fontSize: 14,
  fontWeight: 800,
  padding: '12px 13px',
}

const secondaryButton: CSSProperties = {
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 10,
  background: SURFACE_TOKENS.surfaceInset,
  color: SURFACE_TOKENS.textPrimary,
  cursor: 'pointer',
  fontFamily: DECK_FONTS.display,
  fontSize: 14,
  fontWeight: 700,
  padding: '12px 13px',
}

const ghostButton: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: SURFACE_TOKENS.textSecondary,
  cursor: 'pointer',
  fontFamily: DECK_FONTS.body,
  fontSize: 13,
  padding: '8px 10px',
}

const recommendationBox: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,.12)',
  background: SURFACE_TOKENS.surfaceCard,
  padding: 15,
}

const recommendationGrid: CSSProperties = {
  display: 'grid',
  gap: 12,
}

const recommendationSection: CSSProperties = {
  display: 'grid',
  gap: 6,
  marginTop: 13,
}

const recommendationMetaGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 9,
  marginTop: 13,
}

const miniPanel: CSSProperties = {
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,.1)',
  background: SURFACE_TOKENS.surfaceInset,
  padding: 11,
}

const compactText: CSSProperties = {
  fontFamily: DECK_FONTS.body,
  fontSize: 13,
  lineHeight: 1.45,
  color: SURFACE_TOKENS.textPrimary,
  margin: '5px 0 0',
}

const protocolList: CSSProperties = {
  display: 'grid',
  gap: 7,
  paddingLeft: 18,
  margin: '6px 0 0',
  fontFamily: DECK_FONTS.body,
  fontSize: 13.5,
  lineHeight: 1.45,
  color: SURFACE_TOKENS.textPrimary,
}

const traceBox: CSSProperties = {
  borderRadius: 10,
  border: `1px solid color-mix(in srgb, ${DECK_GOLD} 45%, transparent)`,
  background: 'rgba(230, 184, 90, .1)',
  padding: 12,
  marginTop: 13,
}

const saveTargetRow: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 13,
}

const disabledPill: CSSProperties = {
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 999,
  background: 'rgba(255,255,255,.04)',
  color: SURFACE_TOKENS.textMuted,
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  padding: '7px 9px',
}

const smallLabel: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: SURFACE_TOKENS.textMuted,
  margin: '6px 0 0',
}

const errorText: CSSProperties = {
  fontFamily: DECK_FONTS.body,
  fontSize: 12.5,
  color: '#f0a0a0',
  margin: '14px 0 0',
}
