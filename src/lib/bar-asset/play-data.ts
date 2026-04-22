/**
 * Play data types — what the game emits per event
 */

export interface PlayData {
  /** Which event triggered this. Used to filter exclusions. */
  eventType: string
  /** The bar this play contributed to. */
  sourceBarId: string
  /** Player who triggered the event. */
  playerId: string
  /** Optional — NL text from the play. May be empty. */
  content?: string
}