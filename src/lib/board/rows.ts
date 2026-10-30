/**
 * The council's rows, posted one document per row to the `rows` collection (six-faces-council docs/worklist-api.md).
 * A row is what a rows file in council/callsheets/rows holds: `kind` names its board list (a look's own `list` is its
 * strand, as on a step), the docId is its id, and `pass`
 * names the pass that posted it. The checks are schema/board-save.schema.json's `row` rule, the same ones
 * board/post_rows.py runs before it posts and the board page runs before it draws, so a row this refuses would also
 * have stopped land_rows.py or broken the page.
 */
export const ROW_LISTS = ['positions', 'questions', 'terms', 'causes', 'battles'] as const

const text = (v: unknown) => typeof v === 'string' && /\S/.test(v)
const faces = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every(f => typeof f === 'string')

export function rowErrors(data: Record<string, unknown>): string[] {
  const errors: string[] = []
  const list = data.kind as string
  if (!ROW_LISTS.includes(list as never)) return [`a row's kind (its board list) is one of ${ROW_LISTS.join(', ')}`]
  if (!text(data.pass)) errors.push('a row names the pass that posted it')
  if ('id' in data) errors.push('a row\'s id is its docId, not a field')
  if (data.lane !== undefined && typeof data.lane !== 'string') errors.push('lane is a string')
  if (list === 'positions' && !(faces(data.faces) && text(data.pos))) errors.push('a position needs faces and pos')
  if (list === 'questions') {
    if (!(faces(data.faces) && text(data.q))) errors.push('a question needs faces and q')
    const o = data.options
    if (!(Array.isArray(o) && o.length > 0 && o.every(x => x && typeof x === 'object' && !Array.isArray(x)
        && text((x as Record<string, unknown>).v) && typeof (x as Record<string, unknown>).label === 'string')))
      errors.push('a question needs options, each with v and label')
  }
  if (list === 'terms' && !(text(data.term) && typeof data.plain === 'string')) errors.push('a term needs term and plain')
  if (list === 'causes' && !text(data.desc)) errors.push('a cause needs desc')
  if (list === 'battles' && !(text(data.name) && Array.isArray(data.rounds))) errors.push('a battle needs name and rounds')
  return errors
}
