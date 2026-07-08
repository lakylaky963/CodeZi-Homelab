import { createDeck, STARTING_CHIPS } from './cardUtils.js'
import { evaluateHand } from './handEvaluator.js'

export const touchActivity = (room) => {
  room.lastActivityAt = new Date()
}

export const getActivePlayers = (room) => room.players.filter((p) => !p.folded)

export const getPlayersWhoCanAct = (room) =>
  room.players.filter((p) => !p.folded && !p.allIn && p.chips > 0)

export const findNextActivePlayer = (room, fromIndex) => {
  const n = room.players.length
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n
    const p = room.players[idx]
    if (!p.folded && !p.allIn) return idx
  }
  return -1
}

export const isBettingRoundComplete = (room) => {
  const canAct = getPlayersWhoCanAct(room)
  if (canAct.length === 0) return true
  return canAct.every((p) => p.hasActedThisRound && p.lastBet === room.currentBet)
}

const postBlind = (room, playerIndex, amount, label) => {
  const player = room.players[playerIndex]
  const paid = Math.min(player.chips, amount)
  player.chips -= paid
  player.lastBet = paid
  room.pot += paid
  player.lastAction = label
  if (player.chips === 0) player.allIn = true
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
    p.allIn = false
    p.lastBet = 0
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
  room.currentBet = bbPaid

  room.players.forEach((p) => {
    p.hasActedThisRound = false
  })

  room.currentTurn = findNextActivePlayer(room, bbIndex)
  touchActivity(room)
}

export const resolveShowdown = (room) => {
  const activePlayers = getActivePlayers(room)
  if (activePlayers.length === 0) {
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

  const evaluated = activePlayers.map((p) => ({
    player: p,
    ...evaluateHand(p.cards, room.communityCards),
  }))

  const bestScore = Math.min(...evaluated.map((e) => e.score))
  const winners = evaluated.filter((e) => e.score === bestScore)
  const potAwarded = room.pot
  const share = Math.floor(potAwarded / winners.length)
  let remainder = potAwarded % winners.length
  const winnerResults = []

  winners.forEach((w) => {
    const award = share + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder -= 1
    w.player.chips += award
    w.player.lastAction = `Wins $${award} (${w.description})`
    winnerResults.push({
      username: w.player.username,
      hand: w.description,
      amount: award,
    })
  })

  room.pot = 0

  return {
    winners: winnerResults,
    potAwarded,
  }
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

export const resetHandAfterShowdown = (room) => {
  room.gameStage = 'waiting'
  room.status = 'lobby'
  room.communityCards = []
  room.deck = []
  room.currentBet = 0
  room.playersActedThisRound = 0

  room.players.forEach((p) => {
    p.cards = []
    p.folded = false
    p.allIn = false
    p.lastBet = 0
    p.lastAction = ''
    p.hasActedThisRound = false
  })

  touchActivity(room)
}

export const applyPlayerAction = (room, playerIndex, action, amount = 20) => {
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
      player.hasActedThisRound = true
    } else {
      if (player.chips < callAmount) throw new Error('Insufficient chips')
      player.chips -= callAmount
      room.pot += callAmount
      player.lastBet = room.currentBet
      player.lastAction = `Call $${callAmount}`
      player.hasActedThisRound = true
      if (player.chips === 0) player.allIn = true
    }
  } else if (action === 'raise') {
    const raiseTotal = room.currentBet + amount
    const addition = raiseTotal - player.lastBet
    if (addition <= 0) throw new Error('Raise must exceed current bet')
    if (player.chips < addition) throw new Error('Insufficient chips')
    player.chips -= addition
    room.pot += addition
    room.currentBet = raiseTotal
    player.lastBet = raiseTotal
    player.lastAction = `Raise to $${raiseTotal}`
    player.hasActedThisRound = true
    if (player.chips === 0) player.allIn = true

    room.players.forEach((p, idx) => {
      if (idx !== playerIndex && !p.folded && !p.allIn) {
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

  if (activePlayers.length === 1) {
    room.gameStage = 'showdown'
    room.status = 'showdown'
    return resolveShowdown(room)
  }

  if (isBettingRoundComplete(room)) {
    const canAct = getPlayersWhoCanAct(room)
    if (canAct.length === 0 && activePlayers.length > 1) {
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
  if (nextTurn === -1 && activePlayers.length > 1) {
    return runOutBoard(room)
  }
  room.currentTurn = nextTurn
  return null
}
