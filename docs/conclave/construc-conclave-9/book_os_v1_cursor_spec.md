# Book OS v1 — Detailed Cursor Spec
## Bars-engine extension for governed manuscript authoring, section scaffolding, source-linked BARs, and ChatGPT-to-DB drafting

---

## 0. Summary

Bars-engine already has a functioning **book ingestion and transformation pipeline**:

- `Book` records exist in Prisma
- PDFs can be uploaded and text extracted
- TOC extraction writes structure hints into `Book.metadataJson`
- AI analysis can turn book chunks into draft quests (`CustomBar`)
- AI move extraction can turn book chunks into `NationMove`
- approved book-derived quests can be published into a `QuestThread`
- a token-efficient Books Context API already exists for external consumers / ChatGPT

What the repo does **not** yet provide is a strong **manuscript authoring scaffold**.

This spec adds the missing layer:

1. **Book section scaffolding**
2. **Book/campaign intake**
3. **Section intake**
4. **Source-linked BARs that point to editable/readable text docs**
5. **Section drafting workflow**
6. **Push approved section text into the DB**
7. **Use approved sections as future retrieval context**

This is not a replacement for the current books pipeline.
It is an extension that adds a **book authoring governance layer** on top of the existing ingestion / analysis / quest generation substrate.

---

## 1. Repo-grounded baseline

### 1.1 What already exists
The following capabilities already exist in the repo and should be reused rather than rebuilt:

- `Book` model in Prisma with `title`, `author`, `slug`, `sourcePdfUrl`, `extractedText`, `status`, `metadataJson`
- optional `QuestThread.bookId`
- admin book upload and extraction pipeline in `src/actions/books.ts`
- Books Context API in `src/app/api/admin/books/route.ts`
- AI chunk analysis in `src/actions/book-analyze.ts`
- book-derived `CustomBar` quest creation with provenance in `completionEffects`
- move extraction into `NationMove`
- publishing book quests into a `QuestThread` in `src/actions/book-to-thread.ts`
- admin UI orchestration in `src/app/admin/books/useBookPipelineActions.ts`

### 1.2 What is missing
The following concepts do not currently exist as first-class book-authoring primitives:

- `BookSection`
- section-level draft vs approved text
- section dependencies / anti-repetition rules
- section-linked source artifacts
- style rules
- canon rules
- editorial agent runs
- approval events for prose
- a ChatGPT-friendly “draft this section then push it to DB” loop

---

## 2. Product goals

### 2.1 Primary goals
Implement strong book scaffolding so the system can:

- define a book as a sequence of sections
- capture the purpose of each section before prose is generated
- link sections to sources the system can read
- allow ChatGPT to draft against retrieved context
- push a correct draft into the appropriate DB record
- distinguish between draft text and approved text
- reuse approved sections as future retrieval context

### 2.2 Secondary goals
Enable the system to:

- link BARs to source docs and sections
- emit BARs from approved sections
- support both PDF-first and doc/URL-first workflows
- use existing admin/books surfaces where possible
- remain API-first

### 2.3 Non-goals for v1
Do not attempt in v1:

- full autonomous book writing
- Google Docs OAuth editing implementation unless connector/auth already exists
- arbitrary collaborative rich-text editor
- full style-scoring ML system
- full RAG/vector infra if not needed for MVP

---

## 3. Product framing

The repo currently supports:

**Book → extract text → analyze → generate quests/moves → publish quest thread**

Book OS v1 adds:

**Book → define structure → define section goals → attach sources → draft section → validate → approve → optionally derive BARs/moves/quests**

This makes Bars-engine capable of handling books both as:
- **source material for gameplay**
- **living authored manuscripts**

---

## 4. Core concepts

### 4.1 Book
Existing top-level manuscript container. Reuse existing `Book` model.

### 4.2 BookSection
A new first-class section object.
This is the missing spine.

A book is no longer just `Book.extractedText` plus metadata.
It becomes a structured sequence of sections.

### 4.3 SectionSource
A source artifact attached to a specific section.
Can point to:
- uploaded / pasted text
- PDF-derived excerpt
- URL content snapshot
- external doc mirror / export
- BAR-linked source text

### 4.4 CanonRule
A stable truth / definition / distinction that constrains future sections.

### 4.5 StyleRule
An enforceable voice / cadence / instructional / anti-pattern rule.

