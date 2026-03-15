'use client'

import { promoteDraftToActive } from '@/app/admin/adventures/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PromoteDraftButton({ adventureId }: { adventureId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    try {
      await promoteDraftToActive(adventureId)
      router.refresh()
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      {loading ? 'Promoting…' : 'Promote to Active'}
    </button>
  )
}
