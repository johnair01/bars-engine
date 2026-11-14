/**
 * The verdict on a prediction. Closed at three, so the capability index can group by it.
 *
 * `prediction` stays free text: the player's own sentence survives verbatim. Only the verdict
 * is enumerated. `redefined` is the honest third position — the disproof did not happen as
 * written, but the player reframed what would count. What it means for the index is a canon
 * question and is not decided here.
 */
export const PREDICTION_OUTCOMES = ['met', 'missed', 'redefined'] as const

export type PredictionOutcome = (typeof PREDICTION_OUTCOMES)[number]

export const PREDICTION_OUTCOME_LABELS: Record<PredictionOutcome, string> = {
  met: 'It held',
  missed: 'It did not hold',
  redefined: 'It moved',
}

/** One refusal string, so every surface says the same sentence. */
export const PREDICTION_OUTCOME_REFUSAL =
  'Say whether the prediction held. Three answers: it held, it did not hold, or it moved.'

export function isPredictionOutcome(value: unknown): value is PredictionOutcome {
  return typeof value === 'string' && (PREDICTION_OUTCOMES as readonly string[]).includes(value)
}
