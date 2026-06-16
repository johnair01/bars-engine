"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { COLOR, FONT } from "@/lib/handbook/tokens";
import { SEAL, SPREAD_ART } from "@/lib/handbook/assets";
import type { Block, Chapter } from "@/lib/handbook/content";
import { createHandbookBar } from "@/actions/handbook-bar";
import { addCampaignDomainPreference } from "@/actions/campaign-domain-preference";
import { HeroBlock } from "@/components/handbook/blocks/HeroBlock";
import { ProseBlock } from "@/components/handbook/blocks/ProseBlock";
import { PullquoteBlock } from "@/components/handbook/blocks/PullquoteBlock";
import { LetterBlock } from "@/components/handbook/blocks/LetterBlock";
import { MovesBlock } from "@/components/handbook/blocks/MovesBlock";
import { HandlesBlock } from "@/components/handbook/blocks/HandlesBlock";
import { HousesBlock, HOUSES } from "@/components/handbook/blocks/HousesBlock";
import { RollBlock, type DiceResult } from "@/components/handbook/blocks/RollBlock";
import { BarPromptBlock } from "@/components/handbook/blocks/BarPromptBlock";
import { NationsBlock } from "@/components/handbook/blocks/NationsBlock";
import { FooterBlock } from "@/components/handbook/blocks/FooterBlock";

// localStorage fallbacks (namespace mtgoa_handbook_) — used until server
// persistence is wired. See handoff HOOK A / HOOK B.
const LS_HOUSE = "mtgoa_handbook_house";
const LS_BAR = "mtgoa_handbook_bar";
const LS_POS = "mtgoa_handbook_pos";

type View = "read" | "spread";

