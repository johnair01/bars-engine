/**
 * Wuxing Channel System — the five Taoist elements, each aligned to an emotional state.
 *
 * Canonical source: "MTGOA Game — Core Architecture" § Emotional Alchemy.
 * Generative cycle: Wood → Fire → Earth → Metal → Water → Wood.
 * When a move generates a channel, it also generates +1 of the NEXT element in
 * the cycle automatically (engine/alchemy.ts applies this).
 */

export type Element = "Wood" | "Fire" | "Earth" | "Metal" | "Water";

export type Emotion = "Joy" | "Anger" | "Neutrality" | "Fear" | "Sadness";

export interface ChannelDef {
  element: Element;
  glyph: string;
  emotion: Emotion;
  quality: string;
  /** The next element in the generative (sheng) cycle. */
  generates: Element;
}

export const CHANNELS: Record<Element, ChannelDef> = {
  Wood: {
    element: "Wood",
    glyph: "木",
    emotion: "Joy",
    quality: "Growth, expansion, vision",
    generates: "Fire",
  },
  Fire: {
    element: "Fire",
    glyph: "火",
    emotion: "Anger",
    quality: "Action, confrontation, boundary",
    generates: "Earth",
  },
  Earth: {
    element: "Earth",
    glyph: "土",
    emotion: "Neutrality",
    quality: "Center, mediation, holding",
    generates: "Metal",
  },
  Metal: {
    element: "Metal",
    glyph: "金",
    emotion: "Fear",
    quality: "Precision, perception, clarity",
    generates: "Water",
  },
  Water: {
    element: "Water",
    glyph: "水",
    emotion: "Sadness",
    quality: "Flow, repair, depth",
    generates: "Wood",
  },
};

export const ELEMENTS: Element[] = ["Wood", "Fire", "Earth", "Metal", "Water"];

/** The element generated downstream in the Wuxing cycle. */
export function nextInCycle(element: Element): Element {
  return CHANNELS[element].generates;
}

/** A bag of channel energy, keyed by element. Missing keys read as 0. */
export type ChannelPool = Partial<Record<Element, number>>;

/** Compound emotions documented in Core Architecture § Six Unpacking Questions. */
export const COMPOUND_EMOTIONS: Record<string, Element[]> = {
  Betrayal: ["Water", "Fire"], // sadness + anger
  Shame: ["Water", "Metal"], // sadness + fear
};
