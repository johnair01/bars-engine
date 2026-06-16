"use client";

import { useEffect, useMemo, useState } from "react";
import { COLOR, FONT } from "@/lib/handbook/tokens";
import type {
  AllyshipDeck,
  AllyshipCard,
  MoveCard,
  InstructionCard,
  BasicMove,
  Operation,
  AllyshipDomain,
} from "@/lib/allyship-deck/types";

type Mode = "draw" | "browse" | "consult" | "guide";
type Subject = "self" | "campaign";

const MOVE_LABELS: Record<BasicMove, string> = {
  wake_up: "Wake Up",
  open_up: "Open Up",
  clean_up: "Clean Up",
  grow_up: "Grow Up",
  show_up: "Show Up",
};
const OP_LABELS: Record<Operation, string> = {
  shaman: "Shaman",
  challenger: "Challenger",
  regent: "Regent",
  architect: "Architect",
  diplomat: "Diplomat",
  sage: "Sage",
};
const DOMAIN_LABELS: Record<AllyshipDomain, string> = {
  GATHERING_RESOURCES: "Gather Resources",
  RAISE_AWARENESS: "Raise Awareness",
  DIRECT_ACTION: "Direct Action",
  SKILLFUL_ORGANIZING: "Skillful Organizing",
};

const isMove = (c: AllyshipCard): c is MoveCard => c.kind === "move";
const isInstruction = (c: AllyshipCard): c is InstructionCard => c.kind === "instruction";

export function AllyshipDeckReader() {
  const [deck, setDeck] = useState<AllyshipDeck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("draw");
  const [subject, setSubject] = useState<Subject>("self");
  const [selected, setSelected] = useState<MoveCard | null>(null);

  // Browse filters
  const [fMove, setFMove] = useState<BasicMove | "all">("all");
  const [fOp, setFOp] = useState<Operation | "all">("all");
  const [fDomain, setFDomain] = useState<AllyshipDomain | "all">("all");

  // Consult selection
  const [problemId, setProblemId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/allyship-deck/allyship-deck.json")
      .then((r) => {
        if (!r.ok) throw new Error("Could not load the deck.");
        return r.json() as Promise<AllyshipDeck>;
      })
      .then(setDeck)
      .catch(() => setError("The deck could not be loaded."));
  }, []);

  const moveCards = useMemo(() => (deck ? deck.cards.filter(isMove) : []), [deck]);

  const browsed = useMemo(
    () =>
      moveCards.filter(
        (c) =>
          (fMove === "all" || c.move === fMove) &&
          (fOp === "all" || c.operation === fOp) &&
          (fDomain === "all" || c.domain === fDomain)
      ),
    [moveCards, fMove, fOp, fDomain]
  );

  const draw = () => {
    if (!moveCards.length) return;
    const c = moveCards[Math.floor(Math.random() * moveCards.length)];
    setSelected(c);
  };

  const question = (c: MoveCard) =>
    subject === "campaign" ? c.campaignQuestion : c.primaryQuestion;

  if (error) return <Centered>{error}</Centered>;
  if (!deck) return <Centered>Shuffling…</Centered>;

  return (
    <div style={{ height: "100%", overflowY: "auto", color: COLOR.parchOnDark }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 64px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <p style={kicker}>Mastering Allyship Moves</p>
          <h1 style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 26, color: COLOR.paperHi, margin: "4px 0 0" }}>
            The Allyship Deck
          </h1>
        </div>

        {/* Subject toggle — read each move as inner work, or in service of others */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <Toggle active={subject === "self"} onClick={() => setSubject("self")}>Allyship for self</Toggle>
          <Toggle active={subject === "campaign"} onClick={() => setSubject("campaign")}>Allyship for others</Toggle>
        </div>
        <p style={{ fontFamily: FONT.body, fontSize: 12, color: COLOR.steel, textAlign: "center", margin: "0 0 16px" }}>
          {subject === "self"
            ? "Reading each move as your own inner work."
            : "Reading each move for a campaign, milestone, or relationship in service of others."}
        </p>

        {/* Mode tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {(["draw", "browse", "consult", "guide"] as Mode[]).map((m) => (
            <Tab key={m} active={mode === m} onClick={() => { setMode(m); setSelected(null); }}>
              {m === "draw" ? "Draw" : m === "browse" ? "Browse" : m === "consult" ? "Consult" : "Guide"}
            </Tab>
          ))}
        </div>

        {/* Selected card overlay (shared across modes) */}
        {selected ? (
          <CardDetail card={selected} question={question(selected)} subject={subject} onBack={() => setSelected(null)} />
        ) : (
          <>
            {mode === "draw" && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ fontFamily: FONT.body, fontSize: 16, color: COLOR.steelLt, marginBottom: 22 }}>
                  Draw a move at random. Read its question. Do its practice.
                </p>
                <button style={primaryBtn} onClick={draw}>Draw a card</button>
              </div>
            )}

            {mode === "browse" && (
              <>
                <Filters
                  fMove={fMove} setFMove={setFMove}
                  fOp={fOp} setFOp={setFOp}
                  fDomain={fDomain} setFDomain={setFDomain}
                />
                <p style={countLine}>{browsed.length} cards</p>
                <Grid cards={browsed} onPick={setSelected} q={question} />
              </>
            )}

            {mode === "consult" && (
              <ConsultView
                deck={deck}
                moveCards={moveCards}
                problemId={problemId}
                setProblemId={setProblemId}
                onPick={setSelected}
                q={question}
              />
            )}

            {mode === "guide" && <GuideView cards={deck.cards.filter(isInstruction)} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── sub-views ─────────────────────────────────────────────── */

function ConsultView({
  deck, moveCards, problemId, setProblemId, onPick, q,
}: {
  deck: AllyshipDeck;
  moveCards: MoveCard[];
  problemId: string | null;
  setProblemId: (id: string | null) => void;
  onPick: (c: MoveCard) => void;
  q: (c: MoveCard) => string;
}) {
  const problem = deck.problems.find((p) => p.id === problemId) || null;
  const cards = problem ? moveCards.filter((c) => problem.cardIds.includes(c.id)) : [];

  return (
    <>
      <p style={{ fontFamily: FONT.body, fontSize: 15, color: COLOR.steelLt, marginBottom: 12, textAlign: "center" }}>
        What are you facing?
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 18 }}>
        {deck.problems.map((p) => (
          <button
            key={p.id}
            onClick={() => setProblemId(p.id === problemId ? null : p.id)}
            style={{ ...rowBtn, ...(p.id === problemId ? rowBtnActive : null) }}
          >
            {p.label}
          </button>
        ))}
      </div>
      {problem && (
        <>
          <p style={countLine}>{cards.length} cards for &ldquo;{problem.label}&rdquo;</p>
          <Grid cards={cards} onPick={onPick} q={q} />
        </>
      )}
    </>
  );
}

