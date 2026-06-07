import { useState, useEffect, useCallback, useRef } from "react";
import { ImageBand } from "./oracle/ImageBand";
import { CopyEditorPanel } from "./oracle/CopyEditorPanel";
import { copyFromCard, type CardCopyDraft, type Depth } from "./oracle/copyEditor";
import {
  deckFetchUrl,
  oracleAssetUrl,
  READER_URL,
  type PublishStatus,
} from "./oracle/deckApi";
import {
  getInitialView,
  getOracleAppMode,
  isReaderPreviewInDev,
  modeToggleHref,
  type OracleAppMode,
  type ViewMode,
} from "./oracle/mode";
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  ZONE_HEADER_H,
  ZONE_TITLE_H,
  ZONE_TITLE_PADDING_X,
  ZONE_CONTENT_H,
  OPAQUE_GREEN,
  GOLD,
  CREAM,
  DEFAULT_CROP,
  ZOOM_STEP,
  ZOOM_MIN,
  ZOOM_MAX,
  cropFromCard,
  clampCrop,
  isCardDone,
  cardEditorStatus,
  type Crop,
} from "./oracle/cardLayout";

interface Card {
  id: string;
  suit: { code: string; name: string; domain: string; icon: string };
  rank: string;
  title: string;
  image_file: string;
  image_prompt: string;
  crop?: { x: number; y: number; zoom?: number };
  uploaded?: boolean;
  crop_saved?: boolean;
  flavor: {
    easy: { line: string; npc: string; title: string };
    medium: { line: string; npc: string; title: string };
    hard: { line: string; npc: string; title: string };
  };
  prompts: { easy: string; medium: string; hard: string };
}

interface DeckData {
  deck_name: string;
  for: string;
  made_by: string;
  total_cards: number;
  published_version?: number;
  published_at?: string;
  publish_status?: string;
  cards: Card[];
}

// Map suit codes to the correct SVG icons (already verified working in browser)
const SUIT_SVG_FILES: Record<string, string> = {
  WU: "/images/oracle/icon-wake-up.svg",
  CU: "/images/oracle/icon-clean-up.svg",
  GU: "/images/oracle/icon-grow-up.svg",
  SU: "/images/oracle/icon-show-up.svg",
};

// Section header icons — same as card icons for consistency
const SUIT_HEADER_FILES: Record<string, string> = {
  WU: "/images/oracle/icon-wake-up.svg",
  CU: "/images/oracle/icon-clean-up.svg",
  GU: "/images/oracle/icon-grow-up.svg",
  SU: "/images/oracle/icon-show-up.svg",
};
// Section header: use the composed header PNG (left-aligned symbol on dark green)
const SuitIconImg = ({ code, size = 36 }: { code: string; size?: number }) => {
  const src = SUIT_HEADER_FILES[code];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{
        height: size,
        width: "auto",
        flexShrink: 0,
        objectFit: "contain",
      }}
    />
  );
};
// Card face header: same approach
const SuitIconFace = ({ code }: { code: string }) => (
  <div style={{
    width: 32,
    height: 32,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}>
    <img
      src={SUIT_SVG_FILES[code]}
      alt=""
      style={{
        width: 32,
        height: 32,
        objectFit: "contain",
      }}
    />
  </div>
);

type SingleEntry = "shuffle" | "grid";

function ModePreviewBar({ appMode }: { appMode: OracleAppMode }) {
  if (!import.meta.env.DEV) return null;
  const other = appMode === "reader" ? "editor" : "reader";
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto 1rem",
        padding: "0.45rem 0.75rem",
        background: "rgba(201, 168, 76, 0.12)",
        border: "1px solid #C9A84C55",
        borderRadius: 6,
        textAlign: "center",
        color: GOLD,
        fontFamily: "Georgia, serif",
        fontSize: "0.72rem",
      }}
    >
      {appMode === "reader" ? "Reader preview" : "Editor mode"}
      {" · "}
      <a href={modeToggleHref(other)} style={{ color: GOLD }}>
        Switch to {other}
      </a>
    </div>
  );
}

function chromeBtnStyle(primary = false, disabled = false): React.CSSProperties {
  return {
    background: primary ? GOLD : "transparent",
    border: primary ? "none" : `1px solid ${GOLD}`,
    borderRadius: 4,
    color: primary ? OPAQUE_GREEN : GOLD,
    fontFamily: "Georgia, serif",
    fontSize: "0.75rem",
    fontWeight: primary ? "bold" : "normal",
    padding: "0.4rem 1rem",
    cursor: disabled ? "default" : "pointer",
    letterSpacing: "0.05em",
    opacity: disabled ? 0.6 : 1,
  };
}

type EditorNotice = { kind: "success" | "error"; message: string };

async function postOracleJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: { ok?: boolean; error?: string };
  try {
    json = JSON.parse(text) as { ok?: boolean; error?: string };
  } catch {
    throw new Error(
      res.ok
        ? "Invalid server response"
        : "Save failed — API may be down. Restart with: cd dev && npm run dev"
    );
  }
  if (!res.ok || !json.ok) throw new Error(json.error || "Save failed");
  return json as { ok: boolean; error?: string };
}