### 4.6 SectionRun
An auditable record of an editorial action:
- retrieval
- draft import
- critique
- approval
- BAR derivation

### 4.7 ApprovalEvent
A record of when draft prose becomes approved prose.

### 4.8 SectionBARLink
Join object linking sections and BARs.
Allows:
- a BAR to inform a section
- a section to generate a BAR
- a BAR to point to editable source text

---

## 5. User stories

### 5.1 Book campaign intake
As an author, I want to define the purpose and major sections of a book before drafting so the manuscript has an explicit scaffold.

### 5.2 Section intake
As an author, I want to define what a section must accomplish, what it must not repeat, and how it should affect the reader before prose is drafted.

### 5.3 Source-linked drafting
As an author, I want to attach source text, notes, links, or BARs to a section so the system can retrieve grounded context.

### 5.4 ChatGPT drafting loop
As an author, I want to draft in ChatGPT, iterate until a section is correct, and then push that approved draft into the correct section record in the DB.

### 5.5 Approval boundary
As an author, I want draft text and approved text to be distinct so only approved text becomes future context.

### 5.6 BAR/text linkage
As an author, I want BARs to link to source docs or section text so book-writing and BAR systems reinforce one another.

---

## 6. Data model changes

Below are Prisma-oriented model additions. Adjust naming if needed for your schema conventions.

### 6.1 `BookSection`

```prisma
model BookSection {
  id                    String   @id @default(cuid())
  bookId                String
  parentSectionId       String?
  title                 String
  slug                  String
  orderIndex            Int
  sectionType           String   @default("standard") // intro | conceptual | instructional | story | bridge | exercise | closing | standard

  goal                  String?  @db.Text
  teachingIntent        String?  @db.Text
  emotionalTarget       String?  @db.Text
  targetReaderState     String?  @db.Text
  exitReaderState       String?  @db.Text

  mustDefine            String?  @db.Text // JSON array or text
  mustNotRepeat         String?  @db.Text // JSON array or text
  dependencySectionIds  String?  @db.Text // JSON array of BookSection ids
  avoidanceSectionIds   String?  @db.Text // JSON array of BookSection ids

  draftText             String?  @db.Text
  approvedText          String?  @db.Text

  status                String   @default("draft") // draft | in_review | approved | canonical | archived
  metadataJson          String?  @db.Text

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  book                  Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  parentSection         BookSection? @relation("BookSectionTree", fields: [parentSectionId], references: [id], onDelete: SetNull)
  childSections         BookSection[] @relation("BookSectionTree")

  sources               SectionSource[]
  styleRules            StyleRule[]
  canonRules            CanonRule[]
  runs                  SectionRun[]
  approvalEvents        ApprovalEvent[]
  barLinks              SectionBARLink[]

  @@unique([bookId, slug])
  @@unique([bookId, orderIndex])
  @@index([bookId, status])
  @@map("book_sections")
}
```

### 6.2 `SectionSource`

```prisma
model SectionSource {
  id                 String   @id @default(cuid())
  sectionId          String
  sourceType         String   // pdf_excerpt | pasted_text | url_snapshot | external_doc | bar_link | approved_section_excerpt
  title              String?
  uri                String?
  extractedText      String?  @db.Text
  sourceBookId       String?
  sourceSectionId    String?
  linkedBarId        String?
  snapshotHash       String?
  tagsJson           String?  @db.Text
  trustLevel         String   @default("working") // authoritative | approved | working | reference
  metadataJson       String?  @db.Text
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  section            BookSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  linkedBar          CustomBar?  @relation(fields: [linkedBarId], references: [id], onDelete: SetNull)
  sourceBook         Book?       @relation(fields: [sourceBookId], references: [id], onDelete: SetNull)
  sourceSection      BookSection? @relation("SectionSourceOrigin", fields: [sourceSectionId], references: [id], onDelete: SetNull)

  @@index([sectionId])
  @@index([linkedBarId])
  @@index([sourceBookId])
  @@map("section_sources")
}
```

### 6.3 `StyleRule`

```prisma
model StyleRule {
  id               String   @id @default(cuid())
  bookId           String
  sectionId        String?
  title            String
  ruleType         String   // tone | cadence | teaching | anti_pattern | rhetorical_constraint | structure
  severity         String   @default("hard") // hard | firm | soft
  ruleText         String   @db.Text
  exampleText      String?  @db.Text
  metadataJson     String?  @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  book             Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  section          BookSection? @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([bookId])
  @@index([sectionId])
  @@map("style_rules")
}
```

