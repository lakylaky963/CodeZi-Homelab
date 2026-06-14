import { useState, useMemo } from "react";
import Icon from "../components/Icon.jsx";
import Toast from "../components/Toast.jsx";

export default function SpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [toast, setToast] = useState(null);

  // Custom values state
  const [options, setOptions] = useState(["$100", "Free Spin", "Try Again", "Jackpot", "Coffee", "Pizza"]);
  const [inputValue, setInputValue] = useState("");

  const addOption = (e) => {
    e.preventDefault();
    if (inputValue.trim() && options.length < 12) {
      setOptions([...options, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const spin = () => {
    if (isSpinning) return;
    
    const spinAmount = 1800 + Math.random() * 360;
    const newRotation = rotation + spinAmount;
    setRotation(newRotation);
    setIsSpinning(true);
    setPrize(null);

    setTimeout(() => {
      setIsSpinning(false);
      const segmentSize = 360 / options.length;
      const finalRotation = newRotation % 360;
      // Calculate winning index based on clockwise rotation and top pointer
      const winningIndex = Math.floor(((360 - finalRotation) % 360) / segmentSize);
      const result = options[winningIndex];
      
      setPrize(result);
      setToast({ type: "success", message: `The wheel chose: ${result}` });
    }, 3000);
  };

  const wheelStyle = useMemo(() => {
    const segmentSize = 360 / options.length;
    const colors = [
      "#0f172a", "#1e293b", "#334155", "#475569", 
      "#1e1b4b", "#312e81", "#3730a3", "#4338ca",
      "#020617", "#171717", "#262626", "#404040"
    ];
    
    const gradientParts = options.map((_, i) => {
      const start = i * segmentSize;
      const end = (i + 1) * segmentSize;
      return `${colors[i % colors.length]} ${start}deg ${end}deg`;
    });

    return {
      transform: `rotate(${rotation}deg)`,
      background: `conic-gradient(${gradientParts.join(", ")})`
    };
  }, [options, rotation]);

  return (
    <section className="grid gap-12 py-12 lg:grid-cols-2">
      <Toast toast={toast} />
      
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-950 dark:text-white">Spin the Wheel</h1>
          <p className="mt-2 text-slate-500">Add custom values and let fate decide.</p>
        </div>
        
        <div className="relative h-80 w-80">
          <div className="absolute -top-4 left-1/2 z-10 h-8 w-8 -translate-x-1/2 text-rose-500">
            <Icon name="arrow" size={32} className="rotate-180" />
          </div>
          
          <div 
            className="h-full w-full rounded-full border-8 border-slate-900 shadow-2xl transition-transform duration-[3000ms] ease-out dark:border-slate-800"
            style={wheelStyle}
          >
            <div className="grid h-full w-full place-items-center opacity-20">
              <Icon name="spark" size={120} className="text-white" />
            </div>
          </div>
        </div>

        <button
          disabled={isSpinning || options.length < 2}
          onClick={spin}
          className="h-14 rounded-2xl bg-slate-950 px-10 text-lg font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-slate-950"
        >
          {isSpinning ? "Spinning..." : "SPIN NOW"}
        </button>

        {prize && !isSpinning && (
          <div className="animate-bounce rounded-2xl bg-emerald-500 px-6 py-3 text-xl font-black text-white shadow-lg">
            Result: {prize}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-black text-slate-950 dark:text-white">Wheel Options</h2>
        <p className="text-sm text-slate-500">Configure the segments of the wheel.</p>

        <form onSubmit={addOption} className="mt-6 flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter value..."
            maxLength={20}
            className="h-11 flex-1 rounded-xl border border-slate-200 px-4 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          <button type="submit" className="h-11 rounded-xl bg-cyan-700 px-4 font-bold text-white hover:bg-cyan-600">
            Add
          </button>
        </form>

        <div className="mt-6 space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
              <span className="font-bold text-slate-700 dark:text-slate-300">{opt}</span>
              <button 
                onClick={() => removeOption(i)}
                className="text-rose-500 hover:text-rose-600 px-2"
                disabled={options.length <= 2}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}