import { createDeck, STARTING_CHIPS } from './cardUtils.js'
import { evaluateHand } from './handEvaluator.js'

export const touchActivity = (room) => {
  room.lastActivityAt = new Date()
}

// Still in the hand (not folded, not left).
export const getActivePlayers = (room) => room.players.filter((p) => !p.folded && !p.left)

// Still able to bet (in the hand, not all-in, has chips).
export const getPlayersWhoCanAct = (room) =>
  room.players.filter((p) => !p.folded && !p.left && !p.allIn && p.chips > 0)

export const findNextActivePlayer = (room, fromIndex) => {
  const n = room.players.length
  for (let i = 1; i <= n; i++) {
    const idx = (((fromIndex + i) % n) + n) % n
    const p = room.players[idx]
    if (!p.folded && !p.left && !p.allIn && p.chips > 0) return idx
  }
  return -1
}

export const isBettingRoundComplete = (room) => {
  const canAct = getPlayersWhoCanAct(room)
  if (canAct.length === 0) return true
  return canAct.every((p) => p.hasActedThisRound && p.lastBet === room.currentBet)
}

// Moves chips from a player into the pot and keeps per-street and per-hand totals in sync.
const commit = (room, player, amount) => {
  const paid = Math.max(0, Math.min(player.chips, amount))
  player.chips -= paid
  player.lastBet += paid
  player.totalBet = (player.totalBet || 0) + paid
  room.pot += paid
  if (player.chips === 0) player.allIn = true
  return paid
}

const postBlind = (room, playerIndex, amount, label) => {
  const player = room.players[playerIndex]
  const paid = commit(room, player, amount)
  player.lastAction = label
  return paid
}

export const dealNewHand = (room) => {
  const n = room.players.length
  room.deck = createDeck()
  room.gameStage = 'preflop'
  room.status = 'in_hand'
  room.communityCards = []
  room.pot = 0
  room.currentBet = 0
  room.playersActedThisRound = 0

  room.players.forEach((p) => {
    p.cards = []
    p.folded = false
    p.left = false
    p.allIn = false
    p.lastBet = 0
    p.totalBet = 0
    p.lastAction = ''
    p.hasActedThisRound = false
    if (p.chips <= 0) p.chips = STARTING_CHIPS
  })

  room.dealerIndex = room.dealerIndex < 0 ? 0 : (room.dealerIndex + 1) % n
  const sbIndex = n === 2 ? room.dealerIndex : (room.dealerIndex + 1) % n
  const bbIndex = n === 2 ? (room.dealerIndex + 1) % n : (room.dealerIndex + 2) % n

  room.players.forEach((p) => {
    p.cards = [room.deck.pop(), room.deck.pop()]
  })

  postBlind(room, sbIndex, room.smallBlind, `SB $${room.smallBlind}`)
  const bbPaid = postBlind(room, bbIndex, room.bigBlind, `BB $${room.bigBlind}`)
  room.currentBet = Math.max(bbPaid, room.players[sbIndex].lastBet)

  room.players.forEach((p) => {
    p.hasActedThisRound = false
  })

  room.currentTurn = findNextActivePlayer(room, bbIndex)
  touchActivity(room)
}

// Splits the pot into a main pot and side pots by how much each player put in,
// so an all-in player can only win from others what they themselves matched.
const buildPots = (room) => {
  const contenders = getActivePlayers(room)
  const levels = [...new Set(contenders.map((p) => p.totalBet || 0))].filter((v) => v > 0).sort((a, b) => a - b)
  const pots = []
  let previous = 0
  levels.forEach((level) => {
    const amount = room.players.reduce((sum, p) => sum + Math.max(0, Math.min(p.totalBet || 0, level) - previous), 0)
    const eligible = contenders.filter((p) => (p.totalBet || 0) >= level)
    if (amount > 0) pots.push({ amount, eligible })
    previous = level
  })
  // Anything not covered (e.g. legacy hands without totalBet) goes to the last pot.
  const covered = pots.reduce((sum, pot) => sum + pot.amount, 0)
  if (room.pot > covered) {
    if (pots.length) pots[pots.length - 1].amount += room.pot - covered
    else pots.push({ amount: room.pot, eligible: contenders })
  }
  return pots
}

