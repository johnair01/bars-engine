# Spec: Six Faces as formal council agents

**Status:** proposal, 2026-10-02, revised by two six-face passes the same day. The passes and the board supersede this file where they differ: the build is a definition file (`council/faces.yaml`), a skill (`.claude/skills/six-faces/`) and a stats script (`council/stats.py`), with no Python agents until a surface needs them; records live per repo in `ledger/`; the Sage synthesises and never rules (Wendell, 2026-10-02). See `6FACE_PASS1_2026-10-02.md`, `6FACE_PASS2_2026-10-02.md`, `RESEARCH_lineage-and-prior-art_2026-10-02.md`, and `ledger/`. The board: https://claude.ai/artifact/DxyShVS8tmvJym4HAsgnho

## Purpose

Make the six Game Master faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage) a formal, callable council that deliberates on Wendell's projects from Integral altitudes, records every deliberation and every ruling, and learns from the rulings which questions each face may answer alone.

**Problem.** The faces exist twice and the two copies do not meet.

1. As **game NPCs** in `backend/app/agents/*.py`: six pydantic-ai agents that read a player's state from Postgres and produce quests, move proposals, emotional readings, campaign assessments and community guidance. Exposed to Cursor through the `bars-agents` FastMCP server. They speak to players.
2. As a **deliberation practice** in prose: six-face passes and strand consults written by a Claude session at Wendell's request, in friendcraft, flirtcraft and bars-engine. Each face argues from a stable lens, a verdicts table follows, and the pass ends "for Wendell to rule". Wendell's ruling then lands in a decision log or a header note on the consult. That is where the faces deliberate about projects.

The second practice is the one this spec is about, and it has no definition outside the sessions that produce it. Every pass regenerates the lenses from memory. No record holds the question, the six verdicts and the ruling in one structure. Nothing counts how often each face is convened, for what, or how often Wendell overrules it. That count is the raw material for ceding responsibility, and today it cannot be taken.

**Practice:** Deftness Development. Deterministic over AI (the ledger, the stats and the ceding table are plain data). Dual-track (the council runs with any model provider, or with none, in which case it prints the brief for a human to argue).

## What exists today (checked 2026-10-02)

| Piece | Where | State |
|---|---|---|
| Six NPC agents + Sage orchestrator | `backend/app/agents/` | pydantic-ai 1.68, model `openai:gpt-4o` from `settings.agent_model`, needs an async DB session via `AgentDeps` |
| MCP server for Cursor | `backend/app/mcp_server.py`, `.cursor/mcp.json` | FastMCP, 12 tools, one per NPC function; health-checks the FastAPI backend |
| Strand runner | `backend/app/strand/runner.py` | fixed sect sequence shaman → sage → architect, writes a strand BAR with an audit trail |
| Consult brief format | `.specify/specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md` | the format flirtcraft and later consults cite: per face observations, risks, recommendations; Sage merges |
| Consult scripts | `scripts/strand-consult-*.ts`, 14 of them | one hand-written prompt set per consult, output to a markdown file in the spec folder |
| Composting | `scripts/compost-strand-consults.ts` | moves consults of Done specs to archive. Archives; does not learn |
| Agent Forge | `.specify/specs/admin-agent-forge/spec.md` | 3-2-1 friction → `AgentSpec` / `AgentPatch`. The nearest existing design for patching an agent's context from a human event |
| Cursor mapping | `.cursor/rules/game-master-agents.mdc` | face → Cursor subagent table |
| Friendcraft passes | `preproduction/6FACE_*.md`, six files | the mature form: scorecard, anchor, six lenses, verdicts table, dissent check, landing |
| Flirtcraft consults | `INTAKE_SIX_FACES.md`, `LEDGER_AND_LAUNCH_SIX_FACES.md` | same format; the ruling is a header note that records what the ruling overturned |

## Counts (inventory of 2026-10-02)

