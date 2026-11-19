import test from 'node:test'
import assert from 'node:assert/strict'
import {
  dealNewHand, applyPlayerAction, processAfterAction, markPlayerLeft, resolveShowdown,
  findNextActivePlayer, getActivePlayers, resetHandAfterShowdown, advanceStage,
} from '../src/services/poker/gameLogic.js'

const makeRoom = (chips = [1000, 1000, 1000]) => ({
  players: chips.map((c, i) => ({ username: `p${i}`, chips: c, seatIndex: i })),
  dealerIndex: -1, smallBlind: 10, bigBlind: 20, pot: 0, currentBet: 0,
  communityCards: [], deck: [], status: 'lobby', gameStage: 'waiting', currentTurn: 0,
})
const total = (room) => room.players.reduce((s, p) => s + p.chips, 0) + room.pot

// Rig exact cards for a deterministic showdown.
const rig = (room, holes, board) => {
  room.players.forEach((p, i) => { if (holes[i]) p.cards = holes[i] })
  room.communityCards = board
}

test('dealNewHand: blinds, hole cards, first to act (3 players)', () => {
  const room = makeRoom()
  dealNewHand(room)
  assert.equal(room.dealerIndex, 0)
  assert.equal(room.players[1].chips, 990) // SB
  assert.equal(room.players[2].chips, 980) // BB
  assert.equal(room.pot, 30)
  assert.equal(room.currentBet, 20)
  assert.equal(room.currentTurn, 0) // UTG = dealer in 3-handed
  assert.ok(room.players.every((p) => p.cards.length === 2))
  assert.equal(room.deck.length, 52 - 6)
  assert.equal(room.gameStage, 'preflop')
})

test('heads-up: dealer posts small blind and acts first', () => {
  const room = makeRoom([1000, 1000])
  dealNewHand(room)
  assert.equal(room.players[0].chips, 990)
  assert.equal(room.players[1].chips, 980)
  assert.equal(room.currentTurn, 0)
})

test('dealer button rotates between hands', () => {
  const room = makeRoom()
  dealNewHand(room)
  dealNewHand(room)
  assert.equal(room.dealerIndex, 1)
})

test('broke players are topped up on a new hand', () => {
  const room = makeRoom([0, 1000, 1000])
  dealNewHand(room)
  assert.ok(room.players[0].chips > 0)
})

test('turn order skips folded and all-in players', () => {
  const room = makeRoom([1000, 1000, 1000, 1000])
  dealNewHand(room)
  room.players[1].folded = true
  room.players[2].allIn = true
  assert.equal(findNextActivePlayer(room, 0), 3)
})

test('check is rejected when facing a bet', () => {
  const room = makeRoom()
  dealNewHand(room)
  assert.throws(() => applyPlayerAction(room, 0, 'check'), /Cannot check/)
})

test('unknown action throws', () => {
  const room = makeRoom()
  dealNewHand(room)
  assert.throws(() => applyPlayerAction(room, 0, 'dance'), /Unknown action/)
})

test('call moves chips into pot and advances turn', () => {
  const room = makeRoom()
  dealNewHand(room)
  applyPlayerAction(room, 0, 'call')
  assert.equal(room.players[0].chips, 980)
  assert.equal(room.pot, 50)
  processAfterAction(room)
  assert.equal(room.currentTurn, 1)
})

test('raise: validated, sets current bet, reopens action', () => {
  const room = makeRoom()
  dealNewHand(room)
  assert.throws(() => applyPlayerAction(room, 0, 'raise', 5), /Minimum raise/)
  assert.throws(() => applyPlayerAction(room, 0, 'raise', 'abc'), /Enter a raise amount/)
  assert.throws(() => applyPlayerAction(room, 0, 'raise', -10), /Enter a raise amount/)
  room.players[1].hasActedThisRound = true
  applyPlayerAction(room, 0, 'raise', 40) // raise by 40 on top of 20 => to 60
  assert.equal(room.currentBet, 60)
  assert.equal(room.players[0].lastBet, 60)
  assert.equal(room.players[1].hasActedThisRound, false)
})

test('fold removes player; last player standing wins the pot', () => {
  const room = makeRoom()
  const before = total(room)
  dealNewHand(room)
  applyPlayerAction(room, 0, 'fold')
  processAfterAction(room)
  applyPlayerAction(room, 1, 'fold')
  const result = processAfterAction(room)
  assert.equal(result.winners[0].username, 'p2')
  assert.equal(result.winners[0].hand, 'Last player standing')
  assert.equal(room.pot, 0)
  assert.equal(total(room), before)
})

test('full betting rounds advance preflop -> flop -> turn -> river -> showdown', () => {
  const room = makeRoom()
  dealNewHand(room)
  const before = total(room)
  applyPlayerAction(room, 0, 'call'); processAfterAction(room)
  applyPlayerAction(room, 1, 'call'); processAfterAction(room)
  applyPlayerAction(room, 2, 'check'); processAfterAction(room)
  assert.equal(room.gameStage, 'flop')
  assert.equal(room.communityCards.length, 3)
  for (const stage of ['turn', 'river']) {
    for (let i = 0; i < 3; i++) {
      applyPlayerAction(room, room.currentTurn, 'check')
      processAfterAction(room)
    }
    assert.equal(room.gameStage, stage)
  }
  assert.equal(room.communityCards.length, 5)
  let result = null
  for (let i = 0; i < 3; i++) {
    applyPlayerAction(room, room.currentTurn, 'check')
    result = processAfterAction(room)
  }
  assert.equal(room.gameStage, 'showdown')
  assert.ok(result.winners.length >= 1)
  assert.equal(room.pot, 0)
  assert.equal(total(room), before)
})