export const resolveShowdown = (room) => {
  const activePlayers = getActivePlayers(room)
  if (activePlayers.length === 0) {
    room.pot = 0
    return { winners: [], potAwarded: 0 }
  }

  if (activePlayers.length === 1) {
    const winner = activePlayers[0]
    const potAwarded = room.pot
    winner.chips += potAwarded
    winner.lastAction = `Wins $${potAwarded}`
    room.pot = 0
    return {
      winners: [{ username: winner.username, hand: 'Last player standing', amount: potAwarded }],
      potAwarded,
    }
  }

  const scores = new Map(activePlayers.map((p) => [p, evaluateHand(p.cards, room.communityCards)]))
  const totals = new Map()
  const potAwarded = room.pot

  buildPots(room).forEach((pot) => {
    const best = Math.min(...pot.eligible.map((p) => scores.get(p).score))
    const potWinners = pot.eligible.filter((p) => scores.get(p).score === best)
    const share = Math.floor(pot.amount / potWinners.length)
    let remainder = pot.amount % potWinners.length
    potWinners.forEach((p) => {
      const award = share + (remainder > 0 ? 1 : 0)
      if (remainder > 0) remainder -= 1
      p.chips += award
      totals.set(p, (totals.get(p) || 0) + award)
    })
  })

  const winnerResults = [...totals.entries()].map(([p, amount]) => {
    const { description } = scores.get(p)
    p.lastAction = `Wins $${amount} (${description})`
    return { username: p.username, hand: description, amount }
  })

  room.pot = 0
  return { winners: winnerResults, potAwarded }
}

export const advanceStage = (room) => {
  if (room.gameStage === 'river') {
    room.gameStage = 'showdown'
    room.status = 'showdown'
    return resolveShowdown(room)
  }

  const stages = ['preflop', 'flop', 'turn', 'river']
  const currentIndex = stages.indexOf(room.gameStage)
  room.gameStage = stages[currentIndex + 1]
  room.playersActedThisRound = 0
  room.currentBet = 0

  room.players.forEach((p) => {
    p.lastBet = 0
    p.hasActedThisRound = false
  })

  if (room.gameStage === 'flop') {
    room.communityCards.push(room.deck.pop(), room.deck.pop(), room.deck.pop())
  } else if (room.gameStage === 'turn' || room.gameStage === 'river') {
    room.communityCards.push(room.deck.pop())
  }

  room.currentTurn = findNextActivePlayer(room, room.dealerIndex)
  touchActivity(room)
  return null
}

// After a hand: drop players who left, keep the dealer button on the right seat.
export const resetHandAfterShowdown = (room) => {
  const dealer = room.players[room.dealerIndex]
  const staying = room.players.filter((p) => !p.left)
  // Find the dealer's new seat before reassigning (Mongoose re-wraps the array items).
  const dealerStillHere = dealer ? staying.indexOf(dealer) : -1
  room.players = staying
  room.dealerIndex = dealerStillHere >= 0 ? dealerStillHere : Math.min(room.dealerIndex, room.players.length) - 1
  room.players.forEach((p, i) => { p.seatIndex = i })

  room.gameStage = 'waiting'
  room.status = 'lobby'
  room.communityCards = []
  room.deck = []
  room.currentBet = 0
  room.playersActedThisRound = 0
  room.currentTurn = 0

  room.players.forEach((p) => {
    p.cards = []
    p.folded = false
    p.allIn = false
    p.lastBet = 0
    p.totalBet = 0
    p.lastAction = ''
    p.hasActedThisRound = false
  })

  touchActivity(room)
}