Taken from the written record in the five repos. Session transcripts are not available in this container (`~/.claude/projects` holds only this session), so a pass argued in a Claude Code session and never written to a file is not counted. That gap is the reason for the ledger. The three active repos are shallow clones (bars-engine to 2026-06-11, friendcraft to 2026-08-21, flirtcraft to 2026-08-30), so git-derived counts are lower bounds. emotional-first-aid and root-game hold no face material.

| Measure | Count |
|---|---|
| Standalone recorded deliberations | about 71 (friendcraft 6, flirtcraft 2, bars-engine about 63) |
| Embedded or borderline (six-face sections inside specs, the Library council's 25 rulings) | about 13 |
| Convened by Wendell, with a ruling recorded, in the pass shape of September 2026 | 11 (friendcraft 6, flirtcraft 2, mailing list 2, Understood review 1) |
| Automated strand or Sage consults, March 2026, via `sage_consult` / `strand_run` / `strand:consult:*` | about 25 |
| Decision-log entries in friendcraft citing a pass or a face by name | 10 of 55 (passes four and six are not logged) |
| Recorded overrules of a face by Wendell | 2 explicit (pass six Shaman; flirtcraft intake Sage), plus the mailing-list amendment |

**What they were convened for**

| Cause | About |
|---|---|
| Feature-design consult (mostly the March strand batch) | 25 |
| Spec review or gap analysis | 22 |
| Product, pricing, launch, intake | 8 |
| Incident or build reliability | 5 |
| Book structure or manuscript ruling | 4 |
| Project steering ("what is next") | 2 |
| Card or schema design | 1 |
| Code review | 1 |
| Prose or voice review | 0 recorded (`editorial-core/READER_FACES.md` defines one; no run found) |

**Which face decides**

| Face | Pattern in the record |
|---|---|
| Sage | Rules in all six friendcraft passes, both flirtcraft consults, and every scripted strand consult. About 8 Sage-only consults. |
| Challenger | Primary face for the Understood review; drives "send the letter" in friendcraft passes three to five; one Challenger-only balance pass. |
| Architect | Primary in hand-vault; resolved all three round-one splits in the mailing-list decision. |
| Regent | Occasional: campaign-leads ruling C, the topics plan in the mailing amendment, Kickstarter ruling 6 ("the Sage does not overturn the Regent"). |
| Shaman | Opens, supplies the felt sense, almost never decides. The one explicit overrule on record is against it. |
| Diplomat | Almost never decides; most often the dissent (pass six "Tag"; flirtcraft D9). |

Friendcraft decision-log mentions by name: Sage 14, Shaman 4, Challenger 4, Regent 2, Architect 1, Diplomat 1.

**Three things the inventory changed in this proposal**

1. **A second six exists.** `specs/doctrine/gm-faces.md` defines Ontologist, Systems Architect, Experience Designer, Encounter Designer, Steward, Integrator for spec review, and `hand-vault-capture-movement/SIX_FACE_ANALYSIS.md` used it. The council needs one canonical six. Open decision 7.
2. **The method was already written down three times**, in `docs/process/spec-prework-iching-six-faces.md` (I Ching cast, then six faces, before spec work), `editorial-core/READER_FACES.md` (faces judge prose, per chapter) and `.agent/context/game-master-sects.md`. `faces.yaml` absorbs all three rather than adding a fourth.
3. **The face list is enumerated in at least twelve places in code** (`GameMasterFace` in two `types.ts`, a Python `StrEnum`, a `Literal`, and local copies in eight files) and kept in step by `scripts/verify-face-meta-lockstep.ts`. `faces.yaml` becomes the source those read from, or the lockstep script grows to check it.

## Design Decisions

| Topic | Decision |
|---|---|
| One face, two roles | A face has a **council** role (deliberates on a project) and an **NPC** role (serves a player). Same altitude, same name, different prompt, different output schema, different dependencies. The council role needs no database. The NPC agents are untouched. |
| One definition file | `council/faces.yaml` holds every face's altitude, quadrant, lens question, deliverable shape, standing tests and lessons. The council agents, the Claude Code skill, the Cursor rule and the docs all read it. Nothing about a face is defined twice. |
| The lenses come from the practice, not from me | Each face's lens below is the one the passes already use, with the source cited. Where I propose a change it is marked as mine. |
| The record is data | Every consult is one JSON record in `council/ledger/`. Markdown is rendered from it, never the other way round. Backfill parses the existing consults into records once. |
| The learning signal is the ruling | A face learns only from Wendell's ruling on a question it answered. Agreement, partial agreement and overrule are the three outcomes. Overrules append a lesson, in Wendell's words, to that face's lessons list, which is injected into its prompt. This is `CLAUDE.md` §Received wisdom made per face. |
| Ceding is a table, not a feeling | A `(face, cause)` pair has a disposition: `advisory` (default: the face argues, Wendell rules), `delegated` (the face answers alone, the Sage records it, Wendell reads it after) or `reserved` (never delegated). Promotion needs a run of agreements whose length Wendell sets. One overrule demotes. |
| Reserved by default | Canonical prose, consent and release, money, and anything that names a person. Wendell can add. Nothing is removed from this list by the learning loop. |
| Unanimity is a flag | Pass six found that six voices from one author share the author's blind sector. The Sage records `dissent: false` on a unanimous pass and says so in the landing. Proposal (mine): run the Challenger on a different model family than the other five. Cheap to try, and the ledger will show whether it changes the overrule rate. |
| CLI first, MCP wraps it | The council is a Python package with a CLI. The MCP tools, the Claude Code skill and any HTTP route call the same functions. One implementation, four doors. |
| Files before Postgres | The ledger is git-tracked JSON. A Postgres table and an admin page come later if a surface needs them. No migration in phase 1. |

## Conceptual model

| Dimension | Council |
|---|---|
| WHO | The six faces, in council role. Wendell, who rules. |
| WHAT | A **consult**: one question, six verdicts, one synthesis, one ruling. |
| WHERE | A project (friendcraft, flirtcraft, bars-engine, root-game, emotional-first-aid, or another) and a **cause** (the kind of question). |
| Energy | A ruling. It is the only thing that changes a face's disposition or lessons. |
| Personal throughput | Grow Up. The council exists so that Wendell's judgment compounds instead of being re-derived each session. |

### The six lenses, as practised

| Face | Altitude / quadrant | Lens question | Delivers | Source |
|---|---|---|---|---|
| Shaman | Magenta / I | What is moving underneath? What is the felt sense? | observations, risks, recommendations; the §2c test (does it say something is wrong with them, or something about what I have learned) | STRAND_CONSULT_SIX_FACES §1; 6FACE_PASS6 "felt sense"; friendcraft CLAUDE.md §2c |
| Architect | Orange / It | What must be true in the machine? Is the binary false? | structure, the third position, validation order | STRAND_CONSULT §2; PASS6 "structure" |
| Challenger | Red / stress | What gets wrong? What breaks? What is self-inflicted? | risks, anti-patterns, falsification tests, the scheduling truth under the question | STRAND_CONSULT §3; PASS6 "what gets wrong" |
| Regent | Amber / We institutional | What must be preserved? What ships when? What is an obligation rather than a preference? | phase gates, definition of done, non-negotiables | STRAND_CONSULT §4; OPEN_RULINGS ruling 6 |
| Diplomat | Green / We relational | What bridges? Who is excluded? What will the community accept? | copy principles, onboarding path, the bridge | STRAND_CONSULT §5; PASS6 "what bridges" |
| Sage | Teal / whole | What is the smallest coherent whole? Where do the five conflict, and in what order does it resolve? | synthesis, task deltas, deferred items, the dissent flag, the landing for Wendell | STRAND_CONSULT §6; PASS6 "panoramic" and "Verdicts" |

**Order:** Shaman → Architect → Challenger → Regent → Diplomat → Sage, as the consult brief specifies. The friendcraft passes run Architect first. Record the order used; do not fix it in the schema.

## API contracts

### Record: `Consult`

```ts
type Face = 'shaman' | 'architect' | 'challenger' | 'regent' | 'diplomat' | 'sage'
type Outcome = 'agreed' | 'partial' | 'overruled' | 'unruled'
type Disposition = 'advisory' | 'delegated' | 'reserved'

interface FaceVerdict {
  face: Face
  verdict: string            // one line, the row of the verdicts table
  observations: string[]
  risks: string[]
  recommendations: string[]
  outcome: Outcome           // filled when the ruling lands
  lesson?: string            // Wendell's words, when overruled
}

interface Consult {
  id: string                 // YYYY-MM-DD-<project>-<slug>
  date: string
  project: string
  cause: string              // from council/causes.yaml, derived from backfill, named by Wendell
  question: string
  convened_by: 'wendell' | 'session' | 'script'
  invoked_from: 'claude-code' | 'cursor' | 'cli' | 'mcp' | 'script' | 'backfill'
  context_refs: string[]     // files or rulings cited
  order: Face[]
  faces: FaceVerdict[]
  synthesis: string          // the Sage's merge
  dissent: boolean           // false on a unanimous pass
  landing: string            // "for Wendell to rule"
  ruling?: { date: string; text: string; ref?: string }
  source_doc?: string        // the markdown this was parsed from or rendered to
}
```

### Package `council` (Python, `backend/app/council/` or `cli/council/`)

```py
def consult(question: str, project: str, cause: str | None, faces: list[Face] | None, model: str | None) -> Consult
def record(c: Consult) -> Path                       # writes council/ledger/<id>.json
def render(c: Consult) -> str                        # the markdown pass, in the PASS6 shape
def rule(id: str, text: str, outcomes: dict[Face, Outcome], lessons: dict[Face, str]) -> Consult
def stats(project: str | None, since: str | None) -> Stats   # counts by project, cause, face, outcome
def dispositions() -> dict[tuple[Face, str], Disposition]     # from council/ceding.yaml + ledger
def backfill(paths: list[Path]) -> list[Consult]              # parse existing consult markdown
```

`consult` without a model key returns a `Consult` whose faces carry the lens questions and empty verdicts, rendered as a brief for a human to argue. That is the no-AI path and it is first class.

### Doors

| Door | Form | Who uses it |
|---|---|---|
| CLI | `faces consult "<q>" --project friendcraft --cause schema` · `faces rule <id>` · `faces stats` · `faces ceding` | Wendell, from any terminal, with no editor open |
| MCP | `council_consult`, `council_rule`, `council_stats` added to `bars-agents`, without the DB dependency the NPC tools carry | Claude Code (`claude mcp add bars-agents ...`), Claude Desktop, Cursor |
| Skill | `.claude/skills/six-faces/SKILL.md` in each project repo: read `faces.yaml`, run the CLI or MCP tool, paste the rendered pass into the console, write the record | A session convening a pass. Replaces regenerating the lenses from memory |
| HTTP | `POST /api/council/consult` on the FastAPI app | later, for an admin page or a Routine |

Model: `COUNCIL_MODEL`, default `anthropic:claude-sonnet-5-5` (the `anthropic` package is already in `backend/uv.lock`); `openai:` works unchanged. The Challenger may take `COUNCIL_CHALLENGER_MODEL` (see Design Decisions).

## User stories

### P1: Convene from anywhere
**As Wendell**, I want to type one command, in a terminal or in Claude Desktop, and get a six-face pass on a question, so the council is available when I am not in Claude Code.
**Acceptance:** `faces consult` prints the pass and writes the record. The MCP tool returns the same record. No Postgres required.

### P2: Count what I have been doing
**As Wendell**, I want to see how many times each face has been convened, for what causes, and how often I overruled it.
**Acceptance:** `faces stats` reads the ledger, including the backfilled records, and prints per-project, per-cause and per-face tables with outcome counts.

### P3: Rule, and have the ruling stick
**As Wendell**, I want to record a ruling against a consult once and have every face learn from it.
**Acceptance:** `faces rule` marks each face agreed / partial / overruled, stores my words as the lesson for an overruled face, and the next consult's prompt for that face carries the lesson.

### P4: Cede by evidence
**As Wendell**, I want a `(face, cause)` pair to become `delegated` only after the run of agreements I set, and to fall back on one overrule.
**Acceptance:** `faces ceding` shows the table with the counts behind each row. A delegated pair answers without convening the other five and records that it did.

### P5: No invented thresholds
**As Wendell**, I want every number in the ceding rule to be mine.
**Acceptance:** `council/ceding.yaml` ships with the run length unset. The CLI refuses to promote until it is set. (`CLAUDE.md` §Numbers.)

## Functional requirements

### Phase 0: definition and backfill (no model calls)
- **FR1** `council/faces.yaml` with the six lenses above, sources cited, `lessons: []` per face.
- **FR2** `backfill` parses the existing consult markdown in the three repos into `Consult` records. Rulings are filled where the document records one ("ratified", "What Wendell ruled", a decision-log entry that cites the pass). Everything else is `unruled`.
- **FR3** `council/causes.yaml` derived from the backfill. Wendell names the categories; the parser proposes.
- **FR4** `faces stats` over the backfilled ledger.

### Phase 1: the council runs
- **FR5** Six council agents (pydantic-ai, no `AgentDeps.db`), prompts built from `faces.yaml` + lessons, output `FaceVerdict`.
- **FR6** Sage merge producing `synthesis`, `dissent`, `landing`.
- **FR7** `faces consult`, `faces rule`, `render` in the PASS6 shape, lint-clean under `tools/voice_lint.py` where that repo has it.
- **FR8** MCP tools `council_consult`, `council_rule`, `council_stats` in `bars-agents`.
- **FR9** `.claude/skills/six-faces/` in bars-engine, friendcraft, flirtcraft.

### Phase 2: ceding
- **FR10** `council/ceding.yaml`, `dispositions()`, promotion and demotion as decided above.
- **FR11** A delegated consult convenes one face, records `convened: [face]`, and is still rendered and still ruleable.

### Phase 3 (not scoped): HTTP route, admin page, Postgres table, a Routine that convenes the council on a schedule.

## Non-functional

- Offline: Phase 0 and the no-model path need no network.
- Every model call has the deterministic fallback the NPC agents already have.
- The ledger is append-only in spirit: `rule` edits one record's `ruling` and `outcome` fields and nothing else.
- Voice: rendered passes obey the house voice rules of the repo they land in.

## Open decisions (Wendell's)

1. Where the ledger lives: one ledger in bars-engine with a `project` field (my recommendation, since the agents and the composting script are here), or one per repo.
2. The run length for promotion to `delegated`, and whether promotion is automatic or proposed for him to confirm.
3. The reserved list, beyond the four defaults.
4. **Ruled 2026-10-02:** the council speaks as the faces, not as the NPCs (Kaelen, Ignis, Aurelius, Vorm, Sola, The Witness). Wendell: *"They should speak as faces."*
5. Model provider for the council, and whether to try a second family for the Challenger.
6. Build order: CLI first (my recommendation), or MCP first.
7. Which six is canonical for the council: the altitude six (Shaman, Challenger, Regent, Architect, Diplomat, Sage) or the doctrine six in `specs/doctrine/gm-faces.md`. My recommendation: the altitude six, since every Wendell-convened pass used it, and the doctrine six becomes a named mask set the Sage may wear.

## Dependencies

- `backend/app/agents/` (untouched; shares pydantic-ai and config)
- `backend/app/mcp_server.py` (extended)
- `tools/voice_lint.py` in friendcraft, `.agents/skills/house-voice/` here

## References

- `FOUNDATIONS.md` §The Six Game Master Faces (altitudes)
- `.specify/specs/cyoa-modular-charge-authoring/STRAND_CONSULT_SIX_FACES.md` (consult format)
- `friendcraft-manuacript/preproduction/6FACE_PASS6_2026-09-09.md` (mature pass shape; the unanimity finding)
- `flirtcraft/INTAKE_SIX_FACES.md` (a ruling recorded against a consult, with what it overturned)
- `.specify/specs/admin-agent-forge/spec.md` (AgentPatch, the prior design for patching agent context)
- `friendcraft-manuacript/CLAUDE.md` §Received wisdom, §Numbers, §Back on Muhani
