# Metabolize Learnings — Obsidian Sync Spec
**Status:** Draft
**Owner:** Architect
**Created:** 2026-04-27
**Drives:** Skills/metabolize-learnings/SKILL.md update

---

## 0. Context

The `metabolize-learnings` skill outputs 5 types of content: AARs, SOUL.md patterns, rules, session log entries, and Learning Metabolism Reports. These live in the workspace (`SOUL.md`, `AGENTS.md`, `COUNCIL/logs/`) but not in the Obsidian vault — which is Wendell's actual daily operating surface.

**The fix:** Skill writes outputs to both workspace AND vault. Routing is deterministic, no user input needed.

**Confirmed decisions (2026-04-27):**
- Option C adopted: logs go in `01 Daily Notes/LOGS/` (not a new top-level folder)
- Naming: timestamp format `HHMM` (24-hour UTC) prevents same-day collision
- Pattern numbering: aligned with SOUL.md ordinal (canonical ID)
- No folder renames needed — `06 Specs/` stays as-is
- Skill auto-creates `01 Daily Notes/LOGS/` via `mkdir -p`

---

## 1. Routing Table

| Content type | Workspace path | Vault path | Filename |
|---|---|---|---|
| AAR | `COUNCIL/logs/AAR_YYYY-MM-DD_HHMM.md` | `01 Daily Notes/LOGS/AAR_YYYY-MM-DD_HHMM.md` | `AAR_YYYY-MM-DD_HHMM.md` |
| Pattern note | `SOUL.md` (canonical) | `01 Daily Notes/LOGS/PATTERN-N-YYYY-MM-DD.md` | `PATTERN-N-YYYY-MM-DD.md` |
| Rule note | `AGENTS.md` + Rules tool | `03 BARs/RULE-YYYY-MM-DD-{slug}.md` | `RULE-YYYY-MM-DD-{slug}.md` |
| Session log entry | `COUNCIL/PERSONAL_OPS.md` | `01 Daily Notes/YYYY-MM-DD.md` (append) | `YYYY-MM-DD.md` |
| Learning Metabolism Report | Chat output only | `01 Daily Notes/LOGS/LMR_YYYY-MM-DD.md` | `LMR_YYYY-MM-DD.md` |

**AAR filename rationale:** Timestamp (24-hour UTC) prevents same-day collision. Sortable by filename automatically. Machine-readable + human-legible.

---

## 2. Vault Folder Structure

No renames. No new top-level folders. The structure after this spec ships:

```
The Library/
├── 01 Daily Notes/
│   ├── LOGS/              ← created by skill on first write
│   │   ├── AAR_YYYY-MM-DD_HHMM.md
│   │   ├── PATTERN-N-YYYY-MM-DD.md
│   │   └── LMR_YYYY-MM-DD.md
│   └── YYYY-MM-DD.md      ← daily note (native Obsidian)
├── 03 BARs/
│   └── RULE-YYYY-MM-DD-{slug}.md
├── 05 Research/            ← existing
├── 06 Specs/              ← existing, unchanged (holds active specs)
└── ...
```

**Skill behavior:** Before writing to any vault folder, check if it exists. If not, `mkdir -p` via `run_bash_command`. Do not skip — create the container and proceed.

---

## 3. Sync Mechanism

**Method:** Obsidian Sync (already connected and live).

- Skill writes files to workspace vault directory (`/home/workspace/The Library/The Library/`)
- Obsidian Sync picks up writes within ~30 seconds, syncs to phone vault
- Skill does NOT wait for sync confirmation — write complete = on disk
- Sync conflicts: out of scope (Phase 2 concern)

**What skill writes vs. appends:**

| Action | Content | Method |
|---|---|---|
| Write new | AAR, Pattern note, Rule note, LMR | `create_or_rewrite_file` |
| Append | Daily note entry | `edit_file` (append_line) |
| Write workspace-only | SOUL.md, AGENTS.md | Already done before Phase 4 |

---

## 4. Vault Sync Step — SKILL.md Phase 4 Addition

Add to the end of Phase 4 (after SOUL.md, Rules, PERSONAL_OPS.md writes):

