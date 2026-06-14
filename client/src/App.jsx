import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppShell from "./pages/AppShell";
import Home from "./pages/Home";
import Users from "./pages/Users";
import Game from "./pages/Game";
import TechShowcase from "./pages/TechShowcase";
import Poker from "./pages/Poker";
import SpinWheel from "./pages/SpinWheel";
import CoinFlip from "./pages/CoinFlip";
import Resume from "./pages/Resume";
import Axios from "./pages/Axios";

export default function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          {/* Primary Views */}
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/tech" element={<TechShowcase />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/axios" element={<Axios />} />

          {/* Games */}
          <Route path="/game" element={<Game />} />
          <Route path="/poker" element={<Poker />} />
          <Route path="/spin" element={<SpinWheel />} />
          <Route path="/flip" element={<CoinFlip />} />
        </Routes>
      </AppShell>
    </Router>
  );
}