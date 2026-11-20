export function createBoard() {
  return { cards: [], nextId: 1 }
}

export function addCard(board, { title }) {
  if (typeof title !== 'string' || title.trim() === '') throw new TypeError('title is required')
  const card = { id: board.nextId++, title: title.trim() }
  board.cards.push(card)
  return card
}

export function listCards(board) {
  return [...board.cards]
}