test('all-in raise and short-stack call: board runs out, chips conserved', () => {
  const room = makeRoom([1000, 100])
  dealNewHand(room)
  const before = total(room)
  applyPlayerAction(room, 0, 'raise', 1000) // more than the stack allows -> all-in
  assert.equal(room.players[0].allIn, true)
  processAfterAction(room)
  applyPlayerAction(room, 1, 'call') // short stack calls all-in
  assert.equal(room.players[1].allIn, true)
  const result = processAfterAction(room)
  assert.ok(result, 'hand should run out to showdown')
  assert.equal(room.communityCards.length, 5)
  assert.equal(room.pot, 0)
  assert.equal(total(room), before)
})

test('side pots: short all-in can only win what it matched', () => {
  const room = makeRoom([1000, 1000, 1000])
  dealNewHand(room)
  Object.assign(room.players[0], { totalBet: 100, chips: 900 })
  Object.assign(room.players[1], { totalBet: 300, chips: 700 })
  Object.assign(room.players[2], { totalBet: 300, chips: 700 })
  room.pot = 700
  room.gameStage = 'river'
  rig(room, [['AH', 'AD'], ['KH', 'KD'], ['QH', 'QD']], ['2C', '7S', '9H', 'JD', '3C'])
  const { winners, potAwarded } = resolveShowdown(room)
  assert.equal(potAwarded, 700)
  // p0 wins main pot 300 (3 x 100); p1 wins side pot 400 (2 x 200)
  assert.equal(room.players[0].chips, 900 + 300)
  assert.equal(room.players[1].chips, 700 + 400)
  assert.equal(room.players[2].chips, 700)
  assert.equal(winners.reduce((s, w) => s + w.amount, 0), 700)
})

test('split pot: tie divides evenly, odd chip goes to a winner, nothing lost', () => {
  const room = makeRoom([1000, 1000])
  dealNewHand(room)
  Object.assign(room.players[0], { totalBet: 26, chips: 974 })
  Object.assign(room.players[1], { totalBet: 25, chips: 975 })
  room.pot = 51
  rig(room, [['2H', '3D'], ['4H', '5D']], ['AC', 'KS', 'QH', 'JD', '10C'])
  resolveShowdown(room)
  assert.equal(room.players[0].chips + room.players[1].chips, 974 + 975 + 51)
  // main pot 50 split 25/25; the 1 uncalled chip returns to p0
  assert.equal(room.players[0].chips, 974 + 25 + 1)
  assert.equal(room.players[1].chips, 975 + 25)
})

test('showdown pays the best hand', () => {
  const room = makeRoom([1000, 1000])
  dealNewHand(room)
  room.pot = 200
  room.players.forEach((p) => { p.totalBet = 100; p.chips = 900 })
  rig(room, [['AH', 'AD'], ['2H', '7D']], ['AC', '5S', '9H', 'JD', '3C'])
  const { winners } = resolveShowdown(room)
  assert.equal(winners.length, 1)
  assert.equal(winners[0].username, 'p0')
  assert.equal(room.players[0].chips, 1100)
  assert.equal(room.players[1].chips, 900)
})

test('leaver on their own turn is folded out and turn moves on', () => {
  const room = makeRoom()
  dealNewHand(room)
  assert.equal(room.currentTurn, 0)
  const result = markPlayerLeft(room, 0)
  assert.equal(result, null)
  assert.equal(room.players[0].left, true)
  assert.equal(room.players[0].folded, true)
  assert.equal(room.currentTurn, 1)
  assert.equal(room.players.length, 3, 'seat kept during hand')
  assert.equal(room.pot, 30, 'chips stay in pot')
})

test('leaver out of turn keeps hand running; leaving down to one player ends it', () => {
  const room = makeRoom()
  dealNewHand(room)
  assert.equal(markPlayerLeft(room, 2), null)
  assert.equal(room.currentTurn, 0)
  const result = markPlayerLeft(room, 1)
  assert.ok(result)
  assert.equal(result.winners[0].username, 'p0')
  assert.equal(getActivePlayers(room).length, 1)
})

test('resetHandAfterShowdown removes leavers and fixes dealer/seat indexes', () => {
  const room = makeRoom([1000, 1000, 1000])
  dealNewHand(room)
  room.dealerIndex = 1
  room.players[0].left = true
  resetHandAfterShowdown(room)
  assert.equal(room.players.length, 2)
  assert.equal(room.players[room.dealerIndex].username, 'p1')
  assert.deepEqual(room.players.map((p) => p.seatIndex), [0, 1])
  assert.equal(room.status, 'lobby')
  assert.equal(room.gameStage, 'waiting')
})

test('advanceStage from river triggers showdown', () => {
  const room = makeRoom([1000, 1000])
  dealNewHand(room)
  room.gameStage = 'river'
  room.communityCards = ['2C', '7S', '9H', 'JD', '3C']
  const r = advanceStage(room)
  assert.ok(r)
  assert.equal(room.status, 'showdown')
})
