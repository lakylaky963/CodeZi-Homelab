import GameRoom from '../models/gameRoom.model.js'

const DEFAULT_IDLE_MS = 30 * 60 * 1000
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

export const sweepRoom = async (io, roomName, reason = 'session_ended') => {
  console.log(`🧹 [Sweeper] Pruning session "${roomName}" (${reason})`)
  await GameRoom.deleteOne({ roomName })
  if (io) {
    io.to(roomName).emit('sessionEnded', { roomName, reason })
  }
}

export const sweepStaleSessions = async (io, maxIdleMs = DEFAULT_IDLE_MS) => {
  const cutoff = new Date(Date.now() - maxIdleMs)

  const staleRooms = await GameRoom.find({
    lastActivityAt: { $lt: cutoff },
    $or: [
      { players: { $size: 0 } },
      { status: 'lobby', gameStage: 'waiting' },
    ],
  }).lean()

  for (const room of staleRooms) {
    await sweepRoom(io, room.roomName, 'idle_timeout')
  }

  if (staleRooms.length > 0) {
    console.log(`🧹 [Sweeper] Removed ${staleRooms.length} stale session(s)`)
  }
}

export const startSessionSweeper = (io) => {
  const maxIdleMs = Number(process.env.SESSION_IDLE_MS) || DEFAULT_IDLE_MS

  const run = () => {
    sweepStaleSessions(io, maxIdleMs).catch((err) => {
      console.error('[Sweeper] Failed to sweep stale sessions:', err)
    })
  }

  run()
  const interval = setInterval(run, SWEEP_INTERVAL_MS)
  console.log(`🧹 [Sweeper] Active (interval ${SWEEP_INTERVAL_MS / 1000}s, idle ${maxIdleMs / 1000}s)`)

  return () => clearInterval(interval)
}

export default startSessionSweeper
