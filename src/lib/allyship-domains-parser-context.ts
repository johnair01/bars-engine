/**
 * Allyship domain definitions for AI parsing (book analysis, quest extraction).
 * Use this context in prompts so the parser can classify content intelligently.
 *
 * Source: Mastering the Game of Allyship; refined via user interview.
 * Domains = WHERE the work happens. Moves = HOW the player gets it done.
 */

export const ALLYSHIP_DOMAINS_PARSER_CONTEXT = `
## Allyship Domains (WHERE the work happens)

Assign ONE essential domain per quest when possible. Multiple domains often apply; choose the ESSENTIAL one—the one that best describes where this work happens. Subordinate domains can be left implicit.

### GATHERING_RESOURCES
- **Additive process**: accumulating, collecting, building up
- **Accessing emotional energy** to get things done (individual interior)
- **Inner resources**: capacity, emotional reserves, energy
- **Outer resources**: money, materials, support
- **Human resources**: acquiring man hours, labor, or expertise for a project—human resources are also resources; the context is additive (bringing people/capacity in)
- **NOT**: Learning to delegate (delegation is subtractive—releasing, distributing)
- **CAUTION**: Information is only a resource in limited contexts; avoid over-assigning

### DIRECT_ACTION
- **The work**: action needs doing; removing obstacles; taking concrete steps
- **"Notice what's blocking you"** = Wake Up MOVE (seeing) in the context of Direct Action DOMAIN
- **Domain** = the field where action happens; **Move** = how the player approaches it (wakeUp to see, showUp to do)

### RAISE_AWARENESS
- **Core**: Increasing people's ability to SEE there is a higher level to operate at
- **Visibility**: letting others know something exists (e.g., "let others know the campaign exists")
- **Discovery**: helping people see resources, organization, or actions available
- **Distinct from Wake Up**: Wake Up = learning/seeing for oneself; Raise Awareness = helping OTHERS see

### SKILLFUL_ORGANIZING
- **External**: Coordinating the efforts of others; creating structures, processes, interfaces
- **Internal**: Organizing one's own systems (routines, habits, processes)
- **Emergent problem**: No systems exist; the problem IS lack of organization
- **"We need capacity"**: creating structures that enable work
- **Learning to delegate** = subtractive, organizational—fits here (releasing control, distributing work)
- **Building a network** (organizing relationships) = can be LR (systems) or LL (cultural/relational)

## Move vs Domain (distinct dimensions)

| Move (HOW) | Domain (WHERE) | Example |
|------------|----------------|---------|
| wakeUp | GATHERING_RESOURCES | Learning about a fundraiser; waking up to opportunities to contribute |
| wakeUp | RAISE_AWARENESS | Seeing what others need to know |
| showUp | RAISE_AWARENESS | Letting others know the campaign exists (doing the visibility work) |
| showUp | DIRECT_ACTION | Taking the first step; removing an obstacle |

## Assignment rules
- Prefer to assign a domain when the context is clear
- When multiple domains apply, choose the essential one
- Leave null when the content is purely individual/interior with no clear collective context
- Move and domain are independent: same move can apply across domains; same domain can require different moves
`

/**
 * Condensed version (~80 tokens) for book analysis. Use when token budget is tight.
 */
export const ALLYSHIP_DOMAINS_PARSER_CONTEXT_SHORT = `
Domains (assign one when clear): GATHERING_RESOURCES=additive, resources; DIRECT_ACTION=obstacles, steps; RAISE_AWARENESS=helping others see; SKILLFUL_ORGANIZING=coordinating, delegating. Moves: wakeUp=see, cleanUp=unblock, growUp=skill, showUp=do. Prefer domain when clear; null if purely individual.
`

/**
 * Instructions for the domain-fit paragraph in book summary / leverage prompts.
 */
export const DOMAIN_FIT_ANALYSIS_CONTEXT = `
## Domain fit analysis
Compare the book's themes and examples to the four allyship domains (Skillful Organizing, Gathering Resources, Direct Action, Raising Awareness). State which domain(s) it fits best, whether it supports the campaign's primary domain when one is given, and which domains are a weaker fit.
`.trim()
