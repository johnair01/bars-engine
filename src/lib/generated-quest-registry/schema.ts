import { z } from 'zod'

const StepSchema = z.object({
  phase: z.enum(['stabilization', 'translation', 'expression']),
  instruction: z.string().min(1),
})

const TransformationMoveSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  move: z.string().min(1),
})

const TranslationTransformationSchema = z.object({
  path: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  move: z.string().min(1),
})

export const CreateQuestSchema = z.object({
  title: z.string().min(1),
  status: z.enum(['draft', 'active', 'archived']),
  chapter: z.number().int().positive(),
  moveType: z.enum(['generated', 'library', 'manual']),
  source: z.object({
    kind: z.string().min(1),
    label: z.string().min(1).optional(),
  }),
  bar: z.object({
    label: z.string().min(1),
    type: z.enum(['perception', 'identity', 'relational', 'systemic']),
    polarity: z.string().min(1).optional(),
    emotionalChannel: z.enum(['anger', 'fear', 'sadness', 'joy', 'neutral']),
    emotionalState: z.string().min(1),
    wavePhases: z.array(z.string()).optional(),
  }),
  transformation: z.object({
    stabilization: TransformationMoveSchema,
    translation: TranslationTransformationSchema,
    expression: TransformationMoveSchema,
  }),
  steps: z.array(StepSchema).min(1),
  tags: z.array(z.string()).optional(),
  bookId: z.string().min(1).nullable().optional(),
})

export type CreateQuestInput = z.infer<typeof CreateQuestSchema>
