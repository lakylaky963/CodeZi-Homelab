import test from 'node:test'
import assert from 'node:assert/strict'
import { createDeck, toEvaluatorCard, formatCardForDisplay, STARTING_CHIPS } from '../src/services/poker/cardUtils.js'

test('deck has 52 unique cards', () => {
  const deck = createDeck()
  assert.equal(deck.length, 52)
  assert.equal(new Set(deck).size, 52)
})

test('deck has 13 values in each of 4 suits', () => {
  const deck = createDeck()
  for (const s of ['H', 'D', 'C', 'S']) {
    assert.equal(deck.filter((c) => c.endsWith(s)).length, 13)
  }
})

test('shuffle changes order between decks', () => {
  const a = createDeck().join()
  const b = createDeck().join()
  const c = createDeck().join()
  assert.ok(a !== b || b !== c, 'three consecutive shuffles were identical')
})

test('dealing from the deck removes cards without duplicates', () => {
  const deck = createDeck()
  const dealt = []
  for (let i = 0; i < 9; i++) dealt.push(deck.pop())
  assert.equal(deck.length, 43)
  assert.equal(new Set([...dealt, ...deck]).size, 52)
})

test('toEvaluatorCard converts 10 to T and lowercases suit', () => {
  assert.equal(toEvaluatorCard('10H'), 'Th')
  assert.equal(toEvaluatorCard('AS'), 'As')
  assert.equal(toEvaluatorCard('2D'), '2d')
})

test('formatCardForDisplay', () => {
  assert.deepEqual(formatCardForDisplay('10H'), { val: '10', suit: 'H', suitChar: '♥', isRed: true })
  assert.equal(formatCardForDisplay('KS').isRed, false)
  assert.equal(formatCardForDisplay('hidden'), 'hidden')
  assert.equal(formatCardForDisplay(null), null)
})

test('STARTING_CHIPS is 1000', () => assert.equal(STARTING_CHIPS, 1000))
