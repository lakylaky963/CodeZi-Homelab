/**
 * Poker Room Socket Handler - Game State Machine
 */
const rooms = {};

const createDeck = () => {
  const suits = ['H', 'D', 'C', 'S'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  for (const s of suits) {
    for (const v of values) deck.push(`${v}${s}`);
  }
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
    deck: undefined,
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
  
  if (room.gameStage === 'river') {
    room.gameStage = 'showdown';
    determineWinner(room);
  } else {
    room.gameStage = stages[currentIndex + 1];
    room.playersActedThisRound = 0;
    room.currentTurn = room.players.findIndex(p => !p.folded); // Simple turn reset

    if (room.gameStage === 'flop') {
      room.communityCards.push(room.deck.pop(), room.deck.pop(), room.deck.pop());
    } else if (room.gameStage === 'turn' || room.gameStage === 'river') {
      room.communityCards.push(room.deck.pop());
    }
  }
};

const determineWinner = (room) => {
  const activePlayers = room.players.filter(p => !p.folded);
  if (activePlayers.length === 0) return;
  
  // Simplified logic: pot split among remaining active players for this MVP handler
  // In production, integrate 'pokersolver' or similar library here.
  const share = Math.floor(room.pot / activePlayers.length);
  activePlayers.forEach(p => {
    p.chips += share;
    p.lastAction = `Winner! (+${share})`;
  });
  room.pot = 0;
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
        lastAction: '',
        lastBet: 0
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
      p.lastBet = 0;
    });

    broadcastGameState(io, room);
  });

  socket.on('playerAction', ({ room, action, amount = 0 }) => {
    const roomState = rooms[room];
    if (!roomState || roomState.gameStage === 'showdown' || roomState.gameStage === 'waiting') return;

    const playerIndex = roomState.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex !== roomState.currentTurn) {
      return socket.emit('error', 'It is not your turn');
    }

    const player = roomState.players[playerIndex];

    // 1. Process Logic
    if (action === 'fold') {
      player.folded = true;
      player.lastAction = 'Fold';
    } else if (action === 'call') {
      const callAmount = roomState.currentBet - player.lastBet;
      if (player.chips < callAmount) return socket.emit('error', 'Insufficient chips');
      player.chips -= callAmount;
      roomState.pot += callAmount;
      player.lastBet = roomState.currentBet;
      player.lastAction = 'Call';
    } else if (action === 'raise') {
      const raiseTotal = amount; 
      if (raiseTotal <= roomState.currentBet) return socket.emit('error', 'Raise must be higher than current bet');
      const addition = raiseTotal - player.lastBet;
      if (player.chips < addition) return socket.emit('error', 'Insufficient chips');
      player.chips -= addition;
      roomState.pot += addition;
      roomState.currentBet = raiseTotal;
      player.lastBet = raiseTotal;
      player.lastAction = `Raise to ${amount}`;
      // When someone raises, we reset playersActedThisRound because others must now match it
      roomState.playersActedThisRound = 0; 
    }

    // 2. Game Flow Logic
    roomState.playersActedThisRound++;
    const activePlayers = roomState.players.filter(p => !p.folded);
    
    // Win by default if everyone else folded
    if (activePlayers.length === 1) {
      roomState.gameStage = 'showdown';
      determineWinner(roomState);
      broadcastGameState(io, room);
      return;
    }

    // Check if round is over
    if (roomState.playersActedThisRound >= activePlayers.length) {
      advanceStage(roomState);
      roomState.players.forEach(p => p.lastBet = 0); // Reset round betting
      roomState.currentBet = 0;
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
          // Ensure turn doesn't point to an out-of-bounds index after removal
          if (rooms[room].currentTurn >= rooms[room].players.length) {
            rooms[room].currentTurn = 0;
          }
          broadcastGameState(io, room);
        }
      }
    }
  });
};