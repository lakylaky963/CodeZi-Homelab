// import { useEffect, useMemo, useState } from "react";
// import Icon from "../components/Icon.jsx";

// const requestFlow = [
//   "React route handles interaction",
//   "client/src/api/user.js calls VITE_SERVER_URL",
//   "Express /api/user route validates request",
//   "Mongoose reads or writes the user collection",
//   "React state refreshes the visible dashboard",
// ];

// const stackCards = [
//   ["React", "Route-level views, local UI state, and reusable shell navigation.", "spark"],
//   ["Vite", "Fast dev server and optimized production build for the client app.", "code"],
//   ["Express", "Node API layer hosted separately from the browser client.", "layers"],
//   ["MongoDB", "Small user documents with firstName and lastName only.", "database"],
// ];

// export default function TechShowcase() {
//   const [latency, setLatency] = useState(124);
//   const [status, setStatus] = useState("online");

//   const apiBase = import.meta.env.VITE_SERVER_URL || "VITE_SERVER_URL not set";
//   const userEndpoint = `${apiBase}/api/user`;

//   useEffect(() => {
//     const interval = window.setInterval(() => {
//       setLatency(Math.floor(82 + Math.random() * 220));
//       setStatus(Math.random() > 0.12 ? "online" : "warming");
//     }, 2200);

//     return () => window.clearInterval(interval);
//   }, []);

//   const latencyTone = useMemo(() => {
//     if (latency < 140) return "text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-400/10";
//     if (latency < 240) return "text-amber-800 bg-amber-100 dark:text-amber-200 dark:bg-amber-400/10";
//     return "text-rose-700 bg-rose-100 dark:text-rose-200 dark:bg-rose-400/10";
//   }, [latency]);

//   return (
//     <section className="space-y-8">
//       <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
//         <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
//           <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
//             <Icon name="layers" size={15} />
//             Operational Control Center
//           </span>
//           <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
//             System view for CodeZi.
//           </h1>
//           <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
//             This page documents how the frontend, API, and small MongoDB user schema cooperate without changing the existing API client or database contract.
//           </p>

//           <div className="mt-6 grid gap-3 sm:grid-cols-3">
//             <StatusMetric label="API status" value={status} tone={status === "online" ? "good" : "warn"} />
//             <StatusMetric label="Latency sim" value={`${latency} ms`} tone={latency < 240 ? "good" : "bad"} />
//             <StatusMetric label="Schema fields" value="2" tone="neutral" />
//           </div>
//         </div>

//         <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:shadow-black/20">
//           <div className="flex items-center justify-between gap-3">
//             <div>
//               <p className="text-xs font-black uppercase tracking-widest text-slate-400">Endpoint monitor</p>
//               <h2 className="mt-1 text-xl font-black">Render API target</h2>
//             </div>
//             <span className={`rounded-full px-3 py-1 text-xs font-black ${latencyTone}`}>
//               {status}
//             </span>
//           </div>

//           <div className="mt-5 space-y-3">
//             <Endpoint label="Base URL" value={apiBase} />
//             <Endpoint label="Users" value={userEndpoint} />
//             <Endpoint label="Client" value="client/src/api/user.js" />
//           </div>
//         </div>
//       </div>

//       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//         {stackCards.map(([title, text, icon]) => (
//           <article
//             key={title}
//             className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl hover:shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:shadow-black/20"
//           >
//             <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-200">
//               <Icon name={icon} size={21} />
//             </span>
//             <h2 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{title}</h2>
//             <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
//           </article>
//         ))}
//       </div>

//       <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
//         <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
//           <div>
//             <span className="text-xs font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
//               Live Database Sandbox
//             </span>
//             <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Data contract visualizer</h2>
//           </div>
//           <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
//             no migrations required
//           </span>
//         </div>

//         <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
//           <MappingCard
//             title="Game run"
//             rows={[
//               ["Player", "StudioPlayer"],
//               ["Score", "420"],
//               ["Mode", "Memory Match"],
//               ["Timestamp", new Date().toISOString()],
//             ]}
//           />

//           <div className="hidden text-slate-300 dark:text-slate-700 lg:block">
//             <Icon name="arrow" size={36} />
//           </div>

//           <MappingCard
//             title="MongoDB user document"
//             rows={[
//               ["firstName", "StudioPlayer"],
//               ["lastName", "Score 420 | Memory Match | ISO timestamp"],
//             ]}
//             highlighted
//           />
//         </div>
//       </div>

//       <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
//         <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
//           <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
//             <Icon name="spark" className="text-indigo-600 dark:text-indigo-300" size={20} />
//             Request lifecycle
//           </h2>
//           <div className="mt-5 space-y-3">
//             {requestFlow.map((step, index) => (
//               <div
//                 key={step}
//                 className="grid grid-cols-[40px_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
//               >
//                 <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white dark:bg-indigo-600">
//                   {index + 1}
//                 </span>
//                 <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{step}</p>
//               </div>
//             ))}
//           </div>
//         </article>

//         <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
//           <h2 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
//             <Icon name="database" className="text-cyan-700 dark:text-cyan-300" size={20} />
//             Diagnostics
//           </h2>
//           <div className="mt-5 grid gap-3">
//             {[
//               ["GET", "/api/user", "Fetch dashboard records", "healthy"],
//               ["GET", "/api/user/:id", "Lookup by ObjectId or firstName", "healthy"],
//               ["POST", "/api/user", "Create firstName/lastName document", "healthy"],
//               ["PATCH", "/api/user/:id", "Update an existing document", "guarded"],
//               ["DELETE", "/api/user/:id", "Delete by ObjectId only", "guarded"],
//             ].map(([method, path, purpose, health]) => (
//               <div
//                 key={`${method}-${path}`}
//                 className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[72px_1fr_auto] sm:items-center"
//               >
//                 <span className="rounded-lg bg-white px-2.5 py-1 text-center text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-200">
//                   {method}
//                 </span>
//                 <div className="min-w-0">
//                   <code className="block truncate text-sm font-bold text-slate-950 dark:text-white">{path}</code>
//                   <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{purpose}</p>
//                 </div>
//                 <span
//                   className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
//                     health === "healthy"
//                       ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"
//                       : "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"
//                   }`}
//                 >
//                   {health}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </article>
//       </div>
//     </section>
//   );
// }

// function StatusMetric({ label, value, tone }) {
//   const colors = {
//     good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
//     warn: "bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200",
//     bad: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200",
//     neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
//   };

//   return (
//     <div className={`rounded-xl px-4 py-3 ${colors[tone] || colors.neutral}`}>
//       <p className="text-xs font-black uppercase tracking-widest opacity-70">{label}</p>
//       <p className="mt-1 text-xl font-black capitalize">{value}</p>
//     </div>
//   );
// }

// function Endpoint({ label, value }) {
//   return (
//     <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
//       <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
//       <code className="mt-1 block truncate text-sm font-bold text-cyan-200">{value}</code>
//     </div>
//   );
// }

// function MappingCard({ title, rows, highlighted = false }) {
//   return (
//     <div
//       className={`rounded-xl border p-4 ${
//         highlighted
//           ? "border-cyan-200 bg-cyan-50 dark:border-cyan-400/20 dark:bg-cyan-400/10"
//           : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
//       }`}
//     >
//       <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
//         {title}
//       </h3>
//       <div className="space-y-3">
//         {rows.map(([key, value]) => (
//           <div key={key} className="grid gap-1 rounded-lg bg-white p-3 dark:bg-slate-900">
//             <span className="text-xs font-black uppercase tracking-widest text-slate-400">{key}</span>
//             <code className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{value}</code>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
