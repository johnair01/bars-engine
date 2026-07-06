# MVP Primitive Data Schema

## Purpose

This schema is the implementation bridge for the primitive-first architecture.

The code implementation lives in:

- `src/lib/alchemy/show-up-primitives.ts`

## Core Types

```ts
type ShowUpVectorType =
  | 'stabilize'
  | 'transcend'
  | 'neutral_translate'
  | 'generative_translate'
  | 'mastery_integration_translate'

type ShowUpOrientation = 'internal' | 'external'
type ShowUpSubject = 'self' | 'other' | 'collective'
```

## Primitive Schema

```ts
interface ShowUpPrimitive {
  id: ShowUpPrimitiveId
  label: string
  vectorTypes: ShowUpVectorType[]
  preferredOperations: AlchemyPracticeOperation[]
  sourceChannels?: EmotionChannel[]
  targetChannels?: EmotionChannel[]
  chargeMechanic: string
  baseAct: string
  innerArtifactFamilies: string[]
  outerActFamilies: string[]
  completionLogic: string
  driftReflection: string
  proofPrototypeIds: string[]
}
```

## Translation Input Schema

```ts
interface ShowUpTranslationInput {
  primitiveId: ShowUpPrimitiveId
  stateVector: string
  orientation: ShowUpOrientation
  subject: ShowUpSubject
  superpower: Superpower
  domain: AllyshipDomain
  blocker: string
  cardContext?: ShowUpCardContext
}
```

## Translated Move Schema

```ts
interface TranslatedShowUpMove {
  primitiveId: ShowUpPrimitiveId
  stateVector: string
  vectorMechanic: string
  orientation: ShowUpOrientation
  subject: ShowUpSubject
  superpower: Superpower
  domain: AllyshipDomain
  domainOutput: string
  blocker: string
  title: string
  instruction: string
  completion: string
  reflectionPrompt: string
  cardContext?: ShowUpCardContext
}
```

## MVP Primitive IDs

| ID | Base Name |
|---|---|
| `identify_signal` | Identify Signal |
| `bound_the_ask` | Bound The Ask |
| `name_care_distance` | Name Care And Distance |
| `clean_exit` | Clean Exit |
| `interrupt_pattern` | Interrupt Pattern |
| `create_sequence` | Create Sequence |
| `create_handoff` | Create Handoff |
| `restore_flow` | Restore Flow |
| `make_meaning_actionable` | Make Meaning Actionable |
| `repair_without_performance` | Repair Without Performance |

## Validation Rules

Every primitive must have:

- unique `id`
- non-empty `label`
- at least one `vectorType`
- at least one `preferredOperation`
- `chargeMechanic`
- `baseAct`
- at least one internal artifact family
- at least one external act family
- `completionLogic`
- `driftReflection`

## Current Test Coverage

The focused test lives at:

- `src/lib/alchemy/__tests__/show-up-primitives.test.ts`

It verifies:

- all 10 MVP primitives exist
- schema validation returns no errors
- primitive IDs are unique
- every primitive supports internal and external outputs
- proof primitives for MP02, MP08, MP19, MP05, and MP12 are represented

## Translator

`translateShowUpPrimitive(input)` produces a `TranslatedShowUpMove` from:

```text
primitive + state vector + orientation + subject + superpower + domain + blocker
```

The MVP translator is deterministic:

- primitive supplies the vector mechanic and reflection prompt
- orientation selects inner vs outer output family
- domain shapes `domainOutput`
- superpower shapes instruction style
- proof primitives get sharper templates for MP02, MP08, MP19, MP05, and MP12

## Primitive Selection

`selectShowUpPrimitivesForVector(input)` ranks candidate primitives from:

```ts
interface ShowUpPrimitiveMatchInput {
  from: AlchemyState
  to: AlchemyState
  operation?: AlchemyPracticeOperation
}
```

The selector infers a `ShowUpVectorType` from operation/state movement, then scores primitives by:

- vector type support
- preferred operation
- source channel match
- target channel match

`selectPrimaryShowUpPrimitiveForVector(input)` returns the highest-ranked primitive or `null`.

## Selector Implementation

The implementation now includes:

- `selectShowUpPrimitivesForVector(input)`
- `selectPrimaryShowUpPrimitiveForVector(input)`

These bridge:

```text
AlchemyState from/to + optional operation -> ranked primitive candidates
```

The selector is intentionally ranked rather than single-answer only, because blocker and card context may choose a secondary primitive.

## Next Implementation Step

Route planner output can now become translated move recommendations:

```text
AlchemyEdge -> selected primitive -> translated Show Up move
```

Implemented helpers:

- `recommendShowUpMoveForEdge(edge, context)`
- `recommendShowUpMovesForEdges(edges, context)`

## Next Implementation Step

Use the recommendation helpers from an intake-facing surface or service that supplies:

- route edge(s)
- orientation
- subject
- superpower
- domain
- blocker