### 6.4 `CanonRule`

```prisma
model CanonRule {
  id               String   @id @default(cuid())
  bookId           String
  sectionId        String?
  title            String
  ruleType         String   // definition | distinction | terminology | dependency | prohibition
  ruleText         String   @db.Text
  sourceExcerpt    String?  @db.Text
  metadataJson     String?  @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  book             Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  section          BookSection? @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([bookId])
  @@index([sectionId])
  @@map("canon_rules")
}
```

### 6.5 `SectionRun`

```prisma
model SectionRun {
  id               String   @id @default(cuid())
  sectionId        String
  runType          String   // intake | retrieval | import_draft | critique | approval | derive_bars
  actorType        String   @default("human") // human | agent | api
  actorId          String?
  inputJson        String?  @db.Text
  outputText       String?  @db.Text
  metadataJson     String?  @db.Text
  createdAt        DateTime @default(now())

  section          BookSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([sectionId, runType])
  @@map("section_runs")
}
```

### 6.6 `ApprovalEvent`

```prisma
model ApprovalEvent {
  id               String   @id @default(cuid())
  sectionId        String
  approvedById     String?
  approvedText     String   @db.Text
  notes            String?  @db.Text
  promotedToCanon  Boolean  @default(true)
  createdAt        DateTime @default(now())

  section          BookSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  approvedBy       Player?     @relation(fields: [approvedById], references: [id], onDelete: SetNull)

  @@index([sectionId, createdAt])
  @@map("approval_events")
}
```

### 6.7 `SectionBARLink`

```prisma
model SectionBARLink {
  id               String   @id @default(cuid())
  sectionId        String
  barId            String
  role             String   // source | output | critique | refinement | note
  metadataJson     String?  @db.Text
  createdAt        DateTime @default(now())

  section          BookSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  bar              CustomBar   @relation(fields: [barId], references: [id], onDelete: Cascade)

  @@unique([sectionId, barId, role])
  @@index([sectionId])
  @@index([barId])
  @@map("section_bar_links")
}
```

---

## 7. Existing model updates

### 7.1 `Book`
No breaking changes required, but add optional book-level scaffold metadata if useful.

Suggested additions:

```prisma
campaignIntakeJson String? @db.Text
sectionMapJson     String? @db.Text
bookType           String? // handbook | manual | memoir | framework | guide | hybrid
```

These can also live in `metadataJson` if you want fewer schema changes.

### 7.2 `CustomBar`
No required changes, but recommended optional fields:

```prisma
sourceSectionId String?
sourceBookId    String?
sourceDocUri    String?
```

This is optional because `SectionBARLink` may already be enough.

---

## 8. Intake workflows

### 8.1 Book Campaign Intake
Purpose:
Define the manuscript before prose begins.

#### Inputs
- book title
- subtitle (optional)
- audience
- core promise
- target transformation
- book type
- voice notes
- source works / reference books (optional)
- top-level section count or rough section list

#### Outputs
- `Book` created or updated
- book-level metadata scaffold saved
- initial section map generated
- optional initial style / canon rules seeded

#### Data shape
Store in `Book.metadataJson` or `Book.campaignIntakeJson`:

```json
{
  "audience": "Readers learning emotional alchemy",
  "corePromise": "Teach readers how to use WAVE as emotional first aid",
  "targetTransformation": "Move from emotional confusion to actionable embodied literacy",
  "bookType": "instructional",
  "voiceNotes": [
    "Somatic grounding before abstraction",
    "Avoid blog tone",
    "No summary voice"
  ]
}
```

### 8.2 Section Map Intake
Purpose:
Define the sequence of sections.

#### Inputs
For each section:
- title
- order
- rough purpose
- optional WAVE alignment
- optional dependency notes

#### Outputs
Creates `BookSection` rows with:
- `title`
- `orderIndex`
- `goal`
- `status = draft`

### 8.3 Section Intake
Purpose:
Define what a section must do before drafting.

#### Fields
- goal
- teaching intent
- emotional target
- target reader state on entry
- target reader state on exit
- must define
- must not repeat
- dependencies
- anti-pattern warnings
- source notes

This intake should be editable and should live on the section object itself.

---