function EditorNoticeBar({ notice }: { notice: EditorNotice | null }) {
  if (!notice) return null;
  return (
    <div
      style={{
        width: "100%",
        maxWidth: CARD_WIDTH,
        marginBottom: "0.75rem",
        padding: "0.5rem 0.75rem",
        borderRadius: 6,
        textAlign: "center",
        fontFamily: "Georgia, serif",
        fontSize: "0.78rem",
        color: notice.kind === "success" ? OPAQUE_GREEN : CREAM,
        background: notice.kind === "success" ? "rgba(92, 184, 138, 0.2)" : "rgba(232, 160, 144, 0.15)",
        border: `1px solid ${notice.kind === "success" ? "#5cb88a" : "#e8a090"}`,
      }}
      role="status"
    >
      {notice.message}
    </div>
  );
}

function DepthSelector({
  selectedDepth,
  onSelect,
  compact = false,
}: {
  selectedDepth: "easy" | "medium" | "hard";
  onSelect: (depth: "easy" | "medium" | "hard") => void;
  compact?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: compact ? "0.35rem" : "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
      {(["easy", "medium", "hard"] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onSelect(d)}
          style={{
            background: "transparent",
            border: `1px solid ${selectedDepth === d ? GOLD : "#C9A84C66"}`,
            borderRadius: 4,
            color: GOLD,
            fontFamily: "Georgia, serif",
            fontSize: compact ? "0.65rem" : "0.75rem",
            padding: compact ? "0.25rem 0.55rem" : "0.35rem 0.75rem",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          {d.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// public route — no auth required
export default function OracleDeck() {
  const [appMode] = useState<OracleAppMode>(() => getOracleAppMode());
  const isEditorMode = appMode === "editor";
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedDepth, setSelectedDepth] = useState<"easy" | "medium" | "hard">("hard");
  const [isFlipped, setIsFlipped] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [view, setView] = useState<ViewMode>(() => getInitialView(getOracleAppMode()));
  const [singleEntryFrom, setSingleEntryFrom] = useState<SingleEntry>("shuffle");
  const [greeting, setGreeting] = useState<string>("");
  const [friendContext, setFriendContext] = useState<string | null>(null);
  const [returnPath, setReturnPath] = useState<string>("/");
  const [savedAnswer, setSavedAnswer] = useState<string>("");
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<string>("");
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [framingMode, setFramingMode] = useState(false);
  const [draftCrop, setDraftCrop] = useState<Crop>(DEFAULT_CROP);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [framingBusy, setFramingBusy] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showCopyEditor, setShowCopyEditor] = useState(false);
  const [draftCopy, setDraftCopy] = useState<CardCopyDraft | null>(null);
  const [copyEditorDepth, setCopyEditorDepth] = useState<Depth>("hard");
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [imageCacheKey, setImageCacheKey] = useState(0);
  const [editorNotice, setEditorNotice] = useState<EditorNotice | null>(null);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [notPublished, setNotPublished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usePublishedAssets = appMode === "reader";

  useEffect(() => {
    if (!editorNotice) return;
    const timer = window.setTimeout(() => setEditorNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [editorNotice]);

  const refreshPublishStatus = useCallback(async () => {
    if (!isEditorMode) return null;
    const res = await fetch("/api/oracle/publish/status");
    const json = (await res.json()) as PublishStatus & { ok?: boolean };
    if (res.ok && json.ok !== false) {
      setPublishStatus(json);
      return json;
    }
    return null;
  }, [isEditorMode]);

  const refreshDeck = useCallback(async (cardId?: string) => {
    const fresh = (await fetch("/api/oracle/deck").then((r) => r.json())) as DeckData;
    setDeck(fresh);
    if (cardId) {
      const fromDeck = fresh.cards.find((c) => c.id === cardId);
      if (fromDeck) setSelectedCard(fromDeck);
    }
    return fresh;
  }, []);

  const startFraming = useCallback((crop: Crop = DEFAULT_CROP) => {
    setDraftCrop(clampCrop(crop));
    setFramingMode(true);
    setShowEditMenu(false);
    setShowCopyEditor(false);
    setDraftCopy(null);
    setCopyError(null);
    setShowContent(true);
    setSelectedDepth("hard");
    setIsFlipped(true);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!selectedCard) return;
      setUploadError(null);
      setUploadInProgress(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("cardId", selectedCard.id);
        const res = await fetch("/api/oracle/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Upload failed — try again");
        }
        await refreshDeck(selectedCard.id);
        setImageCacheKey(Date.now());
        startFraming(json.draftCrop ?? DEFAULT_CROP);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed — try again");
      } finally {
        setUploadInProgress(false);
      }
    },
    [selectedCard, refreshDeck, startFraming]
  );

  const handleSaveFraming = useCallback(async () => {
    if (!selectedCard) return;
    setFramingBusy(true);
    setEditorNotice(null);
    try {
      await postOracleJson("/api/oracle/crop", {
        cardId: selectedCard.id,
        crop: draftCrop,
      });
      await refreshDeck(selectedCard.id);
      setFramingMode(false);
      setEditorNotice({
        kind: "success",
        message: `${selectedCard.id} — framing saved. Card is ready to publish.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setEditorNotice({ kind: "error", message });
    } finally {
      setFramingBusy(false);
    }
  }, [selectedCard, draftCrop, refreshDeck]);

  const exitFraming = useCallback(() => {
    setFramingMode(false);
    setShowDiscardDialog(false);
  }, []);

  const handleCancelFraming = useCallback(() => {
    if (!selectedCard) return;
    if (selectedCard.crop_saved) {
      setDraftCrop(cropFromCard(selectedCard));
      exitFraming();
      return;
    }
    setShowDiscardDialog(true);
  }, [selectedCard, exitFraming]);

  const handleDiscardUpload = useCallback(async () => {
    if (!selectedCard) return;
    setFramingBusy(true);
    try {
      const res = await fetch("/api/oracle/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: selectedCard.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Discard failed");
      await refreshDeck(selectedCard.id);
      exitFraming();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Discard failed");
    } finally {
      setFramingBusy(false);
    }
  }, [selectedCard, refreshDeck, exitFraming]);

  const handleKeepUploadedImage = useCallback(() => {
    exitFraming();
  }, [exitFraming]);

  const handleAdjustFraming = useCallback(() => {
    if (!selectedCard) return;
    startFraming(cropFromCard(selectedCard));
  }, [selectedCard, startFraming]);

  const handleContinueFraming = useCallback(() => {
    startFraming(DEFAULT_CROP);
  }, [startFraming]);

  const handleOpenCopyEditor = useCallback(() => {
    if (!selectedCard) return;
    setDraftCopy(copyFromCard(selectedCard));
    setCopyEditorDepth(selectedDepth);
    setCopyError(null);
    setShowCopyEditor(true);
    setShowEditMenu(false);
  }, [selectedCard, selectedDepth]);

  const handleCancelCopyEditor = useCallback(() => {
    setShowCopyEditor(false);
    setDraftCopy(null);
    setCopyError(null);
  }, []);

  const handleSaveCopy = useCallback(async () => {
    if (!selectedCard || !draftCopy) return;
    setCopyBusy(true);
    setCopyError(null);
    setEditorNotice(null);
    try {
      await postOracleJson("/api/oracle/copy", {
        cardId: selectedCard.id,
        copy: draftCopy,
      });
      await refreshDeck(selectedCard.id);
      setShowCopyEditor(false);
      setDraftCopy(null);
      setEditorNotice({
        kind: "success",
        message: `${selectedCard.id} — copy saved.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setCopyError(message);
      setEditorNotice({ kind: "error", message });
    } finally {
      setCopyBusy(false);
    }
  }, [selectedCard, draftCopy, refreshDeck]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setEditorNotice(null);
    try {
      const res = await fetch("/api/oracle/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        published_version?: number;
        reader_url?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Publish failed");
      }
      await refreshDeck();
      await refreshPublishStatus();
      setEditorNotice({
        kind: "success",
        message: `Published v${json.published_version ?? "?"} — ${json.reader_url ?? READER_URL}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      setEditorNotice({ kind: "error", message });
    } finally {
      setPublishing(false);
    }
  }, [refreshDeck, refreshPublishStatus]);

  // Load deck data
  useEffect(() => {
    fetch(deckFetchUrl(appMode))
      .then(async (r) => {
        if (r.status === 404 && appMode === "reader") {
          setNotPublished(true);
          setLoading(false);
          return null;
        }
        if (!r.ok) throw new Error("Could not load deck.");
        return r.json() as Promise<DeckData>;
      })
      .then((d) => {
        if (!d) return;
        setDeck(d);
        setNotPublished(false);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load deck.");
        setLoading(false);
      });
  }, [appMode]);

  useEffect(() => {
    if (!isEditorMode) return;
    refreshPublishStatus().catch(() => {
      /* status is optional UI sugar */
    });
  }, [isEditorMode, refreshPublishStatus]);

  // Deep link: ?card=WU-A&depth=hard&from=Name
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get("card");
    const depth = params.get("depth") as "easy" | "medium" | "hard" | null;
    const from = params.get("from");
    const friend = params.get("friend");
    const returnTo = params.get("return");
    if (from) setGreeting(from);
    if (friend) setFriendContext(friend);
    if (returnTo) setReturnPath(returnTo);

    if (cardId && deck) {
      const card = deck.cards.find((c) => c.id === cardId);
      if (card) {
        setSelectedCard(card);
        setSelectedDepth(depth || "hard");
        setSingleEntryFrom("shuffle");
        setView("single");
        // Auto-flip after a short delay
        setTimeout(() => {
          setIsFlipped(true);
          if (depth) {
            setTimeout(() => setShowContent(true), 600);
          }
        }, 400);
      }
    }
  }, [deck]);

  const resetSingleCardState = useCallback(() => {
    setSelectedDepth("hard");
    setIsFlipped(false);
    setShowContent(false);
    setFramingMode(false);
    setShowDiscardDialog(false);
    setShowEditMenu(false);
    setShowCopyEditor(false);
    setDraftCopy(null);
    setCopyError(null);
    setUploadError(null);
    setUploadInProgress(false);
  }, []);

  const handleShuffle = useCallback(() => {
    if (!deck) return;
    const random = deck.cards[Math.floor(Math.random() * deck.cards.length)];
    setSelectedCard(random);
    resetSingleCardState();
    setSingleEntryFrom("shuffle");
    setView("single");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [deck, resetSingleCardState]);

  const handleGoToBrowse = useCallback(() => {
    setSelectedCard(null);
    resetSingleCardState();
    setView("grid");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetSingleCardState]);

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
    resetSingleCardState();
    setSingleEntryFrom("grid");
    setView("single");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetSingleCardState]);

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleDepthSelect = useCallback((depth: "easy" | "medium" | "hard") => {
    setSelectedDepth(depth);
    setShowContent(true);
  }, []);

  const handleDrawAgain = useCallback(() => {
    if (!deck) return;
    const pool = deck.cards.length > 1 && selectedCard
      ? deck.cards.filter((c) => c.id !== selectedCard.id)
      : deck.cards;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCard(random);
    resetSingleCardState();
    setSingleEntryFrom("shuffle");
    setView("single");
  }, [deck, selectedCard, resetSingleCardState]);

  const handleBackToGrid = useCallback(() => {
    setView("grid");
    setSelectedCard(null);
    resetSingleCardState();
  }, [resetSingleCardState]);

  const handleBackToShuffle = useCallback(() => {
    setView("shuffle");
    setSelectedCard(null);
    resetSingleCardState();
  }, [resetSingleCardState]);

  const handleBackFromSingle = useCallback(() => {
    if (isEditorMode) {
      handleBackToGrid();
    } else if (singleEntryFrom === "grid") {
      handleGoToBrowse();
    } else {
      handleBackToShuffle();
    }
  }, [isEditorMode, singleEntryFrom, handleBackToGrid, handleGoToBrowse, handleBackToShuffle]);

  const handleShare = useCallback(() => {
    if (!selectedCard) return;
    const params = new URLSearchParams({
      card: selectedCard.id,
      depth: selectedDepth,
      from: greeting || "Someone",
    });
    const url = `${window.location.origin}/oracle?${params.toString()}`;
    if (navigator.share) {
      navigator.share({ title: "Oracle Card", url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  }, [selectedCard, selectedDepth, greeting]);

  const handleSaveToFriend = useCallback(() => {
    if (!selectedCard || !friendContext) return;
    setShowAnswerInput(true);
  }, [selectedCard, friendContext]);

  const handleConfirmSave = useCallback(() => {
    if (!selectedCard || !friendContext || !pendingAnswer.trim()) return;
    const entry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      cardId: selectedCard.id,
      suit: selectedCard.suit.code.slice(0, 2).toLowerCase() as "wu" | "cu" | "gu" | "su",
      rank: selectedCard.rank,
      depth: selectedDepth,
      answer: pendingAnswer.trim(),
      answeredAt: new Date().toISOString(),
    };
    // Load friendcraft deck from localStorage
    const stored = localStorage.getItem("friendcraft_deck");
    const deck_data = stored ? JSON.parse(stored) : [];
    const friendIdx = deck_data.findIndex((f: { name: string }) => f.name === friendContext);
    if (friendIdx !== -1) {
      if (!deck_data[friendIdx].provenance) deck_data[friendIdx].provenance = [];
      deck_data[friendIdx].provenance.push(entry);
      localStorage.setItem("friendcraft_deck", JSON.stringify(deck_data));
    }

    // Redirect back
    const returnUrl = `${returnPath}?saved=true&friend=${encodeURIComponent(friendContext)}`;
    window.location.href = returnUrl;
  }, [selectedCard, friendContext, pendingAnswer, selectedDepth, returnPath]);

  const handleCancelSave = useCallback(() => {
    setShowAnswerInput(false);
    setPendingAnswer("");
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F3B2F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#C9A84C", fontFamily: "Georgia, serif" }}>Dealing the deck...</p>
      </div>
    );
  }

  if (notPublished) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F3B2F", padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {isReaderPreviewInDev(appMode) && <ModePreviewBar appMode={appMode} />}
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "1.25rem", letterSpacing: "0.1em", margin: "0 0 1rem" }}>
            DECK NOT PUBLISHED YET
          </h1>
          <p style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "0.9rem", lineHeight: 1.6, opacity: 0.85, margin: "0 0 1.25rem" }}>
            This deck hasn&apos;t been published yet. When it is, you&apos;ll be able to shuffle and draw here.
          </p>
          {import.meta.env.DEV && (
            <a href={modeToggleHref("editor")} style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.85rem" }}>
              Open editor to publish
            </a>
          )}
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F3B2F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#F6F1E8", fontFamily: "Georgia, serif" }}>{error || "Deck unavailable."}</p>
      </div>
    );
  }

  // === READER SHUFFLE HOME ===
  if (!isEditorMode && view === "shuffle") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F3B2F", padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {isReaderPreviewInDev(appMode) && <ModePreviewBar appMode={appMode} />}
        <div style={{ textAlign: "center", marginBottom: "2rem", maxWidth: 480 }}>
          <h1 style={{ color: "#C9A84C", fontFamily: "Georgia, serif", fontSize: "1.5rem", letterSpacing: "0.15em", margin: "0 0 0.5rem" }}>
            THE ORACLE AT THE EDGE OF THE KNOWN WORLD
          </h1>
          <p style={{ color: "#C9A84C", fontFamily: "Georgia, serif", fontSize: "0.8rem", opacity: 0.7, margin: "0 0 1rem" }}>
            A deck for {deck.for} · Made by {deck.made_by}
          </p>
          <p style={{ color: "#F6F1E8", fontFamily: "Georgia, serif", fontSize: "0.9rem", lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
            Shuffle the deck and draw a card. Choose your depth. Share with someone you love.
          </p>
        </div>

        <div style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem", boxShadow: "0 8px 32px rgba(0,0,0,0.35)" }}>
          <img src="/images/oracle/card-back.png" alt="Oracle card back" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <button type="button" onClick={handleShuffle} style={chromeBtnStyle(true)}>Shuffle</button>
          <button
            type="button"
            onClick={handleGoToBrowse}
            style={{ background: "transparent", border: "none", color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.8rem", cursor: "pointer", opacity: 0.75, textDecoration: "underline" }}
          >
            Browse the deck
          </button>
        </div>
      </div>
    );
  }

  // === GRID / BROWSE VIEW ===
  if (view === "grid") {
    const cardsReady = deck.cards.filter(isCardDone).length;
    const statusColor = (status: ReturnType<typeof cardEditorStatus>) =>
      status === "done" ? "#5cb88a" : status === "needs_framing" ? "#d4a84c" : "#888888";
    const statusLabel = (status: ReturnType<typeof cardEditorStatus>) =>
      status === "done" ? "Done" : status === "needs_framing" ? "Needs framing" : "Needs art";

    return (
      <div style={{ minHeight: "100vh", background: "#0F3B2F", padding: "2rem 1rem" }}>
        {import.meta.env.DEV && <ModePreviewBar appMode={appMode} />}
        {isEditorMode && <EditorNoticeBar notice={editorNotice} />}
        {!isEditorMode && (
          <button
            type="button"
            onClick={handleBackToShuffle}
            style={{ background: "transparent", border: "none", color: GOLD, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "0.8rem", marginBottom: "1rem", opacity: 0.7 }}
          >
            ← Shuffle
          </button>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ color: "#C9A84C", fontFamily: "Georgia, serif", fontSize: "1.5rem", letterSpacing: "0.15em", margin: "0 0 0.5rem" }}>
            THE ORACLE AT THE EDGE OF THE KNOWN WORLD
          </h1>
          <p style={{ color: "#C9A84C", fontFamily: "Georgia, serif", fontSize: "0.8rem", opacity: 0.7, margin: "0 0 0.35rem" }}>
            A deck for {deck.for} · Made by {deck.made_by}
          </p>
          {isEditorMode && (
            <>
              <p style={{ color: "#F6F1E8", fontFamily: "Georgia, serif", fontSize: "0.75rem", opacity: 0.65, margin: "0 0 0.75rem" }}>
                {cardsReady} / {deck.total_cards} cards ready to publish
              </p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={cardsReady < deck.total_cards || publishing}
                  style={chromeBtnStyle(true, cardsReady < deck.total_cards || publishing)}
                >
                  {publishing ? "Publishing…" : "Publish deck"}
                </button>
                {publishStatus?.has_published_snapshot && publishStatus.published_at ? (
                  <p style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.68rem", opacity: 0.7, margin: 0 }}>
                    Live v{publishStatus.published_version} ·{" "}
                    {new Date(publishStatus.published_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                ) : (
                  <p style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.68rem", opacity: 0.55, margin: 0 }}>
                    Not published yet
                  </p>
                )}
                {publishStatus?.has_published_snapshot && (
                  <p style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "0.65rem", opacity: 0.55, margin: 0 }}>
                    Reader:{" "}
                    <a href={READER_URL} style={{ color: GOLD }}>
                      {READER_URL.replace("https://", "")}
                    </a>
                    {" · "}
                    <a href={modeToggleHref("reader")} style={{ color: GOLD }}>
                      Preview locally
                    </a>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div style={{ maxWidth: 480, margin: "0 auto 2rem", textAlign: "center" }}>
          <p style={{ color: "#F6F1E8", fontFamily: "Georgia, serif", fontSize: "0.9rem", lineHeight: 1.6, opacity: 0.8 }}>
            {isEditorMode
              ? "Click any card to preview and edit. Upload art, adjust framing, and track progress."
              : "Browse all 52 cards. Tap any card to draw it."}
          </p>
        </div>

        {/* Suit groups */}
        {(["WU", "CU", "GU", "SU"] as const).map((suitCode) => {
          const suitCards = deck.cards.filter((c) => c.suit.code === suitCode);
          const suitName = suitCards[0]?.suit.name;
          return (
            <div key={suitCode} style={{ maxWidth: 900, margin: "0 auto 2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", paddingLeft: "0.25rem", color: "#C9A84C" }}>
                <SuitIconImg code={suitCode} size={36} />
                <h2 style={{ color: "#C9A84C", fontFamily: "Georgia, serif", fontSize: "0.85rem", letterSpacing: "0.12em", margin: 0 }}>{suitName.toUpperCase()}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem" }}>
                {suitCards.map((card) => {
                  const status = cardEditorStatus(card);
                  return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    title={isEditorMode ? statusLabel(status) : undefined}
                    style={{
                      background: "transparent",
                      border: "1px solid #C9A84C",
                      borderRadius: 8,
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      overflow: "hidden",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {/* Mini card preview */}
                    <div style={{ background: "#111", aspectRatio: "2.5/3.5", position: "relative", overflow: "hidden" }}>
                      {isEditorMode && (
                        <span
                          style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: statusColor(status),
                            zIndex: 2,
                            boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
                          }}
                          aria-hidden
                        />
                      )}
                      <img
                        src="/images/oracle/card-back.png"
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                      />
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "0.4rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ color: "#C9A84C", fontFamily: "Georgia, serif", fontSize: "0.65rem" }}>{card.rank}</span>
                        </div>
                        <p style={{ color: "#F6F1E8", fontFamily: "Georgia, serif", fontSize: "0.6rem", lineHeight: 1.3, margin: 0, textAlign: "center" }}>
                          {card.title}
                        </p>
                      </div>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // === SINGLE CARD VIEW ===
  if (!selectedCard) return null;

  const hardFlavor = selectedCard.flavor.hard;
  const hardPrompt = selectedCard.prompts?.hard;
  const previewFlavor = framingMode ? hardFlavor : selectedCard.flavor[selectedDepth];
  const previewPrompt = framingMode ? hardPrompt : selectedCard.prompts?.[selectedDepth];
  const displayCrop = framingMode
    ? draftCrop
    : selectedCard.crop_saved
      ? cropFromCard(selectedCard)
      : DEFAULT_CROP;
  const oracleImage =
    selectedCard.uploaded && selectedCard.image_file?.startsWith("/images/oracle/")
      ? selectedCard.image_file
      : null;
  const oracleImageSrc = oracleImage
    ? oracleAssetUrl(oracleImage, {
        usePublished: usePublishedAssets,
        cacheKey: isEditorMode ? imageCacheKey : undefined,
        publishedVersion: usePublishedAssets ? (deck.published_version ?? 0) : undefined,
      })
    : null;
  const cardReady = isCardDone(selectedCard);
  const needsFraming = Boolean(oracleImage && selectedCard.uploaded && !selectedCard.crop_saved);
  const backLabel = isEditorMode
    ? "← All cards"
    : singleEntryFrom === "grid"
      ? "← Browse"
      : "← Shuffle";

  return (
    <div style={{ minHeight: "100vh", background: OPAQUE_GREEN, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {import.meta.env.DEV && <ModePreviewBar appMode={appMode} />}
      {isEditorMode && <EditorNoticeBar notice={editorNotice} />}
      <button
        onClick={handleBackFromSingle}
        style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: GOLD, cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "0.8rem", marginBottom: "1rem", opacity: 0.7 }}
      >
        {backLabel}
      </button>

      {greeting && (
        <p style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "0.85rem", textAlign: "center", marginBottom: "1rem", fontStyle: "italic", opacity: 0.8 }}>
          {greeting} shared this Oracle card with you. Choose your depth.
        </p>
      )}

      {friendContext && (
        <div style={{
          width: "100%", maxWidth: CARD_WIDTH, marginBottom: "1rem",
          background: OPAQUE_GREEN, border: "1px solid #C9A84C44",
          borderRadius: 8, padding: "0.6rem 1rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.85rem" }}>
            Drawing for {friendContext}
          </span>
          <a href={returnPath} style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.75rem", textDecoration: "none", opacity: 0.7 }}>
            ← Back
          </a>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        disabled={uploadInProgress}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handleFileUpload(file);
          e.target.value = "";
        }}
      />

      <div style={{ width: CARD_WIDTH, height: CARD_HEIGHT, perspective: 1200, position: "relative" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s ease",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              borderRadius: 12,
              overflow: "hidden",
              cursor: isFlipped ? "default" : "pointer",
            }}
            onClick={!isFlipped ? handleFlip : undefined}
          >
            <img src="/images/oracle/card-back.png" alt="Card back" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "#111",
              borderRadius: 12,
              border: `1px solid ${GOLD}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header — opaque */}
            <div style={{
              height: ZONE_HEADER_H,
              flexShrink: 0,
              background: OPAQUE_GREEN,
              borderBottom: `1px solid ${GOLD}`,
              padding: "0 0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: GOLD }}>
                <SuitIconFace code={selectedCard.suit.code} />
                <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.7rem", letterSpacing: "0.08em" }}>
                  {selectedCard.suit.name.toUpperCase()}
                </span>
              </div>
              <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.75rem" }}>{selectedCard.rank}</span>
            </div>

            <ImageBand
              src={oracleImageSrc}
              crop={displayCrop}
              interactive={framingMode && Boolean(oracleImage)}
              onCropChange={framingMode ? setDraftCrop : undefined}
              placeholder={
                !oracleImage ? (
                  <div style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background: "rgba(17,17,17,0.85)",
                  }}>
                    {!uploadInProgress && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            background: "transparent", border: `1px solid ${GOLD}`, borderRadius: 8,
                            color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.85rem",
                            padding: "0.75rem 1.25rem", cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                          }}
                        >
                          <span>Add image</span>
                          <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>tap to choose file</span>
                        </button>
                        {uploadError && (
                          <span style={{ fontSize: "0.65rem", color: "#e8a090", textAlign: "center", maxWidth: "80%" }}>{uploadError}</span>
                        )}
                      </>
                    )}
                    {uploadInProgress && (
                      <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.85rem" }}>Uploading…</span>
                    )}
                  </div>
                ) : null
              }
            />

            {/* Title — opaque */}
            <div style={{
              height: ZONE_TITLE_H,
              flexShrink: 0,
              background: OPAQUE_GREEN,
              borderTop: `1px solid ${GOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: `0 ${ZONE_TITLE_PADDING_X}`,
              boxSizing: "border-box",
            }}>
              <p style={{
                color: CREAM,
                fontFamily: "Georgia, serif",
                fontSize: "0.68rem",
                margin: 0,
                textAlign: "center",
                letterSpacing: "0.04em",
                lineHeight: 1.15,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}>
                {selectedCard.title.toUpperCase()}
              </p>
            </div>

            {/* Content — fixed height */}
            <div style={{
              height: ZONE_CONTENT_H,
              flexShrink: 0,
              background: "rgba(17,17,17,0.95)",
              padding: "0.45rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: showContent || framingMode ? "flex-start" : "center",
              gap: "0.25rem",
              overflow: "hidden",
              boxSizing: "border-box",
            }}>
              {!showContent && !framingMode && (
                <p style={{
                  color: GOLD,
                  fontFamily: "Georgia, serif",
                  fontSize: "0.65rem",
                  textAlign: "center",
                  margin: 0,
                  opacity: 0.55,
                  lineHeight: 1.3,
                }}>
                  Choose your depth below
                </p>
              )}

              {(showContent || framingMode) && (
                <>
                  {previewPrompt ? (
                    <p style={{
                      color: CREAM,
                      fontFamily: "Georgia, serif",
                      fontSize: "0.72rem",
                      textAlign: "center",
                      margin: 0,
                      lineHeight: 1.3,
                      overflowWrap: "break-word",
                    }}>
                      {previewPrompt}
                    </p>
                  ) : null}
                  <div style={{ textAlign: "center", minWidth: 0, marginTop: previewPrompt ? "0.15rem" : 0 }}>
                    <p style={{
                      color: CREAM,
                      fontFamily: "Georgia, serif",
                      fontSize: "0.68rem",
                      fontStyle: "italic",
                      margin: "0 0 0.1rem",
                      lineHeight: 1.3,
                      overflowWrap: "break-word",
                    }}>
                      "{previewFlavor.line}"
                    </p>
                    <p style={{
                      color: GOLD,
                      fontFamily: "Georgia, serif",
                      fontSize: "0.56rem",
                      margin: 0,
                      opacity: 0.85,
                      lineHeight: 1.2,
                      overflowWrap: "break-word",
                    }}>
                      — {previewFlavor.npc}, {previewFlavor.title}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!framingMode && !isFlipped && (
        <button
          type="button"
          onClick={handleFlip}
          style={{
            marginTop: "0.75rem",
            background: "transparent",
            border: "none",
            color: GOLD,
            fontFamily: "Georgia, serif",
            fontSize: "0.75rem",
            opacity: 0.6,
            cursor: "pointer",
            padding: "0.25rem 0.5rem",
          }}
        >
          Tap to flip
        </button>
      )}

      {isFlipped && !framingMode && (
        <div style={{ marginTop: "0.75rem", width: CARD_WIDTH, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
          <DepthSelector selectedDepth={selectedDepth} onSelect={handleDepthSelect} />
        </div>
      )}

      {/* Digital chrome — below card */}
      {framingMode && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", width: CARD_WIDTH }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              type="button"
              disabled={framingBusy || draftCrop.zoom <= ZOOM_MIN}
              onClick={() => setDraftCrop((c) => clampCrop({ ...c, zoom: c.zoom - ZOOM_STEP }))}
              style={chromeBtnStyle(false, framingBusy)}
            >
              −
            </button>
            <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.7rem", minWidth: 48, textAlign: "center" }}>
              {draftCrop.zoom.toFixed(1)}×
            </span>
            <button
              type="button"
              disabled={framingBusy || draftCrop.zoom >= ZOOM_MAX}
              onClick={() => setDraftCrop((c) => clampCrop({ ...c, zoom: c.zoom + ZOOM_STEP }))}
              style={chromeBtnStyle(false, framingBusy)}
            >
              +
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
            <button type="button" onClick={handleSaveFraming} disabled={framingBusy} style={chromeBtnStyle(true, framingBusy)}>Save</button>
            <button type="button" onClick={handleCancelFraming} disabled={framingBusy} style={chromeBtnStyle(false, framingBusy)}>Cancel</button>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={framingBusy} style={chromeBtnStyle(false, framingBusy)}>Choose different image</button>
          </div>
        </div>
      )}

      {showDiscardDialog && (
        <div style={{
          marginTop: "0.75rem",
          width: CARD_WIDTH,
          background: "rgba(17,17,17,0.95)",
          border: `1px solid ${GOLD}`,
          borderRadius: 8,
          padding: "0.75rem",
          textAlign: "center",
        }}>
          <p style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "0.8rem", margin: "0 0 0.75rem" }}>
            Discard this upload?
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <button type="button" onClick={handleDiscardUpload} disabled={framingBusy} style={chromeBtnStyle(true, framingBusy)}>Discard</button>
            <button type="button" onClick={handleKeepUploadedImage} disabled={framingBusy} style={chromeBtnStyle(false, framingBusy)}>Keep image</button>
          </div>
        </div>
      )}

      {isEditorMode && !framingMode && isFlipped && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", width: CARD_WIDTH }}>
          {oracleImage && cardReady && (
            <>
              {!showEditMenu ? (
                <button type="button" onClick={() => setShowEditMenu(true)} style={chromeBtnStyle()}>Edit card</button>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadInProgress} style={chromeBtnStyle(false, uploadInProgress)}>Replace image</button>
                  <button type="button" onClick={handleAdjustFraming} style={chromeBtnStyle()}>Adjust framing</button>
                  <button type="button" onClick={() => setShowEditMenu(false)} style={chromeBtnStyle()}>Close</button>
                </div>
              )}
            </>
          )}
          {needsFraming && (
            <button type="button" onClick={handleContinueFraming} style={chromeBtnStyle(true)}>Continue framing</button>
          )}
          {!showCopyEditor && (
            <button type="button" onClick={handleOpenCopyEditor} style={chromeBtnStyle()}>Edit copy</button>
          )}
          {showCopyEditor && draftCopy && (
            <CopyEditorPanel
              draft={draftCopy}
              activeDepth={copyEditorDepth}
              busy={copyBusy}
              error={copyError}
              onDepthChange={setCopyEditorDepth}
              onDraftChange={setDraftCopy}
              onSave={handleSaveCopy}
              onCancel={handleCancelCopyEditor}
            />
          )}
        </div>
      )}

      {!framingMode && showContent && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          {friendContext ? (
            <>
              <button onClick={handleSaveToFriend} style={chromeBtnStyle(true)}>Save to {friendContext}</button>
              <button onClick={handleDrawAgain} style={chromeBtnStyle()}>{isEditorMode ? "Draw Again" : "Shuffle again"}</button>
            </>
          ) : (
            <>
              <button onClick={handleShare} style={chromeBtnStyle()}>Share</button>
              <button onClick={handleDrawAgain} style={chromeBtnStyle()}>{isEditorMode ? "Draw Again" : "Shuffle again"}</button>
              {!isEditorMode && (
                <button type="button" onClick={handleGoToBrowse} style={chromeBtnStyle()}>Browse deck</button>
              )}
            </>
          )}
        </div>
      )}

      {showAnswerInput && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{ background: "#1a1a1a", border: `1px solid ${GOLD}`, borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 400 }}>
            <p style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "center" }}>
              Your answer for {friendContext}
            </p>
            <textarea
              value={pendingAnswer}
              onChange={(e) => setPendingAnswer(e.target.value)}
              placeholder="What came up for you?"
              autoFocus
              style={{
                width: "100%", minHeight: 120, background: "#111",
                border: "1px solid #C9A84C44", borderRadius: 8,
                color: CREAM, fontFamily: "Georgia, serif",
                fontSize: "0.85rem", padding: "0.75rem",
                resize: "vertical", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1rem" }}>
              <button onClick={handleCancelSave} style={chromeBtnStyle()}>Cancel</button>
              <button onClick={handleConfirmSave} disabled={!pendingAnswer.trim()} style={chromeBtnStyle(true, !pendingAnswer.trim())}>Save to {friendContext}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}