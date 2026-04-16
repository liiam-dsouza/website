import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  HUB / LANDING PAGE                                      ║
// ╚══════════════════════════════════════════════════════════╝

const GAMES = [
  {
    id: "queens",
    name: "Queens",
    tagline: "Place a crown in every region",
    description: "One crown per row, column, and colour. Crowns can't touch — not even diagonally.",
    icon: "👑",
    color: "#c8a060",
    accent: "rgba(200,160,96,0.08)",
    border: "rgba(200,160,96,0.2)",
    status: "playable",
    difficulty: "Medium",
  },
  {
    id: "zip",
    name: "Zip",
    tagline: "Draw the perfect path",
    description: "Connect the numbered dots in order. Your path must pass through every single cell.",
    icon: "⚡",
    color: "#c0392b",
    accent: "rgba(192,57,43,0.08)",
    border: "rgba(192,57,43,0.2)",
    status: "playable",
    difficulty: "Hard",
  },
  {
    id: "crossclimb",
    name: "Crossclimb",
    tagline: "Build the word ladder",
    description: "Solve trivia clues, arrange the words into a ladder where each step changes one letter, then unlock the bookends.",
    icon: "🔤",
    color: "#4a9080",
    accent: "rgba(74,144,128,0.08)",
    border: "rgba(74,144,128,0.2)",
    status: "playable",
    difficulty: "Medium",
  },
  {
    id: "tango",
    name: "Tango",
    tagline: "Balance the suns and moons",
    description: "Fill the grid with suns and moons. Equal counts per row and column, no run of three, and respect the = and × clues.",
    icon: "🌗",
    color: "#c8a060",
    accent: "rgba(200,160,96,0.08)",
    border: "rgba(200,160,96,0.2)",
    status: "playable",
    difficulty: "Medium",
  },
  {
    id: "minisudoku",
    name: "Mini Sudoku",
    tagline: "Classic logic in a 6×6 grid",
    description: "Fill every row, column, and 2×3 box with the numbers 1–6. Select a cell then tap a number — or use the keyboard.",
    icon: "🔢",
    color: "#7060c8",
    accent: "rgba(112,96,200,0.08)",
    border: "rgba(112,96,200,0.2)",
    status: "playable",
    difficulty: "Medium",
  },
  {
    id: "patches",
    name: "Patches",
    tagline: "Fill the grid with rectangles",
    description: "Expand each coloured seed into a rectangle. The number tells you the size, the icon tells you the shape. Cover every cell.",
    icon: "🧩",
    color: "#2196f3",
    accent: "rgba(33,150,243,0.08)",
    border: "rgba(33,150,243,0.2)",
    status: "playable",
    difficulty: "Hard",
  },
  {
    id: "pinpoint",
    name: "Pinpoint",
    tagline: "Find the connecting category",
    description: "Five words share a hidden category. Guess it using as few clues as possible.",
    icon: "🎯",
    color: "#7060c8",
    accent: "rgba(112,96,200,0.08)",
    border: "rgba(112,96,200,0.2)",
    status: "playable",
    difficulty: "Easy",
  },
];

function HubPage({ onPlay }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", flexDirection: "column" }} className="page-enter">

      {/* Hero */}
      <div style={{ padding: "60px 24px 40px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 900, color: "#f0ede8", lineHeight: 1, letterSpacing: "-0.03em" }}>
            LinkedIn
          </div>
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 16 }}>
          <span style={{ color: "#f0ede8" }}>Games </span>
          <span style={{ color: "#333" }}>Hub</span>
        </div>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, color: "#555", lineHeight: 1.7, maxWidth: 420 }}>
          Open-source clones of your favourite LinkedIn daily puzzles. Vibe coded in ~1 hour so expect some bugs.
        </div>

        {/* Divider */}
        <div style={{ marginTop: 36, height: 1, background: "linear-gradient(90deg, #1e1e1e, transparent)" }} />
      </div>

      {/* Games grid */}
      <div style={{ padding: "0 24px 60px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ fontSize: 10, color: "#333", letterSpacing: "0.25em", fontFamily: "'DM Mono',monospace", marginBottom: 20 }}>
          AVAILABLE GAMES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 40 }}>
          {GAMES.filter(g => g.status === "playable").map((game, i) => (
            <div key={game.id} className="card-hover"
              onClick={() => onPlay(game.id)}
              style={{
                background: game.accent, border: `1px solid ${game.border}`,
                borderRadius: 16, padding: "24px 22px", cursor: "pointer",
                animation: `slideUp 0.4s ease ${i * 0.08}s both`,
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ fontSize: 36, lineHeight: 1 }}>{game.icon}</div>
                <div style={{ fontSize: 10, color: game.color, fontFamily: "'DM Mono',monospace", background: `${game.border}`, padding: "4px 10px", borderRadius: 20, letterSpacing: "0.1em" }}>
                  {game.difficulty}
                </div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: "#f0ede8", marginBottom: 6, lineHeight: 1.1 }}>
                {game.name}
              </div>
              <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6, marginBottom: 18 }}>
                {game.description}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: game.color, fontSize: 12, fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em" }}>
                PLAY NOW
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "#2a2a2a", fontFamily: "'DM Mono',monospace" }}>
            Fan-made · Not affiliated with LinkedIn
          </div>
          <div style={{ fontSize: 11, color: "#2a2a2a", fontFamily: "'DM Mono',monospace" }}>
            Open source
          </div>
        </div>
      </div>
    </div>
  );
}

export default HubPage;
