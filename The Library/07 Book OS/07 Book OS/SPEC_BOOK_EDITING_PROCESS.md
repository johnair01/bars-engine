# SPEC: The WAVE Editing Spiral
**Version:** 1.0
**Date:** 2026-04-27
**Status:** Draft — awaiting approval

---

## Overview

The editing session is a WAVE spiral, not a checklist. Every session: Wake → Clean → Grow → Show. Both interior (agent/user) and exterior (book/artifacts) sides of each stage fire each loop.

**The 321 page is the somatic pre-session practice.** Before every editing session, the writer goes to /321 to metabolize what's charged. That clears the nervous system. Then the editing session proceeds from a different quality of attention.

---

## Session Structure

### Pre-Session: Interior Clean Up (Somatic)
**Trigger:** Before every editing session.

Prompt the writer:
> "Before we start — go to https://wendellbritt.zo.space/shadow/321 and do the 321. Come back when you're done."

The 321 metabolizes whatever charge is present (comparison pressure, perfectionism, urgency, overwhelm, etc.). The editing session then proceeds from a cleared tone rather than a charged one.

---

### WAVE Spiral — Interior/Exterior

#### WAKE UP
**Question:** What am I walking into? What experience am I creating?

| Side | Action |
|------|--------|
| **Interior** | Research workspace + Obsidian: read SPEC.md, tracker, current draft, source files, previous session logs |
| **Exterior** | Web search: editorial frameworks, tools, techniques, examples from similar books |

**6 Unpacking Questions** (ask at the start of every Wake Up, before reading sources):

1. **What experience do I want the reader to have in this section?**
2. **How do I want them to feel?**
3. **What is it like for them right now, and how is that different from that feeling?**
4. **What is it like for them to live there — in that gap between now and the target feeling?**
5. **What would have to be true for them to feel this way?**
6. **What reservations do I have about the experience I want to give them?**

**Exit signal:** You know what section you're editing, why, and what experience you're creating.

---

#### CLEAN UP
**Question:** What does the reader need here? What's being avoided or inflated?

| Side | Action |
|------|--------|
| **Interior** | Writer does 321 somatic practice at /321 — sets emotional tone for session |
| **Exterior** | Editorial: identify missing EA moves for the reader, name the shadow in the section (what's avoided, what's performative, what's not named) |

**Exit signal:** You can name 1-3 specific things that need to change in this section.

---

#### GROW UP
**Question:** How do we increase maturity — in the book AND in ourselves?

| Side | Action |
|------|--------|
| **Interior** | Ask: how does editing this book increase the writer's developmental level? (see 6 faces of writer growth below) |
| **Exterior** | Ask: how do we improve our editing capacity? (skill, tooling, workflow) |

**The 6 faces of writer growth:**

- 🧠 **Sage:** The writer learns to see their own voice from outside it — to be in the draft AND reading it at once. The meta-position.
- ⚡ **Challenger:** The writer learns to name what's wrong with their own sentences without collapsing. Precision without self-destruction.
- 🤝 **Diplomat:** The writer learns to hold multiple readers simultaneously — the skeptic AND the believer, the novice AND the expert.
- 🔥 **Shaman:** The writer's emotional vocabulary deepens. They learn to name what they felt in the writing. EA becomes lived, not just conceptual.
- 🏛️ **Architect:** The writer learns to see structure as the argument. The arc is not decoration — it IS the content.
- ⚖️ **Regent:** The writer learns to carry forward the lineage. This book participates in a tradition of transformative writing. They become a better ancestor.

**Exit signal:** You have a clear editorial intention for this section.

---

#### SHOW UP
**Question:** Can you produce aligned content?

| Side | Action |
|------|--------|
| **Interior** | Read the output aloud — hear it, feel it |
| **Exterior** | Write the edits → commit to manuscripts/ git → sync Obsidian → update tracker |

**Exit signal:** Section is edited, committed, synced, tracker updated.

---

## Session Format

**Length:** ~1 chapter per session
**Tone:** Deliberate, not rushed. Quality over velocity.
**Close:** Every session ends with tracker update + one-line summary of what happened.

---

## Editorial Pass Priorities

1. **Voice consistency** — does it sound like the calibrated Wendell voice?
2. **EA move completeness** — does each section have transcend + translate + control for each channel?
3. **Structural integrity** — do the sections follow the canonical 7-section arc?
4. **Hedge ratio** — reduce unsupported claims (target: <1.0/1K words)
5. **Cross-reference accuracy** — face names, altitudes, colors match SPEC.md

---

## File Hygiene Rules

- **Commit before editing:** `cd /home/workspace/manuscripts && git add chapters/... && git commit -m "before edit: [section]"`
- **Commit after editing:** `git add chapters/... && git commit -m "edit: [what changed]"`
- **Verify after commit:** `git log --oneline -3`
- **Tracker update:** After every session, update MTGOA_BOOK_WORK_TRACKER.md in both Obsidian and manuscripts/
- **Note in Obsidian:** Add session note to `07 Book OS/` with what was edited and what emerged

---

## Git Workflow (manuscripts/ only)

```
cd /home/workspace/manuscripts
git add chapters/ch[N]-[FACE]/CHAPTER[N]_[FACE]_FULL_DRAFT_MASTER.md
git commit -m "edit: [description]"
git log --oneline -3  # verify
```

**NEVER** `cd /home/workspace && git add manuscripts/...` — workspace root git ignores manuscripts/

---

## Companion Files

- `SPEC.md` in each chapter folder — canonical reference, read before editing that chapter
- `MTGOA_BOOK_WORK_TRACKER.md` — overall status, updated after every session
- `PERSONAL_OPS.md` — session summaries logged here too
- `07 Book OS/` in Obsidian — session notes, editorial discoveries, patterns observed

---

## Emotional Alchemy Standards for the Book

Every EA move in the book follows this format:

**[DISSATISFACTION → SATISFACTION] Transcend [X] — Emotion Name → Alchemical Outcome**

- Emotion name stated explicitly (not embedded in role-pattern label)
- Control moves labeled with dissatisfaction emotion, not emotion category
- Energy economy (+2/+1/-1) removed from book content — context for writer only
- Canonical EA labels: Metal/Fear, Water/Sadness, Wood/Joy, Fire/Anger, Earth/Neutrality

---

## What This Replaces

- Gap analysis as a standalone activity (it's now embedded in the Clean step)
- Tracker-only workflow (now supplemented by Obsidian session notes)
- Editing without somatic preparation (now required: 321 first)

---

*Spec status: Awaiting author approval*
