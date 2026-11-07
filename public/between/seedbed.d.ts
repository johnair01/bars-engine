// Types for seedbed.js (the BARs garden's rules), read by the server route, plant.ts and the tests.
export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water'
export type Bed = 'hollow' | 'chamber'
export type Plant = { bed: Bed; element: Element; intent?: string; tends: number; plantedAt: string; tendedAt?: string }
export type Mana = Partial<Record<Element, number>>
export type Refusal = { ok: false; why: string }

export const ELEMENTS: Element[]
export const BEDS: Bed[]
export const INTENT_MAX: number
export const TEND_GAP: number
export const FROST_DAYS: number
export const FROST_DAYS_SPRING: number
export const EL_WORD: Record<Element, string>
export const FEEL_WORD: Record<Element, string>

export function elementOf(bar: { nation?: string | null; emotion?: string | null; emotionalAlchemyTag?: string | null } | null | undefined): Element
export function cleanIntent(s: unknown): string | undefined
export function isPlant(p: unknown): p is Plant
export function plant(existing: Plant | null | undefined, opts?: { bed?: string; element?: string; intent?: string }, now?: number): { ok: true; plant: Plant } | Refusal
export function isFrosted(p: Plant | null | undefined, now?: number, opts?: { spring?: boolean }): boolean
export function tendedToday(p: Plant | null | undefined, now?: number): boolean
export function canTend(p: Plant | null | undefined, mana: Mana | null | undefined, now?: number): { ok: true } | Refusal
export function tend(p: Plant | null | undefined, mana: Mana | null | undefined, now?: number): { ok: true; plant: Plant; mana: Mana } | Refusal
export function stageOf(maturity: string | null | undefined): number
export function harvestOf(barId: string, p: Plant | null | undefined, now?: number): { bar: string; element: Element; at: string } | null
export function cleanMana(m: unknown): Mana
