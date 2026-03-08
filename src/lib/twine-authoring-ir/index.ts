/**
 * Twine Authoring IR — structured story grammar that compiles to .twee
 * @see .specify/specs/twine-authoring-ir/spec.md
 */

export type { IRNode, IRChoice, IRStory, IRStoryMetadata, IRNodeType } from './types'
export { irToTwee } from './irToTwee'
export { validateIrStory, type ValidateResult } from './validateIrStory'
