#!/usr/bin/env python3
"""
Oracle Card — Midjourney Prompt Generator
Reads deck.json and produces 52 Midjourney prompts, one per card.

Usage:
  python3 generate_midjourney_prompts.py [output_file]

Output file defaults to:
  /home/workspace/The Library/04 Quests/Casey's Birthday Deck/midjourney_prompts.txt
"""
import json, sys, re

OUTPUT = sys.argv[1] if len(sys.argv) > 1 else "/home/workspace/The Library/04 Quests/Casey's Birthday Deck/midjourney_prompts.txt"

with open("/home/workspace/The Library/04 Quests/Casey's Birthday Deck/data/deck.json") as f:
    deck = json.load(f)

# ── Style guide ─────────────────────────────────────────────────────────────
# Update STYLE to match whatever you've landed on in Midjourney.
# Each card prompt = [SUBJECT] + STYLE
# Leave STYLE empty string once you have your sref code locked.
STYLE = (
    "tarot card illustration, symbolic imagery, muted warm palette, "
    "cream and amber tones, soft shadows, contemplative mood, "
    "no text, no faces, no people, sacred geometry, oracle aesthetic"
)

# ── Subject builders per suit ───────────────────────────────────────────────
def subject(card):
    """Build the visual subject line for one card."""
    tid = card["id"]
    title = card["title"]
    fl = card["flavor"]
    hard = fl.get("hard", {}).get("line", "") or fl.get("medium", {}).get("line", "") or fl.get("easy", {}).get("line", "")
    rank = card["rank"]
    suit_code = card["suit"]["code"]

    # Strip trailing punctuation first — this makes core clean for all paths
    core = (hard or title).rstrip(".,!?;:")

    # Truncate only if still over max_len
    def trunc(text, max_len=55):
        text = re.sub(r'^[^a-zA-Z]+', '', text)
        if len(text) <= max_len:
            return text
        trimmed = text[:max_len].rsplit(" ", 1)[0].rstrip(".,!?;:")
        return trimmed + "…"

    core = trunc(core)

    # Suit-specific visual themes
    if suit_code == "WU":
        if rank == "Ace":
            visual = f"a single eye opening in soft light, {core}"
        elif rank == "Jack":
            visual = f"a figure with one hand raised shielding bright light, {core}"
        elif rank == "Queen":
            visual = f"a figure seated in stillness, gaze turned slightly away, {core}"
        elif rank == "King":
            visual = f"a figure standing at a threshold, naming something just out of frame, {core}"
        else:
            visual = f"a symbolic card image with a geometric element at center, {core}"
    elif suit_code == "CU":
        if rank == "Ace":
            visual = f"a small flame held carefully in open palms, {core}"
        elif rank == "Jack":
            visual = f"a figure kneeling at the edge of water, {core}"
        elif rank == "Queen":
            visual = f"a storm held inside a glass vessel, {core}"
        elif rank == "King":
            visual = f"a figure standing before a mirror that reflects something else, {core}"
        else:
            visual = f"a symbolic card image with a geometric element at center, {core}"
    elif suit_code == "GU":
        if rank == "Ace":
            visual = f"a figure at the edge of a stage with one foot forward, {core}"
        elif rank == "Jack":
            visual = f"a figure pushing against an invisible resistance, {core}"
        elif rank == "Queen":
            visual = f"a figure turning in a slow circle, {core}"
        elif rank == "King":
            visual = f"a figure standing at a crossroads with two paths visible, {core}"
        else:
            visual = f"a symbolic card image with a geometric element at center, {core}"
    elif suit_code == "SU":
        if rank == "Ace":
            visual = f"a figure standing firm while something passes through them, {core}"
        elif rank == "Jack":
            visual = f"a figure planted and rooted while wind moves around them, {core}"
        elif rank == "Queen":
            visual = f"a figure in stillness beside a long bridge, {core}"
        elif rank == "King":
            visual = f"a figure standing inside what they must face, {core}"
        else:
            visual = f"a symbolic card image with a geometric element at center, {core}"

    return visual

# ── Output ──────────────────────────────────────────────────────────────────
lines = []
lines.append(f"# Oracle at the Edge of the Known World — Midjourney Prompts")
lines.append(f"# Generated: 2026-05-12")
lines.append(f"# Style guide: {STYLE}")
lines.append(f"# ")
lines.append(f"# HOW TO USE:")
lines.append(f"# 1. Run this script to generate prompts")
lines.append(f"# 2. Paste each prompt into Midjourney")
lines.append(f"# 3. After landing your style, lock it with --sref [code]")
lines.append(f"# 4. Re-run with --sref to generate all 52 consistently")
lines.append(f"# ")
lines.append("")

for card in deck["cards"]:
    sid = card["id"]
    rank = card["rank"]
    suit_name = card["suit"]["name"]
    title = card["title"]
    visual = subject(card)

    if STYLE:
        full_prompt = f"{visual}. {STYLE}"
    else:
        full_prompt = visual

    lines.append(f"## {sid} [{rank}] — \"{title}\"")
    lines.append(full_prompt)
    lines.append("")

output = "\n".join(lines)
with open(OUTPUT, "w") as f:
    f.write(output)

print(f"Written {len(deck['cards'])} prompts to:\n  {OUTPUT}")
print(f"\nSample prompts:")
print("─" * 60)
for card in deck["cards"][:3]:
    sid = card["id"]
    rank = card["rank"]
    title = card["title"]
    visual = subject(card)
    print(f"\n[{sid}] \"{title}\"")
    print(f"  {visual}. {STYLE}")
