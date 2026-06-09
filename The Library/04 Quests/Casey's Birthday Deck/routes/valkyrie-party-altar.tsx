import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";

type AltarPost = {
  id: string;
  author_name: string;
  anonymous: boolean;
  category: string;
  tags: string[];
  title: string;
  body: string;
  media?: { id: string; type: string; url: string; alt?: string }[];
  source?: { kind: string; base_card_id?: string | null };
  created_at: string;
  deleted_at: string | null;
};

type AltarReply = {
  id: string;
  post_id: string;
  author_name: string;
  anonymous: boolean;
  body: string;
  created_at: string;
  deleted_at: string | null;
};

type AltarBoardEntry = {
  post: AltarPost;
  replies: AltarReply[];
  reactions: Record<string, number>;
  saved_count: number;
};

type KeepSave = {
  id: string;
  note?: string;
  post: AltarPost | null;
};

type DiscoveryData = {
  discovered_count: number;
  total_cards: number;
};

const PARTY_BG = "#5B160B";
const PARTY_PANEL = "rgba(255, 243, 220, 0.09)";
const PARTY_GOLD = "#FFB000";
const PARTY_CREAM = "#FFF3DC";
const PARTY_TEAL = "#2DE2C6";

const CATEGORY_OPTIONS = [
  ["all", "All"],
  ["blessing", "Blessing"],
  ["memory", "Memory"],
  ["quest_dare", "Quest / Dare"],
  ["inside_joke", "Inside Joke"],
  ["question", "Question"],
  ["public_card_answer", "Public Card Answer"],
  ["inspiration", "Inspiration"],
  ["photo", "Photo"],
  ["other", "Other"],
] as const;

const REACTIONS = [
  ["triumph", "🔥"],
  ["poignance", "💧"],
  ["bliss", "🌿"],
  ["excitement", "⚙️"],
  ["peace", "🪨"],
] as const;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(json.error || "Request failed");
  return json as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(json.error || "Request failed");
  return json as T;
}

