import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import AppShell from './components/AppShell.jsx'
import Home from './pages/Home.jsx'
import Game from './pages/Game.jsx'
import Users from './pages/Users.jsx'
import Resume from './pages/Resume.jsx'
import TechShowcase from './pages/TechShowcase.jsx'
import Poker from './pages/Poker.jsx'
import SpinWheel from './pages/SpinWheel.jsx'
import CoinFlip from './pages/CoinFlip.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/users" element={<Users />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/tech" element={<TechShowcase />} />
            <Route path="/poker" element={<Poker />} />
            <Route path="/spin" element={<SpinWheel />} />
            <Route path="/flip" element={<CoinFlip />} />
            <Route path="/axios" element={<Navigate to="/users" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
)