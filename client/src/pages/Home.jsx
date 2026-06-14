import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";

const destinations = [
  {
    to: "/users",
    title: "User Dashboard",
    text: "Create, edit, search, and delete MongoDB user records through the existing CRUD client.",
    icon: "users",
    accent: "text-cyan-700 dark:text-cyan-200",
  },
  {
    to: "/game",
    title: "Runner Game",
    text: "Save player scores using firstName for the name and lastName for encoded score metadata.",
    icon: "game",
    accent: "text-emerald-700 dark:text-emerald-200",
  },
  {
    to: "/tech",
    title: "Ops Showcase",
    text: "Inspect the live API URL, request flow, score encoding, and deployment topology.",
    icon: "layers",
    accent: "text-indigo-700 dark:text-indigo-200",
  },
  {
    to: "/poker",
    title: "Video Poker",
    text: "Test your luck with a classic draw poker game. High scores are saved to the user database.",
    icon: "spark",
    accent: "text-rose-700 dark:text-rose-200",
  },
  {
    to: "/spin",
    title: "Wheel Spin",
    text: "Spin the wheel to win points. A quick way to test the random number generator and API.",
    icon: "refresh",
    accent: "text-amber-700 dark:text-amber-200",
  },
  {
    to: "/flip",
    title: "Heads or Tails",
    text: "A simple 50/50 bet. Win streaks are tracked and saved as competitive records.",
    icon: "game",
    accent: "text-blue-700 dark:text-blue-200",
  },
];

const stats = [
  ["5", "Routed views"],
  ["CRUD", "API contract"],
  ["2 fields", "Mongo schema"],
  ["Vite", "Frontend runtime"],
];

export default function Home() {
  return (
    <section className="space-y-10">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-7">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
            <Icon name="spark" size={15} />
            Operational MERN UI
          </span>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              A polished command surface for your full-stack app.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
              The dashboard, game, and stack explorer now share one responsive
              visual system with real theme switching, tactile controls, and
              backend-aware data states.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/users"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 text-sm font-black text-white shadow-lg shadow-cyan-700/20 transition-all hover:-translate-y-0.5 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 active:translate-y-0"
            >
              Open Dashboard
              <Icon name="arrow" size={18} />
            </Link>
            <Link
              to="/tech"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 active:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Inspect Stack
              <Icon name="layers" size={18} />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            <span className="ml-auto text-xs font-bold text-slate-400">live-preview</span>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    API base
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                    {import.meta.env.VITE_SERVER_URL || "VITE_SERVER_URL not set"}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                  ready
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-cyan-700 p-4 text-white">
                <Icon name="database" size={22} />
                <p className="mt-5 text-2xl font-black">firstName</p>
                <p className="text-sm text-cyan-100">Player or user name</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Icon name="game" size={22} className="text-emerald-600 dark:text-emerald-300" />
                <p className="mt-5 text-2xl font-black text-slate-950 dark:text-white">lastName</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Encoded score metadata</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {destinations.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-slate-200/70 focus:outline-none focus:ring-2 focus:ring-cyan-500 active:translate-y-0 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-700 dark:hover:shadow-black/20"
          >
            <span className={`grid h-11 w-11 place-items-center rounded-xl bg-slate-100 transition-transform group-hover:scale-105 dark:bg-slate-800 ${item.accent}`}>
              <Icon name={item.icon} size={21} />
            </span>
            <h2 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.text}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-700 transition-all group-hover:gap-3 dark:text-cyan-300">
              Open
              <Icon name="arrow" size={16} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