function GuideView({ cards }: { cards: InstructionCard[] }) {
  const topics = Array.from(new Set(cards.map((c) => c.topic)));
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {topics.map((t) => (
        <div key={t}>
          <p style={kicker}>{t}</p>
          {cards.filter((c) => c.topic === t).map((c) => (
            <div key={c.id} style={{ ...panel, marginTop: 8 }}>
              <div style={{ fontFamily: FONT.label, fontSize: 15, color: COLOR.paperHi }}>{c.title}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 14, color: COLOR.steelLt, marginTop: 4, lineHeight: 1.55 }}>{c.body}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CardDetail({
  card, question, subject, onBack,
}: { card: MoveCard; question: string; subject: Subject; onBack: () => void }) {
  return (
    <div style={panel}>
      <button onClick={onBack} style={backBtn}>← back</button>
      <p style={kicker}>
        {OP_LABELS[card.operation]} · {MOVE_LABELS[card.move]} · {DOMAIN_LABELS[card.domain]}
        {card.status === "generated" && <span style={{ color: COLOR.muteInk }}> · draft</span>}
      </p>
      <h2 style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 24, color: COLOR.paperHi, margin: "6px 0 10px" }}>
        {card.title}
      </h2>
      <div style={{ ...fieldLabel, color: COLOR.cinnabar, marginBottom: 4 }}>
        {subject === "campaign" ? "Allyship for others" : "Allyship for self"}
      </div>
      <p style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 18, color: COLOR.goldLt, lineHeight: 1.45, marginBottom: 14 }}>
        {question}
      </p>
      <Field label="Optimizes for" text={card.optimizesFor} />
      <FieldList label="Forbidden moves" items={card.forbiddenMoves} />
      <FieldList label="Failure modes" items={card.failureModes} />
      <Field label="Practice" text={card.remediation} highlight />
      {card.flavor && (
        <p style={{ fontFamily: FONT.body, fontStyle: "italic", fontSize: 14, color: COLOR.steel, marginTop: 14, borderTop: `1px solid ${COLOR.midnight}`, paddingTop: 10 }}>
          {card.flavor}
        </p>
      )}
      <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {card.capabilities.map((cap) => (
          <span key={cap} style={chip}>restores: {cap}</span>
        ))}
        <span style={{ ...chip, background: "transparent", borderColor: COLOR.steel }}>→ {card.outputBar} BAR</span>
      </div>
    </div>
  );
}

/* ─── primitives ────────────────────────────────────────────── */

function Grid({ cards, onPick, q }: { cards: MoveCard[]; onPick: (c: MoveCard) => void; q: (c: MoveCard) => string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
      {cards.map((c) => (
        <button key={c.id} onClick={() => onPick(c)} style={gridCard}>
          <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.1em", color: COLOR.gold, textTransform: "uppercase" }}>
            {OP_LABELS[c.operation]} · {MOVE_LABELS[c.move]}
          </div>
          <div style={{ fontFamily: FONT.label, fontSize: 14, color: COLOR.paperHi, marginTop: 4 }}>{c.title}</div>
          <div style={{ fontFamily: FONT.body, fontSize: 12, color: COLOR.steel, marginTop: 4, lineHeight: 1.4 }}>
            {q(c).slice(0, 80)}{q(c).length > 80 ? "…" : ""}
          </div>
        </button>
      ))}
    </div>
  );
}

function Filters({
  fMove, setFMove, fOp, setFOp, fDomain, setFDomain,
}: {
  fMove: BasicMove | "all"; setFMove: (v: BasicMove | "all") => void;
  fOp: Operation | "all"; setFOp: (v: Operation | "all") => void;
  fDomain: AllyshipDomain | "all"; setFDomain: (v: AllyshipDomain | "all") => void;
}) {
  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
      <Select value={fMove} onChange={setFMove} all="All moves" options={Object.entries(MOVE_LABELS)} />
      <Select value={fOp} onChange={setFOp} all="All operations" options={Object.entries(OP_LABELS)} />
      <Select value={fDomain} onChange={setFDomain} all="All domains" options={Object.entries(DOMAIN_LABELS)} />
    </div>
  );
}

