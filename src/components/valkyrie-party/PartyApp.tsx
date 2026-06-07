'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ImageBand } from "@/components/oracle/ImageBand";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  DEFAULT_CROP,
  ZONE_CONTENT_H,
  ZONE_HEADER_H,
  ZONE_TITLE_H,
  ZONE_TITLE_PADDING_X,
  cropFromCard,
  type Crop,
} from "@/lib/oracle/cardLayout";
import { uploadPartyAsset } from "@/lib/valkyrie-party/upload-client";

type Depth = "easy" | "medium" | "hard";

type OracleCard = {
  id: string;
  suit: { code: string; name: string; domain: string; icon: string };
  rank: string;
  title: string;
  image_file: string;
  uploaded?: boolean;
  crop_saved?: boolean;
  crop?: Crop;
  flavor: Record<Depth, { line: string; npc: string; title: string }>;
  prompts: Record<Depth, string>;
};

type PlayerCard = {
  id: string;
  base_card_id: string;
  title: string;
  prompt: string;
  flavor: string;
  author?: string;
  created_at: string;
};

type QuestCard = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  kind?: "ask" | "offer";
  face?: string;
  wave_mode?: "wake_up" | "clean_up" | "grow_up" | "show_up";
  materials?: string;
  author?: string;
  wave?: {
    wake_up?: string;
    clean_up?: string;
    grow_up?: string;
    show_up?: string;
  };
  game_master?: Record<string, string>;
  created_at: string;
  seed?: boolean;
};

type QuestDraft = {
  title: string;
  prompt: string;
  category: string;
  kind: "ask" | "offer";
  face: string;
  wave_mode: "wake_up" | "clean_up" | "grow_up" | "show_up";
  materials: string;
  wave: { wake_up: string; clean_up: string; grow_up: string; show_up: string };
  game_master: Record<string, string>;
};

type QuestTemplate = {
  id: string;
  face: string;
  kind: "ask" | "offer";
  wave_mode: "wake_up" | "clean_up" | "grow_up" | "show_up";
  title: string;
  creator_prompt: string;
  draft_title: string;
  draft_prompt: string;
  category: string;
  materials?: string;
  wave_text: string;
  face_lens: string;
};

type PartyDeck = {
  deck_name: string;
  for: string;
  made_by: string;
  total_cards: number;
  base_total_cards: number;
  theme?: {
    title: string;
    subtitle: string;
    accent: string;
    background: string;
    cream: string;
    fire?: string;
    water?: string;
    wood?: string;
    metal?: string;
    earth?: string;
    rose?: string;
    teal?: string;
  };
  story?: {
    premise: string;
    invocation: string;
    beats: { title: string; body: string }[];
  };
  party: {
    date: string;
    location: string;
    host_note: string;
    schedule: { time: string; title: string; details: string }[];
  };
  player_cards: PlayerCard[];
  quest_cards: QuestCard[];
  cards: OracleCard[];
};

type Signup = {
  id: string;
  name: string;
  email: string;
  wants_full_signup: boolean;
  keep_party_data: boolean;
};

type CardThread = {
  id: string;
  base_card_id: string;
  sender_name: string;
  recipient_name: string;
  sender_note: string;
  status: "sent" | "answered";
  created_at: string;
  answered_at: string | null;
  answer: null | { from_name: string; text: string; private_note: string };
};

type CardSummary = Pick<OracleCard, "id" | "title" | "rank" | "suit" | "image_file" | "uploaded" | "crop_saved" | "crop"> & {
  prompt: string;
};

type InboxItem = {
  thread: CardThread;
  card: CardSummary | null;
};

type InboxData = {
  incoming: InboxItem[];
  returned: InboxItem[];
  sent_pending: InboxItem[];
};

type DiscoverySlot = {
  id: string;
  state: "discovered" | "undiscovered";
  card: CardSummary | null;
  player_cards: PlayerCard[];
};

type DiscoveryData = {
  player: string;
  discovered_count: number;
  total_cards: number;
  cards: DiscoverySlot[];
};

type PersonalDeckGroup = {
  base_card_id: string;
  base_card: CardSummary | null;
  answers: {
    thread_id: string;
    from_name: string;
    answer_text: string;
    private_note: string;
    sender_note: string;
    answered_at: string;
  }[];
};

type AdminDeckMapRow = {
  card: CardSummary;
  player_cards: PlayerCard[];
  discovered_by: string[];
  discovery_count: number;
  thread_count: number;
  unanswered_count: number;
  answered_count: number;
};

type AdminCardCopyDraft = {
  card_id: string;
  title: string;
  prompts: Record<Depth, string>;
  flavor: Record<Depth, { title: string; line: string; npc: string }>;
};

const PARTY_BG = "#5B160B";
const PARTY_PANEL = "rgba(255, 243, 220, 0.09)";
const PARTY_GOLD = "#FFB000";
const PARTY_CREAM = "#FFF3DC";
const PARTY_FIRE = "#FF4D2E";
const PARTY_ROSE = "#FF6A2A";
const PARTY_TEAL = "#2DE2C6";

function emptyAdminDraft(): AdminCardCopyDraft {
  return {
    card_id: "",
    title: "",
    prompts: { easy: "", medium: "", hard: "" },
    flavor: {
      easy: { title: "", line: "", npc: "" },
      medium: { title: "", line: "", npc: "" },
      hard: { title: "", line: "", npc: "" },
    },
  };
}

const SUIT_SVG_FILES: Record<string, string> = {
  WU: "/oracle/icons/wake-up.svg",
  CU: "/oracle/icons/clean-up.svg",
  GU: "/oracle/icons/grow-up.svg",
  SU: "/oracle/icons/show-up.svg",
};

const FACE_FIELDS = [
  ["shaman", "Shaman", "Creates quests of presence, meaning, emotional honesty, and ritual. This face asks: what feeling or threshold is this quest helping people meet?"],
  ["challenger", "Challenger", "Creates quests of courage, clean asks, boundaries, and growth through chosen friction. This face asks: what brave edge makes the quest alive?"],
  ["regent", "Regent", "Creates quests of belonging, culture, care norms, and being treasured in a held space. This face asks: what does this quest make more normal in the room?"],
  ["architect", "Architect", "Creates quests with clear containers, steps, tools, timing, and logistics. This face asks: how does someone know what to do next?"],
  ["diplomat", "Diplomat", "Creates quests of consent, mutuality, repair, translation, and relational ease. This face asks: how does everyone stay respected?"],
  ["sage", "Sage", "Creates quests of perspective, reflection, integration, and the long game. This face asks: what does this quest help people understand or carry forward?"],
] as const;

const WAVE_MODE_FIELDS = [
  ["wake_up", "Wake Up", "Awareness quests help people notice what is true before they act."],
  ["clean_up", "Clean Up", "Clean-up quests add consent, boundaries, honesty, or repair so the care stays clean."],
  ["grow_up", "Grow Up", "Grow-up quests build a capacity: courage, receiving, asking, tending, resting, or attunement."],
  ["show_up", "Show Up", "Show-up quests turn the insight into an actual move someone can do in the room."],
] as const;

