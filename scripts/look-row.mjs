/** Which board row a newly rendered still belongs on. A look he answered is a record of what he saw, so a later render
 *  must not overwrite it: the still goes to the newest row of the list that has no answer yet, and a list with nothing
 *  open posts nothing. Kept here, apart from the rendering, so the choice can be checked without a browser.
 *
 *  A row belongs to a list by its own `list` field, not by how its id is spelled: ids look like
 *  `between-hearth-frame-look-01`, while a neighbour like `between-hearth-frame-notes-01` names another list. */

/** Ids worth fetching for a list: the ones whose id starts with it. A hint only, so fetching stays one call; `pickRow`
 *  decides membership. */
export function rowsOfList(ids, list) {
  return (ids ?? []).filter(i => i.startsWith(list)).sort()
}

/** `{row, doc}` for the newest unanswered row of the list, else `{row: null, why}` saying what is missing. */
export function pickRow({ ids, docs, list }) {
  const mine = rowsOfList(ids, list)
  if (!mine.length) return { row: null, why: `the board holds no step in the list ${list}` }
  const open = mine.findLast(id => {
    const doc = docs?.[`steps/${id}`]
    return doc?.list === list && !doc.done && !doc.note
  })
  return open
    ? { row: open, doc: docs[`steps/${open}`] }
    : { row: null, why: `every row in ${list} is answered, so it needs a fresh one before a still can land` }
}
