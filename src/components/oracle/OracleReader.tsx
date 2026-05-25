"use client";

import {
  CARD_BACK,
  cardImageSrc,
  DECK_URL,
  suitIconPath,
} from "@/lib/oracle/assets";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  CREAM,
  cropFromCard,
  DEFAULT_CROP,
  GOLD,
  OPAQUE_GREEN,
  ZONE_CONTENT_H,
  ZONE_HEADER_H,
  ZONE_TITLE_H,
  ZONE_TITLE_PADDING_X,
} from "@/lib/oracle/cardLayout";
import { ImageBand } from "@/components/oracle/ImageBand";
import { useCallback, useEffect, useState } from "react";

type Depth = "easy" | "medium" | "hard";

interface Card {
  id: string;
  suit: { code: string; name: string; domain?: string; icon: string };
  rank: string;
  title: string;
  image_file: string;
  crop?: { x: number; y: number; zoom?: number };
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
  total_cards?: number;
  cards: Card[];
}

type ViewMode = "shuffle" | "grid" | "single";
type SingleEntry = "shuffle" | "grid";

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

function DepthSelector({
  selectedDepth,
  onSelect,
}: {
  selectedDepth: Depth;
  onSelect: (depth: Depth) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
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
            fontSize: "0.75rem",
            padding: "0.35rem 0.75rem",
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

function SuitIconImg({ code, size = 36 }: { code: string; size?: number }) {
  const src = suitIconPath(code);
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
}

function SuitIconFace({ code }: { code: string }) {
  const src = suitIconPath(code);
  if (!src) return null;
  return (
    <div
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          width: 32,
          height: 32,
          objectFit: "contain",
        }}
      />
    </div>
  );
}

