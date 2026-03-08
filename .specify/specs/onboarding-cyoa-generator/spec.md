# Spec: Onboarding CYOA Generator — Unblock Invitation Sending

## Purpose

Unblock sending the onboarding page to new users. Admin (Campaign Owner) inputs unpacking questions outlining allyship target's needs; system generates an onboarding CYOA that leads visitors to either **Donate** (Show Up / Gathering Resources) or **Sign Up** (Wake Up). Same repeatable process for quest threads and mini-campaigns. Includes a random test harness to vet quest grammar before launch.

## Context / Goal

The onboarding flow is blocked until the system can generate grammatical CYOA content. This spec provides:
1. **Admin capability**: Generate onboarding CYOA from Campaign Owner unpacking + Epiphany Bridge
2. **Outcomes**: Donate (direct action) or Sign Up (wake up to more)
3. **Test harness**: Random I Ching + unpacking + nation/playbook to validate grammar
4. **API-first**: Contracts before UI; integrate with existing quest grammar

## Conceptual Model (Game Language)

- **WHO**: Campaign Owner (inputs unpacking), New visitor (experiences CYOA)
- **WHAT**: Onboarding CYOA = QuestPacket → Passages → Adventure
- **WHERE**: Bruised Banana (GATHERING_RESOURCES); raise-awareness mini-campaign
- **Energy**: Vibeulons flow when visitors complete
- **Personal throughput**: Epiphany Bridge (6 beats) → Donate or Sign Up

## API Contracts

### generateOnboardingCYOA

```ts
type OnboardingCYOAInput = {
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  segment: 'player' | 'sponsor'
  campaignRef: string
  outcomes: ['donate', 'signup']
}

function generateOnboardingCYOA(input: OnboardingCYOAInput): Promise<QuestPacket>
```

- Reuses compileQuest with Epiphany Bridge (6 beats)
- Action node: Donate (Show Up) and Sign Up (Wake Up) as choice branches

### generateRandomTestInput

```ts
function generateRandomTestInput(): Promise<{
  unpackingAnswers: UnpackingAnswers
  alignedAction: string
  ichingContext: IChingContext
  nationId: string | null
  playbookId: string | null
}>
```

- Random I Ching draw (1–64 when no instance)
- Random unpacking via generateRandomUnpacking
- Random nation + playbook from seed data

### validateQuestGrammar

```ts
function validateQuestGrammar(iterations?: number): Promise<ValidationReport>
```

- Runs generateRandomTestInput → compileQuest N times
- Checks: nodes exist, word counts, choices present, action node format

## Functional Requirements

- **FR1**: generateOnboardingCYOA produces QuestPacket with Epiphany Bridge + action node (Donate | Sign Up)
- **FR2**: generateRandomTestInput returns valid random input for grammar testing
- **FR3**: validateQuestGrammar runs N iterations and returns pass/fail + sample failures
- **FR4**: Admin form for Campaign Owner unpacking (reuse UnpackingForm or extend)

## References

- [Quest Grammar Compiler](../quest-grammar-compiler/spec.md)
- [Campaign Onboarding Twine v2](../campaign-onboarding-twine-v2/spec.md)
- [I Ching Grammatic Quests](../iching-grammatic-quests/spec.md)
- [Random Unpacking Canonical Kernel](../random-unpacking-canonical-kernel/spec.md)
- [Creation Quest Bootstrap](../creation-quest-bootstrap/spec.md)
