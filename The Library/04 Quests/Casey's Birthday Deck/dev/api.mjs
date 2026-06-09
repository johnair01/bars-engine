/**
 * Local API + static asset server for Oracle deck preview.
 * Mirrors zo.space routes: GET /api/oracle/deck, POST /api/oracle/upload,
 * POST /api/oracle/crop, POST /api/oracle/copy, POST /api/oracle/publish,
 * DELETE /api/oracle/upload, /images/oracle/*
 */
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DECK_ROOT = path.resolve(__dirname, "..");
const DECK_JSON = path.join(DECK_ROOT, "data", "deck.json");
const IMAGES_DIR = path.join(DECK_ROOT, "images");
const ICONS_DIR = path.join(DECK_ROOT, "icons");
const ORACLE_UPLOAD_DIR = path.join(IMAGES_DIR, "oracle");
const PUBLISHED_ROOT = path.join(DECK_ROOT, "published");
const PUBLISHED_JSON = path.join(PUBLISHED_ROOT, "deck.json");
const PUBLISHED_IMAGES_DIR = path.join(PUBLISHED_ROOT, "images", "oracle");
const MANIFEST_PATH = path.join(PUBLISHED_ROOT, "manifest.json");
const READER_URL = "https://wendellbritt.zo.space/oracle";
const DEFAULT_DECK_SLUG = "casey-birthday";
const PARTY_ROOT = path.join(DECK_ROOT, "data", "party", "valkyrie");
const PARTY_DECK_JSON = path.join(PARTY_ROOT, "deck.json");
const PARTY_PROMPT_OVERRIDES_JSON = path.join(PARTY_ROOT, "prompt-overrides.json");
const PARTY_CARD_OVERRIDES_JSON = path.join(PARTY_ROOT, "card-overrides.json");
const PARTY_ADDED_CARDS_JSON = path.join(PARTY_ROOT, "added-cards.json");
const PARTY_SIGNUPS_JSON = path.join(PARTY_ROOT, "signups.json");
const PARTY_MESSAGES_JSON = path.join(PARTY_ROOT, "messages.json");
const PARTY_CARD_THREADS_JSON = path.join(PARTY_ROOT, "card-threads.json");
const PARTY_DISCOVERY_JSON = path.join(PARTY_ROOT, "discovery.json");
const PARTY_QUEST_CARDS_JSON = path.join(PARTY_ROOT, "quest-cards.json");
const PARTY_ORACLE_ANSWERS_JSON = path.join(PARTY_ROOT, "oracle-answers.json");
const PARTY_QUEST_PHOTOS_JSON = path.join(PARTY_ROOT, "quest-photos.json");
const PARTY_QUEST_PHOTOS_DIR = path.join(PARTY_ROOT, "quest-photos");
const PARTY_ALTAR_POSTS_JSON = path.join(PARTY_ROOT, "altar-posts.json");
const PARTY_ALTAR_REPLIES_JSON = path.join(PARTY_ROOT, "altar-replies.json");
const PARTY_ALTAR_REACTIONS_JSON = path.join(PARTY_ROOT, "altar-reactions.json");
const PARTY_PERSONAL_SAVES_JSON = path.join(PARTY_ROOT, "personal-saves.json");
const PARTY_ALTAR_MEDIA_DIR = path.join(PARTY_ROOT, "altar-media");
const PARTY_ADMIN_TOKEN = process.env.PARTY_ADMIN_TOKEN || "valkyrie-admin";

const DRAFT_CROP = { x: 50, y: 50, zoom: 1 };

fs.mkdirSync(ORACLE_UPLOAD_DIR, { recursive: true });
fs.mkdirSync(PARTY_ROOT, { recursive: true });
fs.mkdirSync(PARTY_QUEST_PHOTOS_DIR, { recursive: true });
fs.mkdirSync(PARTY_ALTAR_MEDIA_DIR, { recursive: true });

const ICON_ALIASES = {
  "icon-wake-up.svg": "oracle-icon-wake-up.svg",
  "icon-clean-up.svg": "oracle-icon-clean-up.svg",
  "icon-grow-up.svg": "oracle-icon-grow-up.svg",
  "icon-show-up.svg": "oracle-icon-show-up.svg",
  "card-back.png": "oracle-card-back.png",
};

function readDeckRaw() {
  return JSON.parse(fs.readFileSync(DECK_JSON, "utf-8"));
}

function readJsonList(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Array.isArray(parsed) ? parsed : [];
}

function writeJsonList(filePath, rows) {
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2) + "\n");
}

function readJsonObject(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function writeJsonObject(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n");
}

function cleanText(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function valkyrieText(value) {
  if (typeof value === "string") {
    return value
      .replaceAll("Casey's", "Valkyrie's")
      .replaceAll("Casey’s", "Valkyrie’s")
      .replaceAll("Casey", "Valkyrie")
      .replaceAll(" he ", " they ")
      .replaceAll(" him ", " them ")
      .replaceAll(" his ", " their ")
      .replaceAll("He ", "They ")
      .replaceAll("Him ", "Them ")
      .replaceAll("His ", "Their ");
  }
  if (Array.isArray(value)) return value.map(valkyrieText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, valkyrieText(entry)]));
  }
  return value;
}

function readPartyDeck() {
  const meta = JSON.parse(fs.readFileSync(PARTY_DECK_JSON, "utf-8"));
  const caseyDeck = readDeckRaw();
  const valkyrieDeck = valkyrieText(caseyDeck);
  const promptOverrides = readJsonObject(PARTY_PROMPT_OVERRIDES_JSON);
  const cardOverrides = readJsonObject(PARTY_CARD_OVERRIDES_JSON);
  const addedCards = readJsonList(PARTY_ADDED_CARDS_JSON);
  const cards = valkyrieDeck.cards.map((card) => {
    const prompts = promptOverrides[card.id];
    const override = cardOverrides[card.id];
    const nextCard = {
      ...card,
      title: cleanText(override?.title, 80) || card.title,
      flavor: {
        easy: {
          ...card.flavor.easy,
          ...override?.flavor?.easy,
        },
        medium: {
          ...card.flavor.medium,
          ...override?.flavor?.medium,
        },
        hard: {
          ...card.flavor.hard,
          ...override?.flavor?.hard,
        },
      },
    };
    if (!prompts) return nextCard;
    return {
      ...nextCard,
      prompts: {
        easy: prompts.easy || nextCard.prompts.easy,
        medium: prompts.medium || nextCard.prompts.medium,
        hard: prompts.hard || nextCard.prompts.hard,
      },
    };
  });
  return {
    ...valkyrieDeck,
    deck_slug: meta.deck_slug,
    deck_name: meta.deck_name,
    for: "Valkyrie",
    made_by: meta.made_by,
    forked_from: meta.forked_from,
    theme: meta.theme,
    story: meta.story,
    party: meta.party,
    cards,
    base_total_cards: cards.length,
    player_cards: addedCards,
    quest_cards: readQuestCards(),
    total_cards: cards.length,
  };
}

