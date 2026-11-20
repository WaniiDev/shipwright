# Goal: tags, due dates and a CSV export

Three issues. BOARD-3 needs the other two.

## BOARD-1: Tags

Done when:
1. `addCard(board, { title, tags })` keeps `tags` on the card as an array: each tag trimmed and lowercased, empty ones dropped, duplicates dropped, first-seen order kept.
2. A card added without `tags` has `tags: []`.
3. `listCards(board, { tag })` returns only the cards with that tag (matched after trimming and lowercasing); `listCards(board)` still returns every card.

## BOARD-2: Due dates

Done when:
1. `addCard(board, { title, due })` keeps `due` on the card as the same `YYYY-MM-DD` string; a card added without `due` has `due: null`.
2. A `due` that is not a real calendar date in `YYYY-MM-DD` form (`2026-02-30`, `tomorrow`, `2026-1-5`) throws a `RangeError`, and no card is added.
3. `overdue(board, today)`, exported from `src/board.mjs`, returns the cards whose `due` is before `today` (a `YYYY-MM-DD` string), earliest first. Cards due on `today` and cards without a due date are left out.

## BOARD-3: CSV export

Done when:
1. `toCsv(board)`, exported from a new `src/export.mjs`, returns the header line `id,title,tags,due` and then one line per card in board order, joined with `\n`, with no trailing newline.
2. Tags are joined with `;`, and a card without a due date has an empty `due` field.
3. A field that holds a comma, a double quote or a newline is wrapped in double quotes, with each double quote inside it doubled.

Not in scope: reading CSV, a command line, persistence.
