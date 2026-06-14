/**
 * Poker Room Socket Handler - Game State Machine
 */

const rooms = {};

// Helper: Generate and shuffle a 52-card deck
const createDeck = () => {
  const suits = ['H', 'D', 'C', 'S'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const s of suits) {
    for (const v of values) deck.push(`${v}${s}`);
  }
  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const getSanitizedState = (roomName, viewerSocketId) => {
  const room = rooms[roomName];
  if (!room) return null;
  return {
    ...room,
    deck: undefined, // Never leak the remaining deck
    players: room.players.map((p) => ({
      ...p,
      cards: (p.socketId === viewerSocketId || room.gameStage === 'showdown') 
        ? p.cards 
        : p.cards.map(() => 'hidden'),
    })),
  };
};

const broadcastGameState = (io, roomName) => {
  const room = rooms[roomName];
  if (!room) return;
  room.players.forEach((player) => {
    const sanitized = getSanitizedState(roomName, player.socketId);
    io.to(player.socketId).emit('pokerGameStateUpdated', sanitized);
  });
};

const advanceStage = (room) => {
  const stages = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIndex = stages.indexOf(room.gameStage);
  room.gameStage = stages[currentIndex + 1];
  room.currentTurn = 0; // Reset turn to first player for next stage
  room.playersActedThisRound = 0;

  if (room.gameStage === 'flop') {
    room.communityCards.push(...[room.deck.pop(), room.deck.pop(), room.deck.pop()]);
  } else if (room.gameStage === 'turn' || room.gameStage === 'river') {
    room.communityCards.push(room.deck.pop());
  }
};

export default (io, socket) => {
  socket.on('joinRoom', ({ room, username }) => {
    socket.join(room);
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        pot: 0,
        currentTurn: 0,
        communityCards: [],
        gameStage: 'waiting',
        currentBet: 0,
        playersActedThisRound: 0,
      };
    }

    const exists = rooms[room].players.find((p) => p.socketId === socket.id);
    if (!exists) {
      rooms[room].players.push({
        socketId: socket.id,
        username: username || `Guest_${socket.id.substring(0, 4)}`,
        chips: 1000,
        cards: [],
        folded: false,
        lastAction: ''
      });
    }
    broadcastGameState(io, room);
  });

  socket.on('startGame', ({ room }) => {
    const roomState = rooms[room];
    if (!roomState || roomState.players.length < 2) return;

    roomState.deck = createDeck();
    roomState.gameStage = 'preflop';
    roomState.communityCards = [];
    roomState.pot = 0;
    roomState.currentBet = 0;
    roomState.currentTurn = 0;
    roomState.playersActedThisRound = 0;

    roomState.players.forEach(p => {
      p.cards = [roomState.deck.pop(), roomState.deck.pop()];
      p.folded = false;
      p.lastAction = '';
    });

    console.log(`[Poker] Game started in room: ${room}`);
    broadcastGameState(io, room);
  });

  socket.on('playerAction', ({ room, action, amount = 0 }) => {
    const roomState = rooms[room];
    if (!roomState || roomState.gameStage === 'showdown') return;

    const playerIndex = roomState.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex !== roomState.currentTurn) {
      return socket.emit('error', 'It is not your turn');
    }

    const player = roomState.players[playerIndex];

    // 1. Process Actions
    if (action === 'fold') {
      player.folded = true;
      player.lastAction = 'Fold';
    } else if (action === 'call') {
      const callAmount = roomState.currentBet;
      player.chips -= callAmount;
      roomState.pot += callAmount;
      player.lastAction = 'Call';
    } else if (action === 'raise') {
      const raiseTotal = amount; 
      const addition = raiseTotal - (player.lastBet || 0);
      player.chips -= addition;
      roomState.pot += addition;
      roomState.currentBet = raiseTotal;
      player.lastAction = `Raise to ${amount}`;
    }

    // 2. Advance Logic
    roomState.playersActedThisRound++;
    const activePlayers = roomState.players.filter(p => !p.folded);
    
    // Check if round is over
    if (roomState.playersActedThisRound >= activePlayers.length) {
      if (roomState.gameStage === 'river') {
        roomState.gameStage = 'showdown';
      } else {
        advanceStage(roomState);
      }
    } else {
      // Find next active player
      let nextTurn = (roomState.currentTurn + 1) % roomState.players.length;
      while (roomState.players[nextTurn].folded) {
        nextTurn = (nextTurn + 1) % roomState.players.length;
      }
      roomState.currentTurn = nextTurn;
    }

    broadcastGameState(io, room);
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (rooms[room]) {
        rooms[room].players = rooms[room].players.filter((p) => p.socketId !== socket.id);
        if (rooms[room].players.length === 0) {
          delete rooms[room];
        } else {
          // If it was their turn, advance it
          if (rooms[room].currentTurn >= rooms[room].players.length) {
            rooms[room].currentTurn = 0;
          }
          broadcastGameState(io, room);
        }
      }
    }
  });
};