/**
 * Poker Room Socket Handler
 * Manages real-time game state transitions and room logic.
 */

// In-memory store for game rooms
const rooms = {};

/**
 * Sanitizes the game state for a specific socket.
 * Prevents players from seeing each other's hole cards.
 */
const getSanitizedState = (roomName, viewerSocketId) => {
  const room = rooms[roomName];
  if (!room) return null;

  return {
    ...room,
    players: room.players.map((p) => ({
      socketId: p.socketId,
      username: p.username,
      chips: p.chips,
      // Only show cards if it's the viewer's own hand or stage is 'showdown'
      cards: (p.socketId === viewerSocketId || room.gameStage === 'showdown') 
        ? p.cards 
        : p.cards.map(() => 'hidden'), // Represent cards as hidden markers
    })),
  };
};

/**
 * Individualized broadcast: Sends a customized (sanitized) state to each player.
 */
const broadcastGameState = (io, roomName) => {
  const room = rooms[roomName];
  if (!room) return;

  room.players.forEach((player) => {
    const sanitized = getSanitizedState(roomName, player.socketId);
    io.to(player.socketId).emit('pokerGameStateUpdated', sanitized);
  });
};

export default (io, socket) => {
  // 1. Join Room Logic
  socket.on('joinRoom', ({ room, username }) => {
    socket.join(room);
    console.log(`[Poker] Socket ${socket.id} (${username}) joined room: ${room}`);

    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        pot: 0,
        currentTurn: 0,
        communityCards: [],
        gameStage: 'preflop',
      };
    }

    // Add new player if they aren't already in the state
    const exists = rooms[room].players.find((p) => p.socketId === socket.id);
    if (!exists) {
      rooms[room].players.push({
        socketId: socket.id,
        username: username || `Guest_${socket.id.substring(0, 4)}`,
        chips: 1000,
        cards: [], // In the next step, we'll implement a dealer to fill this
      });
    }

    broadcastGameState(io, room);
  });

  // 2. Action Handler (Fold, Call, Raise)
  socket.on('playerAction', ({ room, action, amount = 0 }) => {
    const roomState = rooms[room];
    if (!roomState) return;

    console.log(`[Poker] Action: ${action} from ${socket.id} in ${room}`);
    
    // Logic for updating pot, turn, and stage transitions will go here.
    // For now, we simply update and sync.
    broadcastGameState(io, room);
  });

  // 3. Cleanup on Disconnect
  socket.on('disconnecting', () => {
    // Automatically remove player from any rooms they were in
    for (const room of socket.rooms) {
      if (rooms[room]) {
        rooms[room].players = rooms[room].players.filter((p) => p.socketId !== socket.id);
        if (rooms[room].players.length === 0) {
          delete rooms[room];
        } else {
          broadcastGameState(io, room);
        }
      }
    }
  });
};