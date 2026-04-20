/**
 * Zo AI Provider — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Uses the /zo/ask internal API. This is the primary provider for
 * Wendell's instance. Requires one of:
 *   - ZO_CLIENT_IDENTITY_TOKEN (auto-set in Zo Computer environment — preferred)
 *   - ZO_AI_API_KEY (explicit key from Settings > Advanced > Access Tokens)
 *
 * Model: vercel:minimax/minimax-m2.7
 * Cost: free for Wendell, no per-token billing
 * Persona: Council of Game Faces (d02a9e8c-ecf3-48bd-a4b6-a21f659b099c)
 */

import type { AICompletionRequest, AICompletionResponse } from './providers'

/**
 * Call the Zo AI agent via the /zo/ask internal API.
 *
 * Required env vars:
 *   ZO_AI_API_KEY — your Zo access token (Settings > Advanced > Access Tokens)
 *
 * The API endpoint is typically:
 *   https://api.zo.computer/zo/ask
 * But in the bars-engine Next.js app (deployed on Vercel), we need to use
 * the external endpoint since we don't have access to the internal sandbox
 * loopback from a deployed server.
 *
 * For local dev, you can also call http://localhost:3000/api/zo/ask if you
 * have the Zo dev server running.
 */
export async function callZoAI(req: AICompletionRequest): Promise<AICompletionResponse> {
  // Prefer ZO_AI_API_KEY if set; fall back to ZO_CLIENT_IDENTITY_TOKEN (auto-set in Zo)
  const apiKey = process.env.ZO_AI_API_KEY ?? process.env.ZO_CLIENT_IDENTITY_TOKEN
  if (!apiKey) {
    throw new Error('No Zo API key set. Set ZO_AI_API_KEY or ZO_CLIENT_IDENTITY_TOKEN.')
  }

  // Determine the endpoint: local dev vs deployed
  const baseUrl = process.env.ZO_AI_API_URL ?? 'https://api.zo.computer'
  const url = `${baseUrl}/zo/ask`

  // Build the request body per the /zo/ask API contract
  const body: Record<string, unknown> = {
    input: req.input,
    model_name: process.env.ZO_AI_MODEL ?? 'vercel:minimax/minimax-m2.7',
  }

  // If structured output is requested, add output_format
  if (req.responseFormat?.type === 'json_schema') {
    body.output_format = req.responseFormat.json_schema.schema
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Zo AI API error ${response.status}: ${text}`)
  }

  const data = await response.json() as { output?: string; tokens_used?: number }

  return {
    output: typeof data.output === 'string' ? data.output : JSON.stringify(data.output ?? ''),
    tokensUsed: data.tokens_used,
    provider: 'zo',
  }
}