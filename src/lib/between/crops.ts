/**
 * Satisfaction crops (design pass satisfaction-crops-2026-11-16, Wendell 2026-11-16: "different crops for the kind of
 * work (domain) and the kind of satisfaction"). A crop is a family times a form. The satisfaction of unpacking
 * question 2 sets the FAMILY (five, the walk's channels); the kind of help from question 1 sets the FORM.
 * Pure: no React, no farm doc. The farm keeps `Plant.crop`; absent means the generic pod.
 */
import { EXPERIENCE_OPTIONS } from '@/lib/quest-grammar/unpacking-constants'
import { CHANNEL_LIGHT, SATISFACTIONS, type Channel } from '@/lib/coaching/unpacking-walk'

export type Domain = (typeof EXPERIENCE_OPTIONS)[number]
export type Crop = { family: Channel; form: Domain | 'own' }

export const CHANNELS: ReadonlyArray<Channel> = ['anger', 'sadness', 'fear', 'joy', 'neutrality']

const means = (c: Channel) => SATISFACTIONS.find((s) => s.channel === c)!.means

/** The five families. `means` is the walk's own line (never copied); `grows` is the one sentence about the crop. */
export const CROP_FAMILY: Record<Channel, { name: string; state: string; color: string; means: string; grows: string }> = {
  anger: { name: 'Ember pepper', state: 'Triumph', color: CHANNEL_LIGHT.anger, means: means('anger'), grows: 'Hot red peppers that ripen fast in full sun.' },
  sadness: { name: 'Rain bell', state: 'Poignance', color: CHANNEL_LIGHT.sadness, means: means('sadness'), grows: 'Blue bells that hang heavy with rain.' },
  fear: { name: 'Moon radish', state: 'Wonder-Excitement', color: CHANNEL_LIGHT.fear, means: means('fear'), grows: 'A pale radish that swells in the dark under spiky leaves.' },
  joy: { name: 'Sun pea', state: 'Bliss', color: CHANNEL_LIGHT.joy, means: means('joy'), grows: 'A pea vine that fills with pods as it climbs.' },
  neutrality: { name: 'Hearth squash', state: 'Peace', color: CHANNEL_LIGHT.neutrality, means: means('neutrality'), grows: 'A round golden squash that keeps all winter.' },
}

/** The form: how the crop grows and what the harvest is for. The domain shows only as the bed's label this round. */
export const CROP_FORM: Record<Domain | 'own', { bed: string; grows: string }> = {
  'Gather Resource': { bed: 'Grain bed', grows: 'a grain head you store' },
  'Skillful Organizing': { bed: 'Trellis bed', grows: 'a vine on a trellis linking two beds' },
  'Raise Awareness': { bed: 'Path bloom bed', grows: 'a bloom that seeds the beds beside it' },
  'Direct Action': { bed: 'Hand-picked bed', grows: 'a fruit you pick by hand' },
  own: { bed: 'Wild bed', grows: 'a wild bed' },
}

/** A crop for a family and a form, or none: a Q1 "own" seed has a crop only after the player taps a picture. */
export function makeCrop(family: Channel | null, form: Domain | 'own'): Crop | undefined {
  return family ? { family, form } : undefined
}

export const cropName = (c: Crop) => CROP_FAMILY[c.family].name
export const bedLabel = (c: Crop) => CROP_FORM[c.form].bed

/** True for a value that can be stored on a Plant. */
export function isCrop(v: unknown): v is Crop {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  return (CHANNELS as ReadonlyArray<unknown>).includes(c.family) && (c.form === 'own' || (EXPERIENCE_OPTIONS as ReadonlyArray<unknown>).includes(c.form))
}
