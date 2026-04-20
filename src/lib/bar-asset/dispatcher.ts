/**
 * AI Dispatcher — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Routes NL completion requests to the configured provider.
 * Providers are resolved in priority order: zo → anthropic → openai.
 */

import type { AICompletionRequest, AICompletionResponse } from './providers'
import { resolveProviderFromEnv } from './providers'
import { callZoAI } from './providers/zo'
import { callAnthropic, callOpenAI } from './providers/external'

/**
 * Send a NL completion request to the active AI provider.
 * Throws if no provider is configured.
 */
export async function dispatchAI(req: AICompletionRequest): Promise<AICompletionResponse> {
  const config = resolveProviderFromEnv()

  switch (config.provider) {
    case 'zo':
      return callZoAI(req)
    case 'anthropic':
      return callAnthropic(req)
    case 'openai':
      return callOpenAI(req)
  }
}