const QUEST_TEMPLATES: QuestTemplate[] = [
  { id: "regent-ask-wake", face: "regent", kind: "ask", wave_mode: "wake_up", title: "Belonging Noticing", creator_prompt: "Design a tiny ask that helps someone notice who or what needs relationship tending in the room.", draft_title: "Relationship Tending Check", draft_prompt: "Notice one relationship, cluster, or person who could use tending. Offer one small action that would help them feel included.", category: "connection", materials: "Attention, consent", wave_text: "Notice the relationship field before changing it.", face_lens: "Regent: make care part of the room's culture." },
  { id: "regent-offer-wake", face: "regent", kind: "offer", wave_mode: "wake_up", title: "Held Space Offer", creator_prompt: "Create an offer that lets someone recognize they can be held by the party culture.", draft_title: "I Can Hold A Tiny Container", draft_prompt: "Find me if you want a small held moment: a check-in, a grounding pause, or help entering a group.", category: "care", materials: "A quiet corner", wave_text: "Notice where belonging wants a container.", face_lens: "Regent: turn care into a norm people can trust." },
  { id: "shaman-ask-wake", face: "shaman", kind: "ask", wave_mode: "wake_up", title: "Feeling Threshold", creator_prompt: "Design a quest that helps someone notice the feeling or threshold they are crossing at the party.", draft_title: "Name The Threshold", draft_prompt: "Pause and name the threshold you crossed to arrive here. Share it with one person or leave it at the altar.", category: "ritual", materials: "A quiet breath", wave_text: "Notice the feeling before making meaning from it.", face_lens: "Shaman: make the invisible emotional layer welcome." },
  { id: "challenger-ask-clean", face: "challenger", kind: "ask", wave_mode: "clean_up", title: "Clean Ask", creator_prompt: "Create a quest that helps someone make one brave, clean ask without apology or pressure.", draft_title: "Ask Cleanly", draft_prompt: "Ask one person for a small form of care, clarity, or space. Make it easy for them to say yes or no.", category: "care", materials: "A direct sentence", wave_text: "Clean the quest by making the ask explicit.", face_lens: "Challenger: courage without coercion." },
  { id: "architect-offer-show", face: "architect", kind: "offer", wave_mode: "show_up", title: "Make It Doable", creator_prompt: "Create an offer with a clear container: what, where, how long, and what someone needs to bring.", draft_title: "Ten Minute Reset Station", draft_prompt: "I am offering a ten minute reset: water, breathing, stretching, or a logistics assist. Find me and choose one.", category: "body", materials: "Timer, water, optional mat", wave_text: "Complete the quest by making the next step obvious.", face_lens: "Architect: care becomes real when the container is clear." },
  { id: "diplomat-ask-clean", face: "diplomat", kind: "ask", wave_mode: "clean_up", title: "Consent Thread", creator_prompt: "Design a quest that improves mutuality, consent, or attunement between people.", draft_title: "Ask The Better Question", draft_prompt: "Ask someone: what would make this interaction feel more comfortable, mutual, or fun for you?", category: "connection", materials: "Curiosity", wave_text: "Clean the quest by making mutuality explicit.", face_lens: "Diplomat: treasure people by attuning to their terms." },
  { id: "sage-offer-grow", face: "sage", kind: "offer", wave_mode: "grow_up", title: "Integration Offer", creator_prompt: "Create an offer that helps someone understand, integrate, or carry forward something from the party.", draft_title: "Integration Minute", draft_prompt: "Find me if you want one minute to name what you are taking from this party and how you want to remember it.", category: "altar", materials: "One reflective minute", wave_text: "Grow the moment into something someone can carry.", face_lens: "Sage: help the party become wisdom, not just experience." },
  { id: "regent-offer-show", face: "regent", kind: "offer", wave_mode: "show_up", title: "Relationship Tending Offer", creator_prompt: "Create an offer that helps someone tend a connection right now at the party.", draft_title: "Relationship Tending Assist", draft_prompt: "Find me if you want help checking in with someone, entering a group, or making a small care move feel graceful.", category: "connection", materials: "Find me", wave_text: "Show up by tending one relationship in real time.", face_lens: "Regent: belonging is maintained through small visible rituals." }
];

const EMPTY_QUEST_DRAFT: QuestDraft = {
  title: "",
  prompt: "",
  category: "treasure",
  kind: "ask",
  face: "",
  wave_mode: "wake_up",
  materials: "",
  wave: { wake_up: "", clean_up: "", grow_up: "", show_up: "" },
  game_master: { shaman: "", challenger: "", regent: "", architect: "", diplomat: "", sage: "" },
};

function buttonStyle(primary = false, disabled = false): CSSProperties {
  return {
    border: primary ? "none" : `1px solid ${PARTY_GOLD}`,
    background: primary ? `linear-gradient(135deg, ${PARTY_GOLD}, ${PARTY_ROSE})` : "transparent",
    color: primary ? "#230817" : PARTY_GOLD,
    borderRadius: 6,
    padding: "0.65rem 0.95rem",
    fontFamily: "Georgia, serif",
    fontWeight: primary ? 700 : 400,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };
}

function fieldStyle(multiline = false): CSSProperties {
  return {
    width: "100%",
    minHeight: multiline ? 92 : undefined,
    border: "1px solid rgba(255, 176, 0, 0.45)",
    borderRadius: 6,
    background: "rgba(0, 0, 0, 0.22)",
    color: PARTY_CREAM,
    boxSizing: "border-box",
    padding: "0.65rem 0.75rem",
    fontFamily: "Georgia, serif",
    fontSize: "0.92rem",
  };
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: PARTY_PANEL, border: `1px solid rgba(255, 176, 0, 0.28)`, borderRadius: 8, padding: "1rem", boxShadow: "0 0 28px rgba(255, 79, 163, 0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", margin: "0 0 0.85rem" }}>
        <h2 style={{ color: PARTY_GOLD, fontFamily: "Georgia, serif", fontSize: "1rem", letterSpacing: "0.08em", margin: 0 }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(json.error || "Save failed");
  return json as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || json.ok === false) throw new Error(json.error || "Load failed");
  return json as T;
}

