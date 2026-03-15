'use client'

import { generateFromTemplateAction } from './actions'
import { useState } from 'react'

export function GenerateTemplateButton({
  templateId,
  templateName,
}: {
  templateId: string
  templateName: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await generateFromTemplateAction(templateId)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      {loading ? 'Generating…' : 'Generate'}
    </button>
  )
}
