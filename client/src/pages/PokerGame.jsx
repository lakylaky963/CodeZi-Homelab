import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Icon from "../components/Icon.jsx";

const socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:8080", {
  transports: ["polling", "websocket"],
  withCredentials: true,
});

export default function PokerGame() {
  const [gameState, setGameState] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const roomId = "main-table";

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("gameStateUpdated", (state) => setGameState(state));
    socket.on("receiveCards", (cards) => setMyCards(cards));
    socket.on("showdownResults", (res) => alert(`Winner: ${res.winner} won ${res.pot} chips!`));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("gameStateUpdated");
      socket.off("receiveCards");
      socket.off("showdownResults");
    };
  }, []);

  const join = () => {
    if (!playerName) return;
    socket.emit("joinRoom", { roomId, playerName });
    setJoined(true);
  };

  const start = () => socket.emit("startGame", roomId);
  const action = (type) => socket.emit("playerAction", { roomId, action: type });

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-widest">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 animate-pulse'}`} />
          {isConnected ? 'Server Online' : 'Connecting to Server...'}
        </div>

        <h1 className="text-4xl font-black">Texas Hold'em</h1>
        <input 
          className="bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none text-white"
          placeholder="Enter Nickname" 
          value={playerName} 
          onChange={e => setPlayerName(e.target.value)} 
        />
        <button onClick={join} className="bg-cyan-700 px-8 py-3 rounded-xl font-bold text-white">Join Table</button>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Poker Table */}
      <div className="relative w-full max-w-5xl mx-auto aspect-video bg-emerald-900 rounded-[200px] border-[16px] border-amber-900 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)]" />
        
        {/* Community Cards */}
        <div className="flex gap-3 z-10">
          {gameState?.communityCards.map((c, i) => (
            <div key={i} className="w-16 h-24 bg-white rounded-lg flex items-center justify-center text-slate-900 font-bold text-xl shadow-lg border-2 border-slate-200">
              {c}
            </div>
          ))}
          {Array.from({ length: 5 - (gameState?.communityCards.length || 0) }).map((_, i) => (
            <div key={i} className="w-16 h-24 bg-emerald-800/50 border-2 border-dashed border-emerald-700 rounded-lg" />
          ))}
        </div>

        {/* Pot */}
        <div className="mt-8 z-10 bg-black/40 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <p className="text-amber-400 font-black text-sm uppercase tracking-widest">Total Pot</p>
          <p className="text-white text-2xl font-black text-center">${gameState?.pot || 0}</p>
        </div>

        {/* Player Avatars (Circular positioning) */}
        {gameState?.players.map((p, i) => (
          <div 
            key={p.id} 
            className="absolute flex flex-col items-center gap-1"
            style={{
                top: i === 0 ? '80%' : '10%',
                left: i === 1 ? '10%' : '80%'
            }}
          >
            <div className={`w-14 h-14 rounded-full border-4 ${socket.id === p.id ? 'border-cyan-400' : 'border-slate-700'} bg-slate-800 flex items-center justify-center text-white font-bold`}>
                {p.name[0]}
            </div>
            <span className="text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded">{p.name}</span>
            <span className="text-[10px] text-emerald-400 font-mono">${p.chips}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
          <p className="text-xs font-black text-slate-500 uppercase mb-4">Your Hole Cards</p>
          <div className="flex gap-4">
            {myCards.length > 0 ? myCards.map((c, i) => (
              <div key={i} className="w-20 h-28 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black text-2xl shadow-xl border-t-4 border-cyan-500">
                {c}
              </div>
            )) : <div className="text-slate-600 text-sm italic">Waiting for deal...</div>}
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center">
          {gameState?.stage === 'waiting' ? (
            <button onClick={start} className="h-14 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-100 transition-all">START ROUND</button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => action('fold')} className="h-12 bg-rose-600 text-white font-bold rounded-xl">FOLD</button>
                <button onClick={() => action('call')} className="h-12 bg-slate-700 text-white font-bold rounded-xl">CALL</button>
              </div>
              <button onClick={() => action('raise')} className="h-12 bg-cyan-600 text-white font-bold rounded-xl">RAISE $20</button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}