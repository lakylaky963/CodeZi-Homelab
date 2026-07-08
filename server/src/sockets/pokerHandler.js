import GameRoom from '../models/gameRoom.model.js'
import { STARTING_CHIPS } from '../services/poker/cardUtils.js'
import {
  dealNewHand,
  applyPlayerAction,
  processAfterAction,
  resetHandAfterShowdown,
  touchActivity,
} from '../services/poker/gameLogic.js'
import { sweepRoom } from '../services/sessionSweeper.js'

const getSanitizedState = (roomDoc, viewerSocketId) => {
  const room = roomDoc.toObject ? roomDoc.toObject() : JSON.parse(JSON.stringify(roomDoc))
  const showCards = room.gameStage === 'showdown'

  return {
    roomName: room.roomName,
    sessionId: room.sessionId,
    status: room.status,
    stage: room.gameStage,
    gameStage: room.gameStage,
    pot: room.pot,
    currentBet: room.currentBet,
    currentTurn: room.currentTurn,
    dealerIndex: room.dealerIndex,
    smallBlind: room.smallBlind,
    bigBlind: room.bigBlind,
    communityCards: room.communityCards,
    players: room.players.map((p, index) => ({
      socketId: p.socketId,
      id: p.socketId,
      username: p.username,
      name: p.username,
      seatIndex: p.seatIndex ?? index,
      chips: p.chips,
      folded: p.folded,
      allIn: p.allIn,
      lastAction: p.lastAction,
      lastBet: p.lastBet,
      isDealer: index === room.dealerIndex,
      isCurrentTurn: index === room.currentTurn,
      cards: (p.socketId === viewerSocketId || showCards)
        ? p.cards
        : p.cards.map(() => 'hidden'),
    })),
  }
}

const broadcastGameState = (io, roomDoc) => {
  if (!roomDoc) return
  roomDoc.players.forEach((player) => {
    const sanitized = getSanitizedState(roomDoc, player.socketId)
    io.to(player.socketId).emit('pokerGameStateUpdated', sanitized)
    io.to(player.socketId).emit('gameStateUpdated', sanitized)
  })
}

const emitShowdownAndReset = async (io, roomDoc, roomName, results) => {
  io.to(roomName).emit('showdownResults', results)
  resetHandAfterShowdown(roomDoc)
  await roomDoc.save()
  broadcastGameState(io, roomDoc)
}

const resolveRoomName = (data) => data?.room || data?.roomId

