/** Which board row a newly rendered still belongs on. A look he answered is a record of what he saw, so a later render
 *  must not overwrite it: the still goes to the newest row of the list that has no answer yet, and a list with nothing
 *  open posts nothing. Kept here, apart from the rendering, so the choice can be checked without a browser.
 *
 *  A row's list comes from the row itself (`list: "between-hearth-frame"`), not from how its id is spelled: ids look like
 *  `between-hearth-frame-look-01`, while a neighbour like `between-hearth-frame-notes-01` belongs to another list. */

/** Ids worth fetching for a list: the list's own id, or an id that starts with it. Only a hint, so fetching stays one
 *  call; `pickRow` decides membership from each row's `list`. */
export function rowsOfList(ids, list) {
  return (ids ?? []).filter(i => i === list || i.startsWith(`${list}-`)).sort()
}

/** `{row, doc}` for the newest unanswered row of the list, else `{row: null, why}` saying what is missing. */
export function pickRow({ ids, docs, list }) {
  const mine = rowsOfList(ids, list)
  if (!mine.length) return { row: null, why: `the board holds no step in the list ${list}` }
  for (const id of [...mine].reverse()) {
    const doc = (docs ?? {})[`steps/${id}`]
    if (doc && doc.list === list && !doc.done && !doc.note) return { row: id, doc }
  }
  return { row: null, why: `every row in ${list} is answered, so it needs a fresh one before a still can land` }
}
