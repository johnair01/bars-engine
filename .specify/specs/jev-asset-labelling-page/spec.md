# Spec: Asset statement labelling page

## The ask

> "We need to make sure this UI is ergonomic for someone who doesn’t spend time in data tables a lot and gets overwhelmed by spreadsheets and the like"
> Wendell, on the board's question `jev-asset-piles`, saved 2026-10-14. He chose option C on the same question: label the 20 admin-art rows first.

**Who it is for:** Wendell, and later cocreators who may label statements for other trials.
**What they feel now, and what should change:** The Shaman's read: a JSON file of 195 rows reads as a wall, and the work looks larger than it is. The change is one statement at a time, with three plain answers, so the 20 rows feel like 20 small questions with an obvious stopping point.

## Purpose

Let a person label the 20 admin-art statements as "the code matches the document", "they differ" or "can't tell", one statement per screen, with the code shown beside the statement. Labels save as they are given and the council reads them from the page's database.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| One statement per screen | No table, no list of rows, no filters | Wendell (the steer above) |
| Three answers, in plain words | Stored as `agrees`, `disagrees`, `cannot tell`, matching the statement list's README | council; follows `ASSET_STATEMENTS_README.md` |
| Which rows | The 20 `asset-admin` rows, in list order | Wendell (chose C on `jev-asset-piles`) |
| Code on the card | Up to a few lines around each referenced line, first one open and the rest folded | council |
| No verdict anywhere | The page never says which answer is right, and carries nothing from the statement list's `note` or `known_drift` fields | the trial's rule: no row is pre-marked |
| Saving | Each answer writes to the page's database at once; a person can stop any time and return to the first unanswered statement | council |
| Readable type | A face made for reading, large buttons, generous spacing, both themes, phone width | Wendell (the steer above) |
| Who sees it | The page is private to its owner | council |

## Contracts

Database collection `labels`, one document per statement, id = the statement's id (for example `AS-011`):

```json
{ "label": "agrees" | "disagrees" | "cannot tell", "note": "<optional text>", "savedAt": "<ISO time>" }
```

## Reserved items

None. The statements are doc and code text, with no player data.

## How we will know it failed

- **The cheap test, run before building further:** Wendell labels the first three statements without help, and says whether it felt like a spreadsheet.
- **The result that stops the work:** he stalls on a card, or says it still feels like data entry. Then the card carries too much, and the code view is the first part to cut or fold.

## Definition of done

- [ ] 20 cards render with the doc statement and code excerpts, at desktop and phone width, in light and dark.
- [ ] An answer saves, survives a reload, and shows on return.
- [ ] A read of the `labels` collection through the database tool shows the saved answers.
- [ ] Only Wendell can confirm: the first three statements feel manageable. This goes on his steps list.
