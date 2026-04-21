/**
 * External AI Providers — BAR Asset Pipeline
 * Sprint: sprint/bar-asset-pipeline-001 | Issue: #76
 *
 * Supports Anthropic (Claude) and OpenAI as fallback providers for
 * forked instances or users who want to use their own API keys.
 *
 * To configure:
 *   ANTHROPIC_API_KEY=sk-...     → uses Claude Sonnet
 *   OPENAI_API_KEY=sk-...        → uses GPT-4o mini
 *
 * Optional overrides:
 *   ANTHROPIC_MODEL=claude-3-5-sonnet
 *   OPENAI_MODEL=gpt-4o
 */




import type { AICompletionRequest, AICompletionResponse } from './index'

export async function callAnthropic(req: AICompletionRequest): Promise<AICompletionResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'assistant', content: req.system ?? '' },
    { role: 'user', content: req.input },
  ]

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: req.maxTokens ?? 1024,
    temperature: req.temperature ?? 0.7,
  }

  if (req.responseFormat?.type === 'json_schema') {
    body.response_format = { type: 'json_schema', json_schema: req.responseFormat.json_schema }
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Anthropic API error ${response.status}: ${text}`)
  }

  const data = await response.json() as { content?: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } }
  const text = data.content?.[0]?.text ?? ''
  const inTokens = data.usage?.input_tokens ?? 0
  const outTokens = data.usage?.output_tokens ?? 0

  return { output: text, tokensUsed: inTokens + outTokens, provider: 'anthropic' }
}

export async function callOpenAI(req: AICompletionRequest): Promise<AICompletionResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: req.system ?? '' },
    { role: 'user', content: req.input },
  ]

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: req.maxTokens ?? 1024,
    temperature: req.temperature ?? 0.7,
  }

  if (req.responseFormat?.type === 'json_schema') {
    body.response_format = { type: 'json_schema', json_schema: req.responseFormat.json_schema }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    throw new Error(`OpenAI API error ${response.status}: ${text}`)
  }

  const data = await response.json() as { choices?: Array<{ message: { content: string } }>; usage?: { total_tokens: number } }
  const text = data.choices?.[0]?.message?.content ?? ''
  const tokens = data.usage?.total_tokens ?? 0

  return { output: text, tokensUsed: tokens, provider: 'openai' }
}