function readQuestCards() {
  return readJsonList(PARTY_QUEST_CARDS_JSON);
}

function normalizeQuestCard(body) {
  const title = cleanText(body?.title, 80);
  const prompt = cleanText(body?.prompt, 420);
  const category = cleanText(body?.category, 40) || "treasure";
  const kind = cleanText(body?.kind, 20) === "offer" ? "offer" : "ask";
  const face = cleanText(body?.face, 40);
  const waveMode = ["wake_up", "clean_up", "grow_up", "show_up"].includes(body?.wave_mode) ? body.wave_mode : "wake_up";
  const materials = cleanText(body?.materials, 180);
  const author = cleanText(body?.author, 80) || "Anonymous";
  if (!title || !prompt) return null;
  return {
    id: makeId("quest"),
    title,
    prompt,
    category,
    kind,
    face,
    wave_mode: waveMode,
    materials,
    author,
    wave: {
      wake_up: cleanText(body?.wave?.wake_up, 220),
      clean_up: cleanText(body?.wave?.clean_up, 220),
      grow_up: cleanText(body?.wave?.grow_up, 220),
      show_up: cleanText(body?.wave?.show_up, 220),
    },
    game_master: {
      challenger: cleanText(body?.game_master?.challenger, 180),
      diplomat: cleanText(body?.game_master?.diplomat, 180),
      shaman: cleanText(body?.game_master?.shaman, 180),
      architect: cleanText(body?.game_master?.architect, 180),
      regent: cleanText(body?.game_master?.regent, 180),
      sage: cleanText(body?.game_master?.sage, 180),
    },
    created_at: new Date().toISOString(),
    seed: false,
  };
}

function normalizeOracleAnswer(body) {
  const player = cleanText(body?.player, 80);
  const baseCardId = cleanText(body?.base_card_id, 40);
  const answerText = cleanText(body?.answer_text, 1200);
  const scope = cleanText(body?.scope, 40) === "valkyrie" ? "valkyrie" : "private";
  const depth = DEPTHS.includes(body?.depth) ? body.depth : "hard";
  if (!player || !baseCardId || !answerText) return null;
  return {
    id: makeId("oracle-answer"),
    player,
    base_card_id: baseCardId,
    depth,
    scope,
    answer_text: answerText,
    created_at: new Date().toISOString(),
  };
}

function normalizePartyCard(body) {
  const baseCardId = cleanText(body?.base_card_id, 40);
  const title = cleanText(body?.title, 80);
  const prompt = cleanText(body?.prompt, 280);
  const flavor = cleanText(body?.flavor, 220);
  const author = cleanText(body?.author, 80) || "Anonymous";
  if (!baseCardId || !title || !prompt) return null;
  return {
    id: makeId("guest-card"),
    base_card_id: baseCardId,
    suit: { code: "GIFT", name: "Guest Gifts", domain: "Cards added at the party", icon: "+" },
    rank: "Gift",
    title,
    prompt,
    flavor: flavor || "A card added by someone in the room.",
    author,
    created_at: new Date().toISOString(),
    guest_created: true,
  };
}

function requirePartyAdmin(req, res) {
  const token = cleanText(req.body?.admin_token ?? req.query?.admin_token, 100);
  if (token !== PARTY_ADMIN_TOKEN) {
    res.status(403).json({ ok: false, error: "Admin token required" });
    return false;
  }
  return true;
}

function normalizeSchedule(body) {
  const location = cleanText(body?.location, 160);
  const hostNote = cleanText(body?.host_note, 400);
  const schedule = Array.isArray(body?.schedule) ? body.schedule : null;
  if (!schedule) return null;
  const rows = schedule
    .map((item) => ({
      time: cleanText(item?.time, 40),
      title: cleanText(item?.title, 100),
      details: cleanText(item?.details, 280),
    }))
    .filter((item) => item.time && item.title);
  if (!rows.length) return null;
  return { location, host_note: hostNote, schedule: rows };
}

function normalizePartyCardCopy(body) {
  const cardId = cleanText(body?.card_id, 40);
  if (!cardId) return null;
  return {
    card_id: cardId,
    title: cleanText(body?.title, 80),
    prompts: {
      easy: cleanText(body?.prompts?.easy, 320),
      medium: cleanText(body?.prompts?.medium, 320),
      hard: cleanText(body?.prompts?.hard, 320),
    },
    flavor: {
      easy: {
        title: cleanText(body?.flavor?.easy?.title, 120),
        line: cleanText(body?.flavor?.easy?.line, 220),
        npc: cleanText(body?.flavor?.easy?.npc, 120),
      },
      medium: {
        title: cleanText(body?.flavor?.medium?.title, 120),
        line: cleanText(body?.flavor?.medium?.line, 220),
        npc: cleanText(body?.flavor?.medium?.npc, 120),
      },
      hard: {
        title: cleanText(body?.flavor?.hard?.title, 120),
        line: cleanText(body?.flavor?.hard?.line, 220),
        npc: cleanText(body?.flavor?.hard?.npc, 120),
      },
    },
  };
}

const ALTAR_CATEGORIES = new Set([
  "blessing",
  "memory",
  "quest_dare",
  "inside_joke",
  "question",
  "public_card_answer",
  "inspiration",
  "photo",
  "other",
]);

const ALTAR_REACTIONS = ["triumph", "poignance", "bliss", "excitement", "peace"];

function normalizeAltarPost(body, file) {
  const player = cleanText(body?.player, 80);
  const anonymous = Boolean(body?.anonymous);
  const category = ALTAR_CATEGORIES.has(body?.category) ? body.category : "other";
  const title = cleanText(body?.title, 120);
  const bodyText = cleanText(body?.body, 2000);
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((tag) => cleanText(tag, 40)).filter(Boolean).slice(0, 10)
    : String(body?.tags || "")
        .split(",")
        .map((tag) => cleanText(tag, 40))
        .filter(Boolean)
        .slice(0, 10);
  const sourceKind = cleanText(body?.source?.kind || body?.source_kind, 40) || "freeform";
  const baseCardId = cleanText(body?.source?.base_card_id || body?.base_card_id, 40) || null;
  const threadId = cleanText(body?.source?.thread_id || body?.thread_id, 80) || null;
  const playerCardId = cleanText(body?.source?.player_card_id || body?.player_card_id, 80) || null;
  if (!player || !bodyText) return null;
  const media = [];
  if (file) {
    const safeExt = file.mimetype === "image/jpeg" ? "jpg" : file.mimetype === "image/webp" ? "webp" : "png";
    const mediaId = makeId("altar-media");
    const fileName = `${mediaId}.${safeExt}`;
    fs.writeFileSync(path.join(PARTY_ALTAR_MEDIA_DIR, fileName), file.buffer);
    media.push({
      id: mediaId,
      type: "image",
      url: `/images/party/valkyrie/altar-media/${fileName}`,
      alt: title || bodyText.slice(0, 90) || "Party altar image",
    });
  }
  return {
    id: makeId("altar-post"),
    author_name: anonymous ? "Anonymous" : player,
    anonymous,
    category,
    tags,
    title,
    body: bodyText,
    source: {
      kind: sourceKind,
      base_card_id: baseCardId,
      thread_id: threadId,
      player_card_id: playerCardId,
    },
    media,
    created_at: new Date().toISOString(),
    deleted_at: null,
  };
}

