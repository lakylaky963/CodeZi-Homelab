import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

// Log connection attempt for debugging
console.log("🎮 Poker game connecting to:", SERVER_URL);

const socket = io(SERVER_URL, {
  transports: ["websocket"], // 🟢 Changed: Bypasses polling completely to fix Render's connection timeouts
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  withCredentials: true,
  timeout: 10000,
});

const SEAT_POSITIONS = [
  { top: "78%", left: "50%", transform: "translateX(-50%)" },
  { top: "55%", left: "8%" },
  { top: "12%", left: "18%" },
  { top: "5%", left: "50%", transform: "translateX(-50%)" },
  { top: "12%", left: "72%" },
  { top: "55%", left: "82%" },
];

function renderCard(card) {
  if (!card || card === "hidden") {
    return (
      <div className="w-12 h-16 bg-gradient-to-br from-blue-900 to-indigo-950 border-2 border-white/20 rounded-md shadow-lg flex items-center justify-center">
        <div className="w-7 h-10 border border-white/10 rounded-sm" />
      </div>
    );
  }
  const suit = card.slice(-1);
  const val = card.slice(0, -1);
  const isRed = suit === "H" || suit === "D";
  const suitChar = suit === "H" ? "♥" : suit === "D" ? "♦" : suit === "C" ? "♣" : "♠";
  return (
    <div className={`w-12 h-16 bg-white border border-gray-300 rounded-md shadow-md flex flex-col items-center justify-center font-bold ${isRed ? "text-red-600" : "text-gray-900"}`}>
      <span className="text-[10px] leading-none self-start ml-1">{val}</span>
      <span className="text-base leading-none">{suitChar}</span>
    </div>
  );
}

