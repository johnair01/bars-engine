'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveMythRead } from '@/actions/myths-read'
import {
  MYTHS,
  MYTH_CHARGE_FLAVORS,
  MYTH_CHARGE_INTENSITIES,
  MYTH_GAME_FACES,
  MYTH_READ_ITEMS,
  MYTH_SCALE,
  scoreMyths,
  type MythChargeFlavorKey,
  type MythChargeIntensity,
  type MythGameFaceKey,
  type MythId,
  type MythReadAnswerValue,
  type MythReadItem,
  type RankedMyth,
} from '@/lib/mastering-allyship/myths-read'
import styles from './MythsReadClient.module.css'

type Phase = 'intro' | 'quiz' | 'result'

export function MythsReadClient() {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const [isMetabolizing, startMetabolizing] = useTransition()
  const [phase, setPhase] = useState<Phase>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<Record<MythReadItem['id'], MythReadAnswerValue>>>({})
  const [flipped, setFlipped] = useState<Partial<Record<MythId, boolean>>>({})
  const [chargeMythId, setChargeMythId] = useState<MythId | null>(null)
  const [chargeFlavor, setChargeFlavor] = useState<MythChargeFlavorKey | null>(null)
  const [chargeIntensity, setChargeIntensity] = useState<MythChargeIntensity | null>(null)
  const [gameFace, setGameFace] = useState<MythGameFaceKey | null>(null)
  const [email, setEmail] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailError, setEmailError] = useState('')

  const outcome = useMemo(() => scoreMyths(answers), [answers])
  const activeChargeMythId = chargeMythId ?? outcome.surfaced[0]?.myth.id ?? 'M8'
  const activeChargeMyth = outcome.scores[activeChargeMythId]?.myth ?? outcome.surfaced[0]?.myth
  const selectedFlavor = MYTH_CHARGE_FLAVORS.find((flavor) => flavor.key === chargeFlavor) ?? null
  const selectedIntensity = MYTH_CHARGE_INTENSITIES.find((item) => item.value === chargeIntensity) ?? null
  const selectedGame = MYTH_GAME_FACES.find((game) => game.key === gameFace) ?? null

  function chooseAnswer(value: MythReadAnswerValue) {
    const item = MYTH_READ_ITEMS[step]
    setAnswers((current) => ({ ...current, [item.id]: value }))

    window.setTimeout(() => {
      if (step >= MYTH_READ_ITEMS.length - 1) {
        setPhase('result')
      } else {
        setStep((current) => Math.min(current + 1, MYTH_READ_ITEMS.length - 1))
      }
    }, 190)
  }

  function reset() {
    setPhase('intro')
    setStep(0)
    setAnswers({})
    setFlipped({})
    setChargeMythId(null)
    setChargeFlavor(null)
    setChargeIntensity(null)
    setGameFace(null)
    setEmail('')
    setEmailSaved(false)
    setEmailError('')
  }

  function saveEmail() {
    if (!email.includes('@')) {
      setEmailError('Use an email with @ so this read can find you again.')
      return
    }
    setEmailError('')
    startSaving(async () => {
      const result = await saveMythRead({
        answers,
        email,
        consent: true,
        source: 'mastering-allyship-ch0-save',
        capturedCharge:
          chargeFlavor && chargeIntensity
            ? { mythId: activeChargeMythId, flavor: chargeFlavor, intensity: chargeIntensity, gameFace }
            : null,
        gameFace,
      })

      if (!result.ok) {
        setEmailError(result.error)
        return
      }

      setEmailSaved(true)
    })
  }

  function metabolizeCharge() {
    if (!chargeFlavor || !chargeIntensity || !gameFace) return
    startMetabolizing(async () => {
      const result = await saveMythRead({
        answers,
        email: email || undefined,
        consent: Boolean(email),
        source: 'mastering-allyship-ch0-metabolize',
        capturedCharge: {
          mythId: activeChargeMythId,
          flavor: chargeFlavor,
          intensity: chargeIntensity,
          gameFace,
        },
        gameFace,
        createSeedBar: true,
      })

      if (!result.ok) {
        setEmailError(result.error)
        return
      }

      router.push(result.redirectTo)
    })
  }

  return (
    <main className={styles.shell}>
      <section className={styles.phone} aria-label="Myths Read diagnostic">
        {phase === 'intro' && (
          <div className={`${styles.screen} ${styles.introScreen}`}>
            <Wordmark />
            <div className={styles.introCopy}>
              <h1>You&apos;re playing at least a few of these.</h1>
              <p>
                This does not flatter you. It reads the moves you actually make under pressure,
                then shows which allyship myths are alive right now.
              </p>
            </div>

            <div className={styles.specList} aria-label="Quiz specs">
              <SpecRow mark="12" title="Behavioral prompts" body="Short, direct, first-person." />
              <SpecRow mark="5" title="Frequency scale" body="Never through almost always." />
              <SpecRow mark="♦" title="One first BAR" body="A charge you can metabolize into play." />
            </div>

            <button type="button" className={styles.goldButton} onClick={() => setPhase('quiz')}>
              Read my myths →
            </button>
            <p className={styles.finePrint}>Honest beats fast. The result is a map, not a verdict.</p>
          </div>
        )}

        {phase === 'quiz' && (
          <QuestionScreen
            step={step}
            answers={answers}
            onAnswer={chooseAnswer}
            onBack={() => setStep((current) => Math.max(0, current - 1))}
          />
        )}

        {phase === 'result' && (
          <div className={`${styles.screen} ${styles.resultScreen}`}>
            <header className={styles.resultHeader}>
              <p className={styles.goldKicker}>YOUR READ · {outcome.surfaced.length} MYTHS SURFACED</p>
              <h1>These are the myths you&apos;re playing.</h1>
              <p>
                A myth is a false claim, not a verdict. It names where your strategy has gone
                stale so the book and the deck can give you a move.
              </p>
            </header>

            <div className={styles.mythStack}>
              {outcome.surfaced.map((entry, index) => (
                <MythCard
                  key={entry.myth.id}
                  entry={entry}
                  rank={index + 1}
                  flipped={Boolean(flipped[entry.myth.id])}
                  active={activeChargeMythId === entry.myth.id}
                  onFlip={() =>
                    setFlipped((current) => ({
                      ...current,
                      [entry.myth.id]: !current[entry.myth.id],
                    }))
                  }
                  onWork={() => {
                    setChargeMythId(entry.myth.id)
                    setFlipped((current) => ({ ...current, [entry.myth.id]: true }))
                  }}
                />
              ))}
            </div>

            {activeChargeMyth && (
              <section className={styles.chargePanel}>
                <p className={styles.purpleKicker}>◇ EMOTIONAL ALCHEMY · METABOLIZE THE CHARGE</p>
                <h2>A myth is just a claim until you feel the charge under it.</h2>
                <p>
                  Pick the myth that feels most alive, name the flavor of the charge, then set its
                  intensity. Then choose the game you want to play with that energy.
                </p>

                <div className={styles.chargeBlock}>
                  <span className={styles.stepLabel}>Step 1 · myth</span>
                  <div className={styles.chipGrid}>
                    {outcome.surfaced.map((entry) => (
                      <button
                        key={entry.myth.id}
                        type="button"
                        className={`${styles.chip} ${
                          activeChargeMythId === entry.myth.id ? styles.chipSelected : ''
                        }`}
                        onClick={() => setChargeMythId(entry.myth.id)}
                      >
                        {entry.myth.short}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.chargeBlock}>
                  <span className={styles.stepLabel}>Step 2 · flavor</span>
                  <div className={styles.flavorList}>
                    {MYTH_CHARGE_FLAVORS.map((flavor) => (
                      <button
                        key={flavor.key}
                        type="button"
                        className={`${styles.flavorRow} ${
                          chargeFlavor === flavor.key ? styles.flavorSelected : ''
                        }`}
                        style={{ '--flavor-color': flavor.color } as CSSProperties}
                        onClick={() => setChargeFlavor(flavor.key)}
                      >
                        <span className={styles.flavorSigil}>{flavor.sigil}</span>
                        <span>
                          <strong>{flavor.label}</strong>
                          <small>{flavor.sub}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.chargeBlock}>
                  <span className={styles.stepLabel}>Step 3 · intensity</span>
                  <div className={styles.intensityGrid}>
                    {MYTH_CHARGE_INTENSITIES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`${styles.intensityChip} ${
                          chargeIntensity === item.value ? styles.chipSelected : ''
                        }`}
                        onClick={() => setChargeIntensity(item.value)}
                      >
                        {item.label}
                        <span>{item.value}</span>
                      </button>
                    ))}
                  </div>
                  <p className={styles.readout}>
                    {selectedIntensity?.readout ?? 'Pick the closest strength. You can change it later.'}
                  </p>
                </div>

                <div className={styles.chargeBlock}>
                  <span className={styles.stepLabel}>Step 4 · choose the game</span>
                  <div className={styles.gameGrid}>
                    {MYTH_GAME_FACES.map((game) => (
                      <button
                        key={game.key}
                        type="button"
                        className={`${styles.gameCard} ${gameFace === game.key ? styles.gameSelected : ''}`}
                        onClick={() => setGameFace(game.key)}
                      >
                        <span>{game.face}</span>
                        <strong>{game.gameName}</strong>
                        <small>{game.prompt}</small>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedFlavor && selectedIntensity && selectedGame ? (
                  <div className={styles.seededBar}>
                    <p>♦ YOUR FIRST CAMPAIGN SEED</p>
                    <strong>
                      &quot;{activeChargeMyth.short}&quot;, held as {selectedFlavor.label.toLowerCase()}{' '}
                      at {selectedIntensity.label.toLowerCase()} strength. You chose{' '}
                      {selectedGame.gameName}: {selectedGame.nextStep}
                    </strong>
                    <button
                      type="button"
                      className={styles.purpleButton}
                      onClick={metabolizeCharge}
                      disabled={isMetabolizing}
                    >
                      {isMetabolizing ? 'Seeding…' : 'Seed this campaign →'}
                    </button>
                    <span>
                      Your emotion is the fuel. The game you chose is the vector.
                    </span>
                  </div>
                ) : (
                  <p className={styles.seedPrompt}>
                    Choose a flavor, intensity, and game to seed the campaign.
                  </p>
                )}
              </section>
            )}

            <WholeBoard surfacedIds={outcome.surfaced.map((entry) => entry.myth.id)} />
            <FunnelCtas count={outcome.surfaced.length} />

            <section className={styles.emailPanel}>
              {emailSaved ? (
                <div className={styles.emailSaved}>
                  <span>♦</span>
                  <p>Your read is saved. The myth, charge, and chosen game can travel with you.</p>
                </div>
              ) : (
                <>
                  <h2>Save your read</h2>
                  <div className={styles.emailRow}>
                    <input
                      value={email}
                      type="email"
                      placeholder="you@example.com"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                    <button type="button" onClick={saveEmail} disabled={isSaving}>
                      {isSaving ? 'Saving' : 'Save'}
                    </button>
                  </div>
                  {emailError && <p className={styles.emailError}>{emailError}</p>}
                </>
              )}
            </section>

            <button type="button" className={styles.retake} onClick={reset}>
              ↺ Retake the read
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

function QuestionScreen({
  step,
  answers,
  onAnswer,
  onBack,
}: {
  step: number
  answers: Partial<Record<MythReadItem['id'], MythReadAnswerValue>>
  onAnswer: (value: MythReadAnswerValue) => void
  onBack: () => void
}) {
  const item = MYTH_READ_ITEMS[step]
  const selected = answers[item.id]

  return (
    <div className={`${styles.screen} ${styles.questionScreen}`} key={`q${step}`}>
      <header className={styles.progressHeader}>
        <div>
          <span>{String(step + 1).padStart(2, '0')} / 12</span>
          <span>honest, not fast</span>
        </div>
        <div className={styles.pips} aria-hidden="true">
          {MYTH_READ_ITEMS.map((quizItem, index) => (
            <span
              key={quizItem.id}
              className={
                answers[quizItem.id] != null
                  ? styles.pipAnswered
                  : index === step
                    ? styles.pipCurrent
                    : ''
              }
            />
          ))}
        </div>
      </header>

      <section className={styles.questionBody}>
        <p className={styles.kicker}>HOW OFTEN IS THIS TRUE OF YOU?</p>
        <h1>{item.text}</h1>
      </section>

      <section className={styles.scaleWrap} aria-label="Frequency scale">
        <div className={styles.scale}>
          {MYTH_SCALE.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.scaleButton} ${selected === option.value ? styles.scaleSelected : ''}`}
              onClick={() => onAnswer(option.value)}
            >
              <span
                className={styles.scaleDot}
                style={{ width: 12 + option.value * 5, height: 12 + option.value * 5 }}
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.endLabels}>
          <span>Never</span>
          <span>Almost always</span>
        </div>
      </section>

      <footer className={styles.questionFooter}>
        {step > 0 ? (
          <button type="button" onClick={onBack}>
            ← Back
          </button>
        ) : (
          <span />
        )}
        <span>tap to answer</span>
      </footer>
    </div>
  )
}

function MythCard({
  entry,
  rank,
  flipped,
  active,
  onFlip,
  onWork,
}: {
  entry: RankedMyth
  rank: number
  flipped: boolean
  active: boolean
  onFlip: () => void
  onWork: () => void
}) {
  const pct = Math.round(entry.pct * 100)

  return (
    <article className={`${styles.mythCard} ${flipped ? styles.mythReveal : ''}`}>
      <button type="button" className={styles.cardTapLayer} onClick={onFlip}>
        <span className="sr-only">Toggle {entry.myth.claim}</span>
      </button>
      {!flipped ? (
        <div className={styles.cardFace}>
          <div className={styles.cardMeta}>
            <span>MYTH · RANK {rank}</span>
            <span className={styles.strength}>
              {entry.strength}
              <i>
                <b style={{ width: `${pct}%` }} />
              </i>
            </span>
          </div>
          <h2>&quot;{entry.myth.claim}&quot;</h2>
          <p>Tap to turn it over ↻</p>
        </div>
      ) : (
        <div className={styles.cardBack}>
          <div>
            <span>The diagnosis</span>
            <p>{entry.myth.diagnosis}</p>
          </div>
          <div>
            <span>
              Where the book solves it · {entry.myth.chapter}
            </span>
            <p>{entry.myth.destination}</p>
          </div>
          <div>
            <span>One move now</span>
            <p>{entry.myth.move}</p>
          </div>
          <button type="button" className={styles.workButton} onClick={onWork}>
            {active ? '✓ Working this one' : "This one's alive — work it ↓"}
          </button>
        </div>
      )}
    </article>
  )
}

function WholeBoard({ surfacedIds }: { surfacedIds: MythId[] }) {
  return (
    <section className={styles.boardPanel}>
      <p className={styles.goldKicker}>THE WHOLE BOARD · {surfacedIds.length} LIT FOR YOU</p>
      <ol>
        {MYTHS.map((myth) => {
          const lit = surfacedIds.includes(myth.id)
          return (
            <li key={myth.id} className={lit ? styles.boardLit : ''}>
              <span aria-hidden="true" />
              <p>{myth.claim}</p>
              <small>{myth.chapter}</small>
            </li>
          )
        })}
      </ol>
      <p>Unlit myths aren&apos;t absent — just quiet today.</p>
    </section>
  )
}

function FunnelCtas({ count }: { count: number }) {
  return (
    <section className={styles.funnel}>
      <div className={styles.deckCta}>
        <p className={styles.goldKicker}>{count} ALIVE FOR YOU · WHERE THEY GET WORKED</p>
        <h2>The deck turns this read into practice.</h2>
        <p>Draw a move, make it concrete, and let the charge become something you can play.</p>
        <Link className={styles.goldButton} href="/deck/sales">
          Get the Allyship Deck →
        </Link>
      </div>
      <Link className={styles.companionCta} href="/superpower">
        <span>✦</span>
        <strong>Now see how you ally →</strong>
        <small>Discover your Allyship Superpower</small>
      </Link>
      <Link className={styles.bookLink} href="/mastering-allyship/hub">
        Or read the manual — the book
      </Link>
    </section>
  )
}

function Wordmark() {
  return (
    <div className={styles.wordmark}>
      <span className={styles.trigram} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>MYTHS READ</span>
    </div>
  )
}

function SpecRow({ mark, title, body }: { mark: string; title: string; body: string }) {
  return (
    <div className={styles.specRow}>
      <span>{mark}</span>
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  )
}