## 9. Source system

### 9.1 Source types
Book OS v1 supports the following `SectionSource.sourceType` values:

- `pasted_text`
- `pdf_excerpt`
- `url_snapshot`
- `external_doc`
- `bar_link`
- `approved_section_excerpt`

### 9.2 v1 rules
For v1, keep the source system simple:

- Pasted text is fully supported
- PDF-derived excerpts from existing `Book.extractedText` are supported
- URL snapshot support is allowed if there is already a fetch utility or it can be safely added
- “Google Docs” should be treated as `external_doc` using mirrored text or pasted/exported content unless first-class auth/editing already exists elsewhere

### 9.3 BAR-linked sources
A BAR can be linked to a section by:
1. creating a `SectionBARLink`
2. optionally creating a `SectionSource` with `sourceType = "bar_link"` and `linkedBarId`

This allows:
- BAR as source artifact
- BAR as note object
- BAR as generated derivative of section text

### 9.4 Source snapshot behavior
Important:
If a source is external (URL or external doc), store a snapshot of the extracted text.
Do not rely on live external content at render time.

Reason:
- reproducibility
- prompt stability
- auditability

---

## 10. Drafting loop

### 10.1 Desired workflow
The core user workflow is:

1. Open a section in ChatGPT
2. Pull the section context pack
3. Draft and revise until correct
4. Push final draft into Bars-engine
5. Review / approve inside Bars-engine
6. Future sections can retrieve approved text

### 10.2 Context pack
A context pack should return:

- section metadata / intake
- approved dependency sections
- must-not-repeat summaries
- style rules
- canon rules
- relevant section sources
- optionally linked BAR summaries

### 10.3 Draft import
A section draft import does **not** auto-approve.

The draft import endpoint writes:
- `draftText`
- optional `SectionRun` with `runType = import_draft`

### 10.4 Approval
Approval is separate.
Approving a section:
- copies `draftText` → `approvedText`
- creates `ApprovalEvent`
- sets `status = approved`
- makes section eligible for future retrieval

---

## 11. API surface

Add the following endpoints.

### 11.1 Books / section scaffolding

#### `GET /api/books/:bookId/sections`
Returns all sections for a book in order.

#### `POST /api/books/:bookId/sections`
Creates one or more sections.

**Payload:**
```json
{
  "sections": [
    {
      "title": "How to Use WAVE",
      "orderIndex": 3,
      "sectionType": "instructional",
      "goal": "Explain how a reader uses WAVE in real time"
    }
  ]
}
```

#### `PATCH /api/sections/:sectionId`
Update section intake / metadata.

### 11.2 Section sources

#### `GET /api/sections/:sectionId/sources`
Returns all sources linked to a section.

#### `POST /api/sections/:sectionId/sources`
Creates a source.

**Payload:**
```json
{
  "sourceType": "pasted_text",
  "title": "Approved WAVE exemplar",
  "extractedText": "WAVE is not something you think about..."
}
```

### 11.3 Section context pack

#### `GET /api/sections/:sectionId/context-pack`
Returns a prompt-ready object:

```json
{
  "section": {...},
  "dependencies": [...],
  "mustNotRepeat": [...],
  "styleRules": [...],
  "canonRules": [...],
  "sources": [...],
  "linkedBars": [...]
}
```

### 11.4 Draft import

#### `POST /api/sections/:sectionId/draft`
Writes draft text to the section.

**Payload:**
```json
{
  "draftText": "WAVE begins the moment you notice activation...",
  "actorType": "api",
  "metadataJson": {
    "source": "chatgpt",
    "importedFrom": "book-os drafting flow"
  }
}
```

Behavior:
- update `BookSection.draftText`
- set status to `in_review` if it was `draft`
- create `SectionRun`

### 11.5 Approval

#### `POST /api/sections/:sectionId/approve`

**Payload:**
```json
{
  "notes": "Approved after style/canon review"
}
```

Behavior:
- `approvedText = draftText`
- `status = approved`
- create `ApprovalEvent`

### 11.6 BAR linking

#### `POST /api/sections/:sectionId/link-bar`

**Payload:**
```json
{
  "barId": "ck...",
  "role": "source"
}
```

### 11.7 BAR derivation from section

#### `POST /api/sections/:sectionId/derive-bars`
Optional v1.1 endpoint.
Uses approved text to generate BARs, quests, or moves.