export default function PokerGame() {
  const [gameState, setGameState] = useState(null);
  const [myCards, setMyCards] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joined, setJoined] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showdown, setShowdown] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleStateUpdate = useCallback((state) => {
    setGameState(state);
    const mine = state?.players?.find((p) => p.id === socket.id);
    if (mine?.cards?.length && mine.cards[0] !== "hidden") {
      setMyCards(mine.cards);
    }
  }, []);

  useEffect(() => {
    const onConnect = () => {
      console.log("✅ Connected to server:", socket.id);
      setIsConnected(true);
      setErrorMsg("");
      const saved = sessionStorage.getItem("pokerSession");
      if (saved && joined) {
        const { room, name } = JSON.parse(saved);
        socket.emit("joinRoom", { roomId: room, playerName: name });
      }
    };

    const onDisconnect = (reason) => {
      console.log("❌ Disconnected from server:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        setErrorMsg("Server disconnected. Attempting to reconnect...");
      }
    };

    const onConnectError = (error) => {
      console.error("🔴 Connection error:", error);
      setErrorMsg(`Connection failed: ${error?.message || "Unable to reach server. Check your URL."}`);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("gameStateUpdated", handleStateUpdate);
    socket.on("pokerGameStateUpdated", handleStateUpdate);
    socket.on("receiveCards", (cards) => setMyCards(cards));
    socket.on("showdownResults", (res) => {
      setShowdown(res);
      setMyCards([]);
      setTimeout(() => setShowdown(null), 6000);
    });
    socket.on("sessionEnded", () => {
      setJoined(false);
      setGameState(null);
      setMyCards([]);
      sessionStorage.removeItem("pokerSession");
      setErrorMsg("Session ended — the table was closed.");
    });
    socket.on("error", (message) => {
      console.error("🔴 Socket error:", message);
      setErrorMsg(typeof message === "string" ? message : "Something went wrong");
      setTimeout(() => setErrorMsg(""), 4000);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("gameStateUpdated", handleStateUpdate);
      socket.off("pokerGameStateUpdated", handleStateUpdate);
      socket.off("receiveCards");
      socket.off("showdownResults");
      socket.off("sessionEnded");
      socket.off("error");
    };
  }, [handleStateUpdate, joined]);

  const join = (e) => {
    e?.preventDefault();
    const name = playerName.trim();
    const room = roomName.trim();
    if (!name || !room) return;
    sessionStorage.setItem("pokerSession", JSON.stringify({ room, name }));
    socket.emit("joinRoom", { roomId: room, playerName: name });
    setJoined(true);
    setErrorMsg("");
  };

  const leave = () => {
    socket.emit("leaveRoom", { roomId: roomName.trim() });
    sessionStorage.removeItem("pokerSession");
    setJoined(false);
    setGameState(null);
    setMyCards([]);
  };

  const start = () => socket.emit("startGame", roomName.trim());
  const action = (type, amount) =>
    socket.emit("playerAction", { roomId: roomName.trim(), action: type, amount });

  const myIndex = gameState?.players?.findIndex((p) => p.id === socket.id) ?? -1;
  const isMyTurn = gameState?.currentTurn === myIndex;
  const canCheck = (gameState?.currentBet ?? 0) === (gameState?.players?.[myIndex]?.lastBet ?? 0);
  const callAmount = Math.max(0, (gameState?.currentBet ?? 0) - (gameState?.players?.[myIndex]?.lastBet ?? 0));

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 max-w-md mx-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase tracking-widest">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500 animate-pulse"}`} />
          {isConnected ? "🟢 Server Online" : "🔴 Connecting..."}
        </div>

        <h1 className="text-4xl font-black text-slate-950 dark:text-white">Texas Hold&apos;em</h1>
        <p className="text-slate-500 text-sm text-center">Join a named table with a friend. Sessions are isolated — chips reset when the table closes.</p>

        {errorMsg && (
          <div className="w-full px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm text-center">
            ⚠️ {errorMsg}
            <p className="text-[10px] mt-1 text-rose-300 opacity-70">
              Make sure VITE_SERVER_URL env var is set to your backend URL
            </p>
          </div>
        )}

        <form onSubmit={join} className="w-full space-y-4">
          <input
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none text-white"
            placeholder="Nickname"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
          />
          <input
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none text-white"
            placeholder="Room name (e.g. main-table)"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-cyan-700 px-8 py-3 rounded-xl font-bold text-white hover:bg-cyan-600 transition-colors">
            Join Table
          </button>
        </form>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Room</p>
          <p className="text-xl font-bold text-white">{roomName}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase">
            {gameState?.stage ? gameState.stage : isConnected ? "waiting for game" : "⏳ connecting..."}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60">Pot</p>
          <p className="text-3xl font-black text-amber-400">${gameState?.pot ?? 0}</p>
          {gameState?.currentBet > 0 && (
            <p className="text-xs text-slate-400">Current bet: ${gameState.currentBet}</p>
          )}
        </div>
        <button onClick={leave} className="px-4 py-2 text-sm font-bold text-rose-400 border border-rose-500/30 rounded-xl hover:bg-rose-500/10">
          Leave Table
        </button>
      </div>

      {errorMsg && (
        <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm text-center">
          {errorMsg}
        </div>
      )}

      {showdown && (
        <div className="px-6 py-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center">
          <p className="text-amber-400 font-black uppercase tracking-widest text-sm mb-2">Showdown</p>
          {showdown.winners?.map((w, i) => (
            <p key={i} className="text-white font-bold">
              {w.username} — {w.hand} {w.amount ? `(+$${w.amount})` : ""}
            </p>
          ))}
          <p className="text-slate-400 text-sm mt-1">Pot: ${showdown.potAwarded}</p>
        </div>
      )}

      {/* Poker Table */}
      <div className="relative w-full max-w-5xl mx-auto aspect-video bg-emerald-900 rounded-[200px] border-[16px] border-amber-900 shadow-2xl overflow-hidden min-h-[320px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)]" />

        {/* Community Cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 z-10">
          {gameState?.communityCards?.length > 0
            ? gameState.communityCards.map((c, i) => <span key={i}>{renderCard(c)}</span>)
            : Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-12 h-16 bg-emerald-800/50 border-2 border-dashed border-emerald-700 rounded-md" />
              ))}
        </div>

        {/* Players around table */}
        {gameState?.players?.map((p, i) => {
          const pos = SEAT_POSITIONS[i % SEAT_POSITIONS.length];
          const isMe = p.id === socket.id;
          const isTurn = gameState.currentTurn === i;
          return (
            <div
              key={p.id}
              className="absolute flex flex-col items-center gap-1 z-20"
              style={pos}
            >
              {isTurn && gameState.stage !== "waiting" && (
                <span className="text-[9px] font-black bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full uppercase">Turn</span>
              )}
              <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-white font-bold text-sm ${isMe ? "border-cyan-400 bg-cyan-900/50" : isTurn ? "border-yellow-400 bg-slate-800" : "border-slate-600 bg-slate-800"}`}>
                {p.name?.[0] ?? "?"}
              </div>
              <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded max-w-[80px] truncate">
                {p.name}{isMe ? " (you)" : ""}
              </span>
              <span className="text-[10px] text-emerald-300 font-mono">${p.chips}</span>
              {p.folded && <span className="text-[9px] text-rose-400 font-bold uppercase">Folded</span>}
              {p.lastAction && <span className="text-[9px] text-slate-400 italic">{p.lastAction}</span>}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col items-center">
          <p className="text-xs font-black text-slate-500 uppercase mb-4">Your Hole Cards</p>
          <div className="flex gap-3">
            {myCards.length > 0
              ? myCards.map((c, i) => <span key={i}>{renderCard(c)}</span>)
              : <div className="text-slate-600 text-sm italic">Waiting for deal...</div>}
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center">
          {!gameState ? (
            <p className="text-slate-500 text-center animate-pulse">Syncing table...</p>
          ) : gameState.stage === "waiting" ? (
            <>
              <p className="text-slate-400 text-sm text-center">
                {gameState.players.length} player{gameState.players.length !== 1 ? "s" : ""} seated — need 2 to start
              </p>
              <button
                onClick={start}
                disabled={gameState.players.length < 2}
                className="h-14 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                START ROUND
              </button>
            </>
          ) : !isMyTurn ? (
            <p className="text-slate-500 text-center italic animate-pulse py-6">
              Waiting for {gameState.players[gameState.currentTurn]?.name ?? "next player"}...
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => action("fold")} className="h-12 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500">
                  FOLD
                </button>
                {canCheck ? (
                  <button onClick={() => action("check")} className="h-12 bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-500">
                    CHECK
                  </button>
                ) : (
                  <button onClick={() => action("call")} className="h-12 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600">
                    CALL ${callAmount}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={20}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white font-mono"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                />
                <button onClick={() => action("raise", raiseAmount)} className="px-6 h-12 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500">
                  RAISE
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
