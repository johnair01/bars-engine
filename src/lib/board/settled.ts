/**
 * Which board list a settled answer belongs to: the one its store address names.
 *
 * The store keeps each settled answer at `<kind>--<id>`, and two folds read it: Six-faces-council's pull.py decides
 * whether main recorded a save, and this app's foldResolved hands the answer to the page. The payload's own `kind` is
 * not the home: documents written before the address was the rule carry the singular there ('position', 'question'),
 * and folding on that field filed 2,078 positions and 1,020 questions under lists no tab reads (2026-11-17). Keep this
 * equal to Six-faces-council's board/settled.py.
 */
export const SINGULAR: Record<string, string> = {
  position: 'positions',
  question: 'questions',
  term: 'terms',
  cause: 'causes',
}

/**
 * The board list a settled document belongs to, from the key it is stored under.
 *
 * `key` is the document's id in its collection, `<kind>--<id>`. A key that carries no address falls back to the
 * payload kind, which is what the store wrote before the address was the rule.
 */
export function listOf(key: string, doc: Record<string, unknown>): string {
  const at = key.indexOf('--')
  const address = at > -1 ? key.slice(0, at) : typeof doc.kind === 'string' ? doc.kind : ''
  return SINGULAR[address] ?? address
}
