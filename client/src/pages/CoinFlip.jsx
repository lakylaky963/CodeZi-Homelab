import { useState } from "react";
import Icon from "../components/Icon.jsx";

export default function CoinFlip() {
  const [side, setSide] = useState("heads");
  const [isFlipping, setIsFlipping] = useState(false);
  const [streak, setStreak] = useState(0);

  const flip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    
    const result = Math.random() > 0.5 ? "heads" : "tails";
    
    setTimeout(() => {
      setSide(result);
      setIsFlipping(false);
      if (result === "heads") {
        setStreak(s => s + 1);
      } else {
        setStreak(0);
      }
    }, 1000);
  };

  return (
    <section className="flex flex-col items-center justify-center space-y-10 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-black text-slate-950 dark:text-white">Heads or Tails</h1>
        <p className="text-slate-500 italic">Heads keeps the streak alive!</p>
      </div>

      <div className="relative h-48 w-48">
        <div 
          className={`h-full w-full rounded-full border-8 border-amber-500 bg-amber-400 transition-all duration-500 flex items-center justify-center shadow-2xl ${
            isFlipping ? "animate-bounce scale-75 rotate-[360deg]" : ""
          }`}
        >
          <span className="text-5xl font-black text-amber-800">
            {side === "heads" ? "H" : "T"}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={flip}
          disabled={isFlipping}
          className="h-14 rounded-2xl bg-cyan-700 px-12 font-black text-white shadow-lg transition-transform hover:-translate-y-1 active:translate-y-0"
        >
          FLIP COIN
        </button>

        <div className="flex items-center gap-3 rounded-full bg-slate-100 px-6 py-2 dark:bg-slate-800">
          <Icon name="spark" size={18} className="text-amber-500" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Current Streak: <strong className="text-slate-950 dark:text-white">{streak}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}