---

## 12. Server actions

If you want to mirror existing repo style, add server actions:

- `src/actions/book-sections.ts`
- `src/actions/section-sources.ts`
- `src/actions/section-approval.ts`
- `src/actions/section-context.ts`

### 12.1 `book-sections.ts`
Functions:
- `createBookSections`
- `updateBookSection`
- `listBookSections`
- `getBookSection`
- `importSectionDraft`

### 12.2 `section-sources.ts`
Functions:
- `addSectionSource`
- `listSectionSources`
- `linkBarToSection`

### 12.3 `section-approval.ts`
Functions:
- `approveSection`
- `listApprovalEvents`

### 12.4 `section-context.ts`
Functions:
- `getSectionContextPack`

---

## 13. Admin UI additions

Reuse `/admin/books` rather than creating a parallel universe.

### 13.1 New route
Add:
- `src/app/admin/books/[bookId]/sections/page.tsx`

Purpose:
Primary section management surface for a book.

### 13.2 Section list UI
Display:
- order
- title
- status
- section type
- goal preview
- has draft?
- has approved text?
- source count

Actions:
- edit intake
- view context pack
- open sources
- paste/import draft
- approve
- derive BARs (future)

### 13.3 Section detail UI
Tabs:
- Intake
- Draft
- Approved
- Sources
- BAR links
- Runs
- Approval history
- Context pack preview

### 13.4 Book campaign intake UI
Add optional entry point under `/admin/books/[bookId]`:

- title / promise / audience / transformation
- generate initial section map
- edit section structure

### 13.5 Source add UI
Allow:
- paste text
- attach internal excerpt
- link BAR
- add URL snapshot (if enabled)

---

## 14. Context retrieval logic

### 14.1 Retrieval order
For a section context pack:

1. current section intake
2. approved dependency sections
3. explicit `mustNotRepeat`
4. book-level style rules
5. section-level style rules
6. book-level canon rules
7. section-level canon rules
8. section sources
9. BAR links

### 14.2 Token discipline
Do not dump full books into prompts.
Trim sources using heuristics:
- source priority
- excerpt length
- trust level
- explicit tags

### 14.3 v1 implementation note
If semantic retrieval is not ready, start with explicit linkage + deterministic inclusion.
This is enough to make the system useful quickly.

---

## 15. Editing model for external docs

### 15.1 Scope
The user explicitly wants BARs that link to text docs the system can read and edit.

### 15.2 v1 recommendation
Implement **DB-canonical text with external source references**, not live document editing.

That means:
- external doc content is mirrored into `SectionSource.extractedText`
- the editable canonical manuscript lives in `BookSection.draftText` / `approvedText`

Why:
- simpler
- auditable
- avoids connector/auth complexity
- lets ChatGPT push correct text into the DB immediately

### 15.3 Future path
If direct external doc writing is needed later:
- add `externalDocWritebackStatus`
- add source-specific adapters
- gate by trust / explicit user action

---

## 16. BAR integration details

### 16.1 Why BAR linkage matters
The user wants:
- sections to reference source notes / artifacts
- BARs to help guide writing
- approved text to become game-usable material

### 16.2 Supported link roles
`SectionBARLink.role` should support:

- `source`
- `output`
- `refinement`
- `critique`
- `note`

### 16.3 Example flows

#### BAR → section source
A BAR created in discovery becomes a linked source for section drafting.

#### section → BAR output
An approved section can generate:
- a quest
- a move
- a source BAR
- a doctrinal BAR / canon note

### 16.4 Future reuse of existing analyzers
You may later adapt `src/actions/book-analyze.ts` to operate on `BookSection.approvedText` instead of only `Book.extractedText`.

Do not do that in MVP if it will slow down the section scaffolding rollout.

---

## 17. ChatGPT integration pattern

### 17.1 Current repo advantage
The repo already has a Books Context API specifically for ChatGPT / scripts.

### 17.2 Extend the pattern
Add a **Sections Context API** analogous to the current Books Context API.

Suggested endpoints:
- `GET /api/admin/book-sections?bookId=...`
- `GET /api/admin/book-sections/:sectionId`
- `GET /api/admin/book-sections/:sectionId/context-pack`
- `POST /api/admin/book-sections/:sectionId/draft`
- `POST /api/admin/book-sections/:sectionId/approve`