function normalizeAltarReply(body) {
  const player = cleanText(body?.player, 80);
  const anonymous = Boolean(body?.anonymous);
  const postId = cleanText(body?.post_id, 80);
  const bodyText = cleanText(body?.body, 1200);
  if (!player || !postId || !bodyText) return null;
  return {
    id: makeId("altar-reply"),
    post_id: postId,
    author_name: anonymous ? "Anonymous" : player,
    anonymous,
    body: bodyText,
    created_at: new Date().toISOString(),
    deleted_at: null,
  };
}

function normalizeAltarSave(body) {
  const player = cleanText(body?.player, 80);
  const artifactId = cleanText(body?.artifact_id, 80);
  const note = cleanText(body?.note, 240);
  if (!player || !artifactId) return null;
  return {
    id: makeId("save"),
    player_name: player,
    artifact_type: "altar_post",
    artifact_id: artifactId,
    note,
    created_at: new Date().toISOString(),
  };
}

function buildAltarBoard(category = "") {
  const filterCategory = ALTAR_CATEGORIES.has(category) ? category : "";
  const posts = readJsonList(PARTY_ALTAR_POSTS_JSON).filter((post) => !post.deleted_at);
  const replies = readJsonList(PARTY_ALTAR_REPLIES_JSON).filter((reply) => !reply.deleted_at);
  const reactions = readJsonList(PARTY_ALTAR_REACTIONS_JSON);
  const personalSaves = readJsonList(PARTY_PERSONAL_SAVES_JSON);
  const boardPosts = posts
    .filter((post) => !filterCategory || post.category === filterCategory)
    .map((post) => {
      const reactionCounts = Object.fromEntries(ALTAR_REACTIONS.map((reaction) => [reaction, 0]));
      const postReactions = reactions.filter((reaction) => reaction.post_id === post.id);
      for (const reaction of postReactions) {
        if (reactionCounts[reaction.reaction] !== undefined) reactionCounts[reaction.reaction] += 1;
      }
      return {
        post,
        replies: replies.filter((reply) => reply.post_id === post.id),
        reactions: reactionCounts,
        saved_count: personalSaves.filter((save) => save.artifact_type === "altar_post" && save.artifact_id === post.id).length,
      };
    });
  return {
    posts: boardPosts,
    total_posts: boardPosts.length,
    categories: Array.from(ALTAR_CATEGORIES),
    reaction_types: ALTAR_REACTIONS,
  };
}

function findPartyBaseCard(deck, cardId) {
  return deck.cards.find((card) => card.id === cardId) || null;
}

function cardPrompt(card) {
  return card?.prompts?.hard || card?.prompts?.medium || card?.prompts?.easy || "";
}

function cardSummary(card) {
  if (!card) return null;
  return {
    id: card.id,
    title: card.title,
    rank: card.rank,
    suit: card.suit,
    image_file: card.image_file,
    uploaded: card.uploaded,
    crop_saved: card.crop_saved,
    crop: card.crop,
    prompt: cardPrompt(card),
  };
}

function readDiscoveryRaw() {
  return readJsonObject(PARTY_DISCOVERY_JSON);
}

function writeDiscoveryRaw(discovery) {
  writeJsonObject(PARTY_DISCOVERY_JSON, discovery);
}

function recordDiscovery(player, cardId, source = "draw") {
  const cleanPlayer = cleanText(player, 80);
  const cleanCardId = cleanText(cardId, 40);
  const cleanSource = cleanText(source, 40) || "draw";
  if (!cleanPlayer || !cleanCardId) return null;
  const discovery = readDiscoveryRaw();
  const current = discovery[cleanPlayer] || { card_ids: [], events: [] };
  const cardIds = Array.isArray(current.card_ids) ? current.card_ids : [];
  const events = Array.isArray(current.events) ? current.events : [];
  if (!cardIds.includes(cleanCardId)) cardIds.push(cleanCardId);
  events.push({
    card_id: cleanCardId,
    source: cleanSource,
    created_at: new Date().toISOString(),
  });
  discovery[cleanPlayer] = { card_ids: cardIds, events };
  writeDiscoveryRaw(discovery);
  return { player: cleanPlayer, card_ids: cardIds, events };
}

function discoveryForPlayer(player) {
  const cleanPlayer = cleanText(player, 80);
  const discovery = readDiscoveryRaw();
  const current = discovery[cleanPlayer] || { card_ids: [], events: [] };
  return {
    player: cleanPlayer,
    card_ids: Array.isArray(current.card_ids) ? current.card_ids : [],
    events: Array.isArray(current.events) ? current.events : [],
  };
}

function buildDiscoveryDeck(player, isAdmin = false) {
  const deck = readPartyDeck();
  const found = discoveryForPlayer(player);
  const foundSet = new Set(found.card_ids);
  return {
    player: found.player,
    discovered_count: isAdmin ? deck.cards.length : foundSet.size,
    total_cards: deck.cards.length,
    cards: deck.cards.map((card) => {
      const discovered = isAdmin || foundSet.has(card.id);
      return {
        id: card.id,
        state: discovered ? "discovered" : "undiscovered",
        card: discovered ? cardSummary(card) : null,
        player_cards: discovered
          ? deck.player_cards.filter((playerCard) => playerCard.base_card_id === card.id)
          : [],
      };
    }),
  };
}

function normalizeThreadPayload(body) {
  const baseCardId = cleanText(body?.base_card_id, 40);
  const senderName = cleanText(body?.sender_name, 80);
  const recipientName = cleanText(body?.recipient_name, 80);
  const senderNote = cleanText(body?.sender_note, 600);
  if (!baseCardId || !senderName || !recipientName) return null;
  return { baseCardId, senderName, recipientName, senderNote };
}