function buttonStyle(primary = false, disabled = false): CSSProperties {
  return {
    borderRadius: 999,
    border: `1px solid ${primary ? "rgba(255,176,0,0.55)" : "rgba(255,243,220,0.22)"}`,
    background: disabled
      ? "rgba(255,255,255,0.08)"
      : primary
        ? "linear-gradient(135deg, rgba(255,176,0,0.22), rgba(255,77,46,0.3))"
        : "rgba(255,243,220,0.08)",
    color: disabled ? "rgba(255,243,220,0.5)" : PARTY_CREAM,
    padding: "0.55rem 0.8rem",
    font: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function keepButtonStyle(disabled = false): CSSProperties {
  return {
    borderRadius: 999,
    border: "2px solid rgba(255, 214, 102, 0.82)",
    background: disabled
      ? "rgba(255,214,102,0.12)"
      : "linear-gradient(135deg, rgba(255,214,102,0.24), rgba(255,92,50,0.42))",
    color: disabled ? "rgba(255,243,220,0.65)" : "#fff7ea",
    padding: "0.7rem 1rem",
    font: "inherit",
    fontWeight: 700,
    boxShadow: disabled ? "none" : "0 0 0 1px rgba(255,255,255,0.08), 0 14px 28px rgba(255,118,49,0.18)",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function fieldStyle(multiline = false): CSSProperties {
  return {
    width: "100%",
    minHeight: multiline ? 90 : undefined,
    borderRadius: 8,
    border: "1px solid rgba(255,243,220,0.18)",
    background: "rgba(8, 4, 2, 0.36)",
    color: PARTY_CREAM,
    padding: "0.75rem",
    boxSizing: "border-box",
    font: "inherit",
    resize: multiline ? "vertical" : undefined,
  };
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: PARTY_PANEL, border: "1px solid rgba(255,176,0,0.28)", borderRadius: 10, padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, color: PARTY_GOLD, fontSize: "1.1rem" }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ValkyriePartyAltar() {
  const [playerName, setPlayerName] = useState(localStorage.getItem("valkyrie_party_player") || "");
  const [adminToken, setAdminToken] = useState(localStorage.getItem("valkyrie_party_admin") || "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [board, setBoard] = useState<{ posts: AltarBoardEntry[]; categories: string[]; reaction_types: string[] } | null>(null);
  const [filter, setFilter] = useState("all");
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [saves, setSaves] = useState<KeepSave[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [exportBlob, setExportBlob] = useState("");
  const [composer, setComposer] = useState({
    title: "",
    body: "",
    category: "blessing",
    tags: "",
    anonymous: false,
  });

  const loadBoard = useCallback(async () => {
    const query = filter !== "all" ? `?category=${encodeURIComponent(filter)}` : "";
    const json = await getJson<{ posts: AltarBoardEntry[]; categories: string[]; reaction_types: string[] }>(`/api/party/valkyrie/altar${query}`);
    setBoard(json);
  }, [filter]);

  const loadPlayerContext = useCallback(async () => {
    if (!playerName.trim()) return;
    const [discoveryJson, savesJson] = await Promise.all([
      getJson<DiscoveryData>(`/api/party/valkyrie/discovery?player=${encodeURIComponent(playerName)}`),
      getJson<{ saves: KeepSave[] }>(`/api/party/valkyrie/altar/saves?player=${encodeURIComponent(playerName)}`),
    ]);
    setDiscovery(discoveryJson);
    setSaves(savesJson.saves || []);
  }, [playerName]);

  useEffect(() => {
    loadBoard().catch((err) => setNotice(err instanceof Error ? err.message : "Could not load altar"));
  }, [loadBoard]);

  useEffect(() => {
    loadPlayerContext().catch(() => {
      /* player context is nice-to-have */
    });
  }, [loadPlayerContext]);

  const saveIds = useMemo(() => new Set(saves.map((save) => save.post?.id).filter(Boolean)), [saves]);

  const submitPost = useCallback(async (file: File | null) => {
    if (!playerName.trim() || !composer.body.trim()) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("player", playerName);
      form.set("title", composer.title);
      form.set("body", composer.body);
      form.set("category", composer.category);
      form.set("tags", composer.tags);
      form.set("anonymous", composer.anonymous ? "1" : "");
      if (file) form.set("file", file);
      const res = await fetch("/api/party/valkyrie/altar", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "Could not post to altar");
      setComposer({ title: "", body: "", category: composer.category, tags: "", anonymous: false });
      setNotice("Your offering is now on the altar.");
      await loadBoard();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not post to altar");
    } finally {
      setBusy(false);
    }
  }, [playerName, composer, loadBoard]);

  const sendReply = useCallback(async (postId: string) => {
    const body = replyDrafts[postId]?.trim();
    if (!playerName.trim() || !body) return;
    setBusy(true);
    try {
      await postJson("/api/party/valkyrie/altar/replies", { player: playerName, post_id: postId, body });
      setReplyDrafts((drafts) => ({ ...drafts, [postId]: "" }));
      await loadBoard();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not reply");
    } finally {
      setBusy(false);
    }
  }, [playerName, replyDrafts, loadBoard]);

  const reactToPost = useCallback(async (postId: string, reaction: string) => {
    if (!playerName.trim()) return;
    try {
      await postJson("/api/party/valkyrie/altar/reactions", { player: playerName, post_id: postId, reaction });
      await loadBoard();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not react");
    }
  }, [playerName, loadBoard]);

  const savePost = useCallback(async (postId: string) => {
    if (!playerName.trim()) return;
    try {
      await postJson("/api/party/valkyrie/altar/saves", { player: playerName, artifact_id: postId });
      await loadPlayerContext();
      await loadBoard();
      setNotice("Saved to your keepsake deck.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save post");
    }
  }, [playerName, loadPlayerContext, loadBoard]);

  const deleteOwn = useCallback(async (payload: { post_id?: string; reply_id?: string }) => {
    if (!playerName.trim()) return;
    try {
      await postJson("/api/party/valkyrie/altar/delete", { player: playerName, ...payload });
      await loadBoard();
      await loadPlayerContext();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not delete");
    }
  }, [playerName, loadBoard, loadPlayerContext]);

  const adminDelete = useCallback(async (payload: { post_id?: string; reply_id?: string }) => {
    if (!adminToken.trim()) return;
    try {
      await postJson("/api/party/valkyrie/admin/altar-delete", { admin_token: adminToken, ...payload });
      localStorage.setItem("valkyrie_party_admin", adminToken);
      await loadBoard();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not admin-delete");
    }
  }, [adminToken, loadBoard]);

  const exportBoard = useCallback(async () => {
    if (!adminToken.trim()) return;
    try {
      const json = await getJson<Record<string, unknown>>(`/api/party/valkyrie/admin/altar-export?admin_token=${encodeURIComponent(adminToken)}`);
      localStorage.setItem("valkyrie_party_admin", adminToken);
      setExportBlob(JSON.stringify(json, null, 2));
      setNotice("Export ready below.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not export altar");
    }
  }, [adminToken]);

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(circle at 18% 8%, rgba(255,176,0,0.28), transparent 28%), radial-gradient(circle at 82% 4%, rgba(255,77,46,0.24), transparent 26%), linear-gradient(180deg, ${PARTY_BG}, #220700 72%)`, color: PARTY_CREAM, fontFamily: "Georgia, serif", padding: "1.25rem" }}>
      <div style={{ width: "100%", maxWidth: 1120, margin: "0 auto", display: "grid", gap: "1rem" }}>
        <header style={{ display: "grid", gap: "0.7rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, color: PARTY_TEAL, fontSize: "0.78rem", letterSpacing: "0.12em" }}>VALKYRIE PARTY ALTAR</p>
              <h1 style={{ margin: "0.25rem 0 0", color: PARTY_GOLD, fontSize: "clamp(2rem, 6vw, 3.2rem)" }}>Shared Magic Altar</h1>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Your name" style={{ ...fieldStyle(), width: 180, minHeight: 0, padding: "0.6rem 0.7rem" }} />
              <button type="button" onClick={() => { if (playerName.trim()) { localStorage.setItem("valkyrie_party_player", playerName.trim()); loadPlayerContext().catch(() => undefined); } }} style={buttonStyle()}>
                Save player
              </button>
              <button type="button" onClick={() => window.location.assign("/valkyrie-party")} style={buttonStyle()}>
                Back to party
              </button>
            </div>
          </div>
          <p style={{ margin: 0, lineHeight: 1.55, maxWidth: 880, opacity: 0.88 }}>
            This is the public layer of the party: blessings, memories, questions, quest sparks, public card answers, photos, and tiny treasures people want the room to witness.
          </p>
          {discovery && (
            <p style={{ margin: 0, opacity: 0.72 }}>
              You&apos;ve discovered {discovery.discovered_count} of {discovery.total_cards} oracle cards. Public altar posts can become keepsakes without exposing private card mail.
            </p>
          )}
        </header>

        {notice && (
          <div style={{ border: "1px solid rgba(255,176,0,0.3)", borderRadius: 8, padding: "0.75rem", background: "rgba(0,0,0,0.18)", color: PARTY_GOLD }}>
            {notice}
          </div>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 0.65fr)", gap: "1rem", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <Panel title="Make An Offering" action={
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...fieldStyle(), width: 180, minHeight: 0, padding: "0.55rem 0.7rem" }}>
                {CATEGORY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            }>
              <div style={{ display: "grid", gap: "0.7rem" }}>
                <input value={composer.title} onChange={(e) => setComposer((draft) => ({ ...draft, title: e.target.value }))} placeholder="Optional title" style={fieldStyle()} />
                <textarea value={composer.body} onChange={(e) => setComposer((draft) => ({ ...draft, body: e.target.value }))} placeholder="Leave a blessing, memory, invitation, question, or public answer." style={fieldStyle(true)} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.7rem" }}>
                  <select value={composer.category} onChange={(e) => setComposer((draft) => ({ ...draft, category: e.target.value }))} style={fieldStyle()}>
                    {CATEGORY_OPTIONS.filter(([value]) => value !== "all").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <input value={composer.tags} onChange={(e) => setComposer((draft) => ({ ...draft, tags: e.target.value }))} placeholder="Tags, comma-separated" style={fieldStyle()} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.55rem", opacity: 0.88 }}>
                  <input type="checkbox" checked={composer.anonymous} onChange={(e) => setComposer((draft) => ({ ...draft, anonymous: e.target.checked }))} />
                  Post anonymously
                </label>
                <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                  <label style={buttonStyle(false, busy || !playerName.trim())}>
                    Add photo
                    <input
                      type="file"
                      accept="image/*"
                      disabled={busy || !playerName.trim()}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        submitPost(file);
                        e.currentTarget.value = "";
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button type="button" disabled={busy || !playerName.trim() || !composer.body.trim()} onClick={() => submitPost(null)} style={buttonStyle(true, busy || !playerName.trim() || !composer.body.trim())}>
                    Post to altar
                  </button>
                </div>
              </div>
            </Panel>

            <div style={{ display: "grid", gap: "0.85rem" }}>
              {(board?.posts || []).map(({ post, replies, reactions, saved_count }) => (
                <Panel
                  key={post.id}
                  title={post.title || CATEGORY_OPTIONS.find(([value]) => value === post.category)?.[1] || "Offering"}
                  action={<span style={{ color: PARTY_TEAL, fontSize: "0.8rem" }}>{post.author_name} · {new Date(post.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
                >
                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    <p style={{ margin: 0, lineHeight: 1.55 }}>{post.body}</p>
                    {post.media?.length ? (
                      <div style={{ display: "grid", gap: "0.6rem" }}>
                        {post.media.map((media) => (
                          <img key={media.id} src={media.url} alt={media.alt || "Altar upload"} style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,176,0,0.22)" }} />
                        ))}
                      </div>
                    ) : null}
                    {post.tags?.length ? (
                      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                        {post.tags.map((tag) => <span key={tag} style={{ border: "1px solid rgba(255,176,0,0.2)", borderRadius: 999, padding: "0.18rem 0.5rem", fontSize: "0.76rem", opacity: 0.8 }}>#{tag}</span>)}
                      </div>
                    ) : null}
                    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                      {REACTIONS.map(([value, label]) => (
                        <button key={value} type="button" onClick={() => reactToPost(post.id, value)} style={buttonStyle()}>
                          <span aria-hidden="true" style={{ fontSize: "1.05rem" }}>{label}</span> {reactions[value] || 0}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                      <button type="button" disabled={!playerName.trim() || saveIds.has(post.id)} onClick={() => savePost(post.id)} style={keepButtonStyle(!playerName.trim() || saveIds.has(post.id))}>
                        {saveIds.has(post.id) ? `✨ In your keepsakes · ${saved_count}` : `✨ Keep in my keepsakes · ${saved_count}`}
                      </button>
                      {!post.anonymous && post.author_name === playerName && (
                        <button type="button" onClick={() => deleteOwn({ post_id: post.id })} style={buttonStyle()}>
                          Delete my post
                        </button>
                      )}
                      {adminToken.trim() && (
                        <button type="button" onClick={() => adminDelete({ post_id: post.id })} style={buttonStyle()}>
                          Admin delete
                        </button>
                      )}
                    </div>
                    <div style={{ display: "grid", gap: "0.5rem", borderTop: "1px solid rgba(255,176,0,0.14)", paddingTop: "0.75rem" }}>
                      {replies.map((reply) => (
                        <div key={reply.id} style={{ background: "rgba(0,0,0,0.15)", borderRadius: 8, padding: "0.65rem" }}>
                          <p style={{ margin: "0 0 0.2rem", color: PARTY_GOLD, fontSize: "0.82rem" }}>{reply.author_name}</p>
                          <p style={{ margin: 0, lineHeight: 1.45 }}>{reply.body}</p>
                          <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                            {!reply.anonymous && reply.author_name === playerName && (
                              <button type="button" onClick={() => deleteOwn({ reply_id: reply.id })} style={buttonStyle()}>
                                Delete my reply
                              </button>
                            )}
                            {adminToken.trim() && (
                              <button type="button" onClick={() => adminDelete({ reply_id: reply.id })} style={buttonStyle()}>
                                Admin delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <textarea value={replyDrafts[post.id] || ""} onChange={(e) => setReplyDrafts((drafts) => ({ ...drafts, [post.id]: e.target.value }))} placeholder="Reply to this altar note" style={fieldStyle(true)} />
                      <button type="button" disabled={busy || !playerName.trim() || !(replyDrafts[post.id] || "").trim()} onClick={() => sendReply(post.id)} style={buttonStyle(true, busy || !playerName.trim() || !(replyDrafts[post.id] || "").trim())}>
                        Reply
                      </button>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            <Panel title="Your Keepsakes">
              {saves.length ? (
                <div style={{ display: "grid", gap: "0.55rem", maxHeight: 360, overflow: "auto" }}>
                  {saves.map((save) => (
                    <div key={save.id} style={{ borderTop: "1px solid rgba(255,176,0,0.16)", paddingTop: "0.55rem" }}>
                      <p style={{ margin: "0 0 0.18rem", color: PARTY_GOLD, fontSize: "0.84rem" }}>{save.post?.title || "Untitled offering"}</p>
                      <p style={{ margin: 0, opacity: 0.76, fontSize: "0.84rem", lineHeight: 1.35 }}>{save.post?.body || "Missing post"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.45 }}>When a public note touches you, keep it here.</p>
              )}
            </Panel>

            <Panel title="Admin Tools">
              <div style={{ display: "grid", gap: "0.6rem" }}>
                <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Admin token" style={fieldStyle()} />
                <button type="button" disabled={!adminToken.trim()} onClick={exportBoard} style={buttonStyle(true, !adminToken.trim())}>
                  Export altar
                </button>
                <p style={{ margin: 0, opacity: 0.7, fontSize: "0.84rem", lineHeight: 1.4 }}>
                  Admin can delete any post or reply and export the full altar board after the party. Anonymous authors stay anonymous here too.
                </p>
                {exportBlob && (
                  <textarea readOnly value={exportBlob} style={{ ...fieldStyle(true), minHeight: 220 }} />
                )}
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}