export function HandbookReader({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Interaction state
  const [dice, setDice] = useState<DiceResult | null>(null);
  const [house, setHouse] = useState<string | null>(null);
  const [view, setView] = useState<View>("read");

  // BAR (HOOK B) state
  const [barDraft, setBarDraft] = useState("");
  const [barText, setBarText] = useState("");
  const [barSaved, setBarSaved] = useState(false);
  const [barSaving, setBarSaving] = useState(false);
  const [barError, setBarError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  // Load chapter content (data-driven, like OracleReader loads the deck).
  useEffect(() => {
    fetch(`/handbook/${chapterId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load chapter.");
        return r.json() as Promise<Chapter>;
      })
      .then(setChapter)
      .catch(() => setError("This chapter could not be loaded."));
  }, [chapterId]);

  // Restore persisted state from localStorage fallbacks.
  useEffect(() => {
    try {
      const h = localStorage.getItem(LS_HOUSE);
      if (h) setHouse(h);
      const b = localStorage.getItem(LS_BAR);
      if (b) {
        setBarText(b);
        setBarSaved(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Scroll progress + resume. (Oracle has no resume; added here per handoff.)
  useEffect(() => {
    if (!chapter) return;
    const body = bodyRef.current;
    if (!body) return;

    try {
      const saved = parseInt(localStorage.getItem(LS_POS) || "0", 10);
      if (saved) body.scrollTop = saved;
    } catch {
      /* ignore */
    }

    const onScroll = () => {
      const max = body.scrollHeight - body.clientHeight;
      const p = max > 0 ? Math.min(100, (body.scrollTop / max) * 100) : 0;
      if (progRef.current) progRef.current.style.width = `${p}%`;
      try {
        localStorage.setItem(LS_POS, String(Math.round(body.scrollTop)));
      } catch {
        /* ignore */
      }
    };
    body.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => body.removeEventListener("scroll", onScroll);
  }, [chapter]);

  // HOOK A — House select. Records the player's allyship domain on their
  // identity (campaignDomainPreference), added non-destructively so it doesn't
  // clobber any domains they curated in the Market. localStorage mirrors the
  // reader's own choice and is the fallback for logged-out readers.
  const pickHouse = useCallback((name: string) => {
    setHouse(name);
    try {
      localStorage.setItem(LS_HOUSE, name);
    } catch {
      /* ignore */
    }
    const domainKey = HOUSES.find((h) => h.name === name)?.domainKey;
    if (domainKey) {
      // Fire-and-forget: the localStorage write above already reflects the UI.
      void addCampaignDomainPreference(domainKey).catch(() => {
        /* logged-out / transient — localStorage fallback stands */
      });
    }
  }, []);

  // Dice — pure client. 2d6 + 1.
  const rollDice = useCallback(() => {
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const total = d1 + d2 + 1;
    let tier: string;
    let txt: string;
    if (total >= 10) {
      tier = "10+ · strong hit";
      txt = "Your read lands cleanly. Ask three questions; choose two benefits.";
    } else if (total >= 7) {
      tier = "7–9 · mixed hit";
      txt = "You see it — and you are seen. Ask one question; the Guide adds a cost.";
    } else {
      tier = "6– · a truth";
      txt = "The answer implicates you. Gain 1 Adversity; mark Growth if you name your impact.";
    }
    setDice({ d1, d2, total, tier, txt });
  }, []);

  // HOOK B — BAR creation. Calls the server action; falls back to localStorage
  // when the reader is logged out (action returns { pending: true }).
  const saveBar = useCallback(
    async (prompt: string) => {
      const value = barDraft.trim();
      if (!value) {
        setBarError("Write the call before you plant it.");
        return;
      }
      setBarSaving(true);
      setBarError(null);
      try {
        const result = await createHandbookBar({
          promptText: prompt,
          response: value,
          defaultMoveType: "wakeUp",
          barTypeHint: "player_response",
        });
        if ("error" in result) {
          setBarError(result.error);
          return;
        }
        // success or pending — persist locally and show the planted state.
        try {
          localStorage.setItem(LS_BAR, value);
        } catch {
          /* ignore */
        }
        setBarText(value);
        setBarSaved(true);
      } catch {
        setBarError("Could not plant this seed. Please try again.");
      } finally {
        setBarSaving(false);
      }
    },
    [barDraft]
  );

  const editBar = useCallback(() => {
    setBarDraft(barText);
    setBarSaved(false);
    try {
      localStorage.removeItem(LS_BAR);
    } catch {
      /* ignore */
    }
  }, [barText]);

  const renderBlock = (block: Block, i: number) => {
    switch (block.type) {
      case "hero":
        return <HeroBlock key={i} {...block} />;
      case "prose":
        return <ProseBlock key={i} kicker={block.kicker} lead={block.lead} paras={block.paras} />;
      case "pullquote":
        return <PullquoteBlock key={i} text={block.text} />;
      case "letter":
        return <LetterBlock key={i} {...block} />;
      case "moves":
        return <MovesBlock key={i} />;
      case "handles":
        return <HandlesBlock key={i} />;
      case "houses":
        return <HousesBlock key={i} selected={house} onSelect={pickHouse} />;
      case "roll":
        return <RollBlock key={i} {...block} dice={dice} onRoll={rollDice} />;
      case "barPrompt":
        return (
          <BarPromptBlock
            key={i}
            kicker={block.kicker}
            prompt={block.prompt}
            saved={barSaved}
            savedText={barText}
            draft={barDraft}
            onDraftChange={setBarDraft}
            onSave={() => saveBar(block.prompt)}
            onEdit={editBar}
            saving={barSaving}
            error={barError}
          />
        );
      case "nations":
        return <NationsBlock key={i} />;
      case "footer":
        return <FooterBlock key={i} nextLabel={block.nextLabel} />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: COLOR.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.body,
          color: COLOR.body,
          padding: 24,
          textAlign: "center",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: COLOR.paper,
        overflow: "hidden",
      }}
    >
      {/* Keyframes + hide the reader's scrollbar. */}
      <style>{`
        @keyframes handbookFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .handbook-rdr::-webkit-scrollbar { width: 0; background: transparent; }
        .handbook-rdr { scrollbar-width: none; }
        @media print {
          .handbook-chrome, .handbook-status { display: none !important; }
        }
      `}</style>

      {/* status bar */}
      <div
        className="handbook-status"
        style={{
          height: 34,
          flex: "0 0 auto",
          background: COLOR.midnight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          color: "#e7ddc9",
        }}
      >
        <span style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.04em" }}>The Handbook</span>
        <span style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.06em", opacity: 0.85 }}>
          phone-first
        </span>
      </div>

      {/* app header */}
      <div
        className="handbook-chrome"
        style={{
          flex: "0 0 auto",
          background: COLOR.midnight,
          color: "#e7ddc9",
          padding: "6px 16px 11px",
          borderBottom: "1px solid #2a3047",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Back"
            style={{ background: "transparent", border: "none", fontFamily: FONT.mono, fontSize: 16, color: COLOR.gold, lineHeight: 1, cursor: "pointer", padding: 0 }}
          >
            ‹
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: "0.18em", color: COLOR.steel, textTransform: "uppercase" }}>
              {chapter?.kicker ?? " "}
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 17, color: "#f1ead9", lineHeight: 1.05 }}>
              {chapter?.title ?? " "}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setView("spread")}
            style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #4a5168", borderRadius: 14, padding: "4px 9px", cursor: "pointer", background: "transparent" }}
          >
            <span style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.06em", color: COLOR.gold }}>PRINT</span>
            <div style={{ width: 13, height: 11, border: `1px solid ${COLOR.gold}`, borderRadius: 1 }} />
          </button>
        </div>
        <div style={{ height: 2, background: "#2a3047", borderRadius: 2, marginTop: 9, overflow: "hidden" }}>
          <div
            ref={progRef}
            style={{ height: "100%", width: "0%", background: `linear-gradient(90deg, ${COLOR.cinnabar}, ${COLOR.gold})`, transition: "width .15s ease" }}
          />
        </div>
      </div>

      {/* reader body (reflow) */}
      <div
        ref={bodyRef}
        className="handbook-rdr"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: COLOR.paper,
          backgroundImage: `radial-gradient(130% 60% at 50% 0%, ${COLOR.paperHi} 0%, ${COLOR.paper} 60%)`,
        }}
      >
        {chapter?.blocks.map(renderBlock)}
        <div style={{ height: 40 }} />
      </div>

      {/* print / spread overlay — same content, fixed spread ("author once, render twice") */}
      {view === "spread" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: "rgba(10,11,16,.92)",
            backdropFilter: "blur(3px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 22,
          }}
        >
          <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.18em", color: COLOR.gold, textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>
            Print layout · what your book designer receives
          </div>
          <div style={{ width: 340, height: 220, boxShadow: "0 20px 50px rgba(0,0,0,.5)", display: "flex", overflow: "hidden", background: COLOR.paper }}>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SPREAD_ART} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 55%,rgba(8,10,18,.8))" }} />
              <div style={{ position: "absolute", left: 9, bottom: 8, fontFamily: FONT.display, fontWeight: 600, fontSize: 12, color: COLOR.goldLt }}>
                An Invitation
              </div>
            </div>
            <div style={{ flex: 1, background: COLOR.paper, padding: 13, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 6, letterSpacing: "0.18em", color: COLOR.lanternbearers }}>FROM THE HEADMASTER</div>
              <div style={{ fontFamily: FONT.display, fontStyle: "italic", fontSize: 11, color: "#1d1a15", lineHeight: 1.25, margin: "6px 0" }}>
                You were not chosen because you were ready.
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 }}>
                <div style={{ fontFamily: FONT.hand, fontWeight: 700, fontSize: 15, color: "#1d1a15", lineHeight: 0.9 }}>the Headmaster</div>
                <div style={{ width: 26, height: 26, background: COLOR.cinnabar, borderRadius: 2, display: "grid", placeItems: "center" }}>
                  <span style={{ fontFamily: FONT.seal, fontSize: 16, color: "#f6ece0" }}>{SEAL}</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "#9aa3b6", marginTop: 12, textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>
            Same content, same skin — poured into the fixed 8.5×11 spread. The reader on your phone and the printer&apos;s
            page come from one source.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setView("read")}
              style={{ border: `1px solid ${COLOR.gold}`, borderRadius: 5, padding: "8px 16px", fontFamily: FONT.mono, fontSize: 11, color: COLOR.gold, cursor: "pointer", background: "transparent" }}
            >
              ‹ Back to reading
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ background: COLOR.gold, border: "none", borderRadius: 5, padding: "8px 16px", fontFamily: FONT.mono, fontSize: 11, color: COLOR.midnight, fontWeight: 600, cursor: "pointer" }}
            >
              Export PDF ⤓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
