import { useState, useCallback, useEffect } from "react";
import { createUser, getUser, updateUser } from "../api/user";
import Icon from "../components/Icon.jsx";
import Toast from "../components/Toast.jsx";
import { formatScoreProfile } from "../utils/scoreboard.js";

const SUITS = ["♠", "♣", "♥", "♦"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export default function Poker() {
  const [hand, setHand] = useState([]);
  const [held, setHold] = useState([false, false, false, false, false]);
  const [gameState, setGameState] = useState("idle"); // idle, dealt, result
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const createDeck = () => {
    const deck = [];
    for (const suit of SUITS) {
      for (let i = 0; i < RANKS.length; i++) {
        deck.push({ suit, rank: RANKS[i], value: i + 2 });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const evaluateHand = (finalHand) => {
    const counts = {};
    finalHand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
    const values = Object.values(counts).sort((a, b) => b - a);
    
    if (values[0] === 4) return { label: "Four of a Kind", points: 250 };
    if (values[0] === 3 && values[1] === 2) return { label: "Full House", points: 90 };
    if (values[0] === 3) return { label: "Three of a Kind", points: 30 };
    if (values[0] === 2 && values[1] === 2) return { label: "Two Pair", points: 20 };
    if (values[0] === 2) return { label: "One Pair", points: 10 };
    return { label: "High Card", points: 0 };
  };

  const deal = () => {
    const newDeck = createDeck();
    setHand(newDeck.slice(0, 5));
    setHold([false, false, false, false, false]);
    setGameState("dealt");
    setScore(0);
  };

  const draw = useCallback(async () => {
    const newDeck = createDeck();
    const finalHand = hand.map((card, i) => held[i] ? card : newDeck.pop());
    setHand(finalHand);
    const result = evaluateHand(finalHand);
    setScore(result.points);
    setGameState("result");

    if (result.points > 0) {
      saveScore(result.points);
    }
  }, [hand, held]);

  const saveScore = async (finalScore) => {
    const name = playerName.trim() || "PokerPro";
    setIsSaving(true);
    try {
      const payload = { firstName: name, lastName: formatScoreProfile(finalScore) };
      const existing = await getUser({ id: name }).catch(() => null);
      if (existing?.data?.user?._id) {
        await updateUser({ id: existing.data.user._id, ...payload });
      } else {
        await createUser(payload);
      }
      setToast({ type: "success", message: `Score of ${finalScore} saved for ${name}` });
    } catch {
      setToast({ type: "error", message: "Database connection failed." });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleHold = (i) => {
    if (gameState !== "dealt") return;
    const next = [...held];
    next[i] = !next[i];
    setHold(next);
  };

  return (
    <section className="space-y-8">
      <Toast toast={toast} />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Video Poker</h1>
        <p className="text-slate-500">Hold cards and draw to win. Pairs or better score points.</p>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name"
            className="h-11 rounded-xl border border-slate-200 px-4 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {gameState === "idle" || gameState === "result" ? (
            <button onClick={deal} className="h-11 rounded-xl bg-rose-600 px-6 font-bold text-white">Deal Hand</button>
          ) : (
            <button onClick={draw} className="h-11 rounded-xl bg-emerald-600 px-6 font-bold text-white">Draw Cards</button>
          )}
        </div>

        <div className="mt-8 grid grid-cols-5 gap-2 sm:gap-4">
          {hand.map((card, i) => (
            <div 
              key={i}
              onClick={() => toggleHold(i)}
              className={`relative flex h-32 flex-col items-center justify-center rounded-xl border-2 transition-all cursor-pointer ${
                held[i] ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              }`}
            >
              <span className={`text-2xl font-bold ${card.suit === "♥" || card.suit === "♦" ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
                {card.rank}{card.suit}
              </span>
              {held[i] && <span className="absolute bottom-2 text-[10px] font-black uppercase text-emerald-600">Held</span>}
            </div>
          ))}
        </div>

        {gameState === "result" && (
          <div className="mt-6 rounded-xl bg-slate-950 p-4 text-center text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Result</p>
            <p className="text-2xl font-black">{score > 0 ? `Winner: ${score} pts` : "No Pair"}</p>
          </div>
        )}
      </div>
    </section>
  );
}