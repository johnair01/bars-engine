/**
 * Zo AI Provider — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001
 *
 * Uses the Zo /zo/ask internal API for BAR content generation.
 * Requires ZO_CLIENT_IDENTITY_TOKEN and ZO_AI_API_KEY env vars.
 */

import type { AICompletionRequest, AICompletionResponse } from '../dispatcher'
import { dispatchAI } from '../dispatcher'

const ZO_API_URL = 'https://api.zo.computer/zo/ask'

/**
 * Call the Zo /zo/ask internal API.
 * Falls back to external AI if ZO_AI_API_KEY is not set.
 */
export async function callZoAI(req: AICompletionRequest): Promise<AICompletionResponse> {
  const apiKey = process.env.ZO_AI_API_KEY

  if (!apiKey) {
    throw new Error(
      'ZO_AI_API_KEY is not set. ' +
      'Set it in Settings > Advanced > Secrets to enable the Zo AI provider.'
    )
  }

  const body: Record<string, unknown> = {
    input: req.input,
    model_name: 'vercel:minimax/minimax-m2.7',
  }

  if (req.system) body.system = req.system
  if (req.maxTokens) body.maxTokens = req.maxTokens
  if (req.temperature) body.temperature = req.temperature

  const response = await fetch(ZO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Zo AI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { output: string; tokens_used?: number }
  return {
    output: data.output ?? '',
    provider: 'zo',
    tokensUsed: data.tokens_used,
  }
}

export { dispatchAI }
