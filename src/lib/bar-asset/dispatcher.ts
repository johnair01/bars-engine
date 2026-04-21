/**
 * AI Dispatcher — routes completion requests to the appropriate provider
 * Sprint: sprint/bar-asset-pipeline-002 | Issue: #76
 */

import type { AICompletionRequest, AICompletionResponse } from './providers'
import { resolveProviderFromEnv } from './providers'
import { callZoAI } from './providers/zo'
import { callAnthropic, callOpenAI } from './providers/external'

/**
 * Dispatch an AI completion request to the appropriate provider.
 * Provider is resolved from environment variables (ZO_AI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY).
 */
export async function dispatchAI(req: AICompletionRequest): Promise<AICompletionResponse> {
  const provider = resolveProviderFromEnv()
  switch (provider) {
    case 'zo':
      return callZoAI(req)
    case 'anthropic':
      return callAnthropic(req)
    case 'openai':
      return callOpenAI(req)
  }
}