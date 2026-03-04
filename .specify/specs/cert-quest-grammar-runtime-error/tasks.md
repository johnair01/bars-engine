# Tasks: Cert Quest Grammar Runtime Error

## FR1: Strip telemetryHooks for client

- [x] compileQuestWithAI: omit telemetryHooks from returned packet
- [x] GenerationFlow handleContinue (Compile & Preview): strip telemetryHooks from packet before setPreview
- [x] Verify: Generate with AI and Compile & Preview both work without runtime error

## FR2: Report Issue (if applicable)

- [x] PassageRenderer: pass skipRevalidate when advancing to FEEDBACK and reverting from FEEDBACK
- [x] TwineQuestModal: add sessionStorage persistence for feedback text (survives unexpected navigations)
- [ ] Manual test: Report Issue from STEP_1 or STEP_3 → type feedback → no dashboard revert

## FR3: Page layout

- [x] Quest Grammar page: center content on desktop (max-w-2xl mx-auto)
- [ ] Manual test: /admin/quest-grammar looks centered, not awkwardly right-justified

## Verification

- [ ] cert-quest-grammar-v1: no runtime error on Generate with AI or Compile & Preview
- [ ] cert-quest-grammar-v1: Report Issue does not kick when typing
- [ ] Quest Grammar page: centered layout on desktop
