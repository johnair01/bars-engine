#!/usr/bin/env python3
"""
Oracle Card — Midjourney Prompt Generator
Reads deck.json → 52 prompts, one per card.
Nation-based character descriptions derived from flavor NPC data.
"""
import json, re
from collections import Counter

DECK_PATH = "/home/workspace/The Library/04 Quests/Casey's Birthday Deck/data/deck.json"
OUTPUT   = "/home/workspace/The Library/04 Quests/Casey's Birthday Deck/midjourney_prompts.txt"

# ── Nation → visual description (robe + skin for Midjourney) ────────────────
NATION_VISUAL = {
    "Argyra":    "in silver-white geometric robes, pale skin, angular and still",
    "Pyrakanth": "in red and black fire-lit robes, bronze skin, fierce and still",
    "Meridia":   "in yellow-brown flowing robes, warm brown skin, grounded and still",
    "Lamenth":   "in deep blue robes, blue-grey undertones, fluid and reflective",
    "Virelune":  "in deep green robes, dark skin, rooted and alive",
}

# ── NPC → nation (from Calrunia NPC Grid) ───────────────────────────────────
NPC_NATION = {
    "Kael Virex": "Argyra",    "Doran Kest": "Argyra",       "Veyra Null": "Argyra",
    "Jarek Stone": "Meridia",   "Mira Solen": "Meridia",       "Oris Vale": "Meridia",
    "Rax Corven": "Pyrakanth",  "Selen Mar": "Pyrakanth",     "Kaelis Thorn": "Pyrakanth",
    "Luma Vire": "Virelune",    "Eira Lune": "Virelune",       "Orin Vale": "Virelune",
    "Selenya Grove": "Virelune","Iri Sol": "Virelune",          "Neris Vale": "Virelune",
    "Maelis Thren": "Lamenth",  "Telis Vane": "Lamenth",       "Eira Vane": "Lamenth",
    "Lethra Vane": "Lamenth",
}

# ── Style (update once you lock your Midjourney sref) ───────────────────────
STYLE = (
    "tarot card illustration, symbolic imagery, muted warm palette, "
    "cream and amber tones, soft shadows, contemplative mood, "
    "no text, no faces, sacred geometry, oracle aesthetic"
)


def get_nation(card):
    for tier in ("hard", "medium", "easy"):
        npc = card.get("flavor", {}).get(tier, {}).get("npc", "")
        if npc and npc in NPC_NATION:
            return NPC_NATION[npc]
    return "Virelune"


def clean(text, max_len=55):
    text = re.sub(r"^[^\w]+", "", text).strip().rstrip(".,!?;:")
    if len(text) > max_len:
        text = text[:max_len].rsplit(" ", 1)[0].rstrip(".,!?;:") + "…"
    return text


def subject(card):
    rank   = card["rank"]
    nation = get_nation(card)
    robe   = NATION_VISUAL[nation]
    easy   = clean(card.get("prompts", {}).get("easy", "") or "")
    flavor = card.get("flavor", {})
    scene  = clean(flavor.get("hard", {}).get("line", "") or
                  flavor.get("medium", {}).get("line", "") or
                  card.get("prompts", {}).get("easy", "") or "")

    if rank == "Ace":
        return f"a single eye opening in soft light, a cultivator {robe}, {scene}"
    if rank == "Jack":
        return f"a cultivator {robe}, one hand raised, {easy}, {scene}"
    if rank == "Queen":
        return f"a cultivator {robe}, seated in stillness, {easy}, {scene}"
    if rank == "King":
        return f"a cultivator {robe}, standing at a threshold, {easy}, {scene}"
    return f"a symbolic oracle card image, a cultivator {robe}, {scene}"


# ── Run ─────────────────────────────────────────────────────────────────────
with open(DECK_PATH) as f:
    deck = json.load(f)

lines = [
    "# Oracle at the Edge of the Known World — Midjourney Prompts",
    "# Generated: 2026-05-12  |  Run: python3 generate_mj_prompts.py",
    "# HOW TO USE:",
    "#  1. Run script → paste prompts into Midjourney",
    "#  2. Once style is locked, add STYLE = '--sref YOURCODE' above",
    "#  3. Re-run → all 52 cards in consistent style",
    "#",
    "",
]

for card in deck["cards"]:
    nation  = get_nation(card)
    robe    = NATION_VISUAL[nation].split(",")[0].replace("in ", "")
    visual  = subject(card)
    lines.append(f"## {card['id']} [{card['rank']}] — \"{card['title']}\"  [{robe}]")
    lines.append(f"{visual}. {STYLE}")
    lines.append("")

with open(OUTPUT, "w") as f:
    f.write("\n".join(lines))

# Nation coverage report
nc = Counter(get_nation(c) for c in deck["cards"])
print(f"Written {len(deck['cards'])} prompts → {OUTPUT}")
print(f"Nation coverage: {dict(sorted(nc.items()))}")

# Print 6 test prompts (one per suit × face/number)
test_ids = ["WU-A", "WU-J", "CU-A", "GU-A", "SU-A", "SU-K"]
for cid in test_ids:
    card = next(c for c in deck["cards"] if c["id"] == cid)
    print(f"\n[{card['id']}] \"{card['title']}\"")
    print(f"  {subject(card)}")