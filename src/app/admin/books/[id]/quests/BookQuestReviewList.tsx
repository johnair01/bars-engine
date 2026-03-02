'use client'

import { approveQuest, rejectQuest, approveAllQuests, updateBookQuest, moveApprovedToDraft, createThreadFromQuest } from '@/actions/book-quest-review'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
const ALLYSHIP_DOMAINS = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'] as const
const GAME_MASTER_FACES = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const

type Quest = {
  id: string
  title: string
  description: string | null
  moveType: string | null
  allyshipDomain: string | null
  reward?: number
  gameMasterFace?: string | null
}

export function BookQuestReviewList({
  bookId,
  draftQuests,
  approvedQuests,
}: {
  bookId: string
  draftQuests: Quest[]
  approvedQuests: Quest[]
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Quest>>({})
  const [actionResult, setActionResult] = useState<string | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)
  const [movingToDraft, setMovingToDraft] = useState(false)
  const [upgradingId, setUpgradingId] = useState<string | null>(null)
  const [createdThreadId, setCreatedThreadId] = useState<string | null>(null)

  const handleApprove = async (questId: string) => {
    setActionResult(null)
    const result = await approveQuest(questId)
    if (result.error) setActionResult(result.error)
    else router.refresh()
  }

  const handleReject = async (questId: string) => {
    setActionResult(null)
    const result = await rejectQuest(questId)
    if (result.error) setActionResult(result.error)
    else router.refresh()
  }

  const handleMoveToDraft = async () => {
    setMovingToDraft(true)
    setActionResult(null)
    const result = await moveApprovedToDraft(bookId)
    setMovingToDraft(false)
    if (result.error) setActionResult(result.error)
    else {
      setActionResult(`Moved ${result.count} quests to draft for review`)
      router.refresh()
    }
  }

  const handleApproveAll = async () => {
    setApprovingAll(true)
    setActionResult(null)
    const result = await approveAllQuests(bookId)
    setApprovingAll(false)
    if (result.error) setActionResult(result.error)
    else {
      setActionResult(`Approved ${result.count} quests`)
      router.refresh()
    }
  }

  const startEdit = (quest: Quest) => {
    setEditingId(quest.id)
    setEditForm({
      title: quest.title,
      description: quest.description ?? '',
      moveType: quest.moveType ?? 'growUp',
      allyshipDomain: quest.allyshipDomain,
      reward: quest.reward ?? 1,
      gameMasterFace: quest.gameMasterFace ?? null,
    })
  }

  const handleUpgradeToThread = async (questId: string) => {
    setUpgradingId(questId)
    setActionResult(null)
    setCreatedThreadId(null)
    const result = await createThreadFromQuest(questId)
    setUpgradingId(null)
    if (result.error) setActionResult(result.error)
    else {
      setActionResult('Thread created.')
      if (result.threadId) setCreatedThreadId(result.threadId)
      router.refresh()
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async () => {
    if (!editingId) return
    setActionResult(null)
    const result = await updateBookQuest(editingId, {
      title: editForm.title,
      description: editForm.description ?? undefined,
      moveType: (editForm.moveType as (typeof MOVE_TYPES)[number]) ?? 'growUp',
      allyshipDomain: editForm.allyshipDomain
        ? (editForm.allyshipDomain as (typeof ALLYSHIP_DOMAINS)[number])
        : null,
      reward: editForm.reward !== undefined ? editForm.reward : undefined,
      gameMasterFace: editForm.gameMasterFace !== undefined
        ? (editForm.gameMasterFace as (typeof GAME_MASTER_FACES)[number] | null)
        : undefined,
    })
    if (result.error) setActionResult(result.error)
    else {
      setEditingId(null)
      setEditForm({})
      router.refresh()
    }
  }

  const moveLabels: Record<string, string> = {
    wakeUp: 'Wake Up',
    cleanUp: 'Clean Up',
    growUp: 'Grow Up',
    showUp: 'Show Up',
  }

  const domainLabels: Record<string, string> = {
    GATHERING_RESOURCES: 'Gathering Resources',
    DIRECT_ACTION: 'Direct Action',
    RAISE_AWARENESS: 'Raise Awareness',
    SKILLFUL_ORGANIZING: 'Skillful Organizing',
  }

  const faceLabels: Record<string, string> = {
    shaman: 'Shaman',
    challenger: 'Challenger',
    regent: 'Regent',
    architect: 'Architect',
    diplomat: 'Diplomat',
    sage: 'Sage',
  }

  if (draftQuests.length === 0 && approvedQuests.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
        <p className="text-zinc-400">
          No draft quests. {approvedQuests.length > 0 ? 'All quests are approved. You can publish from the Books list.' : 'Run Trigger Analysis first.'}
        </p>
        {approvedQuests.length > 0 && (
          <div>
            <p className="text-sm text-zinc-500 mb-2">
              Quest created before the review feature were auto-approved. Move them to draft to review and edit.
            </p>
            <button
              onClick={handleMoveToDraft}
              disabled={movingToDraft}
              className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {movingToDraft ? 'Moving...' : `Move ${approvedQuests.length} to draft`}
            </button>
          </div>
        )}
        {actionResult && (
          <p className={`text-sm ${actionResult.includes('Moved') ? 'text-green-400' : 'text-red-400'}`}>
            {actionResult}
          </p>
        )}
        {approvedQuests.length > 0 && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Approved quests ({approvedQuests.length})</h3>
            <div className="space-y-2">
              {approvedQuests.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-4 py-2 px-3 bg-zinc-800/50 rounded">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-white">{q.title}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{moveLabels[q.moveType ?? 'growUp']}</span>
                      {q.allyshipDomain && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{domainLabels[q.allyshipDomain]}</span>}
                      <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{q.reward ?? 1} vibeulon{(q.reward ?? 1) !== 1 ? 's' : ''}</span>
                      {q.gameMasterFace && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{faceLabels[q.gameMasterFace]}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgradeToThread(q.id)}
                    disabled={upgradingId === q.id}
                    className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded shrink-0 disabled:opacity-50"
                  >
                    {upgradingId === q.id ? 'Creating...' : 'Upgrade to thread'}
                  </button>
                </div>
              ))}
            </div>
            {actionResult && actionResult.includes('Thread created') && (
              <p className="text-sm text-green-400 mt-2">
                {actionResult}
                {createdThreadId && (
                  <Link href={`/admin/journeys/thread/${createdThreadId}`} className="ml-2 underline hover:no-underline">
                    View thread
                  </Link>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{draftQuests.length} draft quests to review</p>
        <button
          onClick={handleApproveAll}
          disabled={approvingAll}
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition disabled:opacity-50"
        >
          {approvingAll ? 'Approving...' : 'Approve all'}
        </button>
      </div>

      {actionResult && (
        <p className={`text-sm ${actionResult.startsWith('Approved') ? 'text-green-400' : 'text-red-400'}`}>
          {actionResult}
        </p>
      )}

      <div className="space-y-3">
        {draftQuests.map((quest) => (
          <div
            key={quest.id}
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4"
          >
            {editingId === quest.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.title ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  placeholder="Title"
                />
                <textarea
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm min-h-[80px]"
                  placeholder="Description"
                />
                <div className="flex flex-wrap gap-4 items-center">
                  <select
                    value={editForm.moveType ?? 'growUp'}
                    onChange={(e) => setEditForm((f) => ({ ...f, moveType: e.target.value }))}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  >
                    {MOVE_TYPES.map((m) => (
                      <option key={m} value={m}>{moveLabels[m]}</option>
                    ))}
                  </select>
                  <select
                    value={editForm.allyshipDomain ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, allyshipDomain: e.target.value || null }))}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  >
                    <option value="">—</option>
                    {ALLYSHIP_DOMAINS.map((d) => (
                      <option key={d} value={d}>{domainLabels[d]}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    Vibeulons:
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={editForm.reward ?? 1}
                      onChange={(e) => setEditForm((f) => ({ ...f, reward: parseInt(e.target.value, 10) || 1 }))}
                      className="w-16 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    />
                  </label>
                  {(editForm.moveType ?? 'growUp') === 'growUp' && (
                    <select
                      value={editForm.gameMasterFace ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, gameMasterFace: e.target.value || null }))}
                      className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    >
                      <option value="">— Face —</option>
                      {GAME_MASTER_FACES.map((f) => (
                        <option key={f} value={f}>{faceLabels[f]}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-white">{quest.title}</h3>
                    {quest.description && (
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{quest.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                        {moveLabels[quest.moveType ?? 'growUp']}
                      </span>
                      {quest.allyshipDomain && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                          {domainLabels[quest.allyshipDomain]}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                        {quest.reward ?? 1} vibeulon{(quest.reward ?? 1) !== 1 ? 's' : ''}
                      </span>
                      {quest.gameMasterFace && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                          {faceLabels[quest.gameMasterFace]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(quest)}
                      className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleApprove(quest.id)}
                      className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(quest.id)}
                      className="px-3 py-1.5 text-sm bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {approvedQuests.length > 0 && (
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Approved quests ({approvedQuests.length})</h3>
          <div className="space-y-2">
            {approvedQuests.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-4 py-2 px-3 bg-zinc-800/50 rounded">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-white">{q.title}</span>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{moveLabels[q.moveType ?? 'growUp']}</span>
                    {q.allyshipDomain && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{domainLabels[q.allyshipDomain]}</span>}
                    <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{q.reward ?? 1} vibeulon{(q.reward ?? 1) !== 1 ? 's' : ''}</span>
                    {q.gameMasterFace && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{faceLabels[q.gameMasterFace]}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleUpgradeToThread(q.id)}
                  disabled={upgradingId === q.id}
                  className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded shrink-0 disabled:opacity-50"
                >
                  {upgradingId === q.id ? 'Creating...' : 'Upgrade to thread'}
                </button>
              </div>
            ))}
          </div>
          {actionResult && actionResult.includes('Thread created') && (
            <p className="text-sm text-green-400 mt-2">
              {actionResult}
              {createdThreadId && (
                <Link href={`/admin/journeys/thread/${createdThreadId}`} className="ml-2 underline hover:no-underline">
                  View thread
                </Link>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