// amount = how much to raise BY (on top of the current bet). Sent by the browser, so validated here.
export const applyPlayerAction = (room, playerIndex, action, amount) => {
  const player = room.players[playerIndex]

  if (action === 'fold') {
    player.folded = true
    player.lastAction = 'Fold'
    player.hasActedThisRound = true
  } else if (action === 'check') {
    if (room.currentBet > player.lastBet) {
      throw new Error('Cannot check — must call or fold')
    }
    player.lastAction = 'Check'
    player.hasActedThisRound = true
  } else if (action === 'call') {
    const callAmount = room.currentBet - player.lastBet
    if (callAmount <= 0) {
      player.lastAction = 'Check'
    } else {
      const paid = commit(room, player, callAmount) // short stack: calls all-in
      player.lastAction = player.allIn ? `All-in $${paid}` : `Call $${paid}`
    }
    player.hasActedThisRound = true
  } else if (action === 'raise') {
    const raiseBy = Math.floor(Number(amount))
    const minRaise = room.bigBlind || 20
    if (!Number.isFinite(raiseBy) || raiseBy <= 0) throw new Error('Enter a raise amount')
    const wanted = room.currentBet + raiseBy
    const maxTotal = player.lastBet + player.chips
    if (wanted > maxTotal) {
      // Not enough for that raise: go all-in instead.
      if (maxTotal <= room.currentBet) {
        const paid = commit(room, player, player.chips)
        player.lastAction = `All-in $${paid}`
        player.hasActedThisRound = true
        touchActivity(room)
        return
      }
    } else if (raiseBy < minRaise) {
      throw new Error(`Minimum raise is $${minRaise}`)
    }
    const raiseTotal = Math.min(wanted, maxTotal)
    commit(room, player, raiseTotal - player.lastBet)
    room.currentBet = raiseTotal
    player.lastAction = player.allIn ? `All-in $${raiseTotal}` : `Raise to $${raiseTotal}`
    player.hasActedThisRound = true

    room.players.forEach((p, idx) => {
      if (idx !== playerIndex && !p.folded && !p.left && !p.allIn) {
        p.hasActedThisRound = false
      }
    })
  } else {
    throw new Error(`Unknown action: ${action}`)
  }

  touchActivity(room)
}

export const runOutBoard = (room) => {
  while (room.gameStage !== 'showdown') {
    const result = advanceStage(room)
    if (result) return result
  }
  return resolveShowdown(room)
}

export const processAfterAction = (room) => {
  const activePlayers = getActivePlayers(room)

  if (activePlayers.length <= 1) {
    room.gameStage = 'showdown'
    room.status = 'showdown'
    return resolveShowdown(room)
  }

  if (isBettingRoundComplete(room)) {
    // Nobody (or only one player) can still bet: deal the rest of the board.
    if (getPlayersWhoCanAct(room).length <= 1) {
      return runOutBoard(room)
    }

    if (room.gameStage === 'preflop' || room.gameStage === 'flop' || room.gameStage === 'turn') {
      advanceStage(room)
      return null
    }
    if (room.gameStage === 'river') {
      room.gameStage = 'showdown'
      room.status = 'showdown'
      return resolveShowdown(room)
    }
  }

  const nextTurn = findNextActivePlayer(room, room.currentTurn)
  if (nextTurn === -1) {
    return runOutBoard(room)
  }
  room.currentTurn = nextTurn
  return null
}

// A player leaves or disconnects mid-hand: fold them out instead of deleting their seat,
// so turn order, the dealer button and their chips in the pot stay correct.
export const markPlayerLeft = (room, playerIndex) => {
  const player = room.players[playerIndex]
  player.left = true
  player.folded = true
  player.lastAction = 'Left'
  if (playerIndex !== room.currentTurn) {
    // Someone else's turn: only finish early if this leaves one player in the hand.
    return getActivePlayers(room).length <= 1 ? processAfterAction(room) : null
  }
  return processAfterAction(room)
}
