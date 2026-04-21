/**
 * AI Provider types — shared interface for all AI providers
 * Sprint: sprint/bar-asset-pipeline-002 | Issue: #76
 */

/** Request format for AI completion. */
export interface AICompletionRequest {
  /** The user-facing input prompt */
  input: string
  /** Optional system prompt override */
  system?: string
  /** Max tokens in response */
  maxTokens?: number
  /** Temperature 0-1 */
  temperature?: number
}

/** Response format from all AI providers. */
export interface AICompletionResponse {
  /** The generated text output */
  output: string
  /** Provider name for debugging */
  provider: string
  /** Token count if available */
  tokensUsed?: number | null
}

/**
 * Resolve which provider to use from environment.
 * Priority: zo → anthropic → openai
 */
export function resolveProviderFromEnv(): 'zo' | 'anthropic' | 'openai' {
  if (process.env.ZO_AI_API_KEY || process.env.ZO_CLIENT_IDENTITY_TOKEN) return 'zo'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'zo' // default, will fail at call time if no key
}