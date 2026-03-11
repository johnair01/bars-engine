'use client'

import { approveQuest, rejectQuest, approveAllQuests, updateBookQuest, moveApprovedToDraft, createThreadFromQuest } from '@/actions/book-quest-review'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MOVE_TYPES = ['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const
const ALLYSHIP_DOMAINS = ['GATHERING_RESOURCES', 'DIRECT_ACTION', 'RAISE_AWARENESS', 'SKILLFUL_ORGANIZING'] as const
const GAME_MASTER_FACES = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const
const NATIONS = ['Argyra', 'Pyrakanth', 'Lamenth', 'Meridia', 'Virelune'] as const
const ARCHETYPES = [
  'Bold Heart',
  'Danger Walker',
  'Truth Seer',
  'Still Point',
  'Subtle Influence',
  'Devoted Guardian',
  'Decisive Storm',
  'Joyful Connector',
] as const
const LOCK_TYPES = ['identity_lock', 'emotional_lock', 'action', 'possibility'] as const

type Quest = {
  id: string
  title: string
  description: string | null
  moveType: string | null
  allyshipDomain: string | null
  reward?: number
  gameMasterFace?: string | null
  nation?: string | null
  archetype?: string | null
  kotterStage?: number
  lockType?: string | null
}

function filterQuests(quests: Quest[], filters: { nation?: string[]; archetype?: string[]; kotterStage?: number[] }) {
  if (!filters.nation?.length && !filters.archetype?.length && !filters.kotterStage?.length) return quests
  return quests.filter((q) => {
    if (filters.nation?.length && (!q.nation || !filters.nation.includes(q.nation))) return false
    if (filters.archetype?.length && (!q.archetype || !filters.archetype.includes(q.archetype))) return false
    if (filters.kotterStage?.length && (q.kotterStage == null || !filters.kotterStage.includes(q.kotterStage))) return false
    return true
  })
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
  const [filterNation, setFilterNation] = useState<string[]>([])
  const [filterArchetype, setFilterArchetype] = useState<string[]>([])
  const [filterKotterStage, setFilterKotterStage] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const filters = { nation: filterNation, archetype: filterArchetype, kotterStage: filterKotterStage }
  const filteredDrafts = filterQuests(draftQuests, filters)
  const filteredApproved = filterQuests(approvedQuests, filters)
  const hasActiveFilters = filterNation.length > 0 || filterArchetype.length > 0 || filterKotterStage.length > 0

  const toggleStr = (list: string[], setList: (v: string[]) => void, value: string) => {
    const has = list.includes(value)
    setList(has ? list.filter((x) => x !== value) : [...list, value])
  }
  const toggleNum = (list: number[], setList: (v: number[]) => void, value: number) => {
    const has = list.includes(value)
    setList(has ? list.filter((x) => x !== value) : [...list, value])
  }

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
      nation: quest.nation ?? null,
      archetype: quest.archetype ?? null,
      kotterStage: quest.kotterStage ?? 1,
      lockType: quest.lockType ?? null,
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
      nation: editForm.nation !== undefined ? editForm.nation : undefined,
      archetype: editForm.archetype !== undefined ? editForm.archetype : undefined,
      kotterStage: editForm.kotterStage !== undefined ? editForm.kotterStage : undefined,
      lockType: editForm.lockType !== undefined ? editForm.lockType : undefined,
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
      {/* Filter panel */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
        >
          {showFilters ? '▼' : '▶'} Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-amber-600/50 px-2 py-0.5 text-xs text-amber-200">active</span>
          )}
        </button>
        {showFilters && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="mb-1 text-xs text-zinc-500">Nation</p>
              <div className="flex flex-wrap gap-1">
                {NATIONS.map((n) => (
                  <label key={n} className="flex cursor-pointer items-center gap-1">
                    <input
                      type="checkbox"
                      checked={filterNation.includes(n)}
                      onChange={() => toggleStr(filterNation, setFilterNation, n)}
                      className="rounded border-zinc-600 bg-zinc-800"
                    />
                    <span className="text-xs text-zinc-300">{n}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-zinc-500">Archetype</p>
              <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                {ARCHETYPES.map((a) => (
                  <label key={a} className="flex cursor-pointer items-center gap-1">
                    <input
                      type="checkbox"
                      checked={filterArchetype.includes(a)}
                      onChange={() => toggleStr(filterArchetype, setFilterArchetype, a)}
                      className="rounded border-zinc-600 bg-zinc-800"
                    />
                    <span className="text-xs text-zinc-300">{a}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-zinc-500">Kotter stage</p>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
                  <label key={k} className="flex cursor-pointer items-center gap-1">
                    <input
                      type="checkbox"
                      checked={filterKotterStage.includes(k)}
                      onChange={() => toggleNum(filterKotterStage, setFilterKotterStage, k)}
                      className="rounded border-zinc-600 bg-zinc-800"
                    />
                    <span className="text-xs text-zinc-300">{k}</span>
                  </label>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilterNation([])
                    setFilterArchetype([])
                    setFilterKotterStage([])
                  }}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {filteredDrafts.length} draft quests to review
          {hasActiveFilters && ` (${draftQuests.length} total)`}
        </p>
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
        {filteredDrafts.map((quest) => (
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
                  <select
                    value={editForm.nation ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, nation: e.target.value || null }))}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  >
                    <option value="">— Nation —</option>
                    {NATIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <select
                    value={editForm.archetype ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, archetype: e.target.value || null }))}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  >
                    <option value="">— Archetype —</option>
                    {ARCHETYPES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    Kotter:
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={editForm.kotterStage ?? 1}
                      onChange={(e) => setEditForm((f) => ({ ...f, kotterStage: parseInt(e.target.value, 10) || 1 }))}
                      className="w-12 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                    />
                  </label>
                  <select
                    value={editForm.lockType ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, lockType: e.target.value || null }))}
                    className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  >
                    <option value="">— Lock —</option>
                    {LOCK_TYPES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
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
                      {quest.nation && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{quest.nation}</span>
                      )}
                      {quest.archetype && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{quest.archetype}</span>
                      )}
                      {quest.kotterStage != null && quest.kotterStage > 1 && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">K{quest.kotterStage}</span>
                      )}
                      {quest.lockType && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">{quest.lockType}</span>
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

      {filteredApproved.length > 0 && (
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            Approved quests ({filteredApproved.length}
            {hasActiveFilters && ` of ${approvedQuests.length}`})
          </h3>
          <div className="space-y-2">
            {filteredApproved.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-4 py-2 px-3 bg-zinc-800/50 rounded">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-white">{q.title}</span>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{moveLabels[q.moveType ?? 'growUp']}</span>
                    {q.allyshipDomain && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{domainLabels[q.allyshipDomain]}</span>}
                    {q.nation && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{q.nation}</span>}
                    {q.archetype && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{q.archetype}</span>}
                    {q.kotterStage != null && q.kotterStage > 1 && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">K{q.kotterStage}</span>}
                    {q.lockType && <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-400 rounded">{q.lockType}</span>}
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