function threadWithCard(thread, deck = readPartyDeck()) {
  return {
    thread,
    card: cardSummary(findPartyBaseCard(deck, thread.base_card_id)),
  };
}

function buildInbox(player) {
  const cleanPlayer = cleanText(player, 80);
  const deck = readPartyDeck();
  const threads = readJsonList(PARTY_CARD_THREADS_JSON);
  return {
    incoming: threads
      .filter((thread) => thread.recipient_name === cleanPlayer && thread.status === "sent")
      .map((thread) => threadWithCard(thread, deck)),
    returned: threads
      .filter((thread) => thread.sender_name === cleanPlayer && thread.status === "answered")
      .map((thread) => threadWithCard(thread, deck)),
    sent_pending: threads
      .filter((thread) => thread.sender_name === cleanPlayer && thread.status === "sent")
      .map((thread) => threadWithCard(thread, deck)),
  };
}

function buildPersonalDeck(player) {
  const cleanPlayer = cleanText(player, 80);
  const deck = readPartyDeck();
  const threads = readJsonList(PARTY_CARD_THREADS_JSON).filter(
    (thread) => thread.sender_name === cleanPlayer && thread.status === "answered" && thread.answer
  );
  const byCard = new Map();
  const ensureEntry = (baseCardId) => {
    const entry = byCard.get(baseCardId) || {
      base_card_id: baseCardId,
      base_card: cardSummary(findPartyBaseCard(deck, baseCardId)),
      answers: [],
    };
    byCard.set(baseCardId, entry);
    return entry;
  };
  for (const thread of threads) {
    const entry = ensureEntry(thread.base_card_id);
    entry.answers.push({
      thread_id: thread.id,
      from_name: thread.answer.from_name,
      answer_text: thread.answer.text,
      private_note: thread.answer.private_note,
      sender_note: thread.sender_note,
      answered_at: thread.answered_at,
    });
  }
  const oracleAnswers = readJsonList(PARTY_ORACLE_ANSWERS_JSON).filter((answer) => answer.player === cleanPlayer);
  for (const answer of oracleAnswers) {
    const entry = ensureEntry(answer.base_card_id);
    entry.answers.push({
      thread_id: answer.id,
      from_name: answer.scope === "valkyrie" ? "You to Valkyrie" : "You",
      answer_text: answer.answer_text,
      private_note: "",
      sender_note: answer.scope === "valkyrie" ? "Sent to Valkyrie" : "Private answer",
      answered_at: answer.created_at,
    });
  }
  return Array.from(byCard.values());
}

function buildAdminDeckMap() {
  const deck = readPartyDeck();
  const discovery = readDiscoveryRaw();
  const threads = readJsonList(PARTY_CARD_THREADS_JSON);
  return deck.cards.map((card) => {
    const discoveredBy = Object.entries(discovery)
      .filter(([, value]) => Array.isArray(value?.card_ids) && value.card_ids.includes(card.id))
      .map(([player]) => player);
    const cardThreads = threads.filter((thread) => thread.base_card_id === card.id);
    return {
      card: cardSummary(card),
      player_cards: deck.player_cards.filter((playerCard) => playerCard.base_card_id === card.id),
      discovered_by: discoveredBy,
      discovery_count: discoveredBy.length,
      thread_count: cardThreads.length,
      unanswered_count: cardThreads.filter((thread) => thread.status === "sent").length,
      answered_count: cardThreads.filter((thread) => thread.status === "answered").length,
    };
  });
}

function writeDeckRaw(deck) {
  fs.writeFileSync(DECK_JSON, JSON.stringify(deck, null, 2) + "\n");
}

function findCard(deck, cardId) {
  const idx = deck.cards.findIndex((c) => c.id === cardId);
  return idx === -1 ? null : { idx, card: deck.cards[idx] };
}

function countCardsReady(deck) {
  return deck.cards.filter((c) => c.uploaded === true && c.crop_saved === true).length;
}

function imageFileName(cardId) {
  return `${String(cardId).toLowerCase()}.png`;
}

function resolveDraftImagePath(card) {
  const fromField = card.image_file?.replace(/^\/?images\/oracle\//, "") || imageFileName(card.id);
  return path.join(ORACLE_UPLOAD_DIR, path.basename(fromField));
}

function readPublishedDeckRaw() {
  if (!fs.existsSync(PUBLISHED_JSON)) return null;
  return JSON.parse(fs.readFileSync(PUBLISHED_JSON, "utf-8"));
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
}

function buildPublishStatus(deck) {
  const manifest = readManifest();
  return {
    publish_status: manifest ? "published" : deck.publish_status === "published" ? "published" : "draft",
    published_at: manifest?.published_at ?? deck.published_at ?? null,
    published_version: manifest?.published_version ?? deck.published_version ?? 0,
    cards_ready: countCardsReady(deck),
    total_cards: deck.total_cards ?? deck.cards.length,
    reader_url: READER_URL,
    has_published_snapshot: Boolean(manifest),
  };
}

function publishDeck(deckSlug = DEFAULT_DECK_SLUG) {
  const deck = readDeckRaw();
  const cardsReady = countCardsReady(deck);
  const totalCards = deck.total_cards ?? deck.cards.length;

  if (cardsReady < totalCards) {
    return {
      ok: false,
      status: 400,
      body: { ok: false, error: "52/52 cards required", cards_ready: cardsReady, total_cards: totalCards },
    };
  }

  fs.mkdirSync(PUBLISHED_IMAGES_DIR, { recursive: true });

  for (const card of deck.cards) {
    const src = resolveDraftImagePath(card);
    const dest = path.join(PUBLISHED_IMAGES_DIR, imageFileName(card.id));
    if (!fs.existsSync(src)) {
      return {
        ok: false,
        status: 400,
        body: {
          ok: false,
          error: `Missing image file for ${card.id}`,
          cards_ready: cardsReady,
          total_cards: totalCards,
        },
      };
    }
    fs.copyFileSync(src, dest);
  }

  const publishedVersion = (deck.published_version ?? 0) + 1;
  const publishedAt = new Date().toISOString();

  const publishedDeck = JSON.parse(JSON.stringify(deck));
  publishedDeck.deck_slug = deckSlug;
  publishedDeck.publish_status = "published";
  publishedDeck.published_at = publishedAt;
  publishedDeck.published_version = publishedVersion;

  fs.writeFileSync(PUBLISHED_JSON, JSON.stringify(publishedDeck, null, 2) + "\n");

  const deckBytes = fs.readFileSync(PUBLISHED_JSON);
  const checksum = createHash("sha256").update(deckBytes).digest("hex");

  const manifest = {
    deck_slug: deckSlug,
    published_at: publishedAt,
    published_version: publishedVersion,
    total_cards: totalCards,
    cards_ready: cardsReady,
    checksum,
    reader_url: READER_URL,
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  deck.deck_slug = deckSlug;
  deck.publish_status = "published";
  deck.published_at = publishedAt;
  deck.published_version = publishedVersion;
  writeDeckRaw(deck);

  return {
    ok: true,
    status: 200,
    body: {
      ok: true,
      published_at: publishedAt,
      published_version: publishedVersion,
      cards_ready: cardsReady,
      total_cards: totalCards,
      reader_url: READER_URL,
      checksum,
    },
  };
}

function normalizeCrop(raw) {
  if (!raw || typeof raw !== "object") return null;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const zoom = Number(raw.zoom);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom)) return null;
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
    zoom: Math.min(3, Math.max(1, zoom)),
  };
}