Protect using the same API key mechanism pattern already used by Books Context API.

### 17.3 Primary use case
This allows a Custom GPT / ChatGPT workflow to:

1. list sections
2. fetch a section context pack
3. draft in the chat
4. push the draft into Bars-engine
5. optionally approve after review

This is the most important user-facing workflow in this spec.

---

## 18. Validation rules

### 18.1 Draft import validation
On draft import:
- section must exist
- draft text must be non-empty
- optional max length warning, not hard stop
- store exact imported text; do not mutate

### 18.2 Approval validation
Before approve:
- draft text must exist
- approval should be explicit
- create immutable approval event

### 18.3 Section order validation
Within a book:
- no duplicate `orderIndex`
- no duplicate `slug`

### 18.4 Source validation
For `pasted_text`:
- `extractedText` required

For `url_snapshot`:
- `uri` required

For `bar_link`:
- `linkedBarId` required

---

## 19. Migration plan

### Phase 1 — Schema and CRUD
Implement:
- `BookSection`
- `SectionSource`
- `StyleRule`
- `CanonRule`
- `SectionRun`
- `ApprovalEvent`
- `SectionBARLink`

Add CRUD server actions and REST routes.

### Phase 2 — Intake + admin UI
Implement:
- book campaign intake
- section map creation UI
- section intake editor
- section list/detail UI

### Phase 3 — Draft push + approval
Implement:
- context pack API
- draft import
- approval flow
- run logging

### Phase 4 — BAR linkage
Implement:
- link BAR to section
- create source from BAR link
- browse BAR links in section detail

### Phase 5 — Optional derivation / analysis
Implement later:
- derive bars from approved section
- derive section-level moves / quests
- retrieval scoring

---

## 20. File-by-file implementation plan

### 20.1 Prisma
- `prisma/schema.prisma`
- new migration in `prisma/migrations/...`

### 20.2 Actions
Create:
- `src/actions/book-sections.ts`
- `src/actions/section-sources.ts`
- `src/actions/section-context.ts`
- `src/actions/section-approval.ts`

### 20.3 API routes
Create:
- `src/app/api/admin/book-sections/route.ts`
- `src/app/api/admin/book-sections/[sectionId]/route.ts`
- `src/app/api/admin/book-sections/[sectionId]/context-pack/route.ts`
- `src/app/api/admin/book-sections/[sectionId]/draft/route.ts`
- `src/app/api/admin/book-sections/[sectionId]/approve/route.ts`
- `src/app/api/admin/book-sections/[sectionId]/sources/route.ts`
- `src/app/api/admin/book-sections/[sectionId]/bars/route.ts`

### 20.4 Admin pages
Create:
- `src/app/admin/books/[bookId]/sections/page.tsx`
- `src/app/admin/books/[bookId]/sections/[sectionId]/page.tsx`

Components:
- `SectionList.tsx`
- `SectionIntakeForm.tsx`
- `SectionDraftEditor.tsx`
- `SectionSourcePanel.tsx`
- `SectionBarLinksPanel.tsx`
- `SectionApprovalPanel.tsx`
- `SectionContextPackPanel.tsx`

### 20.5 Optional utilities
Create:
- `src/lib/book-sections/context-pack.ts`
- `src/lib/book-sections/slug.ts`
- `src/lib/book-sections/validation.ts`

---

## 21. Suggested server action signatures

### `src/actions/book-sections.ts`

```ts
export async function createBookSections(
  bookId: string,
  sections: Array<{
    title: string
    orderIndex: number
    sectionType?: string
    goal?: string
  }>
)

export async function updateBookSection(
  sectionId: string,
  updates: {
    title?: string
    orderIndex?: number
    goal?: string
    teachingIntent?: string
    emotionalTarget?: string
    targetReaderState?: string
    exitReaderState?: string
    mustDefine?: string
    mustNotRepeat?: string
    dependencySectionIds?: string[]
    avoidanceSectionIds?: string[]
    metadataJson?: string
  }
)

export async function importSectionDraft(
  sectionId: string,
  draftText: string,
  metadata?: Record<string, unknown>
)

export async function listBookSections(bookId: string)

export async function getBookSection(sectionId: string)
```

### `src/actions/section-sources.ts`