function Select<T extends string>({
  value, onChange, all, options,
}: { value: T | "all"; onChange: (v: T | "all") => void; all: string; options: [string, string][] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | "all")}
      style={{ fontFamily: FONT.label, fontSize: 14, padding: "8px 10px", borderRadius: 8, background: COLOR.midnight, color: COLOR.paperHi, border: `1px solid ${COLOR.steel}` }}
    >
      <option value="all">{all}</option>
      {options.map(([k, label]) => (
        <option key={k} value={k}>{label}</option>
      ))}
    </select>
  );
}

function Field({ label, text, highlight }: { label: string; text: string; highlight?: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={fieldLabel}>{label}</div>
      <div style={{ fontFamily: FONT.body, fontSize: 15, lineHeight: 1.5, color: highlight ? COLOR.paperHi : COLOR.steelLt }}>{text}</div>
    </div>
  );
}

function FieldList({ label, items }: { label: string; items: string[] }) {
  if (!items?.length || (items.length === 1 && items[0] === "— author —")) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={fieldLabel}>{label}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((it, i) => (
          <li key={i} style={{ fontFamily: FONT.body, fontSize: 14, lineHeight: 1.5, color: COLOR.steelLt }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ fontFamily: FONT.label, fontSize: 14, padding: "7px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid ${active ? COLOR.gold : COLOR.steel}`, background: active ? "rgba(200,163,90,0.16)" : "transparent", color: active ? COLOR.goldLt : COLOR.parchOnDark }}>
      {children}
    </button>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${active ? COLOR.cinnabar : COLOR.steel}`, background: active ? "rgba(168,64,46,0.18)" : "transparent", color: active ? COLOR.goldLt : COLOR.steel }}>
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center", color: COLOR.steelLt, fontFamily: FONT.body }}>
      {children}
    </div>
  );
}

/* ─── style tokens ──────────────────────────────────────────── */
const kicker: React.CSSProperties = { fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: COLOR.gold };
const fieldLabel: React.CSSProperties = { fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: COLOR.muteInk, marginBottom: 3 };
const countLine: React.CSSProperties = { fontFamily: FONT.mono, fontSize: 11, color: COLOR.steel, margin: "0 0 10px" };
const panel: React.CSSProperties = { background: COLOR.card, border: `1px solid ${COLOR.midnight}`, borderRadius: 12, padding: 18 };
const gridCard: React.CSSProperties = { textAlign: "left", background: COLOR.card, border: `1px solid ${COLOR.midnight}`, borderRadius: 10, padding: 12, cursor: "pointer", color: COLOR.parchOnDark };
const rowBtn: React.CSSProperties = { textAlign: "left", fontFamily: FONT.body, fontSize: 15, padding: "11px 14px", borderRadius: 10, cursor: "pointer", border: `1px solid ${COLOR.steel}`, background: "transparent", color: COLOR.parchOnDark };
const rowBtnActive: React.CSSProperties = { borderColor: COLOR.gold, background: "rgba(200,163,90,0.14)", color: COLOR.goldLt };
const primaryBtn: React.CSSProperties = { fontFamily: FONT.label, fontSize: 16, padding: "14px 28px", borderRadius: 10, border: "none", cursor: "pointer", background: COLOR.cinnabar, color: COLOR.paperHi };
const backBtn: React.CSSProperties = { fontFamily: FONT.mono, fontSize: 11, color: COLOR.steel, background: "transparent", border: "none", cursor: "pointer", padding: 0, marginBottom: 8 };
const chip: React.CSSProperties = { fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 999, background: "rgba(200,163,90,0.14)", border: `1px solid ${COLOR.gold}`, color: COLOR.goldLt };