const DEPTHS = ["easy", "medium", "hard"];

function normalizeCopyPayload(body) {
  const cardId = body?.cardId;
  const copy = body?.copy;
  if (!cardId || !copy || typeof copy !== "object") return null;

  const title = typeof copy.title === "string" ? copy.title.trim() : "";
  if (!title) return null;

  const flavor = {};
  const prompts = {};
  for (const depth of DEPTHS) {
    const block = copy.flavor?.[depth];
    if (!block || typeof block !== "object") return null;
    const line = typeof block.line === "string" ? block.line.trim() : "";
    const npc = typeof block.npc === "string" ? block.npc.trim() : "";
    const flavorTitle = typeof block.title === "string" ? block.title.trim() : "";
    if (!line || !npc || !flavorTitle) return null;
    flavor[depth] = { line, npc, title: flavorTitle };

    const prompt = typeof copy.prompts?.[depth] === "string" ? copy.prompts[depth].trim() : "";
    if (!prompt) return null;
    prompts[depth] = prompt;
  }

  return { cardId, copy: { title, flavor, prompts } };
}

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(express.json());

app.get("/api/oracle/deck", (req, res) => {
  try {
    if (req.query.mode === "reader") {
      const published = readPublishedDeckRaw();
      if (!published) {
        return res.status(404).json({
          ok: false,
          error: "Deck not published yet",
          publish_status: "draft",
        });
      }
      return res.json(published);
    }
    res.json(readDeckRaw());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/api/oracle/publish/status", (_req, res) => {
  try {
    const deck = readDeckRaw();
    res.json({ ok: true, ...buildPublishStatus(deck) });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie", (_req, res) => {
  try {
    res.json({
      ok: true,
      deck: readPartyDeck(),
      signups: readJsonList(PARTY_SIGNUPS_JSON),
      messages: readJsonList(PARTY_MESSAGES_JSON),
      threads: readJsonList(PARTY_CARD_THREADS_JSON),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/altar", (req, res) => {
  try {
    const category = cleanText(req.query?.category, 40);
    res.json({ ok: true, ...buildAltarBoard(category) });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/altar", upload.single("file"), (req, res) => {
  try {
    const post = normalizeAltarPost(req.body, req.file);
    if (!post) {
      return res.status(400).json({ ok: false, error: "Player and altar body are required" });
    }
    const posts = readJsonList(PARTY_ALTAR_POSTS_JSON);
    posts.unshift(post);
    writeJsonList(PARTY_ALTAR_POSTS_JSON, posts);
    res.json({ ok: true, post });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/altar/replies", (req, res) => {
  try {
    const reply = normalizeAltarReply(req.body);
    if (!reply) {
      return res.status(400).json({ ok: false, error: "Player, post, and reply are required" });
    }
    const posts = readJsonList(PARTY_ALTAR_POSTS_JSON);
    if (!posts.some((post) => post.id === reply.post_id && !post.deleted_at)) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }
    const replies = readJsonList(PARTY_ALTAR_REPLIES_JSON);
    replies.unshift(reply);
    writeJsonList(PARTY_ALTAR_REPLIES_JSON, replies);
    res.json({ ok: true, reply });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/altar/reactions", (req, res) => {
  try {
    const postId = cleanText(req.body?.post_id, 80);
    const player = cleanText(req.body?.player, 80);
    const reaction = cleanText(req.body?.reaction, 40);
    if (!postId || !player || !ALTAR_REACTIONS.includes(reaction)) {
      return res.status(400).json({ ok: false, error: "post, player, and valid reaction are required" });
    }
    const posts = readJsonList(PARTY_ALTAR_POSTS_JSON);
    if (!posts.some((post) => post.id === postId && !post.deleted_at)) {
      return res.status(404).json({ ok: false, error: "Post not found" });
    }
    const reactions = readJsonList(PARTY_ALTAR_REACTIONS_JSON);
    const existingIndex = reactions.findIndex((entry) => entry.post_id === postId && entry.player_name === player && entry.reaction === reaction);
    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.unshift({
        id: makeId("reaction"),
        post_id: postId,
        player_name: player,
        reaction,
        created_at: new Date().toISOString(),
      });
    }
    writeJsonList(PARTY_ALTAR_REACTIONS_JSON, reactions);
    res.json({ ok: true, post_id: postId, reaction, active: existingIndex < 0 });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/altar/saves", (req, res) => {
  try {
    const save = normalizeAltarSave(req.body);
    if (!save) {
      return res.status(400).json({ ok: false, error: "Player and post are required" });
    }
    const posts = readJsonList(PARTY_ALTAR_POSTS_JSON);
    const post = posts.find((entry) => entry.id === save.artifact_id && !entry.deleted_at);
    if (!post) {
      return res.status(404).json({ ok: false, error: "Altar post not found" });
    }
    const saves = readJsonList(PARTY_PERSONAL_SAVES_JSON);
    const existing = saves.find((entry) => entry.player_name === save.player_name && entry.artifact_id === save.artifact_id);
    if (existing) return res.json({ ok: true, save: existing, duplicate: true });
    saves.unshift({
      ...save,
      snapshot: {
        title: post.title,
        body: post.body,
        category: post.category,
        author_name: post.author_name,
        media: Array.isArray(post.media) ? post.media : [],
        tags: Array.isArray(post.tags) ? post.tags : [],
        created_at: post.created_at,
      },
    });
    writeJsonList(PARTY_PERSONAL_SAVES_JSON, saves);
    res.json({ ok: true, save: saves[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/altar/saves", (req, res) => {
  try {
    const player = cleanText(req.query?.player, 80);
    if (!player) return res.status(400).json({ ok: false, error: "player is required" });
    const saves = readJsonList(PARTY_PERSONAL_SAVES_JSON).filter((save) => save.player_name === player);
    const posts = readJsonList(PARTY_ALTAR_POSTS_JSON);
    res.json({
      ok: true,
      saves: saves.map((save) => ({
        ...save,
        post: posts.find((post) => post.id === save.artifact_id) || save.snapshot || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/altar/delete", (req, res) => {
  try {
    const player = cleanText(req.body?.player, 80);
    const postId = cleanText(req.body?.post_id, 80);
    const replyId = cleanText(req.body?.reply_id, 80);
    if (!player || (!postId && !replyId)) {
      return res.status(400).json({ ok: false, error: "player and post_id or reply_id are required" });
    }
    if (postId) {
      const posts = readJsonList(PARTY_ALTAR_POSTS_JSON);
      const target = posts.find((post) => post.id === postId && !post.deleted_at);
      if (!target) return res.status(404).json({ ok: false, error: "Post not found" });
      if (target.anonymous || target.author_name !== player) {
        return res.status(403).json({ ok: false, error: "Only named post authors can delete their own posts here" });
      }
      writeJsonList(
        PARTY_ALTAR_POSTS_JSON,
        posts.map((post) => post.id === postId ? { ...post, deleted_at: new Date().toISOString() } : post)
      );
      return res.json({ ok: true, post_id: postId, deleted: true });
    }
    const replies = readJsonList(PARTY_ALTAR_REPLIES_JSON);
    const target = replies.find((reply) => reply.id === replyId && !reply.deleted_at);
    if (!target) return res.status(404).json({ ok: false, error: "Reply not found" });
    if (target.anonymous || target.author_name !== player) {
      return res.status(403).json({ ok: false, error: "Only named reply authors can delete their own replies here" });
    }
    writeJsonList(
      PARTY_ALTAR_REPLIES_JSON,
      replies.map((reply) => reply.id === replyId ? { ...reply, deleted_at: new Date().toISOString() } : reply)
    );
    res.json({ ok: true, reply_id: replyId, deleted: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/quest-cards", (_req, res) => {
  try {
    const cards = readQuestCards();
    res.json({ ok: true, cards, total_cards: cards.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/quest-cards", (req, res) => {
  try {
    const card = normalizeQuestCard(req.body);
    if (!card) {
      return res.status(400).json({ ok: false, error: "Title and activity are required" });
    }
    const cards = readQuestCards();
    cards.unshift(card);
    writeJsonList(PARTY_QUEST_CARDS_JSON, cards);
    res.json({ ok: true, card, cards, deck: readPartyDeck() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/oracle-answers", (req, res) => {
  try {
    const answer = normalizeOracleAnswer(req.body);
    if (!answer) {
      return res.status(400).json({ ok: false, error: "Player, card, and answer are required" });
    }
    const deck = readPartyDeck();
    if (!findPartyBaseCard(deck, answer.base_card_id)) {
      return res.status(400).json({ ok: false, error: "Base card not found" });
    }
    const answers = readJsonList(PARTY_ORACLE_ANSWERS_JSON);
    answers.unshift(answer);
    writeJsonList(PARTY_ORACLE_ANSWERS_JSON, answers);
    recordDiscovery(answer.player, answer.base_card_id, answer.scope === "valkyrie" ? "answer_to_valkyrie" : "private_answer");
    res.json({ ok: true, answer });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/quest-cards/:questId/photos", upload.single("file"), (req, res) => {
  try {
    const questId = cleanText(req.params?.questId, 80);
    const player = cleanText(req.body?.player, 80);
    const caption = cleanText(req.body?.caption, 180);
    if (!questId || !player || !req.file) {
      return res.status(400).json({ ok: false, error: "Quest, player, and photo are required" });
    }
    const quest = readQuestCards().find((card) => card.id === questId);
    if (!quest) return res.status(404).json({ ok: false, error: "Quest not found" });
    const safeExt = req.file.mimetype === "image/jpeg" ? "jpg" : req.file.mimetype === "image/webp" ? "webp" : "png";
    const id = makeId("quest-photo");
    const fileName = `${id}.${safeExt}`;
    fs.writeFileSync(path.join(PARTY_QUEST_PHOTOS_DIR, fileName), req.file.buffer);
    const photo = {
      id,
      quest_id: questId,
      player,
      caption,
      image_path: `/images/party/valkyrie/quest-photos/${fileName}`,
      created_at: new Date().toISOString(),
    };
    const photos = readJsonList(PARTY_QUEST_PHOTOS_JSON);
    photos.unshift(photo);
    writeJsonList(PARTY_QUEST_PHOTOS_JSON, photos);
    res.json({ ok: true, photo });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/discovery", (req, res) => {
  try {
    const player = cleanText(req.body?.player, 80);
    const baseCardId = cleanText(req.body?.base_card_id, 40);
    const source = cleanText(req.body?.source, 40) || "draw";
    const deck = readPartyDeck();
    if (!player || !baseCardId) {
      return res.status(400).json({ ok: false, error: "player and base_card_id are required" });
    }
    if (!findPartyBaseCard(deck, baseCardId)) {
      return res.status(400).json({ ok: false, error: "Base card not found" });
    }
    const discovery = recordDiscovery(player, baseCardId, source);
    res.json({ ok: true, discovery });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/discovery", (req, res) => {
  try {
    const player = cleanText(req.query?.player, 80);
    if (!player) return res.status(400).json({ ok: false, error: "player is required" });
    res.json({ ok: true, ...buildDiscoveryDeck(player) });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/admin/deck-map", (req, res) => {
  try {
    if (!requirePartyAdmin(req, res)) return;
    res.json({ ok: true, cards: buildAdminDeckMap() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/admin/card-copy", (req, res) => {
  try {
    if (!requirePartyAdmin(req, res)) return;
    const update = normalizePartyCardCopy(req.body);
    if (!update) return res.status(400).json({ ok: false, error: "card_id is required" });
    const deck = readPartyDeck();
    if (!findPartyBaseCard(deck, update.card_id)) {
      return res.status(404).json({ ok: false, error: "Card not found" });
    }
    const promptOverrides = readJsonObject(PARTY_PROMPT_OVERRIDES_JSON);
    promptOverrides[update.card_id] = {
      easy: update.prompts.easy,
      medium: update.prompts.medium,
      hard: update.prompts.hard,
    };
    writeJsonObject(PARTY_PROMPT_OVERRIDES_JSON, promptOverrides);
    const cardOverrides = readJsonObject(PARTY_CARD_OVERRIDES_JSON);
    cardOverrides[update.card_id] = {
      title: update.title,
      flavor: update.flavor,
    };
    writeJsonObject(PARTY_CARD_OVERRIDES_JSON, cardOverrides);
    res.json({ ok: true, card: readPartyDeck().cards.find((card) => card.id === update.card_id) || null });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/admin/card-upload", upload.single("file"), (req, res) => {
  try {
    if (!requirePartyAdmin(req, res)) return;
    const cardId = cleanText(req.body?.cardId, 40);
    if (!cardId || !req.file) {
      return res.status(400).json({ ok: false, error: "cardId and file required" });
    }
    const deck = readDeckRaw();
    const found = findCard(deck, cardId);
    if (!found) return res.status(404).json({ ok: false, error: "Card not found" });
    const assetName = `${String(cardId).toLowerCase()}.png`;
    const dest = path.join(ORACLE_UPLOAD_DIR, assetName);
    fs.writeFileSync(dest, req.file.buffer);
    const { idx } = found;
    deck.cards[idx] = {
      ...deck.cards[idx],
      uploaded: true,
      image_file: `/images/oracle/${assetName}`,
      crop_saved: false,
    };
    delete deck.cards[idx].crop;
    writeDeckRaw(deck);
    res.json({ ok: true, cardId, assetPath: `/images/oracle/${assetName}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/admin/altar-delete", (req, res) => {
  try {
    if (!requirePartyAdmin(req, res)) return;
    const postId = cleanText(req.body?.post_id, 80);
    const replyId = cleanText(req.body?.reply_id, 80);
    if (!postId && !replyId) {
      return res.status(400).json({ ok: false, error: "post_id or reply_id is required" });
    }
    if (postId) {
      const posts = readJsonList(PARTY_ALTAR_POSTS_JSON);
      const nextPosts = posts.map((post) => post.id === postId ? { ...post, deleted_at: new Date().toISOString() } : post);
      writeJsonList(PARTY_ALTAR_POSTS_JSON, nextPosts);
      return res.json({ ok: true, post_id: postId, deleted: true });
    }
    const replies = readJsonList(PARTY_ALTAR_REPLIES_JSON);
    const nextReplies = replies.map((reply) => reply.id === replyId ? { ...reply, deleted_at: new Date().toISOString() } : reply);
    writeJsonList(PARTY_ALTAR_REPLIES_JSON, nextReplies);
    res.json({ ok: true, reply_id: replyId, deleted: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/admin/altar-export", (req, res) => {
  try {
    if (!requirePartyAdmin(req, res)) return;
    res.json({
      ok: true,
      exported_at: new Date().toISOString(),
      posts: readJsonList(PARTY_ALTAR_POSTS_JSON),
      replies: readJsonList(PARTY_ALTAR_REPLIES_JSON),
      reactions: readJsonList(PARTY_ALTAR_REACTIONS_JSON),
      saves: readJsonList(PARTY_PERSONAL_SAVES_JSON),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/card-threads", (req, res) => {
  try {
    const parsed = normalizeThreadPayload(req.body);
    if (!parsed) {
      return res.status(400).json({ ok: false, error: "base_card_id, sender_name, and recipient_name are required" });
    }
    const deck = readPartyDeck();
    if (!findPartyBaseCard(deck, parsed.baseCardId)) {
      return res.status(400).json({ ok: false, error: "Base card not found" });
    }
    const thread = {
      id: makeId("thread"),
      base_card_id: parsed.baseCardId,
      sender_name: parsed.senderName,
      recipient_name: parsed.recipientName,
      sender_note: parsed.senderNote,
      status: "sent",
      created_at: new Date().toISOString(),
      answered_at: null,
      answer: null,
    };
    const threads = readJsonList(PARTY_CARD_THREADS_JSON);
    threads.unshift(thread);
    writeJsonList(PARTY_CARD_THREADS_JSON, threads);
    recordDiscovery(parsed.recipientName, parsed.baseCardId, "inbox");
    res.json({ ok: true, thread });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/inbox", (req, res) => {
  try {
    const player = cleanText(req.query?.player, 80);
    if (!player) return res.status(400).json({ ok: false, error: "player is required" });
    res.json({ ok: true, ...buildInbox(player) });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/card-threads/:threadId/answer", (req, res) => {
  try {
    const threadId = cleanText(req.params?.threadId, 80);
    const fromName = cleanText(req.body?.from_name, 80);
    const answerText = cleanText(req.body?.answer_text, 1200);
    const privateNote = cleanText(req.body?.private_note, 600);
    if (!threadId || !fromName || !answerText) {
      return res.status(400).json({ ok: false, error: "from_name and answer_text are required" });
    }
    const threads = readJsonList(PARTY_CARD_THREADS_JSON);
    const idx = threads.findIndex((thread) => thread.id === threadId);
    if (idx === -1) return res.status(404).json({ ok: false, error: "Thread not found" });
    const thread = threads[idx];
    if (thread.status !== "sent") {
      return res.status(400).json({ ok: false, error: "Thread is already answered" });
    }
    if (thread.recipient_name !== fromName) {
      return res.status(403).json({ ok: false, error: "Only the recipient can answer this card" });
    }
    const answeredAt = new Date().toISOString();
    threads[idx] = {
      ...thread,
      status: "answered",
      answered_at: answeredAt,
      answer: {
        from_name: fromName,
        text: answerText,
        private_note: privateNote,
      },
    };
    writeJsonList(PARTY_CARD_THREADS_JSON, threads);
    recordDiscovery(thread.sender_name, thread.base_card_id, "returned");
    res.json({ ok: true, thread: threads[idx] });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.get("/api/party/valkyrie/personal-deck", (req, res) => {
  try {
    const player = cleanText(req.query?.player, 80);
    if (!player) return res.status(400).json({ ok: false, error: "player is required" });
    res.json({ ok: true, cards: buildPersonalDeck(player) });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/cards", (req, res) => {
  try {
    const card = normalizePartyCard(req.body);
    if (!card) {
      return res.status(400).json({ ok: false, error: "Base card, title, and prompt are required" });
    }
    const deck = readPartyDeck();
    if (!deck.cards.some((baseCard) => baseCard.id === card.base_card_id)) {
      return res.status(400).json({ ok: false, error: "Base card not found" });
    }
    const cards = readJsonList(PARTY_ADDED_CARDS_JSON);
    cards.unshift(card);
    writeJsonList(PARTY_ADDED_CARDS_JSON, cards);
    res.json({ ok: true, card, deck: readPartyDeck() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/schedule", (req, res) => {
  try {
    if (!requirePartyAdmin(req, res)) return;
    const update = normalizeSchedule(req.body);
    if (!update) return res.status(400).json({ ok: false, error: "Schedule rows are required" });
    const meta = JSON.parse(fs.readFileSync(PARTY_DECK_JSON, "utf-8"));
    meta.party = {
      ...meta.party,
      location: update.location || meta.party.location,
      host_note: update.host_note || meta.party.host_note,
      schedule: update.schedule,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(PARTY_DECK_JSON, JSON.stringify(meta, null, 2) + "\n");
    res.json({ ok: true, party: meta.party, deck: readPartyDeck() });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/signups", (req, res) => {
  try {
    const name = cleanText(req.body?.name, 80);
    if (!name) return res.status(400).json({ ok: false, error: "Player name is required" });
    const signup = {
      id: makeId("player"),
      name,
      email: cleanText(req.body?.email, 120),
      wants_full_signup: Boolean(req.body?.wants_full_signup),
      keep_party_data: Boolean(req.body?.keep_party_data),
      created_at: new Date().toISOString(),
    };
    const signups = readJsonList(PARTY_SIGNUPS_JSON);
    signups.unshift(signup);
    writeJsonList(PARTY_SIGNUPS_JSON, signups);
    res.json({ ok: true, signup });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/party/valkyrie/messages", (req, res) => {
  try {
    const to = cleanText(req.body?.to, 80);
    const from = cleanText(req.body?.from, 80) || "Anonymous";
    const title = cleanText(req.body?.title, 80);
    const message = cleanText(req.body?.message, 600);
    if (!to || !title || !message) {
      return res.status(400).json({ ok: false, error: "Recipient, title, and message are required" });
    }
    const row = {
      id: makeId("message"),
      to,
      from,
      title,
      message,
      created_at: new Date().toISOString(),
    };
    const messages = readJsonList(PARTY_MESSAGES_JSON);
    messages.unshift(row);
    writeJsonList(PARTY_MESSAGES_JSON, messages);
    res.json({ ok: true, message: row });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/oracle/publish", (req, res) => {
  try {
    const deckSlug =
      typeof req.body?.deck_slug === "string" && req.body.deck_slug.trim()
        ? req.body.deck_slug.trim()
        : DEFAULT_DECK_SLUG;
    const result = publishDeck(deckSlug);
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

app.post("/api/oracle/upload", upload.single("file"), (req, res) => {
  const cardId = req.body?.cardId;
  if (!cardId || !req.file) {
    return res.status(400).json({ ok: false, error: "cardId and file required" });
  }
  const assetName = `${String(cardId).toLowerCase()}.png`;
  const dest = path.join(ORACLE_UPLOAD_DIR, assetName);
  fs.writeFileSync(dest, req.file.buffer);

  const deck = readDeckRaw();
  const found = findCard(deck, cardId);
  if (!found) {
    return res.status(404).json({ ok: false, error: "card not found" });
  }
  const assetPath = `/images/oracle/${assetName}`;
  const { idx } = found;
  const prev = deck.cards[idx];
  deck.cards[idx] = {
    ...prev,
    uploaded: true,
    image_file: assetPath,
    crop_saved: false,
  };
  delete deck.cards[idx].crop;
  writeDeckRaw(deck);

  res.json({
    ok: true,
    cardId,
    assetPath,
    draftCrop: { ...DRAFT_CROP },
  });
});

app.post("/api/oracle/crop", (req, res) => {
  const cardId = req.body?.cardId;
  const crop = normalizeCrop(req.body?.crop);
  if (!cardId || !crop) {
    return res.status(400).json({ ok: false, error: "cardId and crop {x,y,zoom} required" });
  }

  const deck = readDeckRaw();
  const found = findCard(deck, cardId);
  if (!found) {
    return res.status(404).json({ ok: false, error: "card not found" });
  }

  const { idx } = found;
  deck.cards[idx] = {
    ...deck.cards[idx],
    crop,
    crop_saved: true,
  };
  writeDeckRaw(deck);

  res.json({ ok: true, cardId, crop });
});

app.post("/api/oracle/copy", (req, res) => {
  const parsed = normalizeCopyPayload(req.body);
  if (!parsed) {
    return res.status(400).json({ ok: false, error: "cardId and copy { title, flavor, prompts } required" });
  }

  const deck = readDeckRaw();
  const found = findCard(deck, parsed.cardId);
  if (!found) {
    return res.status(404).json({ ok: false, error: "card not found" });
  }

  const { idx } = found;
  deck.cards[idx] = {
    ...deck.cards[idx],
    title: parsed.copy.title,
    flavor: parsed.copy.flavor,
    prompts: parsed.copy.prompts,
  };
  writeDeckRaw(deck);

  res.json({ ok: true, cardId: parsed.cardId, copy: parsed.copy });
});

app.delete("/api/oracle/upload", (req, res) => {
  const cardId = req.body?.cardId ?? req.query?.cardId;
  if (!cardId) {
    return res.status(400).json({ ok: false, error: "cardId required" });
  }

  const deck = readDeckRaw();
  const found = findCard(deck, cardId);
  if (!found) {
    return res.status(404).json({ ok: false, error: "card not found" });
  }

  const assetName = `${String(cardId).toLowerCase()}.png`;
  const dest = path.join(ORACLE_UPLOAD_DIR, assetName);
  if (fs.existsSync(dest)) fs.unlinkSync(dest);

  const { idx } = found;
  const prev = deck.cards[idx];
  deck.cards[idx] = {
    ...prev,
    uploaded: false,
    image_file: `images/${assetName}`,
    crop_saved: false,
  };
  delete deck.cards[idx].crop;
  writeDeckRaw(deck);

  res.json({ ok: true, cardId, discarded: true });
});

app.get("/images/oracle/:name", (req, res) => {
  const name = path.basename(req.params.name);
  const alias = ICON_ALIASES[name];

  if (alias) {
    for (const p of [path.join(ICONS_DIR, alias), path.join(IMAGES_DIR, alias)]) {
      if (fs.existsSync(p)) return res.sendFile(p);
    }
  }

  if (req.query.source === "published") {
    const published = path.join(PUBLISHED_IMAGES_DIR, name);
    if (fs.existsSync(published)) return res.sendFile(published);
    return res.status(404).send("Not found");
  }

  const uploaded = path.join(ORACLE_UPLOAD_DIR, name);
  if (fs.existsSync(uploaded)) return res.sendFile(uploaded);

  res.status(404).send("Not found");
});

app.get("/images/party/valkyrie/quest-photos/:name", (req, res) => {
  const name = path.basename(req.params.name);
  const photo = path.join(PARTY_QUEST_PHOTOS_DIR, name);
  if (fs.existsSync(photo)) return res.sendFile(photo);
  res.status(404).send("Not found");
});

app.get("/images/party/valkyrie/altar-media/:name", (req, res) => {
  const name = path.basename(req.params.name);
  const media = path.join(PARTY_ALTAR_MEDIA_DIR, name);
  if (fs.existsSync(media)) return res.sendFile(media);
  res.status(404).send("Not found");
});

const PORT = Number(process.env.ORACLE_API_PORT || 3099);
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Oracle local API → http://127.0.0.1:${PORT}`);
  console.log(`  deck.json  ${DECK_JSON}`);
});
