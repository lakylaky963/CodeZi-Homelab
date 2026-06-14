import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Initialize socket outside component to prevent multiple connections on re-render
const socket = io('http://localhost:8080');

const PokerGame = () => {
  const [gameState, setGameState] = useState(null);
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joined, setJoined] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(100);

  useEffect(() => {
    // 2. State Management: Sync with server broadcast
    socket.on('pokerGameStateUpdated', (updatedState) => {
      setGameState(updatedState);
    });

    socket.on('error', (message) => {
      alert(message);
    });

    return () => {
      socket.off('pokerGameStateUpdated');
      socket.off('error');
    };
  }, []);

  // 1. Room Form Handler
  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim() && roomName.trim()) {
      socket.emit('joinRoom', { room: roomName, username });
      setJoined(true);
    }
  };

  const handleStartGame = () => {
    socket.emit('startGame', { room: roomName });
  };

  const handleAction = (action, amount = 0) => {
    socket.emit('playerAction', { room: roomName, action, amount: parseInt(amount) });
  };

  // UI Helper: Render individual card
  const renderCard = (card) => {
    if (!card || card === 'hidden') {
      return (
        <div className="w-10 h-14 bg-gradient-to-br from-blue-800 to-indigo-900 border-2 border-white/20 rounded-md shadow-lg flex items-center justify-center">
          <div className="w-6 h-10 border border-white/10 rounded-sm"></div>
        </div>
      );
    }
    const suit = card.slice(-1);
    const val = card.slice(0, -1);
    const isRed = suit === 'H' || suit === 'D';
    const suitChar = suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'C' ? '♣' : '♠';

    return (
      <div className={`w-10 h-14 bg-white border border-gray-300 rounded-md shadow-md flex flex-col items-center justify-center font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <span className="text-xs leading-none self-start ml-1">{val}</span>
        <span className="text-lg leading-none">{suitChar}</span>
      </div>
    );
  };

  // --- Render Join Screen ---
  if (!joined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">POKER ROOM</h1>
            <p className="text-slate-400">Enter a table name to start playing</p>
          </div>
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase mb-2 ml-1">Username</label>
              <input
                type="text"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="The Gambler"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs font-bold uppercase mb-2 ml-1">Room Name</label>
              <input
                type="text"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                placeholder="High Stakes"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest">
              Join Table
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Render Game Table ---
  if (!gameState) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-mono animate-pulse">Initializing Table...</div>;

  const isMyTurn = gameState.players[gameState.currentTurn]?.socketId === socket.id;

  return (
    <div className="min-h-screen bg-emerald-950 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900 to-slate-950 p-4 md:p-8 flex flex-col text-white">
      {/* Status Bar */}
      <div className="flex justify-between items-end bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 mb-8">
        <div>
          <h2 className="text-slate-400 text-xs font-black uppercase tracking-widest">Room Name</h2>
          <p className="text-2xl font-bold">{roomName}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-emerald-500/30">
            {gameState.gameStage}
          </span>
        </div>
        <div className="text-right">
          <h2 className="text-yellow-500/60 text-xs font-black uppercase tracking-widest">Total Pot</h2>
          <p className="text-4xl font-black text-yellow-400">${gameState.pot}</p>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-12">
        {/* Community Cards */}
        <div className="flex gap-3 p-6 bg-emerald-800/40 rounded-2xl border-2 border-emerald-700/50 shadow-inner min-w-[320px] justify-center items-center">
          {gameState.communityCards.length === 0 ? (
            <p className="text-emerald-700 font-black uppercase tracking-[0.2em] text-sm">Waiting for Flop</p>
          ) : (
            gameState.communityCards.map((card, i) => <React.Fragment key={i}>{renderCard(card)}</React.Fragment>)
          )}
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {gameState.players.map((player, idx) => {
            const isCurrent = gameState.currentTurn === idx;
            const isMe = player.socketId === socket.id;
            return (
              <div key={player.socketId} className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${isCurrent ? 'bg-slate-800 border-yellow-400 scale-105 shadow-2xl z-10' : 'bg-slate-900/80 border-slate-800 opacity-90'}`}>
                {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">Thinking...</div>}
                <div className="flex justify-between items-center mb-3">
                  <span className={`font-bold truncate ${isMe ? 'text-blue-400' : 'text-white'}`}>{player.username} {isMe && "(You)"}</span>
                  {player.folded && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 uppercase">Folded</span>}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-yellow-500 font-mono font-bold">${player.chips}</span>
                  <div className="flex gap-1">
                    {player.cards.map((c, i) => <React.Fragment key={i}>{renderCard(c)}</React.Fragment>)}
                  </div>
                </div>
                {player.lastAction && <p className="text-center text-[10px] text-slate-500 italic uppercase font-bold tracking-widest">{player.lastAction}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Actions Footer */}
      <div className="mt-8 bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
        {gameState.gameStage === 'waiting' ? (
          <div className="flex flex-col items-center">
            <button onClick={handleStartGame} disabled={gameState.players.length < 2} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 font-black rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              Start Game
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-6">
            {!isMyTurn ? (
              <p className="text-slate-500 font-medium animate-pulse tracking-wide italic">Waiting for current player to act...</p>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => handleAction('fold')} className="px-8 py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 font-bold rounded-xl transition-all uppercase text-sm">Fold</button>
                <button onClick={() => handleAction('call')} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 uppercase text-sm">Call / Check</button>
                <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <span className="pl-4 text-slate-500 text-sm font-bold">$</span>
                  <input 
                    type="number" 
                    className="w-24 bg-transparent py-3 px-2 text-white font-mono outline-none" 
                    value={raiseAmount} 
                    onChange={(e) => setRaiseAmount(e.target.value)} 
                  />
                  <button onClick={() => handleAction('raise', raiseAmount)} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black px-6 py-3 uppercase text-sm transition-all">Raise</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PokerGame;