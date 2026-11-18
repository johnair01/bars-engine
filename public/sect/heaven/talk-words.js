// The Shaman Elder's talk card (step 1 of the Heaven quest demo, plan heaven-quest-demo 2026-11-17). No imports, so a test reads it.
// Every line names its thing (concrete-referent rule); every reply seal is an act. His answers on hq-spirits-1 and hq-source-1
// (18:34 UTC) put the player's own doubt in front of the spirits; the writing card and the slip are step 2, so this card ends by offering the errand; step 2 takes over at the "I'll tell you" seal through talk()'s onGo.
export const SHAMAN = {
  open: 'You carried the bucket to the heart stone. Your next errand is down the altar walk, and I send you to it alone.',
  again: 'Come back when you are ready to tell me what the doubting voice says, and I will hand you the slip for the altar walk.',
  what: {
    text: 'Down the altar walk. First, tell me what the doubting voice that walks with you says to you.',
    reply: 'Where to?',
  },
  why: {
    text: 'A spirit speaks only to someone who comes alone. First, tell me what that doubting voice says to you.',
    reply: 'Why alone?',
  },
  met: 'The voice you faced has become a person and stands outside the founder\'s hall. Go and see it.',
  held: 'You hold the slip. A spirit waits on the altar walk for each line you wrote.',
  go: { reply: "I'll tell you", close: 'Take your time. The altar walk waits for the words of that voice.' },
};

/** The card's replies at a node: 'open' offers what/why; after one is read, the other and "I'll go". Pure. */
export function replies(node) {
  if (node === 'open') return [['what', SHAMAN.what.reply], ['why', SHAMAN.why.reply]];
  if (node === 'what') return [['why', SHAMAN.why.reply], ['go', SHAMAN.go.reply]];
  if (node === 'why') return [['what', SHAMAN.what.reply], ['go', SHAMAN.go.reply]];
  if (node === 'again') return [['go', SHAMAN.go.reply]];
  return [];
}
/** What she says at a node. Pure. */
export const lineAt = node => (node === 'what' ? SHAMAN.what.text : node === 'why' ? SHAMAN.why.text : node === 'again' ? SHAMAN.again : node === 'held' ? SHAMAN.held : node === 'met' ? SHAMAN.met : node === 'close' ? SHAMAN.go.close : SHAMAN.open);