function CardFace({
  card,
  depth,
  playerCard,
}: {
  card: OracleCard;
  depth: Depth;
  playerCard: PlayerCard | null;
}) {
  const crop = card.crop_saved ? cropFromCard(card) : DEFAULT_CROP;
  const image = typeof card.image_file === "string" && card.image_file.startsWith("/oracle/") ? card.image_file : null;
  const flavor = card.flavor[depth];
  const prompt = card.prompts[depth];

  return (
    <article style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 12, overflow: "hidden", border: `1px solid ${PARTY_GOLD}`, background: "#111", boxShadow: "0 18px 50px rgba(255,77,46,0.22)" }}>
      <div style={{ height: ZONE_HEADER_H, background: `linear-gradient(90deg, ${PARTY_BG}, #4B1248)`, borderBottom: `1px solid ${PARTY_GOLD}`, padding: "0 0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: PARTY_GOLD }}>
          <img src={SUIT_SVG_FILES[card.suit.code]} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.08em" }}>{card.suit.name.toUpperCase()}</span>
        </div>
        <span style={{ color: PARTY_GOLD, fontSize: "0.75rem" }}>{card.rank}</span>
      </div>

      <ImageBand src={image} crop={crop} />

      <div style={{ height: ZONE_TITLE_H, background: `linear-gradient(90deg, #4B1248, ${PARTY_BG})`, borderTop: `1px solid ${PARTY_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", padding: `0 ${ZONE_TITLE_PADDING_X}` }}>
        <p style={{ color: PARTY_CREAM, fontSize: "0.68rem", margin: 0, textAlign: "center", letterSpacing: "0.04em", lineHeight: 1.15 }}>
          {(playerCard?.title || card.title).toUpperCase()}
        </p>
      </div>

      <div style={{ height: ZONE_CONTENT_H, background: "rgba(17,17,17,0.95)", padding: "0.45rem 0.5rem", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.25rem", overflow: "hidden" }}>
        <p style={{ color: PARTY_CREAM, fontSize: "0.72rem", textAlign: "center", margin: 0, lineHeight: 1.3, overflowWrap: "break-word" }}>
          {playerCard?.prompt || prompt}
        </p>
        <div style={{ textAlign: "center", minWidth: 0, marginTop: "0.15rem" }}>
          <p style={{ color: PARTY_CREAM, fontSize: "0.68rem", fontStyle: "italic", margin: "0 0 0.1rem", lineHeight: 1.3 }}>
            "{playerCard?.flavor || flavor.line}"
          </p>
          <p style={{ color: PARTY_GOLD, fontSize: "0.56rem", margin: 0, opacity: 0.85, lineHeight: 1.2 }}>
            {playerCard ? `Added by ${playerCard.author || "Anonymous"}` : `- ${flavor.npc}, ${flavor.title}`}
          </p>
        </div>
      </div>
    </article>
  );
}

function CardBack({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        border: "none",
        borderRadius: 12,
        padding: 0,
        overflow: "hidden",
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
      }}
      aria-label={onClick ? "Reveal card" : "Card back"}
    >
      <img src="/oracle/card-back.png" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </button>
  );
}

function QuestSlip({ card }: { card: QuestCard }) {
  const waveRows = [
    ["Wake", card.wave?.wake_up],
    ["Clean", card.wave?.clean_up],
    ["Grow", card.wave?.grow_up],
    ["Show", card.wave?.show_up],
  ].filter(([, value]) => Boolean(value));

  return (
    <article style={{ width: "min(100%, 330px)", minHeight: 430, border: `1px solid rgba(255, 176, 0, 0.55)`, borderRadius: 12, padding: "1rem", background: "linear-gradient(180deg, rgba(255,243,220,0.16), rgba(255,77,46,0.09))", boxShadow: "0 18px 45px rgba(0,0,0,0.18)", boxSizing: "border-box", display: "grid", alignContent: "start", gap: "0.65rem" }}>
      <p style={{ margin: 0, color: PARTY_TEAL, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        {(card.kind || "ask").toUpperCase()} - {card.face ? `${card.face} - ` : ""}{card.wave_mode ? `${card.wave_mode.replace("_", " ")} - ` : ""}{card.category || "treasure"} quest
      </p>
      <h3 style={{ margin: 0, color: PARTY_GOLD, fontSize: "1.35rem", lineHeight: 1.1 }}>
        {card.title}
      </h3>
      <p style={{ margin: 0, lineHeight: 1.5, fontSize: "1rem" }}>
        {card.prompt}
      </p>
      {card.materials && (
        <p style={{ margin: 0, opacity: 0.76, fontSize: "0.84rem", lineHeight: 1.35 }}>
          Bring: {card.materials}
        </p>
      )}
      {waveRows.length > 0 && (
        <div style={{ display: "grid", gap: "0.3rem", borderTop: "1px solid rgba(255,176,0,0.22)", paddingTop: "0.55rem" }}>
          {waveRows.map(([label, value]) => (
            <p key={label} style={{ margin: 0, fontSize: "0.76rem", lineHeight: 1.28, opacity: 0.82 }}>
              <span style={{ color: PARTY_GOLD }}>{label}:</span> {value}
            </p>
          ))}
        </div>
      )}
      <p style={{ margin: 0, opacity: 0.62, fontSize: "0.78rem", alignSelf: "end" }}>
        Added by {card.author || "Anonymous"}
      </p>
    </article>
  );
}

export function PartyApp() {
  const [deck, setDeck] = useState<PartyDeck | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [inbox, setInbox] = useState<InboxData>({ incoming: [], returned: [], sent_pending: [] });
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [personalDeck, setPersonalDeck] = useState<PersonalDeckGroup[]>([]);
  const [adminDeckMap, setAdminDeckMap] = useState<AdminDeckMapRow[]>([]);
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null);
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<PlayerCard | null>(null);
  const [selectedQuestCard, setSelectedQuestCard] = useState<QuestCard | null>(null);
  const [questRevealed, setQuestRevealed] = useState(false);
  const [selectedDepth, setSelectedDepth] = useState<Depth>("easy");
  const [cardRevealed, setCardRevealed] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(true);
  const [signup, setSignup] = useState({ email: "", keep: true, full: false });
  const [mailDraft, setMailDraft] = useState({ recipient_name: "", sender_note: "" });
  const [oracleAnswerDraft, setOracleAnswerDraft] = useState("");
  const [questDraft, setQuestDraft] = useState<QuestDraft>(EMPTY_QUEST_DRAFT);
  const [questComposerOpen, setQuestComposerOpen] = useState(false);
  const [questWizardStep, setQuestWizardStep] = useState<"face" | "template" | "details" | "review">("face");
  const [questPhotoCaption, setQuestPhotoCaption] = useState("");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxTab, setInboxTab] = useState<"incoming" | "returned" | "sent_pending">("incoming");
  const [answering, setAnswering] = useState<InboxItem | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerPrivateNote, setAnswerPrivateNote] = useState("");
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [scheduleDraft, setScheduleDraft] = useState<PartyDeck["party"] | null>(null);
  const [selectedAdminCardId, setSelectedAdminCardId] = useState("");
  const [adminCopyDraft, setAdminCopyDraft] = useState<AdminCardCopyDraft>(emptyAdminDraft);
  const [orientationStep, setOrientationStep] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const loadParty = useCallback(async () => {
    const res = await fetch("/api/party/valkyrie");
    const json = await res.json();
    if (!res.ok || json.ok === false) throw new Error(json.error || "Could not load party");
    setDeck(json.deck);
    setSignups(json.signups || []);
    setScheduleDraft(json.deck.party);
  }, []);

  const loadPlayerViews = useCallback(async (player: string) => {
    if (!player.trim()) return;
    const query = encodeURIComponent(player.trim());
    const [inboxJson, discoveryJson, personalJson] = await Promise.all([
      getJson<InboxData & { ok: boolean }>(`/api/party/valkyrie/inbox?player=${query}`),
      getJson<DiscoveryData & { ok: boolean }>(`/api/party/valkyrie/discovery?player=${query}`),
      getJson<{ ok: boolean; cards: PersonalDeckGroup[] }>(`/api/party/valkyrie/personal-deck?player=${query}`),
    ]);
    setInbox({
      incoming: inboxJson.incoming || [],
      returned: inboxJson.returned || [],
      sent_pending: inboxJson.sent_pending || [],
    });
    setDiscovery(discoveryJson);
    setPersonalDeck(personalJson.cards || []);
  }, []);

  useEffect(() => {
    loadParty().catch((err) => setNotice(err instanceof Error ? err.message : "Could not load party"));
  }, [loadParty]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedPlayer = window.localStorage.getItem("valkyrie_party_player") || "";
    const savedAdmin = window.localStorage.getItem("valkyrie_party_admin") || "";
    const adminQueryEnabled = new URLSearchParams(window.location.search).get("admin") === "1";
    setPlayerName(savedPlayer);
    setShowJoinModal(!savedPlayer);
    setAdminToken(savedAdmin);
    setShowAdmin(adminQueryEnabled);
  }, []);

  useEffect(() => {
    if (!playerName.trim()) return;
    loadPlayerViews(playerName).catch(() => {
      /* player panels can lag without blocking the party */
    });
  }, [playerName, loadPlayerViews]);

  useEffect(() => {
    if (!playerName.trim()) return;
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("valkyrie_party_orientation_seen_v1");
    if (!seen) setOrientationStep(1);
  }, [playerName]);

  const players = useMemo(() => {
    const names = new Set(signups.map((s) => s.name).filter(Boolean));
    if (playerName) names.add(playerName);
    names.add("Valkyrie");
    return Array.from(names);
  }, [signups, playerName]);

  const relatedPlayerCards = useMemo(() => {
    if (!deck || !selectedCard) return [];
    return deck.player_cards.filter((card) => card.base_card_id === selectedCard.id);
  }, [deck, selectedCard]);

  const matchingQuestTemplates = useMemo(() => {
    if (!questDraft.face) return [];
    const exact = QUEST_TEMPLATES.filter((template) =>
      template.face === questDraft.face &&
      template.kind === questDraft.kind &&
      template.wave_mode === questDraft.wave_mode
    );
    return exact.length ? exact : QUEST_TEMPLATES.filter((template) => template.face === questDraft.face && template.kind === questDraft.kind);
  }, [questDraft.face, questDraft.kind, questDraft.wave_mode]);

  const applyQuestTemplate = useCallback((template: QuestTemplate) => {
    setQuestDraft((draft) => ({
      ...draft,
      title: template.draft_title,
      prompt: template.draft_prompt,
      category: template.category,
      kind: template.kind,
      face: template.face,
      wave_mode: template.wave_mode,
      materials: template.materials || "",
      wave: {
        ...draft.wave,
        [template.wave_mode]: template.wave_text,
      },
      game_master: {
        ...draft.game_master,
        [template.face]: template.face_lens,
      },
    }));
    setQuestWizardStep("details");
  }, []);

  const surpriseQuestTemplate = useCallback(() => {
    const template = QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];
    applyQuestTemplate(template);
  }, [applyQuestTemplate]);

  const drawCard = useCallback(async () => {
    if (!deck?.cards.length) return;
    const pool = selectedCard && deck.cards.length > 1 ? deck.cards.filter((card) => card.id !== selectedCard.id) : deck.cards;
    const card = pool[Math.floor(Math.random() * pool.length)];
    setSelectedCard(card);
    setSelectedPlayerCard(null);
    setCardRevealed(false);
    setOracleAnswerDraft("");
    setNotice("");
    if (playerName.trim()) {
      try {
        await postJson("/api/party/valkyrie/discovery", {
          player: playerName,
          base_card_id: card.id,
          source: "draw",
        });
        await loadPlayerViews(playerName);
      } catch {
        /* discovery should not block the draw ritual */
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [deck, selectedCard, playerName, loadPlayerViews]);

  const drawQuestCard = useCallback(() => {
    if (!deck?.quest_cards.length) return;
    const pool = selectedQuestCard && deck.quest_cards.length > 1
      ? deck.quest_cards.filter((card) => card.id !== selectedQuestCard.id)
      : deck.quest_cards;
    setSelectedQuestCard(pool[Math.floor(Math.random() * pool.length)]);
    setQuestRevealed(false);
    setQuestPhotoCaption("");
    setNotice("");
  }, [deck, selectedQuestCard]);

  const saveOracleAnswer = useCallback(async (scope: "private" | "valkyrie") => {
    if (!selectedCard || !playerName.trim() || !oracleAnswerDraft.trim()) return;
    setBusy(true);
    try {
      await postJson("/api/party/valkyrie/oracle-answers", {
        player: playerName,
        base_card_id: selectedCard.id,
        depth: selectedDepth,
        scope,
        answer_text: oracleAnswerDraft,
      });
      setOracleAnswerDraft("");
      setNotice(scope === "valkyrie" ? "Answer sent to Valkyrie's party inbox." : "Private answer saved to your party deck.");
      await loadPlayerViews(playerName);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save answer");
    } finally {
      setBusy(false);
    }
  }, [selectedCard, playerName, selectedDepth, oracleAnswerDraft, loadPlayerViews]);

  const uploadQuestPhoto = useCallback(async (file: File | null) => {
    if (!file || !selectedQuestCard || !playerName.trim()) return;
    setBusy(true);
    try {
      const uploaded = await uploadPartyAsset(file, { kind: "quest_completion", questCardId: selectedQuestCard.id });
      await postJson("/api/party/valkyrie/quest-cards/" + selectedQuestCard.id + "/completions", {
        asset_url: uploaded.url,
        caption: questPhotoCaption,
      });
      setQuestPhotoCaption("");
      setNotice("Photo attached to this quest.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not attach photo");
    } finally {
      setBusy(false);
    }
  }, [selectedQuestCard, playerName, questPhotoCaption]);

  const addQuestCard = useCallback(async () => {
    if (!questDraft.title.trim() || !questDraft.prompt.trim()) return;
    setBusy(true);
    try {
      const json = await postJson<{ deck: PartyDeck; card: QuestCard }>("/api/party/valkyrie/quest-cards", {
        ...questDraft,
        author: playerName,
      });
      setDeck(json.deck);
      setSelectedQuestCard(json.card);
      setQuestRevealed(true);
      setQuestDraft(EMPTY_QUEST_DRAFT);
      setQuestWizardStep("face");
      setQuestComposerOpen(false);
      setNotice("Quest added to the party deck.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not add quest");
    } finally {
      setBusy(false);
    }
  }, [questDraft, playerName]);

  const saveSignup = useCallback(async () => {
    if (!playerName.trim()) return;
    setBusy(true);
    try {
      const json = await postJson<{ signup: Signup }>("/api/party/valkyrie/signups", {
        name: playerName,
        email: signup.email,
        keep_party_data: signup.keep,
        wants_full_signup: signup.full,
      });
      localStorage.setItem("valkyrie_party_player", json.signup.name);
      setShowJoinModal(false);
      setNotice(signup.full ? "You are in. Full bars-engine signup is marked for follow-up." : "You are in the party.");
      await loadParty();
      await loadPlayerViews(json.signup.name);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  }, [playerName, signup, loadParty, loadPlayerViews]);

  const sendCardMail = useCallback(async () => {
    if (!selectedCard || !playerName.trim() || !mailDraft.recipient_name.trim()) return;
    setBusy(true);
    try {
      await postJson("/api/party/valkyrie/card-threads", {
        base_card_id: selectedCard.id,
        sender_name: playerName,
        recipient_name: mailDraft.recipient_name,
        sender_note: mailDraft.sender_note,
      });
      setMailDraft({ recipient_name: "", sender_note: "" });
      setNotice(`Sent ${selectedCard.id} to ${mailDraft.recipient_name}.`);
      await loadPlayerViews(playerName);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not send card");
    } finally {
      setBusy(false);
    }
  }, [selectedCard, playerName, mailDraft, loadPlayerViews]);

  const answerThread = useCallback(async () => {
    if (!answering || !playerName.trim() || !answerText.trim()) return;
    setBusy(true);
    try {
      await postJson(`/api/party/valkyrie/card-threads/${answering.thread.id}/answer`, {
        from_name: playerName,
        answer_text: answerText,
        private_note: answerPrivateNote,
      });
      setAnswering(null);
      setAnswerText("");
      setAnswerPrivateNote("");
      setNotice("Answer sent back as a card.");
      await loadPlayerViews(playerName);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not answer card");
    } finally {
      setBusy(false);
    }
  }, [answering, playerName, answerText, answerPrivateNote, loadPlayerViews]);

  const loadAdminDeckMap = useCallback(async () => {
    if (!adminToken.trim()) return;
    const query = encodeURIComponent(adminToken.trim());
    const json = await getJson<{ ok: boolean; cards: AdminDeckMapRow[] }>(`/api/party/valkyrie/admin/deck-map?admin_token=${query}`);
    setAdminDeckMap(json.cards || []);
  }, [adminToken]);

  const currentAdminCard = useMemo(
    () => deck?.cards.find((card) => card.id === selectedAdminCardId) || null,
    [deck, selectedAdminCardId]
  );

  const saveSchedule = useCallback(async () => {
    if (!scheduleDraft) return;
    setBusy(true);
    try {
      const json = await postJson<{ deck: PartyDeck }>("/api/party/valkyrie/schedule", {
        admin_token: adminToken,
        location: scheduleDraft.location,
        host_note: scheduleDraft.host_note,
        schedule: scheduleDraft.schedule,
      });
      localStorage.setItem("valkyrie_party_admin", adminToken);
      setDeck(json.deck);
      setScheduleDraft(json.deck.party);
      setNotice("Schedule updated.");
      await loadAdminDeckMap().catch(() => {
        /* deck map is optional admin context */
      });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not update schedule");
    } finally {
      setBusy(false);
    }
  }, [adminToken, scheduleDraft, loadAdminDeckMap]);

  useEffect(() => {
    if (!showAdmin || !adminToken.trim()) return;
    loadAdminDeckMap().catch(() => {
      /* admin token may not be set yet */
    });
  }, [showAdmin, adminToken, loadAdminDeckMap]);

  useEffect(() => {
    if (!currentAdminCard) return;
    setAdminCopyDraft({
      card_id: currentAdminCard.id,
      title: currentAdminCard.title,
      prompts: {
        easy: currentAdminCard.prompts.easy,
        medium: currentAdminCard.prompts.medium,
        hard: currentAdminCard.prompts.hard,
      },
      flavor: {
        easy: { ...currentAdminCard.flavor.easy },
        medium: { ...currentAdminCard.flavor.medium },
        hard: { ...currentAdminCard.flavor.hard },
      },
    });
  }, [currentAdminCard]);

  const saveAdminCardCopy = useCallback(async () => {
    if (!adminToken.trim() || !adminCopyDraft.card_id) return;
    setBusy(true);
    try {
      const json = await postJson<{ card: OracleCard }>("/api/party/valkyrie/admin/card-override", {
        admin_token: adminToken,
        ...adminCopyDraft,
      });
      localStorage.setItem("valkyrie_party_admin", adminToken);
      setNotice(`${json.card?.id || adminCopyDraft.card_id} updated.`);
      await loadParty();
      await loadAdminDeckMap();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save card copy");
    } finally {
      setBusy(false);
    }
  }, [adminToken, adminCopyDraft, loadParty, loadAdminDeckMap]);

  const uploadAdminCardImage = useCallback(async (file: File | null) => {
    if (!file || !adminToken.trim() || !selectedAdminCardId) return;
    setBusy(true);
    try {
      const uploaded = await uploadPartyAsset(file, { kind: "oracle_override", cardId: selectedAdminCardId });
      const json = await postJson<{ deck: PartyDeck }>("/api/party/valkyrie/admin/card-override", {
        admin_token: adminToken,
        card_id: selectedAdminCardId,
        image_url: uploaded.url,
      });
      localStorage.setItem("valkyrie_party_admin", adminToken);
      setDeck(json.deck);
      setNotice(selectedAdminCardId + " image updated. Fine framing still lives in the full oracle editor if you need it.");
      await loadParty();
      await loadAdminDeckMap();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setBusy(false);
    }
  }, [adminToken, selectedAdminCardId, loadParty, loadAdminDeckMap]);

  if (!deck || !scheduleDraft) {
    return (
      <main style={{ minHeight: "100vh", background: PARTY_BG, color: PARTY_CREAM, display: "grid", placeItems: "center", fontFamily: "Georgia, serif" }}>
        Dealing Valkyrie's party deck...
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: `radial-gradient(circle at 18% 8%, rgba(255,176,0,0.28), transparent 28%), radial-gradient(circle at 82% 4%, rgba(255,77,46,0.24), transparent 26%), linear-gradient(180deg, ${PARTY_BG}, #220700 72%)`, color: PARTY_CREAM, fontFamily: "Georgia, serif", padding: "1.25rem" }}>
      <div style={{ position: "fixed", top: "0.75rem", right: "0.75rem", zIndex: 45, display: "grid", gap: "0.35rem", justifyItems: "end", maxWidth: "min(92vw, 320px)" }}>
        <div style={{ border: `1px solid rgba(255, 176, 0, 0.45)`, borderRadius: 999, background: "rgba(35, 8, 23, 0.88)", backdropFilter: "blur(10px)", padding: "0.4rem 0.5rem", display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", justifyContent: "flex-end", boxShadow: "0 12px 30px rgba(0,0,0,0.22)" }}>
          <span style={{ color: PARTY_GOLD, fontSize: "0.82rem", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {playerName ? playerName : "New player"}
          </span>
          <button type="button" onClick={() => setShowJoinModal(true)} style={{ ...buttonStyle(), padding: "0.42rem 0.6rem", fontSize: "0.78rem" }}>
            {playerName ? "Change" : "Join"}
          </button>
          <button type="button" onClick={() => setInboxOpen(true)} disabled={!playerName.trim()} style={{ ...buttonStyle(false, !playerName.trim()), padding: "0.42rem 0.6rem", fontSize: "0.78rem" }}>
            Inbox {inbox.incoming.length}
          </button>
        </div>
      </div>
      <div style={{ width: "100%", maxWidth: 1080, margin: "0 auto", display: "grid", gap: "1rem" }}>
        <header style={{ textAlign: "center", padding: "1rem 0 0.35rem" }}>
          <p style={{ color: PARTY_TEAL, opacity: 0.92, fontSize: "0.78rem", letterSpacing: "0.12em", margin: "0 0 0.4rem" }}>
            FIRE BIRD SPA ORACLE
          </p>
          <h1 style={{ color: PARTY_GOLD, fontSize: "clamp(2.2rem, 8vw, 4.5rem)", lineHeight: 0.95, margin: 0, textShadow: "0 0 28px rgba(255,79,163,0.32)" }}>
            {deck.theme?.title || deck.deck_name}
          </h1>
          <p style={{ maxWidth: 720, margin: "0.85rem auto 0", lineHeight: 1.6, opacity: 0.9 }}>
            {deck.theme?.subtitle || "Draw from the full oracle deck, then choose the original card or any player-created card attached to it."}
          </p>
          {deck.story && (
            <p style={{ maxWidth: 760, margin: "0.65rem auto 0", lineHeight: 1.55, opacity: 0.74 }}>
              {deck.story.invocation}
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
            {[PARTY_FIRE, PARTY_GOLD, PARTY_TEAL, "#41D96B", "#38BDF8", PARTY_ROSE].map((color) => (
              <span key={color} style={{ width: 28, height: 6, borderRadius: 999, background: color, boxShadow: `0 0 14px ${color}` }} />
            ))}
          </div>
        </header>

        {deck.story && (
          <Panel title="How The Fire Bird Rite Works">
            <p style={{ margin: "0 0 0.75rem", lineHeight: 1.55 }}>{deck.story.premise}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "0.65rem" }}>
              {deck.story.beats.map((beat) => (
                <div key={beat.title} style={{ borderTop: "1px solid rgba(255,176,0,0.25)", paddingTop: "0.5rem" }}>
                  <p style={{ color: PARTY_GOLD, margin: "0 0 0.2rem", fontSize: "0.86rem" }}>{beat.title}</p>
                  <p style={{ margin: 0, opacity: 0.78, lineHeight: 1.35, fontSize: "0.84rem" }}>{beat.body}</p>
                </div>
              ))}
            </div>
            <p style={{ margin: "0.75rem 0 0", opacity: 0.68, fontSize: "0.82rem", lineHeight: 1.4 }}>
              Private card answers are for the people in that exchange. Do not repost someone else's private answer publicly unless they have said yes.
            </p>
          </Panel>
        )}

        <Panel title="Spa Safety Notes">
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            No lavender, no nuts. Mask optional, test within 6 hours. Casual non-sexual nudity may be present; participation is optional, body positivity is required. Optional microdosing is personal responsibility, gentle add-on energy only.
          </p>
        </Panel>

        {notice && (
          <div style={{ border: `1px solid rgba(255, 176, 0, 0.45)`, borderRadius: 8, color: PARTY_GOLD, padding: "0.75rem 1rem", textAlign: "center" }}>
            {notice}
          </div>
        )}

        {showJoinModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.78)",
              display: "grid",
              placeItems: "center",
              padding: "1rem",
            }}
          >
            <div style={{ width: "min(100%, 420px)", background: "#230817", border: `1px solid ${PARTY_GOLD}`, borderRadius: 10, padding: "1rem", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
              <h2 style={{ color: PARTY_GOLD, fontSize: "1.15rem", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Join The Party</h2>
              <p style={{ margin: "0 0 1rem", lineHeight: 1.5, opacity: 0.82 }}>
                Pick your player name before you draw. Email is optional unless you want to keep your cards later.
              </p>
              <div style={{ display: "grid", gap: "0.7rem" }}>
                <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player name" style={fieldStyle()} autoFocus />
                <input value={signup.email} onChange={(e) => setSignup((s) => ({ ...s, email: e.target.value }))} placeholder="Email, optional" style={fieldStyle()} />
                <label style={{ display: "flex", gap: "0.55rem", alignItems: "center", fontSize: "0.88rem" }}>
                  <input type="checkbox" checked={signup.keep} onChange={(e) => setSignup((s) => ({ ...s, keep: e.target.checked }))} />
                  Keep my party cards and messages
                </label>
                <label style={{ display: "flex", gap: "0.55rem", alignItems: "center", fontSize: "0.88rem" }}>
                  <input type="checkbox" checked={signup.full} onChange={(e) => setSignup((s) => ({ ...s, full: e.target.checked }))} />
                  Help me do a full bars-engine signup later
                </label>
                <button disabled={busy || !playerName.trim()} onClick={saveSignup} style={buttonStyle(true, busy || !playerName.trim())}>
                  Enter party
                </button>
              </div>
            </div>
          </div>
        )}

        {inboxOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.78)", display: "grid", placeItems: "center", padding: "1rem" }}>
            <div style={{ width: "min(100%, 760px)", maxHeight: "88vh", overflow: "auto", background: "#230817", border: `1px solid ${PARTY_GOLD}`, borderRadius: 10, padding: "1rem", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
                <h2 style={{ color: PARTY_GOLD, fontSize: "1.15rem", letterSpacing: "0.08em", margin: 0 }}>Inbox</h2>
                <button type="button" onClick={() => setInboxOpen(false)} style={buttonStyle()}>Close</button>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button type="button" onClick={() => setInboxTab("incoming")} style={buttonStyle(inboxTab === "incoming")}>To Answer ({inbox.incoming.length})</button>
                <button type="button" onClick={() => setInboxTab("returned")} style={buttonStyle(inboxTab === "returned")}>Returned ({inbox.returned.length})</button>
                <button type="button" onClick={() => setInboxTab("sent_pending")} style={buttonStyle(inboxTab === "sent_pending")}>Sent ({inbox.sent_pending.length})</button>
              </div>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {inbox[inboxTab].length ? inbox[inboxTab].map((item) => (
                  <div key={item.thread.id} style={{ border: "1px solid rgba(255,176,0,0.25)", borderRadius: 8, padding: "0.75rem", background: "rgba(0,0,0,0.16)" }}>
                    <p style={{ color: PARTY_GOLD, margin: "0 0 0.3rem", fontSize: "0.86rem" }}>
                      {item.card?.id || item.thread.base_card_id} - {item.card?.title || "Unknown Card"}
                    </p>
                    <p style={{ margin: "0 0 0.35rem", opacity: 0.82, lineHeight: 1.4 }}>
                      {inboxTab === "incoming"
                        ? `From ${item.thread.sender_name}`
                        : inboxTab === "returned"
                          ? `Answered by ${item.thread.answer?.from_name}`
                          : `Waiting on ${item.thread.recipient_name}`}
                    </p>
                    {item.thread.sender_note && (
                      <p style={{ margin: "0 0 0.35rem", fontStyle: "italic", opacity: 0.76 }}>"{item.thread.sender_note}"</p>
                    )}
                    {inboxTab === "incoming" && (
                      <>
                        <p style={{ margin: "0 0 0.65rem", lineHeight: 1.4 }}>{item.card?.prompt}</p>
                        <button type="button" onClick={() => { setAnswering(item); setAnswerText(""); setAnswerPrivateNote(""); }} style={buttonStyle(true)}>Answer</button>
                      </>
                    )}
                    {inboxTab === "returned" && item.thread.answer && (
                      <p style={{ margin: 0, lineHeight: 1.4 }}>{item.thread.answer.text}</p>
                    )}
                  </div>
                )) : (
                  <p style={{ margin: 0, opacity: 0.72 }}>Nothing here yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {answering && (
          <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.82)", display: "grid", placeItems: "center", padding: "1rem" }}>
            <div style={{ width: "min(100%, 520px)", background: "#230817", border: `1px solid ${PARTY_GOLD}`, borderRadius: 10, padding: "1rem", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
              <h2 style={{ color: PARTY_GOLD, fontSize: "1.05rem", letterSpacing: "0.08em", margin: "0 0 0.5rem" }}>Answer Card</h2>
              <p style={{ color: PARTY_GOLD, margin: "0 0 0.35rem" }}>{answering.card?.id} - {answering.card?.title}</p>
              <p style={{ margin: "0 0 0.75rem", lineHeight: 1.45 }}>{answering.card?.prompt}</p>
              {answering.thread.sender_note && (
                <p style={{ margin: "0 0 0.75rem", fontStyle: "italic", opacity: 0.78 }}>"{answering.thread.sender_note}" - {answering.thread.sender_name}</p>
              )}
              <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Your answer" style={fieldStyle(true)} autoFocus />
              <textarea value={answerPrivateNote} onChange={(e) => setAnswerPrivateNote(e.target.value)} placeholder="Private note, optional" style={{ ...fieldStyle(true), marginTop: "0.65rem" }} />
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.75rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setAnswering(null)} style={buttonStyle()}>Cancel</button>
                <button type="button" disabled={busy || !answerText.trim()} onClick={answerThread} style={buttonStyle(true, busy || !answerText.trim())}>Send answer</button>
              </div>
            </div>
          </div>
        )}

        {questComposerOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 65, background: "rgba(0,0,0,0.82)", display: "grid", placeItems: "center", padding: "1rem" }}>
            <div style={{ width: "min(100%, 760px)", maxHeight: "90vh", overflow: "auto", background: "#230817", border: `1px solid ${PARTY_GOLD}`, borderRadius: 10, padding: "1rem", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.85rem" }}>
                <div>
                  <h2 style={{ color: PARTY_GOLD, fontSize: "1.15rem", letterSpacing: "0.08em", margin: "0 0 0.25rem" }}>Quest Wizard</h2>
                  <p style={{ margin: 0, opacity: 0.74, lineHeight: 1.35 }}>Make a quick party quest, or add deeper context so the card helps people get treasured with more care.</p>
                </div>
                <button type="button" onClick={() => setQuestComposerOpen(false)} style={buttonStyle()}>Close</button>
              </div>

              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {(["face", "template", "details", "review"] as const).map((step) => (
                  <button key={step} type="button" onClick={() => setQuestWizardStep(step)} style={buttonStyle(questWizardStep === step)}>
                    {step[0].toUpperCase() + step.slice(1)}
                  </button>
                ))}
              </div>

              {questWizardStep === "face" && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <p style={{ margin: 0, lineHeight: 1.45 }}>Start by choosing the face of the quest. Each face has a different instinct for what it means to treasure someone.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: "0.65rem" }}>
                    {FACE_FIELDS.map(([face, label, help]) => (
                      <button
                        key={face}
                        type="button"
                        onClick={() => {
                          setQuestDraft((draft) => ({ ...draft, face, game_master: { ...draft.game_master, [face]: help } }));
                          setQuestWizardStep("template");
                        }}
                        style={{ ...buttonStyle(questDraft.face === face), textAlign: "left", lineHeight: 1.35 }}
                      >
                        {label}<br /><span style={{ fontWeight: 400, opacity: 0.78 }}>{help}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={surpriseQuestTemplate} style={buttonStyle(true)}>Surprise me</button>
                </div>
              )}

              {questWizardStep === "template" && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <p style={{ margin: 0, lineHeight: 1.45 }}>Now choose whether this is an ASK or OFFER, and which W/C/G/S mode it uses. Templates are different for asks and offers.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "0.65rem" }}>
                    <button type="button" onClick={() => setQuestDraft((draft) => ({ ...draft, kind: "ask" }))} style={{ ...buttonStyle(questDraft.kind === "ask"), textAlign: "left" }}>
                      ASK<br /><span style={{ fontWeight: 400, opacity: 0.78 }}>A quest someone chooses and completes.</span>
                    </button>
                    <button type="button" onClick={() => setQuestDraft((draft) => ({ ...draft, kind: "offer" }))} style={{ ...buttonStyle(questDraft.kind === "offer"), textAlign: "left" }}>
                      OFFER<br /><span style={{ fontWeight: 400, opacity: 0.78 }}>A care move someone can claim from you.</span>
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "0.5rem" }}>
                    {WAVE_MODE_FIELDS.map(([mode, label, help]) => (
                      <button key={mode} type="button" onClick={() => setQuestDraft((draft) => ({ ...draft, wave_mode: mode }))} style={{ ...buttonStyle(questDraft.wave_mode === mode), textAlign: "left", lineHeight: 1.3 }}>
                        {label}<br /><span style={{ fontWeight: 400, opacity: 0.76 }}>{help}</span>
                      </button>
                    ))}
                  </div>
                  {questDraft.face ? (
                    <div style={{ display: "grid", gap: "0.65rem" }}>
                      <p style={{ margin: 0, color: PARTY_GOLD }}>Choose a template, then rewrite it into your own quest.</p>
                      {matchingQuestTemplates.map((template) => (
                        <button key={template.id} type="button" onClick={() => applyQuestTemplate(template)} style={{ ...buttonStyle(false), textAlign: "left", lineHeight: 1.4 }}>
                          {template.title}<br />
                          <span style={{ fontWeight: 400, opacity: 0.78 }}>{template.creator_prompt}</span>
                        </button>
                      ))}
                      <button type="button" onClick={surpriseQuestTemplate} style={buttonStyle(true)}>Surprise me</button>
                    </div>
                  ) : (
                    <p style={{ margin: 0, opacity: 0.72 }}>Choose a face first, or use Surprise me.</p>
                  )}
                </div>
              )}

              {questWizardStep === "details" && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <p style={{ margin: 0, lineHeight: 1.45 }}>Edit the draft until it sounds like something you would actually invite or offer. The context fields are optional and can be skipped.</p>
                  <input value={questDraft.title} onChange={(e) => setQuestDraft((draft) => ({ ...draft, title: e.target.value }))} placeholder="Quest title" style={fieldStyle()} />
                  <textarea value={questDraft.prompt} onChange={(e) => setQuestDraft((draft) => ({ ...draft, prompt: e.target.value }))} placeholder="What should people do?" style={fieldStyle(true)} />
                  <select value={questDraft.category} onChange={(e) => setQuestDraft((draft) => ({ ...draft, category: e.target.value }))} style={fieldStyle()}>
                    <option value="treasure">Treasure</option>
                    <option value="care">Care</option>
                    <option value="connection">Connection</option>
                    <option value="ritual">Ritual</option>
                    <option value="spa">Spa</option>
                    <option value="joy">Joy</option>
                    <option value="grounding">Grounding</option>
                    <option value="body">Body</option>
                    <option value="breath">Breath</option>
                    <option value="altar">Altar</option>
                    <option value="valkyrie">Valkyrie</option>
                  </select>
                  <input value={questDraft.materials} onChange={(e) => setQuestDraft((draft) => ({ ...draft, materials: e.target.value }))} placeholder="Materials, location, or consent notes, optional" style={fieldStyle()} />
                  <input value={questDraft.wave[questDraft.wave_mode]} onChange={(e) => setQuestDraft((draft) => ({ ...draft, wave: { ...draft.wave, [draft.wave_mode]: e.target.value } }))} placeholder="Optional W/C/G/S context for this quest" style={fieldStyle()} />
                </div>
              )}

              {questWizardStep === "review" && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <QuestSlip card={{ ...questDraft, id: "preview", author: playerName || "Anonymous", created_at: new Date().toISOString() }} />
                  <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.45 }}>Only title and action are required. Everything else is context for people who want a richer quest.</p>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", flexWrap: "wrap", marginTop: "1rem" }}>
                <button type="button" onClick={() => setQuestDraft(EMPTY_QUEST_DRAFT)} style={buttonStyle()}>Clear</button>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setQuestWizardStep("review")} style={buttonStyle()}>Preview card</button>
                  <button type="button" disabled={busy || !questDraft.title.trim() || !questDraft.prompt.trim()} onClick={addQuestCard} style={buttonStyle(true, busy || !questDraft.title.trim() || !questDraft.prompt.trim())}>
                    Add to quest deck
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1rem", alignItems: "start" }}>
          <div style={{ background: "rgba(0, 0, 0, 0.18)", border: `1px solid rgba(255, 176, 0, 0.35)`, borderRadius: 8, padding: "1rem", display: "grid", placeItems: "center", minHeight: 480 }}>
            {selectedCard && cardRevealed ? (
              <div style={{ display: "grid", gap: "0.8rem", justifyItems: "center" }}>
                <CardFace card={selectedCard} depth={selectedDepth} playerCard={selectedPlayerCard} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", justifyContent: "center", maxWidth: CARD_WIDTH }}>
                  {(["easy", "medium", "hard"] as const).map((depth) => (
                    <button key={depth} type="button" onClick={() => setSelectedDepth(depth)} style={buttonStyle(selectedDepth === depth)}>
                      {depth.toUpperCase()}
                    </button>
                  ))}
                </div>
                <button onClick={drawCard} style={buttonStyle(true)}>Draw another oracle card</button>
                {relatedPlayerCards.length > 0 && (
                  <div style={{ width: "100%", maxWidth: 520, background: PARTY_PANEL, border: "1px solid rgba(255,176,0,0.25)", borderRadius: 8, padding: "0.75rem" }}>
                    <p style={{ color: PARTY_GOLD, margin: "0 0 0.5rem", fontSize: "0.82rem" }}>Player cards attached to {selectedCard.id}</p>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button type="button" onClick={() => setSelectedPlayerCard(null)} style={buttonStyle(!selectedPlayerCard)}>
                        Original
                      </button>
                      {relatedPlayerCards.map((card) => (
                        <button key={card.id} type="button" onClick={() => setSelectedPlayerCard(card)} style={buttonStyle(selectedPlayerCard?.id === card.id)}>
                          {card.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ width: "100%", maxWidth: 520, background: PARTY_PANEL, border: "1px solid rgba(255,176,0,0.25)", borderRadius: 8, padding: "0.75rem" }}>
                  <p style={{ color: PARTY_GOLD, margin: "0 0 0.5rem", fontSize: "0.82rem" }}>Answer this prompt</p>
                  <textarea value={oracleAnswerDraft} onChange={(e) => setOracleAnswerDraft(e.target.value)} placeholder="Write your answer. Save it privately, or send it to Valkyrie." style={fieldStyle(true)} />
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.55rem" }}>
                    <button type="button" disabled={busy || !playerName.trim() || !oracleAnswerDraft.trim()} onClick={() => saveOracleAnswer("private")} style={buttonStyle(false, busy || !playerName.trim() || !oracleAnswerDraft.trim())}>
                      Save privately
                    </button>
                    <button type="button" disabled={busy || !playerName.trim() || !oracleAnswerDraft.trim()} onClick={() => saveOracleAnswer("valkyrie")} style={buttonStyle(true, busy || !playerName.trim() || !oracleAnswerDraft.trim())}>
                      Send to Valkyrie
                    </button>
                  </div>
                </div>
                <div style={{ width: "100%", maxWidth: 520, background: PARTY_PANEL, border: "1px solid rgba(255,176,0,0.25)", borderRadius: 8, padding: "0.75rem" }}>
                  <p style={{ color: PARTY_GOLD, margin: "0 0 0.5rem", fontSize: "0.82rem" }}>Send this card</p>
                  <div style={{ display: "grid", gap: "0.55rem" }}>
                    <select value={mailDraft.recipient_name} onChange={(e) => setMailDraft((draft) => ({ ...draft, recipient_name: e.target.value }))} style={fieldStyle()}>
                      <option value="">Choose recipient</option>
                      {players.filter((name) => name !== playerName).map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <textarea value={mailDraft.sender_note} onChange={(e) => setMailDraft((draft) => ({ ...draft, sender_note: e.target.value }))} placeholder="Optional note to send with the card" style={fieldStyle(true)} />
                    <button type="button" disabled={busy || !playerName.trim() || !mailDraft.recipient_name} onClick={sendCardMail} style={buttonStyle(true, busy || !playerName.trim() || !mailDraft.recipient_name)}>
                      Send card
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.85rem", justifyItems: "center", textAlign: "center", maxWidth: 360 }}>
                <CardBack onClick={selectedCard ? () => setCardRevealed(true) : undefined} />
                <p style={{ lineHeight: 1.55, opacity: 0.82, margin: 0 }}>
                  {selectedCard ? "A card has arrived. Tap the back to reveal it." : "Draw an oracle card for connection, reflection, or passing to someone else."}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <button onClick={drawCard} style={buttonStyle(true)}>{selectedCard ? "Draw another oracle card" : "Draw oracle card"}</button>
                  {selectedCard && !cardRevealed && (
                    <button onClick={() => setCardRevealed(true)} style={buttonStyle()}>Reveal</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            <Panel title="Quest Deck">
              <p style={{ margin: "0 0 0.75rem", opacity: 0.8, lineHeight: 1.45 }}>
                Draw a party activity, or add a new "Get Fucking Treasured" experience for everyone to encounter.
              </p>
              {selectedQuestCard && questRevealed ? (
                <div style={{ display: "grid", gap: "0.75rem", marginBottom: "0.85rem", justifyItems: "center" }}>
                  <QuestSlip card={selectedQuestCard} />
                  <div style={{ width: "100%", display: "grid", gap: "0.5rem" }}>
                    <input value={questPhotoCaption} onChange={(e) => setQuestPhotoCaption(e.target.value)} placeholder="Photo caption, optional" style={fieldStyle()} />
                    <label style={{ ...buttonStyle(false, busy || !playerName.trim()), textAlign: "center" }}>
                      Attach completion photo
                      <input
                        type="file"
                        accept="image/*"
                        disabled={busy || !playerName.trim()}
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0] || null;
                          uploadQuestPhoto(file);
                          e.currentTarget.value = "";
                        }}
                        style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>
              ) : selectedQuestCard ? (
                <div style={{ display: "grid", gap: "0.75rem", marginBottom: "0.85rem", justifyItems: "center", textAlign: "center" }}>
                  <CardBack onClick={() => setQuestRevealed(true)} />
                  <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.45 }}>A quest is ready. Tap the back to reveal it.</p>
                </div>
              ) : (
                <p style={{ margin: "0 0 0.85rem", opacity: 0.72, lineHeight: 1.45 }}>
                  The quest deck is for the actual party: spa missions, care offers, room games, tiny rituals, and treasure moments.
                </p>
              )}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={drawQuestCard} style={buttonStyle(true)}>{selectedQuestCard ? "Draw another quest" : "Draw quest"}</button>
                {selectedQuestCard && !questRevealed && (
                  <button type="button" onClick={() => setQuestRevealed(true)} style={buttonStyle()}>Reveal quest</button>
                )}
                <button type="button" onClick={() => { setQuestComposerOpen(true); setQuestWizardStep("face"); }} style={buttonStyle()}>
                  Add quest
                </button>
              </div>
              <p style={{ margin: "0.75rem 0 0", opacity: 0.62, fontSize: "0.8rem" }}>
                {deck.quest_cards.length} quests available
              </p>
            </Panel>
          </div>
        </section>

        <section style={{ display: "grid", gap: "1rem" }}>
          <Panel
            title="Party Flow"
            action={
              <button type="button" onClick={() => setScheduleOpen((open) => !open)} style={buttonStyle()}>
                {scheduleOpen ? "Hide schedule" : "Show full schedule"}
              </button>
            }
          >
            <p style={{ margin: "0 0 0.55rem", color: PARTY_GOLD }}>{new Date(`${deck.party.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
            <p style={{ margin: "0 0 0.75rem", opacity: 0.82 }}>{deck.party.location}</p>
            <p style={{ margin: "0 0 0.9rem", lineHeight: 1.5 }}>{deck.party.host_note}</p>
            <p style={{ margin: 0, opacity: 0.78, lineHeight: 1.45 }}>
              This is the current spa-day arc. It is timed enough to coordinate the big shared moments, but still soft enough for check-ins, invitations, treasure pivots, and what the room needs.
            </p>
            {scheduleOpen && (
              <>
                <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.75rem" }}>
                  {deck.party.schedule.map((item) => (
                    <div key={`${item.time}-${item.title}`} style={{ borderTop: "1px solid rgba(255,176,0,0.2)", paddingTop: "0.55rem" }}>
                      <p style={{ margin: "0 0 0.15rem", color: PARTY_GOLD, fontSize: "0.86rem" }}>{item.time} - {item.title}</p>
                      <p style={{ margin: 0, opacity: 0.78, lineHeight: 1.4, fontSize: "0.88rem" }}>{item.details}</p>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setShowAdmin((open) => !open)} style={{ ...buttonStyle(), marginTop: "0.85rem" }}>
                  Admin flow editor
                </button>
              </>
            )}
          </Panel>

          <Panel title="Shared Altar">
            <p style={{ margin: "0 0 0.7rem", opacity: 0.78 }}>
              {signups.length} players have joined. The Shared Altar is the public memory-board of the party: blessings, photos, public answers, little offerings, inside jokes, and notes people want the whole room to witness.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.85rem" }}>
              <button type="button" onClick={() => window.location.assign("/valkyrie-party/altar")} style={buttonStyle(true)}>
                Enter the public altar
              </button>
            </div>
          </Panel>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1rem" }}>
          <Panel title="My Discovered Cards">
            {discovery ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}>
                  <p style={{ margin: 0, color: PARTY_GOLD }}>
                    {discovery.discovered_count} / {discovery.total_cards} discovered
                  </p>
                  <button type="button" onClick={() => setDiscoveryOpen((open) => !open)} style={buttonStyle()}>
                    {discoveryOpen ? "Hide" : "Show"}
                  </button>
                </div>
                {discoveryOpen && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: "0.45rem", maxHeight: 240, overflow: "auto", marginTop: "0.75rem" }}>
                    {discovery.cards.map((slot) => (
                      <div key={slot.id} style={{ border: "1px solid rgba(255,176,0,0.22)", borderRadius: 6, padding: "0.45rem", minHeight: 64, background: slot.state === "discovered" ? "rgba(255,176,0,0.08)" : "rgba(0,0,0,0.16)" }}>
                        <p style={{ margin: "0 0 0.2rem", color: PARTY_GOLD, fontSize: "0.72rem" }}>{slot.id}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", lineHeight: 1.25, opacity: slot.state === "discovered" ? 0.92 : 0.48 }}>
                          {slot.card?.title || "Undiscovered"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ margin: 0, opacity: 0.72 }}>Join and shuffle to start discovering cards.</p>
            )}
          </Panel>

          <Panel title="My Answer Deck">
            {personalDeck.length ? (
              <div style={{ display: "grid", gap: "0.65rem", maxHeight: 260, overflow: "auto" }}>
                {personalDeck.map((group) => (
                  <div key={group.base_card_id} style={{ borderTop: "1px solid rgba(255,176,0,0.2)", paddingTop: "0.55rem" }}>
                    <p style={{ margin: "0 0 0.25rem", color: PARTY_GOLD }}>{group.base_card_id} - {group.base_card?.title || "Unknown Card"}</p>
                    <p style={{ margin: "0 0 0.35rem", opacity: 0.72 }}>{group.answers.length} answers collected</p>
                    {group.answers.slice(0, 2).map((answer) => (
                      <p key={answer.thread_id} style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", lineHeight: 1.35 }}>
                        {answer.from_name}: {answer.answer_text}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, opacity: 0.72 }}>Answers people send back to you will collect here.</p>
            )}
          </Panel>
        </section>

        {showAdmin && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <Panel title="Admin Schedule Editor">
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Admin token" style={fieldStyle()} />
                <input value={scheduleDraft.location} onChange={(e) => setScheduleDraft((p) => p && ({ ...p, location: e.target.value }))} placeholder="Location" style={fieldStyle()} />
                <textarea value={scheduleDraft.host_note} onChange={(e) => setScheduleDraft((p) => p && ({ ...p, host_note: e.target.value }))} placeholder="Host note" style={fieldStyle(true)} />
                {scheduleDraft.schedule.map((row, index) => (
                  <div key={index} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "0.5rem" }}>
                    <input value={row.time} onChange={(e) => setScheduleDraft((p) => p && ({ ...p, schedule: p.schedule.map((r, i) => i === index ? { ...r, time: e.target.value } : r) }))} placeholder="Time" style={fieldStyle()} />
                    <input value={row.title} onChange={(e) => setScheduleDraft((p) => p && ({ ...p, schedule: p.schedule.map((r, i) => i === index ? { ...r, title: e.target.value } : r) }))} placeholder="Title" style={fieldStyle()} />
                    <div />
                    <textarea value={row.details} onChange={(e) => setScheduleDraft((p) => p && ({ ...p, schedule: p.schedule.map((r, i) => i === index ? { ...r, details: e.target.value } : r) }))} placeholder="Details" style={fieldStyle(true)} />
                  </div>
                ))}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setScheduleDraft((p) => p && ({ ...p, schedule: [...p.schedule, { time: "", title: "", details: "" }] }))} style={buttonStyle()}>
                    Add schedule row
                  </button>
                  <button type="button" disabled={busy || !adminToken.trim()} onClick={saveSchedule} style={buttonStyle(true, busy || !adminToken.trim())}>
                    Save schedule
                  </button>
                  <button type="button" disabled={!adminToken.trim()} onClick={() => loadAdminDeckMap().catch((err) => setNotice(err instanceof Error ? err.message : "Could not load deck map"))} style={buttonStyle(false, !adminToken.trim())}>
                    Load deck map
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="Admin Deck Map">
              {adminDeckMap.length ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.55rem", maxHeight: 360, overflow: "auto" }}>
                  {adminDeckMap.map((row) => (
                    <button key={row.card.id} type="button" onClick={() => setSelectedAdminCardId(row.card.id)} style={{ border: selectedAdminCardId === row.card.id ? "1px solid rgba(255,176,0,0.65)" : "1px solid rgba(255,176,0,0.22)", borderRadius: 6, padding: "0.55rem", background: "rgba(0,0,0,0.15)", textAlign: "left", color: PARTY_CREAM, font: "inherit", cursor: "pointer" }}>
                      <p style={{ margin: "0 0 0.2rem", color: PARTY_GOLD, fontSize: "0.78rem" }}>{row.card.id} - {row.card.title}</p>
                      <p style={{ margin: 0, opacity: 0.75, fontSize: "0.76rem" }}>{row.discovery_count} discovered - {row.thread_count} threads</p>
                      <p style={{ margin: "0.2rem 0 0", opacity: 0.65, fontSize: "0.72rem" }}>{row.player_cards.length} attached cards</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, opacity: 0.72 }}>Enter the admin token and load the deck map to see all cards.</p>
              )}
            </Panel>

            <Panel title="Admin Card Editor">
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <select value={selectedAdminCardId} onChange={(e) => setSelectedAdminCardId(e.target.value)} style={fieldStyle()}>
                  <option value="">Choose a card</option>
                  {deck.cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.id} - {card.title}
                    </option>
                  ))}
                </select>
                {currentAdminCard ? (
                  <>
                    <input value={adminCopyDraft.title} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, title: e.target.value }))} placeholder="Card title" style={fieldStyle()} />
                    {(["easy", "medium", "hard"] as const).map((depth) => (
                      <div key={depth} style={{ display: "grid", gap: "0.45rem", borderTop: "1px solid rgba(255,176,0,0.15)", paddingTop: "0.65rem" }}>
                        <p style={{ margin: 0, color: PARTY_GOLD, fontSize: "0.82rem" }}>{depth.toUpperCase()}</p>
                        <input value={adminCopyDraft.flavor[depth].title} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, flavor: { ...draft.flavor, [depth]: { ...draft.flavor[depth], title: e.target.value } } }))} placeholder={`${depth} flavor title`} style={fieldStyle()} />
                        <input value={adminCopyDraft.flavor[depth].npc} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, flavor: { ...draft.flavor, [depth]: { ...draft.flavor[depth], npc: e.target.value } } }))} placeholder={`${depth} voice / npc`} style={fieldStyle()} />
                        <textarea value={adminCopyDraft.flavor[depth].line} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, flavor: { ...draft.flavor, [depth]: { ...draft.flavor[depth], line: e.target.value } } }))} placeholder={`${depth} flavor line`} style={fieldStyle(true)} />
                        <textarea value={adminCopyDraft.prompts[depth]} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, prompts: { ...draft.prompts, [depth]: e.target.value } }))} placeholder={`${depth} prompt`} style={fieldStyle(true)} />
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <label style={buttonStyle(false, busy || !adminToken.trim())}>
                        Upload new image
                        <input
                          type="file"
                          accept="image/*"
                          disabled={busy || !adminToken.trim()}
                          onChange={(e) => {
                            const file = e.currentTarget.files?.[0] || null;
                            uploadAdminCardImage(file);
                            e.currentTarget.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                      <button type="button" disabled={busy || !adminToken.trim() || !selectedAdminCardId} onClick={saveAdminCardCopy} style={buttonStyle(true, busy || !adminToken.trim() || !selectedAdminCardId)}>
                        Save card copy
                      </button>
                      <button type="button" onClick={() => window.location.assign("/oracle")} style={buttonStyle()}>
                        Open full oracle editor
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, opacity: 0.72 }}>Choose a card to edit its title, flavor copy, prompts, or image.</p>
                )}
              </div>
            </Panel>
          </div>
        )}
      {orientationStep > 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.78)", display: "grid", placeItems: "center", padding: "1rem" }}>
          <div style={{ width: "min(100%, 520px)", background: "#230817", border: `1px solid ${PARTY_GOLD}`, borderRadius: 12, padding: "1rem", display: "grid", gap: "0.75rem", boxShadow: "0 24px 70px rgba(0,0,0,0.45)" }}>
            <p style={{ margin: 0, color: PARTY_TEAL, fontSize: "0.76rem", letterSpacing: "0.12em" }}>PARTY ORIENTATION</p>
            {orientationStep === 1 && (<>
              <h2 style={{ margin: 0, color: PARTY_GOLD }}>1. Draw your first oracle card</h2>
              <p style={{ margin: 0, lineHeight: 1.5, opacity: 0.85 }}>Start by shuffling the oracle deck. The card begins face-down, then you reveal it when you are ready.</p>
            </>)}
            {orientationStep === 2 && (<>
              <h2 style={{ margin: 0, color: PARTY_GOLD }}>2. Answer it or pass it on</h2>
              <p style={{ margin: 0, lineHeight: 1.5, opacity: 0.85 }}>You can answer privately, send your answer to Valkyrie, or mail the card to another player so they can answer it.</p>
            </>)}
            {orientationStep === 3 && (<>
              <h2 style={{ margin: 0, color: PARTY_GOLD }}>3. Try the quest deck</h2>
              <p style={{ margin: 0, lineHeight: 1.5, opacity: 0.85 }}>The quest deck is for actual treasured experiences at the party. Shuffle until something catches your interest, or add an ask or offer.</p>
            </>)}
            {orientationStep === 4 && (<>
              <h2 style={{ margin: 0, color: PARTY_GOLD }}>4. Visit the public altar</h2>
              <p style={{ margin: 0, lineHeight: 1.5, opacity: 0.85 }}>The altar is the shared public layer. Leave blessings, memories, photos, and public answers there. The Emotional First Aid page also works from this guest session.</p>
            </>)}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", flexWrap: "wrap" }}>
              <button type="button" onClick={() => { window.localStorage.setItem("valkyrie_party_orientation_seen_v1", "1"); setOrientationStep(0); }} style={buttonStyle()}>Skip</button>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {orientationStep === 4 ? (
                  <>
                    <button type="button" onClick={() => window.location.assign('/emotional-first-aid?returnTo=/valkyrie-party')} style={buttonStyle()}>Open Emotional First Aid</button>
                    <button type="button" onClick={() => { window.localStorage.setItem("valkyrie_party_orientation_seen_v1", "1"); setOrientationStep(0); window.location.assign('/valkyrie-party/altar'); }} style={buttonStyle(true)}>Open altar</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setOrientationStep((step) => Math.min(4, step + 1))} style={buttonStyle(true)}>Next</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </main>
  );
}