### Phase 4, Step 5 — Obsidian Vault Sync

**Pre-flight:** Ensure vault path exists before writing to it.

```bash
mkdir -p "/home/workspace/The Library/The Library/01 Daily Notes/LOGS"
mkdir -p "/home/workspace/The Library/The Library/03 BARs"
```

**Write AAR to vault:**
- Source: `COUNCIL/logs/AAR_YYYY-MM-DD_HHMM.md`
- Destination: `01 Daily Notes/LOGS/AAR_YYYY-MM-DD_HHMM.md`
- Tool: `create_or_rewrite_file`

**Write pattern note to vault:**
- Source: SOUL.md Pattern N
- Destination: `01 Daily Notes/LOGS/PATTERN-N-YYYY-MM-DD.md`
- Tool: `create_or_rewrite_file`
- Frontmatter: `type: pattern`, `number: N`, `date_added: YYYY-MM-DD`, `source_aar: AAR_YYYY-MM-DD_HHMM.md`

**Write rule note to vault:**
- Destination: `03 BARs/RULE-YYYY-MM-DD-{slug}.md`
- Tool: `create_or_rewrite_file`
- Frontmatter: `type: rule`, `condition: WHEN...`, `instruction: THEN...`, `date_added: YYYY-MM-DD`

**Append session entry to daily note:**
- Destination: `01 Daily Notes/YYYY-MM-DD.md`
- Tool: `edit_file` (append_line)
- Format: `## HH:MM — [session name]\n\n**What happened:** ...\n**Files updated:** ...\n**Rules created:** ...\n**Next session starts here:** ...`

**Write LMR to vault:**
- Destination: `01 Daily Notes/LOGS/LMR_YYYY-MM-DD.md`
- Tool: `create_or_rewrite_file`

**Verification:** After each write, `wc -c` via separate tool call. Report: `[L1] ✓ vault_path (size=N)`.

---

## 5. Frontmatter Standard

### AAR
```yaml
---
type: AAR
date: YYYY-MM-DD
timestamp: HHMM
session: [brief session name]
outputs:
  - patterns: [N]
  - rules: [N]
workspace_path: COUNCIL/logs/AAR_YYYY-MM-DD_HHMM.md
---
```

### Pattern note
```yaml
---
type: pattern
number: N
title: "Pattern N: [title]"
date_added: YYYY-MM-DD
source_aar: AAR_YYYY-MM-DD_HHMM.md
workspace_path: SOUL.md (Pattern N)
---
```

### Rule note
```yaml
---
type: rule
condition: "[WHEN condition]"
instruction: "[THEN instruction]"
date_added: YYYY-MM-DD
source_aar: AAR_YYYY-MM-DD_HHMM.md
workspace_path: AGENTS.md (Project Learnings)
---
```

---

## 6. Phase 1 Scope

### In Scope
- [x] Routing table (Section 1)
- [x] Folder structure (Section 2)
- [x] Sync mechanism (Section 3)
- [x] Vault sync step for SKILL.md (Section 4)
- [ ] Frontmatter standard (Section 5)
- [ ] SKILL.md updated with Phase 4, Step 5

### Out of Scope (Phase 2+)
- Sync conflict resolution
- Selective sync
- Vault-only mode
- Bi-directional sync
- Sync wait confirmation

---

## 7. Implementation Sequence

1. **This spec** — filed to `The Library/06 Specs/metabolize-learnings-obsidian-sync-spec.md`
2. **SKILL.md update** — Phase 4, Step 5 written (Section 4 of this spec)
3. **Skill test** — run metabolize-learnings on the next session, verify vault files appear
4. **AAR filing** — file this AAR to `01 Daily Notes/LOGS/AAR_2026-04-27_1820.md`

---

## 8. Open Questions — All Resolved

1. **Naming collision** → resolved: HHMM timestamp, UTC 24-hour
2. **Daily note creation** → resolved: skill creates if not exists, acceptable
3. **Pattern numbering** → resolved: aligned with SOUL.md ordinal, canonical ID
4. **Folder rename** → resolved: no rename needed, LOGS is a subfolder of `01 Daily Notes/`

---

*Spec status: Ready for SKILL.md implementation*