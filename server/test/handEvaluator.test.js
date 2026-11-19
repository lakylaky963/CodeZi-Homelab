import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateHand } from '../src/services/poker/handEvaluator.js'

// Lower score = stronger hand.
const hands = [
  ['High Card', ['AH', '9D'], ['2C', '5S', '7H', 'JD', '3C']],
  ['Pair', ['AH', 'AD'], ['2C', '5S', '7H', 'JD', '3C']],
  ['Two Pair', ['AH', 'AD'], ['2C', '2S', '7H', 'JD', '3C']],
  ['Three of a Kind', ['AH', 'AD'], ['AC', '5S', '7H', 'JD', '3C']],
  ['Straight', ['4H', '5D'], ['6C', '7S', '8H', 'KD', '2C']],
  ['Flush', ['2H', '9H'], ['4H', '7H', 'JH', 'KD', '3C']],
  ['Full House', ['AH', 'AD'], ['AC', '5S', '5H', 'JD', '3C']],
  ['Four of a Kind', ['AH', 'AD'], ['AC', 'AS', '5H', 'JD', '3C']],
  ['Straight Flush', ['4H', '5H'], ['6H', '7H', '8H', 'KD', '2C']],
  ['Royal Flush', ['AH', 'KH'], ['QH', 'JH', '10H', '2D', '3C']],
]

test('hand categories rank strictly from High Card up to Royal Flush', () => {
  const scores = hands.map(([, hole, board]) => evaluateHand(hole, board).score)
  for (let i = 1; i < scores.length; i++) {
    assert.ok(scores[i] < scores[i - 1], `${hands[i][0]} should beat ${hands[i - 1][0]}`)
  }
})

test('wheel straight (A-5) loses to a 6-high straight', () => {
  const wheel = evaluateHand(['AH', '2D'], ['3C', '4S', '5H', 'KD', '9C'])
  const six = evaluateHand(['2H', '3D'], ['4C', '5S', '6H', 'KD', '9C'])
  assert.ok(six.score < wheel.score)
})

test('kicker decides between equal pairs', () => {
  const board = ['AC', '5S', '7H', '2D', '3C']
  const strong = evaluateHand(['AH', 'KD'], board)
  const weak = evaluateHand(['AD', 'QD'], board)
  assert.ok(strong.score < weak.score)
})

test('identical strength ties exactly (board plays)', () => {
  const board = ['AC', 'KS', 'QH', 'JD', '10C']
  const a = evaluateHand(['2H', '3D'], board)
  const b = evaluateHand(['4H', '5D'], board)
  assert.equal(a.score, b.score)
})

test('best five of seven cards is used', () => {
  const quads = evaluateHand(['AH', 'AD'], ['AC', 'AS', '2H', '3D', '9C'])
  const pair = evaluateHand(['AH', 'KD'], ['AC', '2S', '2H', '3D', '9C'])
  assert.ok(quads.score < pair.score)
})

test('fewer than five cards is incomplete', () => {
  const r = evaluateHand(['AH', 'AD'], ['AC'])
  assert.equal(r.description, 'Incomplete')
  assert.equal(r.score, Number.MAX_SAFE_INTEGER)
})