export default (io, socket) => {
  socket.on('joinRoom', async (data) => {
    const room = resolveRoomName(data)
    const username = (data?.username || data?.playerName || '').trim()

    if (!room) {
      return socket.emit('error', 'Room name or ID is required')
    }
    if (!username) {
      return socket.emit('error', 'Username is required')
    }

    socket.join(room)
    console.log(`[Poker] Socket ${socket.id} (${username}) joined room: ${room}`)

    try {
      let roomDoc = await GameRoom.findOne({ roomName: room })

      if (roomDoc?.status === 'in_hand') {
        return socket.emit('error', 'Hand in progress — wait for the round to finish')
      }

      if (!roomDoc) {
        roomDoc = new GameRoom({
          roomName: room,
          players: [],
          pot: 0,
          currentTurn: 0,
          communityCards: [],
          gameStage: 'waiting',
          status: 'lobby',
          currentBet: 0,
          playersActedThisRound: 0,
          deck: [],
          dealerIndex: -1,
        })
      }

      const nameTaken = roomDoc.players.some(
        (p) => p.username.toLowerCase() === username.toLowerCase() && p.socketId !== socket.id,
      )
      if (nameTaken) {
        return socket.emit('error', 'Username already taken in this room')
      }

      const exists = roomDoc.players.find((p) => p.socketId === socket.id)
      if (!exists) {
        roomDoc.players.push({
          socketId: socket.id,
          username,
          seatIndex: roomDoc.players.length,
          chips: STARTING_CHIPS,
          cards: [],
          folded: false,
          allIn: false,
          lastAction: '',
          lastBet: 0,
          hasActedThisRound: false,
        })
      } else {
        exists.username = username
      }

      touchActivity(roomDoc)
      await roomDoc.save()
      broadcastGameState(io, roomDoc)
    } catch (err) {
      console.error(`[Poker] Error in joinRoom for socket ${socket.id}:`, err)
      socket.emit('error', 'Failed to join game session')
    }
  })

  socket.on('leaveRoom', async (data) => {
    const room = resolveRoomName(data)
    if (!room) return

    try {
      const roomDoc = await GameRoom.findOne({ roomName: room })
      if (!roomDoc) return

      roomDoc.players = roomDoc.players.filter((p) => p.socketId !== socket.id)
      socket.leave(room)

      if (roomDoc.players.length === 0) {
        await sweepRoom(io, room, 'all_players_left')
      } else {
        if (roomDoc.currentTurn >= roomDoc.players.length) {
          roomDoc.currentTurn = 0
        }
        touchActivity(roomDoc)
        await roomDoc.save()
        broadcastGameState(io, roomDoc)
      }
    } catch (err) {
      console.error(`[Poker] Error in leaveRoom for socket ${socket.id}:`, err)
    }
  })

  socket.on('startGame', async (data) => {
    const room = typeof data === 'string' ? data : resolveRoomName(data)
    if (!room) {
      return socket.emit('error', 'Room ID is required')
    }

    try {
      const roomDoc = await GameRoom.findOne({ roomName: room })
      if (!roomDoc || roomDoc.players.length < 2) {
        return socket.emit('error', 'Cannot start game with less than 2 players')
      }
      if (roomDoc.gameStage !== 'waiting' && roomDoc.status !== 'lobby') {
        return socket.emit('error', 'A hand is already in progress')
      }

      dealNewHand(roomDoc)

      roomDoc.players.forEach((p) => {
        io.to(p.socketId).emit('receiveCards', p.cards)
      })

      await roomDoc.save()
      broadcastGameState(io, roomDoc)
    } catch (err) {
      console.error(`[Poker] Error in startGame for room ${room}:`, err)
      socket.emit('error', 'Failed to start game session')
    }
  })

  socket.on('playerAction', async (data) => {
    const room = resolveRoomName(data)
    const action = data?.action

    if (!room || !action) return

    try {
      const roomDoc = await GameRoom.findOne({ roomName: room })
      if (!roomDoc || roomDoc.gameStage === 'waiting') {
        return socket.emit('error', 'No active hand')
      }

      const playerIndex = roomDoc.players.findIndex((p) => p.socketId === socket.id)
      if (playerIndex === -1) {
        return socket.emit('error', 'You are not in this room')
      }
      if (playerIndex !== roomDoc.currentTurn) {
        return socket.emit('error', 'It is not your turn')
      }

      applyPlayerAction(roomDoc, playerIndex, action, data?.amount || 20)
      const results = processAfterAction(roomDoc)

      if (results) {
        await roomDoc.save()
        broadcastGameState(io, roomDoc)
        await emitShowdownAndReset(io, roomDoc, room, results)
      } else {
        await roomDoc.save()
        broadcastGameState(io, roomDoc)
      }
    } catch (err) {
      console.error(`[Poker] Error in playerAction for socket ${socket.id}:`, err)
      socket.emit('error', err.message || 'Failed to process game action')
    }
  })

  socket.on('disconnecting', async () => {
    console.log(`[Poker] Socket disconnecting: ${socket.id}`)
    for (const room of socket.rooms) {
      if (room === socket.id) continue

      try {
        const roomDoc = await GameRoom.findOne({ roomName: room })
        if (!roomDoc) continue

        roomDoc.players = roomDoc.players.filter((p) => p.socketId !== socket.id)

        if (roomDoc.players.length === 0) {
          await sweepRoom(io, room, 'all_players_left')
        } else {
          if (roomDoc.currentTurn >= roomDoc.players.length) {
            roomDoc.currentTurn = 0
          }
          touchActivity(roomDoc)
          await roomDoc.save()
          broadcastGameState(io, roomDoc)
        }
      } catch (err) {
        console.error(`[Poker] Error during disconnect cleanup for room "${room}":`, err)
      }
    }
  })
}

export { sweepRoom as pruneRoomSession }
