'use client'

import { useState } from 'react'
import { IntentionUpdateModal } from './IntentionUpdateModal'

interface IntentionDisplayProps {
  intention: string
  campaignDomainPreference?: string[]
}

export function IntentionDisplay({ intention, campaignDomainPreference = [] }: IntentionDisplayProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="w-full px-4 py-3 bg-emerald-900/15 border border-emerald-900/40 rounded-lg flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">My Intention</div>
          <p className="text-emerald-100/90 text-sm italic leading-relaxed">{intention}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="shrink-0 text-[10px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Edit
        </button>
      </div>
      <IntentionUpdateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentIntention={intention}
        campaignDomainPreference={campaignDomainPreference}
      />
    </>
  )
}