```ts
export async function addSectionSource(
  sectionId: string,
  input: {
    sourceType: string
    title?: string
    uri?: string
    extractedText?: string
    linkedBarId?: string
    sourceBookId?: string
    sourceSectionId?: string
    trustLevel?: string
    tagsJson?: string
    metadataJson?: string
  }
)

export async function linkBarToSection(
  sectionId: string,
  barId: string,
  role: string,
  metadataJson?: string
)

export async function listSectionSources(sectionId: string)
```

### `src/actions/section-context.ts`

```ts
export async function getSectionContextPack(sectionId: string)
```

### `src/actions/section-approval.ts`

```ts
export async function approveSection(
  sectionId: string,
  notes?: string
)

export async function listSectionApprovalEvents(sectionId: string)
```

---

## 22. Context pack contract

Suggested response shape:

```json
{
  "section": {
    "id": "sec_123",
    "title": "How to Use WAVE",
    "goal": "Explain how to use WAVE in the moment of activation",
    "teachingIntent": "Reader knows when to start and how to proceed",
    "mustNotRepeat": ["Do not re-explain the emotional theory section"],
    "status": "draft"
  },
  "dependencies": [
    {
      "id": "sec_prev",
      "title": "What WAVE Is",
      "approvedText": "..."
    }
  ],
  "styleRules": [
    {
      "title": "Somatic grounding first",
      "ruleText": "Abstract claims must be grounded in bodily experience."
    }
  ],
  "canonRules": [
    {
      "title": "WAVE entry condition",
      "ruleText": "WAVE begins when activation is noticed in the body."
    }
  ],
  "sources": [
    {
      "id": "src_1",
      "sourceType": "pasted_text",
      "title": "Exemplar section",
      "extractedText": "..."
    }
  ],
  "linkedBars": [
    {
      "id": "bar_1",
      "title": "WAVE reminder",
      "role": "source"
    }
  ]
}
```

---

## 23. Acceptance criteria

### AC1 — section scaffolding
An admin can create a book section map for a book.

### AC2 — section intake
An admin can define and save the goals and constraints of a section.

### AC3 — source linking
An admin can attach pasted text, internal references, or BAR links to a section.

### AC4 — context pack
A section context pack can be retrieved through an API route.

### AC5 — draft import
ChatGPT or an admin can import section draft text into a section record.

### AC6 — approval
An admin can approve a draft, creating immutable approved text and an approval event.

### AC7 — future retrieval
Approved section text appears in future context packs when explicitly linked as a dependency or source.

### AC8 — repo compatibility
Existing books upload / extract / analyze / publish flows continue to work unchanged.

---

## 24. Risks and mitigations

### Risk: building too much editorial intelligence too soon
Mitigation:
Start with explicit section intake + explicit source linking.
Do not block MVP on full agentic critique.

### Risk: external doc complexity
Mitigation:
Use mirrored text snapshots in DB for v1.
Do not require live editing of Google Docs in MVP.

### Risk: prompt bloat
Mitigation:
Build context packs from approved dependencies and explicitly linked sources only.

### Risk: parallel ontology confusion with books pipeline
Mitigation:
Frame this as **Book Authoring Layer**, not replacement for book analysis pipeline.

### Risk: section drafts becoming accidental canon
Mitigation:
Only `approvedText` enters future retrieval by default.

---

## 25. Suggested GitHub issue breakdown

1. `feat(book-os): add BookSection and editorial support models to Prisma`
2. `feat(book-os): add CRUD server actions for book sections`
3. `feat(book-os): add section sources and BAR linking`
4. `feat(book-os): add section context pack endpoint`
5. `feat(book-os): add section draft import flow`
6. `feat(book-os): add section approval flow`
7. `feat(book-os): add /admin/books/[bookId]/sections UI`
8. `feat(book-os): add section detail editor UI`
9. `feat(book-os): extend Books Context API pattern for section drafting`
10. `chore(book-os): document ChatGPT drafting workflow`

---

## 26. Implementation recommendation

Build this in the following order:

1. schema
2. section CRUD
3. section sources
4. context pack
5. draft import
6. approval
7. admin UI
8. BAR linkage polish

Do not start with “agent magic.”
Start with **strong scaffolding**.
The scaffolding is the product.

---

## 27. Final framing

Bars-engine already knows how to turn books into gameplay material.

This spec teaches it how to hold a manuscript steady while it is being written.

That is the missing layer.

Without it, the system extracts from books.

With it, the system can actually help make them.
