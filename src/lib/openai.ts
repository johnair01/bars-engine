/**
 * Centralized OpenAI provider with API key validation.
 * Ensures OPENAI_API_KEY is set before any AI call; throws a clear error when missing.
 */
import { createOpenAI } from '@ai-sdk/openai'

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.trim() === '') {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to .env.local (local) or Vercel Environment Variables (deploy). See docs/ENV_AND_VERCEL.md'
    )
  }
  return key
}

/**
 * Returns an OpenAI provider instance with validated API key.
 * Use: getOpenAI()('gpt-4o') for model access.
 */
export function getOpenAI() {
  return createOpenAI({ apiKey: getApiKey() })
}
