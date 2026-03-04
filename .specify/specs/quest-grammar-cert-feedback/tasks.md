# Tasks: Quest Grammar Cert Feedback

## Phase 1: Report Issue Redirect (FR1)

- [ ] Reproduce: cert-quest-grammar-v1 STEP_1 → Report Issue → observe 4–5 second revert to dashboard.
- [ ] Verify TwineQuestModal FEEDBACK support applies to cert-quest-grammar-v1.
- [ ] Fix any modal-specific revert; ensure user stays in quest flow.
- [ ] Manual test: Report Issue from STEP_1 → no dashboard revert.

## Phase 2: Unpacking Form UX (FR2)

- [ ] Audit 6 unpacking questions—define which use dropdowns vs short text.
- [ ] Add dropdown options for applicable questions (e.g. Q2 satisfaction feelings, Q4 dissatisfaction, Q6 shadow voices).
- [ ] Refactor form: mix of dropdowns + short-response fields.
- [ ] Apply mobile-first layout; CYOA-style progression; emotional tone.
- [ ] Manual test: form usable on mobile; feels like choose-your-own-adventure.

## Phase 3: Node Generation Quality (FR3)

- [ ] Analyze compileQuest node text output; document where it produces nonsense.
- [ ] Design AI prompt: unpacking answers + aligned action → coherent node text per beat.
- [ ] Integrate AI prompt into compileQuest (or separate generateNodeText) while preserving structure.
- [ ] Manual test: Bruised Banana example produces grammatical nodes.

## Phase 4: Fractal + Admin Edit (FR4, stretch)

- [ ] Define fractal node subsections schema.
- [ ] Add admin edit layer for generated nodes before publish.
- [ ] Ensure deterministic structure produces correct BARs and quests.

## Verification

- [ ] cert-quest-grammar-v1: Report Issue does not revert to dashboard.
- [ ] Unpacking form: dropdowns + short responses; mobile-first; CYOA feel.
- [ ] Compile & Preview: nodes are grammatical and coherent.
