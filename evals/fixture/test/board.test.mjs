import assert from 'node:assert/strict'
import { test } from 'node:test'

import { addCard, createBoard, listCards } from '../src/board.mjs'

test('a card gets the next id and a trimmed title', () => {
  const board = createBoard()
  assert.deepEqual(addCard(board, { title: ' Write the spec ' }).title, 'Write the spec')
  assert.equal(addCard(board, { title: 'Ship it' }).id, 2)
  assert.equal(listCards(board).length, 2)
})

test('a card needs a title', () => {
  assert.throws(() => addCard(createBoard(), { title: '  ' }), TypeError)
})
