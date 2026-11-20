import 'server-only'

/**
 * The payment word register (hole H-payment-word): one word per player id, one player per word.
 * issueWord is idempotent: a player who asks twice gets the same word. A collision on the word retries with a new one.
 */
import { db } from '@/lib/db'
import { isPlayerId } from './packet-record'
import { isWord, makeWord } from './payment-word'

export async function issueWord(playerId: string, rand: () => number = Math.random): Promise<string> {
  if (!isPlayerId(playerId)) throw new Error('issueWord: bad player id')
  const have = await db.founderPaymentWord.findUnique({ where: { playerId } })
  if (have) return have.word
  for (let i = 0; i < 12; i++) {
    const word = makeWord(rand)
    try {
      await db.founderPaymentWord.create({ data: { word, playerId } })
      return word
    } catch {
      // The word or the player id was taken in the meantime: a racing call may have issued this player's word.
      const raced = await db.founderPaymentWord.findUnique({ where: { playerId } })
      if (raced) return raced.word
    }
  }
  throw new Error('issueWord: no free word after 12 tries')
}

/** The player id that owns a word, or null. */
export async function ownerOfWord(word: string): Promise<string | null> {
  if (!isWord(word)) return null
  const row = await db.founderPaymentWord.findUnique({ where: { word } })
  return row?.playerId ?? null
}
