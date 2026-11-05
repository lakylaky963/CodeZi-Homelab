import { model, Schema, SchemaTypes } from 'mongoose'
import { randomUUID } from 'crypto'

const PlayerSchema = new Schema({
  socketId: {
    type: SchemaTypes.String,
    required: true,
  },
  username: {
    type: SchemaTypes.String,
    required: true,
  },
  seatIndex: {
    type: SchemaTypes.Number,
    default: 0,
  },
  chips: {
    type: SchemaTypes.Number,
    default: 1000,
  },
  cards: [{
    type: SchemaTypes.String,
  }],
  folded: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  allIn: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  lastAction: {
    type: SchemaTypes.String,
    default: '',
  },
  lastBet: {
    type: SchemaTypes.Number,
    default: 0,
  },
  hasActedThisRound: {
    type: SchemaTypes.Boolean,
    default: false,
  },
  // chips this player has put into the pot during the current hand (for side pots)
  totalBet: {
    type: SchemaTypes.Number,
    default: 0,
  },
  // left or disconnected mid-hand: treated as folded, removed when the hand ends
  left: {
    type: SchemaTypes.Boolean,
    default: false,
  },
}, { _id: false })

const GameRoomSchema = new Schema({
  roomName: {
    type: SchemaTypes.String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: SchemaTypes.String,
    required: true,
    default: () => randomUUID(),
  },
  status: {
    type: SchemaTypes.String,
    enum: ['lobby', 'in_hand', 'showdown', 'closed'],
    default: 'lobby',
  },
  players: [PlayerSchema],
  pot: {
    type: SchemaTypes.Number,
    default: 0,
  },
  dealerIndex: {
    type: SchemaTypes.Number,
    default: -1,
  },
  smallBlind: {
    type: SchemaTypes.Number,
    default: 10,
  },
  bigBlind: {
    type: SchemaTypes.Number,
    default: 20,
  },
  currentTurn: {
    type: SchemaTypes.Number,
    default: 0,
  },
  communityCards: [{
    type: SchemaTypes.String,
  }],
  gameStage: {
    type: SchemaTypes.String,
    default: 'waiting',
  },
  currentBet: {
    type: SchemaTypes.Number,
    default: 0,
  },
  playersActedThisRound: {
    type: SchemaTypes.Number,
    default: 0,
  },
  deck: [{
    type: SchemaTypes.String,
  }],
  lastActivityAt: {
    type: SchemaTypes.Date,
    default: Date.now,
  },
}, {
  timestamps: true,
})

GameRoomSchema.index({ lastActivityAt: 1 })
GameRoomSchema.index({ status: 1, lastActivityAt: 1 })

const GameRoom = model('gameroom', GameRoomSchema)

export default GameRoom