export function OracleReader() {
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedDepth, setSelectedDepth] = useState<Depth>("hard");
  const [isFlipped, setIsFlipped] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [view, setView] = useState<ViewMode>("shuffle");
  const [singleEntryFrom, setSingleEntryFrom] = useState<SingleEntry>("shuffle");
  const [greeting, setGreeting] = useState("");
  const [friendContext, setFriendContext] = useState<string | null>(null);
  const [returnPath, setReturnPath] = useState("/");
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState("");

  useEffect(() => {
    fetch(DECK_URL)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load deck.");
        return r.json() as Promise<DeckData>;
      })
      .then((d) => {
        setDeck(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load deck.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get("card");
    const depth = params.get("depth") as Depth | null;
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

  const handleCardClick = useCallback(
    (card: Card) => {
      setSelectedCard(card);
      resetSingleCardState();
      setSingleEntryFrom("grid");
      setView("single");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [resetSingleCardState]
  );

  const handleFlip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleDepthSelect = useCallback((depth: Depth) => {
    setSelectedDepth(depth);
    setShowContent(true);
  }, []);

  const handleDrawAgain = useCallback(() => {
    if (!deck) return;
    const pool =
      deck.cards.length > 1 && selectedCard
        ? deck.cards.filter((c) => c.id !== selectedCard.id)
        : deck.cards;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCard(random);
    resetSingleCardState();
    setSingleEntryFrom("shuffle");
    setView("single");
  }, [deck, selectedCard, resetSingleCardState]);

  const handleBackToShuffle = useCallback(() => {
    setView("shuffle");
    setSelectedCard(null);
    resetSingleCardState();
  }, [resetSingleCardState]);

  const handleBackFromSingle = useCallback(() => {
    if (singleEntryFrom === "grid") {
      handleGoToBrowse();
    } else {
      handleBackToShuffle();
    }
  }, [singleEntryFrom, handleGoToBrowse, handleBackToShuffle]);

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
    const stored = localStorage.getItem("friendcraft_deck");
    const deckData = stored ? JSON.parse(stored) : [];
    const friendIdx = deckData.findIndex((f: { name: string }) => f.name === friendContext);
    if (friendIdx !== -1) {
      if (!deckData[friendIdx].provenance) deckData[friendIdx].provenance = [];
      deckData[friendIdx].provenance.push(entry);
      localStorage.setItem("friendcraft_deck", JSON.stringify(deckData));
    }
    window.location.href = `${returnPath}?saved=true&friend=${encodeURIComponent(friendContext)}`;
  }, [selectedCard, friendContext, pendingAnswer, selectedDepth, returnPath]);

  const handleCancelSave = useCallback(() => {
    setShowAnswerInput(false);
    setPendingAnswer("");
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: OPAQUE_GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: GOLD, fontFamily: "Georgia, serif" }}>Dealing the deck...</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: OPAQUE_GREEN,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: CREAM, fontFamily: "Georgia, serif" }}>
          {error || "Deck unavailable."}
        </p>
      </div>
    );
  }

  if (view === "shuffle") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: OPAQUE_GREEN,
          padding: "2rem 1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem", maxWidth: 480 }}>
          <h1
            style={{
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: "1.5rem",
              letterSpacing: "0.15em",
              margin: "0 0 0.5rem",
            }}
          >
            THE ORACLE AT THE EDGE OF THE KNOWN WORLD
          </h1>
          <p
            style={{
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: "0.8rem",
              opacity: 0.7,
              margin: "0 0 1rem",
            }}
          >
            A deck for {deck.for} · Made by {deck.made_by}
          </p>
          <p
            style={{
              color: CREAM,
              fontFamily: "Georgia, serif",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              opacity: 0.8,
              margin: 0,
            }}
          >
            Shuffle the deck and draw a card. Choose your depth. Share with someone you love.
          </p>
        </div>

        <div
          style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: "1.5rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          }}
        >
          <img
            src={CARD_BACK}
            alt="Oracle card back"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <button type="button" onClick={handleShuffle} style={chromeBtnStyle(true)}>
            Shuffle
          </button>
          <button
            type="button"
            onClick={handleGoToBrowse}
            style={{
              background: "transparent",
              border: "none",
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: "0.8rem",
              cursor: "pointer",
              opacity: 0.75,
              textDecoration: "underline",
            }}
          >
            Browse the deck
          </button>
        </div>
      </div>
    );
  }

  if (view === "grid") {
    return (
      <div style={{ minHeight: "100vh", background: OPAQUE_GREEN, padding: "2rem 1rem" }}>
        <button
          type="button"
          onClick={handleBackToShuffle}
          style={{
            background: "transparent",
            border: "none",
            color: GOLD,
            cursor: "pointer",
            fontFamily: "Georgia, serif",
            fontSize: "0.8rem",
            marginBottom: "1rem",
            opacity: 0.7,
          }}
        >
          ← Shuffle
        </button>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: "1.5rem",
              letterSpacing: "0.15em",
              margin: "0 0 0.5rem",
            }}
          >
            THE ORACLE AT THE EDGE OF THE KNOWN WORLD
          </h1>
          <p
            style={{
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: "0.8rem",
              opacity: 0.7,
              margin: 0,
            }}
          >
            A deck for {deck.for} · Made by {deck.made_by}
          </p>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto 2rem", textAlign: "center" }}>
          <p
            style={{
              color: CREAM,
              fontFamily: "Georgia, serif",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              opacity: 0.8,
            }}
          >
            Browse all 52 cards. Tap any card to draw it.
          </p>
        </div>

        {(["WU", "CU", "GU", "SU"] as const).map((suitCode) => {
          const suitCards = deck.cards.filter((c) => c.suit.code === suitCode);
          const suitName = suitCards[0]?.suit.name;
          return (
            <div key={suitCode} style={{ maxWidth: 900, margin: "0 auto 2rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                  paddingLeft: "0.25rem",
                  color: GOLD,
                }}
              >
                <SuitIconImg code={suitCode} size={36} />
                <h2
                  style={{
                    color: GOLD,
                    fontFamily: "Georgia, serif",
                    fontSize: "0.85rem",
                    letterSpacing: "0.12em",
                    margin: 0,
                  }}
                >
                  {suitName.toUpperCase()}
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {suitCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleCardClick(card)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${GOLD}`,
                      borderRadius: 8,
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      overflow: "hidden",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <div
                      style={{
                        background: "#111",
                        aspectRatio: "2.5/3.5",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={CARD_BACK}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "0.4rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.65rem" }}>
                            {card.rank}
                          </span>
                        </div>
                        <p
                          style={{
                            color: CREAM,
                            fontFamily: "Georgia, serif",
                            fontSize: "0.6rem",
                            lineHeight: 1.3,
                            margin: 0,
                            textAlign: "center",
                          }}
                        >
                          {card.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (!selectedCard) return null;

  const previewFlavor = selectedCard.flavor[selectedDepth];
  const previewPrompt = selectedCard.prompts?.[selectedDepth];
  const displayCrop = selectedCard.crop_saved ? cropFromCard(selectedCard) : DEFAULT_CROP;
  const oracleImageSrc = cardImageSrc(selectedCard.image_file);
  const backLabel = singleEntryFrom === "grid" ? "← Browse" : "← Shuffle";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: OPAQUE_GREEN,
        padding: "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        onClick={handleBackFromSingle}
        style={{
          alignSelf: "flex-start",
          background: "transparent",
          border: "none",
          color: GOLD,
          cursor: "pointer",
          fontFamily: "Georgia, serif",
          fontSize: "0.8rem",
          marginBottom: "1rem",
          opacity: 0.7,
        }}
      >
        {backLabel}
      </button>

      {greeting && (
        <p
          style={{
            color: CREAM,
            fontFamily: "Georgia, serif",
            fontSize: "0.85rem",
            textAlign: "center",
            marginBottom: "1rem",
            fontStyle: "italic",
            opacity: 0.8,
          }}
        >
          {greeting} shared this Oracle card with you. Choose your depth.
        </p>
      )}

      {friendContext && (
        <div
          style={{
            width: "100%",
            maxWidth: CARD_WIDTH,
            marginBottom: "1rem",
            background: OPAQUE_GREEN,
            border: "1px solid #C9A84C44",
            borderRadius: 8,
            padding: "0.6rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.85rem" }}>
            Drawing for {friendContext}
          </span>
          <a
            href={returnPath}
            style={{
              color: GOLD,
              fontFamily: "Georgia, serif",
              fontSize: "0.75rem",
              textDecoration: "none",
              opacity: 0.7,
            }}
          >
            ← Back
          </a>
        </div>
      )}

      <div
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          perspective: 1200,
          position: "relative",
        }}
      >
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
            onKeyDown={
              !isFlipped
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") handleFlip();
                  }
                : undefined
            }
            role={!isFlipped ? "button" : undefined}
            tabIndex={!isFlipped ? 0 : undefined}
          >
            <img
              src={CARD_BACK}
              alt="Card back"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
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
            <div
              style={{
                height: ZONE_HEADER_H,
                flexShrink: 0,
                background: OPAQUE_GREEN,
                borderBottom: `1px solid ${GOLD}`,
                padding: "0 0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: GOLD }}>
                <SuitIconFace code={selectedCard.suit.code} />
                <span
                  style={{
                    color: GOLD,
                    fontFamily: "Georgia, serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  {selectedCard.suit.name.toUpperCase()}
                </span>
              </div>
              <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "0.75rem" }}>
                {selectedCard.rank}
              </span>
            </div>

            <ImageBand src={oracleImageSrc} crop={displayCrop} />

            <div
              style={{
                height: ZONE_TITLE_H,
                flexShrink: 0,
                background: OPAQUE_GREEN,
                borderTop: `1px solid ${GOLD}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: `0 ${ZONE_TITLE_PADDING_X}`,
                boxSizing: "border-box",
              }}
            >
              <p
                style={{
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
                }}
              >
                {selectedCard.title.toUpperCase()}
              </p>
            </div>

            <div
              style={{
                height: ZONE_CONTENT_H,
                flexShrink: 0,
                background: "rgba(17,17,17,0.95)",
                padding: "0.45rem 0.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: showContent ? "flex-start" : "center",
                gap: "0.25rem",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {!showContent && (
                <p
                  style={{
                    color: GOLD,
                    fontFamily: "Georgia, serif",
                    fontSize: "0.65rem",
                    textAlign: "center",
                    margin: 0,
                    opacity: 0.55,
                    lineHeight: 1.3,
                  }}
                >
                  Choose your depth below
                </p>
              )}

              {showContent && (
                <>
                  {previewPrompt ? (
                    <p
                      style={{
                        color: CREAM,
                        fontFamily: "Georgia, serif",
                        fontSize: "0.72rem",
                        textAlign: "center",
                        margin: 0,
                        lineHeight: 1.3,
                        overflowWrap: "break-word",
                      }}
                    >
                      {previewPrompt}
                    </p>
                  ) : null}
                  <div
                    style={{
                      textAlign: "center",
                      minWidth: 0,
                      marginTop: previewPrompt ? "0.15rem" : 0,
                    }}
                  >
                    <p
                      style={{
                        color: CREAM,
                        fontFamily: "Georgia, serif",
                        fontSize: "0.68rem",
                        fontStyle: "italic",
                        margin: "0 0 0.1rem",
                        lineHeight: 1.3,
                        overflowWrap: "break-word",
                      }}
                    >
                      &ldquo;{previewFlavor.line}&rdquo;
                    </p>
                    <p
                      style={{
                        color: GOLD,
                        fontFamily: "Georgia, serif",
                        fontSize: "0.56rem",
                        margin: 0,
                        opacity: 0.85,
                        lineHeight: 1.2,
                        overflowWrap: "break-word",
                      }}
                    >
                      — {previewFlavor.npc}, {previewFlavor.title}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isFlipped && (
        <button
          type="button"
          onClick={handleFlip}
          style={{
            marginTop: "0.75rem",
            background: "transparent",
            border: "none",
            color: GOLD,
            fontFamily: "Georgia, serif",
            fontSize: "0.7rem",
            cursor: "pointer",
            opacity: 0.6,
            padding: "0.25rem 0.5rem",
          }}
        >
          Tap to flip
        </button>
      )}

      {isFlipped && (
        <div
          style={{
            marginTop: "0.75rem",
            width: CARD_WIDTH,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          <DepthSelector selectedDepth={selectedDepth} onSelect={handleDepthSelect} />
        </div>
      )}

      {showContent && (
        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {friendContext ? (
            <>
              <button type="button" onClick={handleSaveToFriend} style={chromeBtnStyle(true)}>
                Save to {friendContext}
              </button>
              <button type="button" onClick={handleDrawAgain} style={chromeBtnStyle()}>
                Shuffle again
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleShare} style={chromeBtnStyle()}>
                Share
              </button>
              <button type="button" onClick={handleDrawAgain} style={chromeBtnStyle()}>
                Shuffle again
              </button>
              <button type="button" onClick={handleGoToBrowse} style={chromeBtnStyle()}>
                Browse deck
              </button>
            </>
          )}
        </div>
      )}

      {showAnswerInput && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              border: `1px solid ${GOLD}`,
              borderRadius: 12,
              padding: "1.5rem",
              width: "100%",
              maxWidth: 400,
            }}
          >
            <p
              style={{
                color: GOLD,
                fontFamily: "Georgia, serif",
                fontSize: "0.85rem",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              Your answer for {friendContext}
            </p>
            <textarea
              value={pendingAnswer}
              onChange={(e) => setPendingAnswer(e.target.value)}
              placeholder="What came up for you?"
              autoFocus
              style={{
                width: "100%",
                minHeight: 120,
                background: "#111",
                border: "1px solid #C9A84C44",
                borderRadius: 8,
                color: CREAM,
                fontFamily: "Georgia, serif",
                fontSize: "0.85rem",
                padding: "0.75rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                marginTop: "1rem",
              }}
            >
              <button type="button" onClick={handleCancelSave} style={chromeBtnStyle()}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={!pendingAnswer.trim()}
                style={chromeBtnStyle(true, !pendingAnswer.trim())}
              >
                Save to {friendContext}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
