/**
 * AI Provider Abstraction — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Single interface for NL generation with two backends:
 *   - Zo AI (primary): uses the /zo/ask internal API
 *   - External AI (fork/instances): Anthropic (Claude), OpenAI (GPT)
 *
 * The provider is selected via env var at runtime.
 */

export type AIProvider = 'zo' | 'anthropic' | 'openai'

export interface AICompletionRequest {
  /** System prompt — sets the role and constraints */
  system: string
  /** User prompt — the actual task */
  input: string
  /** Max tokens to generate */
  maxTokens?: number
  /** Temperature 0-1 */
  temperature?: number
  /** Structured output schema (optional) */
  responseFormat?: {
    type: 'json_schema'
    json_schema: {
      name: string
      schema: Record<string, unknown>
    }
  }
}

export interface AICompletionResponse {
  /** The generated text */
  output: string
  /** Tokens consumed (estimated) */
  tokensUsed?: number
  /** Which provider answered */
  provider: AIProvider
}

export interface AIProviderConfig {
  provider: AIProvider
  /** For external providers only */
  apiKey?: string
  /** For external providers — which model to use */
  model?: string
}

/** Default model per external provider */
export const EXTERNAL_DEFAULT_MODEL: Record<Exclude<AIProvider, 'zo'>, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o-mini',
}

/**
 * Select provider from environment.
 * Priority: ZO_AI_API_KEY → ANTHROPIC_API_KEY → OPENAI_API_KEY
 * ZO_AI is primary (Wendell's own AI).
 */
export function resolveProviderFromEnv(): AIProviderConfig {
  if (process.env.ZO_AI_API_KEY || process.env.ZO_CLIENT_IDENTITY_TOKEN) {
    return { provider: 'zo' }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL ?? EXTERNAL_DEFAULT_MODEL.anthropic }
  }
  if (process.env.OPENAI_API_KEY) {
    return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL ?? EXTERNAL_DEFAULT_MODEL.openai }
  }
  throw new Error(
    'No AI provider configured. Set one of: ZO_AI_API_KEY, ZO_CLIENT_IDENTITY_TOKEN, ANTHROPIC_API_KEY, OPENAI_API_KEY'
  )
}