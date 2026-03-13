'use client'

import { useState } from 'react'

interface Props {
  error: string
  component: string
  className?: string
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export function ReportIssueButton({ error, component, className }: Props) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success'>('idle')
  const [issueUrl, setIssueUrl] = useState<string | null>(null)
  const [issueNumber, setIssueNumber] = useState<number>(0)

  async function handleReport() {
    setStatus('pending')
    try {
      const res = await fetch(`${backendUrl}/api/agents/report-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component,
          error_message: error,
          page_url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'Failed to submit')
      setIssueUrl(data.output.url)
      setIssueNumber(data.output.number)
      setStatus('success')
    } catch (e) {
      console.error('[ReportIssueButton]', e)
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <span className={`text-xs text-emerald-400 ${className ?? ''}`}>
        Issue reported.{' '}
        {issueUrl && (
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-emerald-300"
          >
            {issueNumber > 0 ? `#${issueNumber}` : 'Open pre-filled issue'}
          </a>
        )}
      </span>
    )
  }

  return (
    <button
      onClick={handleReport}
      disabled={status === 'pending'}
      className={`text-xs text-zinc-500 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      {status === 'pending' ? 'Reporting...' : 'Report Issue'}
    </button>
  )
}
