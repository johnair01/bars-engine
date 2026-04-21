/**
 * AI Provider index — shared types and re-exports
 * Sprint: sprint/bar-asset-pipeline-001
 */

export interface AICompletionRequest {
  system?: string
  input: string
  maxTokens?: number
  temperature?: number
  responseFormat?: {
    type: 'json_schema'
    json_schema?: { name: string; strict?: boolean; schema?: unknown }
  }
}

export interface AICompletionResponse {
  output: string
  tokensUsed?: number
  provider: string
}

export { callAnthropic } from './external'
export { callOpenAI } from './external'
export { callZoAI } from './zo'

export type ProviderType = 'zo' | 'anthropic' | 'openai' | null

export interface ProviderConfig {
  provider: ProviderType
  apiKey?: string
}

export function resolveProviderFromEnv(): ProviderConfig {
  const zoKey = process.env.ZO_AI_API_KEY ?? process.env.ZO_CLIENT_IDENTITY_TOKEN
  if (zoKey) return { provider: 'zo', apiKey: zoKey }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) return { provider: 'anthropic', apiKey: anthropicKey }

  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) return { provider: 'openai', apiKey: openaiKey }

  return { provider: null }
}
