/** Which board row a newly rendered still belongs on. A look he answered is a record of what he saw, so a later render
 *  must not overwrite it: the still goes to the newest row of the list that has no answer yet, and a list with nothing
 *  open posts nothing. Kept here, apart from the rendering, so the choice can be checked without a browser. */

/** The step ids of one look list: the list's own id, or a numbered row of it (`<list>-01`). The number is required, so a
 *  neighbour that merely starts with the same words (`between-hearth-frame-notes-01`) is not drawn into the list. */
export function rowsOfList(ids, list) {
  const escape = list.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const mine = new RegExp(`^${escape}(?:-\\d+)?$`)
  return (ids ?? []).filter(i => mine.test(i)).sort()
}

/** `{row, doc}` for the newest unanswered row of the list, else `{row: null, why}` saying what is missing. */
export function pickRow({ ids, docs, list }) {
  const mine = rowsOfList(ids, list)
  if (!mine.length) return { row: null, why: `the board holds no step in the list ${list}` }
  for (const id of [...mine].reverse()) {
    const doc = (docs ?? {})[`steps/${id}`]
    if (doc && !doc.done && !doc.note) return { row: id, doc }
  }
  return { row: null, why: `every row in ${list} is answered, so it needs a fresh one before a still can land` }
}
