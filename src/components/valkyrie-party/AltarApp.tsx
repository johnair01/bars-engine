'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { uploadPartyAsset } from '@/lib/valkyrie-party/upload-client'

type AltarPost = {
  id: string
  author_name: string
  anonymous: boolean
  category: string
  tags: string[]
  title: string
  body: string
  media?: { id: string; type: string; url: string; alt?: string }[]
  source?: { kind: string; base_card_id?: string | null }
  created_at: string
  deleted_at: string | null
}

type AltarReply = {
  id: string
  post_id: string
  author_name: string
  anonymous: boolean
  body: string
  created_at: string
  deleted_at: string | null
}

type AltarBoardEntry = {
  post: AltarPost
  replies: AltarReply[]
  reactions: Record<string, number>
  saved_count: number
}

type KeepSave = {
  id: string
  note?: string
  post: AltarPost | null
}

type DiscoveryData = {
  discovered_count: number
  total_cards: number
}

const PARTY_BG = '#5B160B'
const PARTY_PANEL = 'rgba(255, 243, 220, 0.09)'
const PARTY_GOLD = '#FFB000'
const PARTY_CREAM = '#FFF3DC'
const PARTY_TEAL = '#2DE2C6'
const CORK = '#6f4028'
const PAPER = '#fff6dc'

const CATEGORY_OPTIONS = [
  ['all', 'All'],
  ['blessing', 'Blessing'],
  ['memory', 'Memory'],
  ['quest_dare', 'Quest / Dare'],
  ['inside_joke', 'Inside Joke'],
  ['question', 'Question'],
  ['public_card_answer', 'Public Card Answer'],
  ['inspiration', 'Inspiration'],
  ['photo', 'Photo'],
  ['other', 'Other'],
] as const

const REACTIONS = [
  ['triumph', '🔥'],
  ['poignance', '💧'],
  ['bliss', '🌿'],
  ['excitement', '⚙️'],
  ['peace', '🪨'],
] as const

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok || json.ok === false) throw new Error(json.error || 'Request failed')
  return json as T
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.ok === false) throw new Error(json.error || 'Request failed')
  return json as T
}

function buttonStyle(primary = false, disabled = false): CSSProperties {
  return {
    borderRadius: 999,
    border: `1px solid ${primary ? 'rgba(255,176,0,0.55)' : 'rgba(255,243,220,0.22)'}`,
    background: disabled
      ? 'rgba(255,255,255,0.08)'
      : primary
        ? 'linear-gradient(135deg, rgba(255,176,0,0.22), rgba(255,77,46,0.3))'
        : 'rgba(255,243,220,0.08)',
    color: disabled ? 'rgba(255,243,220,0.5)' : PARTY_CREAM,
    padding: '0.55rem 0.8rem',
    font: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function keepButtonStyle(disabled = false): CSSProperties {
  return {
    borderRadius: 999,
    border: '2px solid rgba(255, 214, 102, 0.82)',
    background: disabled
      ? 'rgba(255,214,102,0.12)'
      : 'linear-gradient(135deg, rgba(255,214,102,0.24), rgba(255,92,50,0.42))',
    color: disabled ? 'rgba(255,243,220,0.65)' : '#fff7ea',
    padding: '0.7rem 1rem',
    font: 'inherit',
    fontWeight: 700,
    boxShadow: disabled ? 'none' : '0 0 0 1px rgba(255,255,255,0.08), 0 14px 28px rgba(255,118,49,0.18)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function fieldStyle(multiline = false): CSSProperties {
  return {
    width: '100%',
    minHeight: multiline ? 90 : undefined,
    borderRadius: 8,
    border: '1px solid rgba(255,243,220,0.18)',
    background: 'rgba(8, 4, 2, 0.36)',
    color: PARTY_CREAM,
    padding: '0.75rem',
    boxSizing: 'border-box',
    font: 'inherit',
    resize: multiline ? 'vertical' : undefined,
  }
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: PARTY_PANEL, border: '1px solid rgba(255,176,0,0.28)', borderRadius: 10, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: PARTY_GOLD, fontSize: '1.1rem' }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function BoardCard({ entry, onOpen }: { entry: AltarBoardEntry; onOpen: () => void }) {
  const { post, reactions } = entry
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        border: 'none',
        borderRadius: 10,
        background: PAPER,
        color: '#412313',
        padding: '0.8rem',
        minHeight: 180,
        display: 'grid',
        alignContent: 'start',
        gap: '0.45rem',
        textAlign: 'left',
        boxShadow: '0 8px 22px rgba(0,0,0,0.22)',
        transform: `rotate(${((post.id.charCodeAt(0) % 5) - 2) * 1.2}deg)`,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'start' }}>
        <strong style={{ color: '#a04f00', fontSize: '0.92rem' }}>{post.title || post.category.replace('_', ' ')}</strong>
        <span style={{ color: '#117e73', fontSize: '0.75rem' }}>{post.author_name}</span>
      </div>
      <p style={{ margin: 0, lineHeight: 1.35, fontSize: '0.95rem' }}>{post.body.slice(0, 180)}{post.body.length > 180 ? '…' : ''}</p>
      {post.media?.[0] ? <img src={post.media[0].url} alt={post.media[0].alt || 'Altar upload'} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8 }} /> : null}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: 'auto', fontSize: '0.85rem' }}>
        {REACTIONS.map(([key, emoji]) => (
          <span key={key}>{emoji} {reactions[key] || 0}</span>
        ))}
      </div>
    </button>
  )
}

function EmptyBoardSpot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: '2px dashed rgba(255,243,220,0.28)',
        background: 'rgba(255,243,220,0.05)',
        minHeight: 170,
        color: 'rgba(255,243,220,0.72)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', lineHeight: 1 }}>+</div>
        <div>Add a note here</div>
      </div>
    </button>
  )
}

export function AltarApp() {
  const [playerName, setPlayerName] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [board, setBoard] = useState<{ posts: AltarBoardEntry[]; categories: string[]; reaction_types: string[] } | null>(null)
  const [filter, setFilter] = useState('all')
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null)
  const [saves, setSaves] = useState<KeepSave[]>([])
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [exportBlob, setExportBlob] = useState('')
  const [composer, setComposer] = useState({ title: '', body: '', category: 'blessing', tags: '', anonymous: false })
  const [composerFile, setComposerFile] = useState<File | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [focusedEntry, setFocusedEntry] = useState<AltarBoardEntry | null>(null)

  useEffect(() => {
    setPlayerName(window.localStorage.getItem('valkyrie_party_player') || '')
    setAdminToken(window.localStorage.getItem('valkyrie_party_admin') || '')
  }, [])

  const loadBoard = useCallback(async () => {
    const query = filter !== 'all' ? `?category=${encodeURIComponent(filter)}` : ''
    const json = await getJson<{ posts: AltarBoardEntry[]; categories: string[]; reaction_types: string[] }>(`/api/party/valkyrie/altar${query}`)
    setBoard(json)
    setFocusedEntry((current) => {
      if (!current) return null
      return json.posts.find((entry) => entry.post.id === current.post.id) || null
    })
  }, [filter])

  const loadPlayerContext = useCallback(async () => {
    const [discoveryJson, savesJson] = await Promise.all([
      getJson<DiscoveryData>(`/api/party/valkyrie/discovery`).catch(() => ({ discovered_count: 0, total_cards: 0 })),
      getJson<{ saves: KeepSave[] }>(`/api/party/valkyrie/altar/saves`).catch(() => ({ saves: [] })),
    ])
    setDiscovery(discoveryJson)
    setSaves(savesJson.saves || [])
  }, [])

  useEffect(() => {
    loadBoard().catch((err) => setNotice(err instanceof Error ? err.message : 'Could not load altar'))
  }, [loadBoard])

  useEffect(() => {
    loadPlayerContext().catch(() => undefined)
  }, [loadPlayerContext])

  const saveIds = useMemo(() => new Set(saves.map((save) => save.post?.id).filter(Boolean)), [saves])
  const visiblePosts = board?.posts || []
  const emptySlots = Math.max(6, 12 - visiblePosts.length)

  const submitPost = useCallback(async (file: File | null = composerFile) => {
    if (!composer.body.trim() && !file) return
    setBusy(true)
    try {
      let assetUrl = ''
      if (file) {
        const uploaded = await uploadPartyAsset(file, { kind: 'altar' })
        assetUrl = uploaded.url
      }
      await postJson('/api/party/valkyrie/altar', {
        title: composer.title,
        body: composer.body,
        category: composer.category,
        tags: composer.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        anonymous: composer.anonymous,
        asset_url: assetUrl,
      })
      setComposer({ title: '', body: '', category: composer.category, tags: '', anonymous: false })
      setComposerFile(null)
      setComposerOpen(false)
      setNotice('Your offering is now on the altar.')
      await loadBoard()
      await loadPlayerContext().catch(() => undefined)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not post to altar')
    } finally {
      setBusy(false)
    }
  }, [composer, composerFile, loadBoard, loadPlayerContext])

  const sendReply = useCallback(async (postId: string) => {
    const body = replyDrafts[postId]?.trim()
    if (!body) return
    setBusy(true)
    try {
      await postJson('/api/party/valkyrie/altar/replies', { post_id: postId, body })
      setReplyDrafts((drafts) => ({ ...drafts, [postId]: '' }))
      await loadBoard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not reply')
    } finally {
      setBusy(false)
    }
  }, [replyDrafts, loadBoard])

  const reactToPost = useCallback(async (postId: string, reaction: string) => {
    try {
      await postJson('/api/party/valkyrie/altar/reactions', { post_id: postId, reaction })
      await loadBoard()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not react')
    }
  }, [loadBoard])

  const savePost = useCallback(async (postId: string) => {
    try {
      await postJson('/api/party/valkyrie/altar/saves', { artifact_id: postId })
      await loadPlayerContext()
      await loadBoard()
      setNotice('Saved to your keepsake deck.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save post')
    }
  }, [loadPlayerContext, loadBoard])

  const deleteOwn = useCallback(async (payload: { post_id?: string; reply_id?: string }) => {
    try {
      await postJson('/api/party/valkyrie/altar/delete', payload)
      await loadBoard()
      await loadPlayerContext().catch(() => undefined)
      setFocusedEntry(null)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not delete')
    }
  }, [loadBoard, loadPlayerContext])

  const adminDelete = useCallback(async (payload: { post_id?: string; reply_id?: string }) => {
    if (!adminToken.trim()) return
    try {
      await postJson('/api/party/valkyrie/admin/altar-delete', { admin_token: adminToken, ...payload })
      window.localStorage.setItem('valkyrie_party_admin', adminToken)
      await loadBoard()
      setFocusedEntry(null)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not admin-delete')
    }
  }, [adminToken, loadBoard])

  const exportBoard = useCallback(async () => {
    if (!adminToken.trim()) return
    try {
      const json = await getJson<Record<string, unknown>>(`/api/party/valkyrie/admin/altar-export?admin_token=${encodeURIComponent(adminToken)}`)
      window.localStorage.setItem('valkyrie_party_admin', adminToken)
      setExportBlob(JSON.stringify(json, null, 2))
      setNotice('Export ready below.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not export altar')
    }
  }, [adminToken])

  return (
    <main style={{ minHeight: '100vh', background: `radial-gradient(circle at 18% 8%, rgba(255,176,0,0.28), transparent 28%), radial-gradient(circle at 82% 4%, rgba(255,77,46,0.24), transparent 26%), linear-gradient(180deg, ${PARTY_BG}, #220700 72%)`, color: PARTY_CREAM, fontFamily: 'Georgia, serif', padding: '1.25rem' }}>
      <div style={{ width: '100%', maxWidth: 1180, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <header style={{ display: 'grid', gap: '0.7rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, color: PARTY_TEAL, fontSize: '0.78rem', letterSpacing: '0.12em' }}>VALKYRIE PARTY ALTAR</p>
              <h1 style={{ margin: '0.25rem 0 0', color: PARTY_GOLD, fontSize: 'clamp(2rem, 6vw, 3.2rem)' }}>Shared Magic Altar</h1>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Your name" style={{ ...fieldStyle(), width: 180, minHeight: 0, padding: '0.6rem 0.7rem' }} />
              <button type="button" onClick={() => window.localStorage.setItem('valkyrie_party_player', playerName.trim())} style={buttonStyle()}>
                Save player
              </button>
              <button type="button" onClick={() => window.location.assign('/valkyrie-party')} style={buttonStyle()}>
                Back to party
              </button>
            </div>
          </div>
          <p style={{ margin: 0, lineHeight: 1.55, maxWidth: 880, opacity: 0.88 }}>
            This is the public layer of the party: blessings, memories, questions, quest sparks, public card answers, photos, and tiny treasures people want the room to witness.
          </p>
          {discovery && (
            <p style={{ margin: 0, opacity: 0.72 }}>
              You&apos;ve discovered {discovery.discovered_count} of {discovery.total_cards} oracle cards. Tap an open space on the corkboard to add a note or image.
            </p>
          )}
        </header>

        {notice && (
          <div style={{ border: '1px solid rgba(255,176,0,0.3)', borderRadius: 8, padding: '0.75rem', background: 'rgba(0,0,0,0.18)', color: PARTY_GOLD }}>
            {notice}
          </div>
        )}

        <section style={{ background: `linear-gradient(180deg, rgba(111,64,40,0.95), rgba(88,48,28,0.95))`, border: '1px solid rgba(255,214,150,0.26)', borderRadius: 18, padding: '1rem', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05), 0 18px 40px rgba(0,0,0,0.24)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <div>
              <h2 style={{ margin: 0, color: '#ffe4b0', fontSize: '1.2rem' }}>Public Altar Board</h2>
              <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,243,220,0.82)' }}>Pinned offerings, public answers, photos, and sparks. Tap an empty spot to add something.</p>
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...fieldStyle(), width: 190, minHeight: 0, padding: '0.55rem 0.7rem' }}>
              {CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.9rem' }}>
            {visiblePosts.map((entry) => <BoardCard key={entry.post.id} entry={entry} onOpen={() => setFocusedEntry(entry)} />)}
            {Array.from({ length: emptySlots }).map((_, index) => <EmptyBoardSpot key={`empty-${index}`} onClick={() => setComposerOpen(true)} />)}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          <Panel title="Make An Offering">
            <p style={{ margin: '0 0 0.75rem', opacity: 0.8, lineHeight: 1.45 }}>Use this when you want to compose carefully. For quick posting, just tap an open board spot.</p>
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              <input value={composer.title} onChange={(e) => setComposer((draft) => ({ ...draft, title: e.target.value }))} placeholder="Optional title" style={fieldStyle()} />
              <textarea value={composer.body} onChange={(e) => setComposer((draft) => ({ ...draft, body: e.target.value }))} placeholder="Leave a blessing, memory, invitation, question, or public answer." style={fieldStyle(true)} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
                <select value={composer.category} onChange={(e) => setComposer((draft) => ({ ...draft, category: e.target.value }))} style={fieldStyle()}>
                  {CATEGORY_OPTIONS.filter(([value]) => value !== 'all').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <input value={composer.tags} onChange={(e) => setComposer((draft) => ({ ...draft, tags: e.target.value }))} placeholder="Tags, comma-separated" style={fieldStyle()} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', opacity: 0.88 }}>
                <input type="checkbox" checked={composer.anonymous} onChange={(e) => setComposer((draft) => ({ ...draft, anonymous: e.target.checked }))} />
                Post anonymously
              </label>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                <label style={buttonStyle(false, busy)}>
                  {composerFile ? 'Change photo' : 'Choose photo'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0] || null
                      setComposerFile(file)
                      if (file) {
                        setComposer((draft) => ({ ...draft, category: draft.category === 'blessing' ? 'photo' : draft.category }))
                      }
                      e.currentTarget.value = ''
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                {composerFile ? <span style={{ alignSelf: 'center', opacity: 0.78, fontSize: '0.84rem' }}>Attached: {composerFile.name}</span> : null}
                <button type="button" disabled={busy || (!composer.body.trim() && !composerFile)} onClick={() => submitPost()} style={buttonStyle(true, busy || (!composer.body.trim() && !composerFile))}>
                  {composerFile ? 'Post to altar' : 'Post note to altar'}
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="Your Keepsakes">
            {saves.length ? (
              <div style={{ display: 'grid', gap: '0.55rem', maxHeight: 360, overflow: 'auto' }}>
                {saves.map((save) => (
                  <div key={save.id} style={{ borderTop: '1px solid rgba(255,176,0,0.16)', paddingTop: '0.55rem' }}>
                    <p style={{ margin: '0 0 0.18rem', color: PARTY_GOLD, fontSize: '0.84rem' }}>{save.post?.title || 'Untitled offering'}</p>
                    <p style={{ margin: 0, opacity: 0.76, fontSize: '0.84rem', lineHeight: 1.35 }}>{save.post?.body || 'Missing post'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.45 }}>When a public note touches you, keep it here.</p>
            )}
          </Panel>

          <Panel title="Admin Tools">
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Admin token" style={fieldStyle()} />
              <button type="button" disabled={!adminToken.trim()} onClick={exportBoard} style={buttonStyle(true, !adminToken.trim())}>
                Export altar
              </button>
              <p style={{ margin: 0, opacity: 0.7, fontSize: '0.84rem', lineHeight: 1.4 }}>
                Admin can delete any post or reply and export the full altar board after the party. Anonymous authors stay anonymous here too.
              </p>
              {exportBlob && <textarea readOnly value={exportBlob} style={{ ...fieldStyle(true), minHeight: 220 }} />}
            </div>
          </Panel>
        </section>
      </div>

      {composerOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', padding: '1rem', zIndex: 40 }}>
          <div style={{ width: 'min(100%, 520px)', background: '#2b130a', border: '1px solid rgba(255,176,0,0.35)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, color: PARTY_GOLD }}>Add to the altar</h2>
            <input value={composer.title} onChange={(e) => setComposer((draft) => ({ ...draft, title: e.target.value }))} placeholder="Optional title" style={fieldStyle()} />
            <textarea value={composer.body} onChange={(e) => setComposer((draft) => ({ ...draft, body: e.target.value }))} placeholder="Write your note or offering" style={fieldStyle(true)} />
            <select value={composer.category} onChange={(e) => setComposer((draft) => ({ ...draft, category: e.target.value }))} style={fieldStyle()}>
              {CATEGORY_OPTIONS.filter(([value]) => value !== 'all').map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span style={{ color: PARTY_CREAM, opacity: 0.9 }}>Photo</span>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={buttonStyle(false, busy)}>
                  {composerFile ? 'Change photo' : 'Choose photo'}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0] || null
                      setComposerFile(file)
                      if (file) {
                        setComposer((draft) => ({ ...draft, category: draft.category === 'blessing' ? 'photo' : draft.category }))
                      }
                      e.currentTarget.value = ''
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
                {composerFile ? <span style={{ opacity: 0.78, fontSize: '0.84rem' }}>{composerFile.name}</span> : <span style={{ opacity: 0.62, fontSize: '0.84rem' }}>Optional, but fully supported.</span>}
              </div>
            </label>
            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setComposerOpen(false); setComposerFile(null) }} style={buttonStyle()}>Cancel</button>
              <button type="button" disabled={busy || (!composer.body.trim() && !composerFile)} onClick={() => submitPost()} style={buttonStyle(true, busy || (!composer.body.trim() && !composerFile))}>{composerFile ? 'Pin to altar' : 'Pin note'}</button>
            </div>
          </div>
        </div>
      )}

      {focusedEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'grid', placeItems: 'center', padding: '1rem', zIndex: 50 }}>
          <div style={{ width: 'min(100%, 760px)', maxHeight: '88vh', overflow: 'auto', background: '#2b130a', border: '1px solid rgba(255,176,0,0.35)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'start', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, color: PARTY_GOLD }}>{focusedEntry.post.title || focusedEntry.post.category.replace('_', ' ')}</h2>
                <p style={{ margin: '0.3rem 0 0', color: PARTY_TEAL }}>{focusedEntry.post.author_name}</p>
              </div>
              <button type="button" onClick={() => setFocusedEntry(null)} style={buttonStyle()}>Close</button>
            </div>
            <p style={{ margin: 0, lineHeight: 1.55 }}>{focusedEntry.post.body}</p>
            {focusedEntry.post.media?.length ? focusedEntry.post.media.map((media) => <img key={media.id} src={media.url} alt={media.alt || 'Altar upload'} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 10 }} />) : null}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {REACTIONS.map(([value, label]) => (
                <button key={value} type="button" onClick={() => reactToPost(focusedEntry.post.id, value)} style={buttonStyle()}>{label} {focusedEntry.reactions[value] || 0}</button>
              ))}
              <button type="button" disabled={saveIds.has(focusedEntry.post.id)} onClick={() => savePost(focusedEntry.post.id)} style={keepButtonStyle(saveIds.has(focusedEntry.post.id))}>
                {saveIds.has(focusedEntry.post.id) ? `✨ In your keepsakes · ${focusedEntry.saved_count}` : `✨ Keep in my keepsakes · ${focusedEntry.saved_count}`}
              </button>
              {!focusedEntry.post.anonymous && focusedEntry.post.author_name === playerName && <button type="button" onClick={() => deleteOwn({ post_id: focusedEntry.post.id })} style={buttonStyle()}>Delete my post</button>}
              {adminToken.trim() && <button type="button" onClick={() => adminDelete({ post_id: focusedEntry.post.id })} style={buttonStyle()}>Admin delete</button>}
            </div>
            <div style={{ display: 'grid', gap: '0.5rem', borderTop: '1px solid rgba(255,176,0,0.14)', paddingTop: '0.75rem' }}>
              {focusedEntry.replies.map((reply) => (
                <div key={reply.id} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '0.65rem' }}>
                  <p style={{ margin: '0 0 0.2rem', color: PARTY_GOLD, fontSize: '0.82rem' }}>{reply.author_name}</p>
                  <p style={{ margin: 0, lineHeight: 1.45 }}>{reply.body}</p>
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {!reply.anonymous && reply.author_name === playerName && <button type="button" onClick={() => deleteOwn({ reply_id: reply.id })} style={buttonStyle()}>Delete my reply</button>}
                    {adminToken.trim() && <button type="button" onClick={() => adminDelete({ reply_id: reply.id })} style={buttonStyle()}>Admin delete</button>}
                  </div>
                </div>
              ))}
              <textarea value={replyDrafts[focusedEntry.post.id] || ''} onChange={(e) => setReplyDrafts((drafts) => ({ ...drafts, [focusedEntry.post.id]: e.target.value }))} placeholder="Reply to this altar note" style={fieldStyle(true)} />
              <button type="button" disabled={busy || !(replyDrafts[focusedEntry.post.id] || '').trim()} onClick={() => sendReply(focusedEntry.post.id)} style={buttonStyle(true, busy || !(replyDrafts[focusedEntry.post.id] || '').trim())}>Reply</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
