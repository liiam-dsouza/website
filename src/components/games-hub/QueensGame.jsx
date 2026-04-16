import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  QUEENS GAME                                             ║
// ╚══════════════════════════════════════════════════════════╝

const QUEEN_PALETTE = [
  "#b8c9d9", // blue-grey
  "#f4a47a", // orange
  "#a8c5a0", // green
  "#e8a0a0", // red
  "#c5b8e8", // purple
  "#f0d080", // yellow
  "#9ecfcf", // teal
  "#e8c0d8", // pink
  "#b8d4b8", // mint
  "#d4b896", // tan
];

function generateQueensPuzzle(seed, N = 8) {
  const rng = createRng(seedFromString(seed + "queens" + N));

  // 1. Place N non-attacking, non-touching queens
  function tryPlaceQueens() {
    const queens = [];
    const usedCols = new Set();
    function bt(row) {
      if (row === N) return true;
      const cols = shuffleWith([...Array(N)].map((_, i) => i), rng);
      for (const col of cols) {
        if (usedCols.has(col)) continue;
        // Check no touching (including diagonal) with all previous queens
        let ok = true;
        for (const q of queens) {
          if (Math.abs(q.row - row) <= 1 && Math.abs(q.col - col) <= 1) { ok = false; break; }
        }
        if (!ok) continue;
        queens.push({ row, col });
        usedCols.add(col);
        if (bt(row + 1)) return true;
        queens.pop();
        usedCols.delete(col);
      }
      return false;
    }
    return bt(0) ? queens : null;
  }

  let queens = null;
  for (let i = 0; i < 20 && !queens; i++) queens = tryPlaceQueens();
  if (!queens) return null;

  // 2. Assign colours by growing regions from each queen's cell
  const colorGrid = Array.from({ length: N }, () => Array(N).fill(-1));
  queens.forEach((q, i) => { colorGrid[q.row][q.col] = i; });

  // BFS flood-fill to assign remaining cells
  const queue = queens.map((q, i) => ({ r: q.row, c: q.col, color: i }));
  const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]];

  for (let iter = 0; iter < N * N * 4; iter++) {
    if (queue.length === 0) break;
    const idx = Math.floor(rng() * queue.length);
    const { r, c, color } = queue[idx];
    queue.splice(idx, 1);
    for (const [dr, dc] of shuffleWith(dirs4, rng)) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= N || nc < 0 || nc >= N || colorGrid[nr][nc] !== -1) continue;
      colorGrid[nr][nc] = color;
      queue.push({ r: nr, c: nc, color });
    }
  }

  // Fill any remaining unassigned cells with nearest assigned neighbour
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (colorGrid[r][c] !== -1) continue;
        for (const [dr, dc] of dirs4) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N && colorGrid[nr][nc] !== -1) {
            colorGrid[r][c] = colorGrid[nr][nc];
            changed = true; break;
          }
        }
      }
  }

  return { N, queens, colorGrid, palette: QUEEN_PALETTE.slice(0, N) };
}

function QueensGame({ onBack }) {
  const [N, setN] = useState(8);
  const [puzzle, setPuzzle] = useState(null);
  const [seed, setSeed] = useState("");
  const [board, setBoard] = useState([]); // 0=empty, 1=X, 2=crown
  const [autoX, setAutoX] = useState(true);
  // Track which cells had X auto-placed by a specific crown, keyed by "r,c" of the crown
  const [autoXMap, setAutoXMap] = useState({}); // { "crownR,crownC": Set of "r,c" strings }
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [gameState, setGameState] = useState("idle");
  const [bestTime, setBestTime] = useState(null);
  const autoXRef = useRef(autoX);
  useEffect(() => { autoXRef.current = autoX; }, [autoX]);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  function newGame(overrideN) {
    const sz = overrideN ?? N;
    const s = Math.random().toString(36).slice(2, 8).toUpperCase();
    const p = generateQueensPuzzle(s, sz);
    if (!p) { newGame(overrideN); return; }
    setSeed(s);
    setPuzzle(p);
    setBoard(Array.from({ length: sz }, () => Array(sz).fill(0)));
    setAutoXMap({});
    setSolved(false);
    setGameState("idle");
    setElapsed(0);
    startTimeRef.current = null;
    clearInterval(timerRef.current);
  }

  useEffect(() => { newGame(); }, []);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Returns all cells that should be auto-X'd when a crown is placed at (cr, cc)
  function getAutoXCells(cr, cc, n) {
    const cells = new Set();
    for (let col = 0; col < n; col++) if (col !== cc) cells.add(`${cr},${col}`);
    for (let row = 0; row < n; row++) if (row !== cr) cells.add(`${row},${cc}`);
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      const nr = cr + dr, nc = cc + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) cells.add(`${nr},${nc}`);
    }
    return cells;
  }

  function handleCellClick(r, c) {
    if (solved) return;
    if (gameState === "idle") {
      startTimeRef.current = Date.now();
      setGameState("playing");
    }

    const n = puzzle?.N ?? N;

    setBoard(prev => {
      const next = prev.map(row => [...row]);
      const current = next[r][c];
      const newVal = (current + 1) % 3;
      next[r][c] = newVal;

      if (autoXRef.current) {
        setAutoXMap(prevMap => {
          const newMap = { ...prevMap };
          const crownKey = `${r},${c}`;

          if (newVal === 2) {
            // Crown placed — auto-X the row, column, and diagonal neighbours
            const toMark = getAutoXCells(r, c, n);
            const actuallyMarked = new Set();
            toMark.forEach(key => {
              const [kr, kc] = key.split(",").map(Number);
              if (next[kr][kc] === 0) {
                next[kr][kc] = 1;
                actuallyMarked.add(key);
              }
            });
            newMap[crownKey] = actuallyMarked;

          } else if (current === 2) {
            // Crown removed — clean up its auto-X marks
            const prevMarked = prevMap[crownKey];
            if (prevMarked) {
              prevMarked.forEach(key => {
                const [kr, kc] = key.split(",").map(Number);
                if (next[kr][kc] === 1) {
                  // Don't clear if another crown also covers this cell
                  const stillNeeded = Object.entries(newMap).some(([ck, cells]) => {
                    if (ck === crownKey) return false;
                    return cells?.has(key);
                  });
                  if (!stillNeeded) next[kr][kc] = 0;
                }
              });
              delete newMap[crownKey];
            }
          }

          return newMap;
        });
      }

      checkSolution(next);
      return next;
    });
  }

  function checkSolution(b) {
    if (!puzzle) return;
    const { N: n, queens, colorGrid } = puzzle;
    // Collect crown positions
    const crowns = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (b[r][c] === 2) crowns.push({ r, c });
    if (crowns.length !== n) return;
    // Check rows, cols, colors, touching
    const rows = new Set(), cols = new Set(), colors = new Set();
    for (const cr of crowns) {
      rows.add(cr.r); cols.add(cr.c); colors.add(colorGrid[cr.r][cr.c]);
    }
    if (rows.size !== n || cols.size !== n || colors.size !== n) return;
    // Check no touching
    for (let i = 0; i < crowns.length; i++)
      for (let j = i + 1; j < crowns.length; j++) {
        if (Math.abs(crowns[i].r - crowns[j].r) <= 1 && Math.abs(crowns[i].c - crowns[j].c) <= 1) return;
      }
    const t = Date.now() - startTimeRef.current;
    setSolved(true);
    setGameState("done");
    setBestTime(prev => (!prev || t < prev) ? t : prev);
  }

  function getErrors(b) {
    if (!puzzle) return new Set();
    const { N: n, colorGrid } = puzzle;
    const errors = new Set();
    // Count crowns per color
    const colorCrowns = {};
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (b[r][c] === 2) {
          const col = colorGrid[r][c];
          colorCrowns[col] = (colorCrowns[col] || 0) + 1;
        }
    for (const [col, count] of Object.entries(colorCrowns))
      if (count > 1) errors.add(Number(col));
    // Row/col duplicates → mark those colors too
    const rowCrowns = {}, colCrowns = {};
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (b[r][c] === 2) {
          rowCrowns[r] = (rowCrowns[r] || 0) + 1;
          colCrowns[c] = (colCrowns[c] || 0) + 1;
        }
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (b[r][c] === 2 && ((rowCrowns[r] > 1) || (colCrowns[c] > 1)))
          errors.add(colorGrid[r][c]);
    // Touching crowns
    const crowns = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (b[r][c] === 2) crowns.push({ r, c });
    for (let i = 0; i < crowns.length; i++)
      for (let j = i + 1; j < crowns.length; j++)
        if (Math.abs(crowns[i].r - crowns[j].r) <= 1 && Math.abs(crowns[i].c - crowns[j].c) <= 1) {
          errors.add(colorGrid[crowns[i].r][crowns[i].c]);
          errors.add(colorGrid[crowns[j].r][crowns[j].c]);
        }
    return errors;
  }

  if (!puzzle) return <div style={{ color: "#f0ede8", padding: 40, fontFamily: "DM Mono" }}>Generating…</div>;

  const { N: n, colorGrid, palette } = puzzle;
  const errors = solved ? new Set() : getErrors(board);

  // Compute cell size to fit in viewport
  const cellSize = Math.min(44, Math.floor((Math.min(480, window.innerWidth - 48)) / n));
  const gridSize = n * cellSize;

  // Border rendering: thicker borders between different colour regions
  function getBorderStyle(r, c, side) {
    // side: top/right/bottom/left
    const dr = side === "top" ? -1 : side === "bottom" ? 1 : 0;
    const dc = side === "left" ? -1 : side === "right" ? 1 : 0;
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= n || nc < 0 || nc >= n) return "2px solid #2a2a2a";
    if (colorGrid[r][c] !== colorGrid[nr][nc]) return "2.5px solid #1a1a1a";
    return "1px solid rgba(0,0,0,0.15)";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "20px 16px", background: "#0e0e0e" }} className="page-enter">

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "1.5px solid #2a2a2a", borderRadius: 8, padding: "7px 14px", color: "#888", fontSize: 12, fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em", transition: "all 0.15s" }}
          onMouseEnter={e => e.target.style.borderColor = "#555"} onMouseLeave={e => e.target.style.borderColor = "#2a2a2a"}>
          ← HUB
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#f0ede8", lineHeight: 1 }}>Queens</div>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.2em", marginTop: 2, fontFamily: "'DM Mono',monospace" }}>PLACE ONE CROWN IN EACH REGION</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {bestTime && <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em" }}>BEST</div>}
          {bestTime && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 500, color: "#a0c8a0" }}>{formatTime(bestTime)}</div>}
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 22, fontWeight: 500, color: solved ? "#a0c8a0" : gameState === "playing" ? "#f0ede8" : "#333", letterSpacing: "-0.02em", minWidth: 80 }}>
          {solved ? formatTime(elapsed) : formatTime(gameState === "playing" ? elapsed : null)}
        </div>
        <div style={{ flex: 1, display: "flex", gap: 6, justifyContent: "center" }}>
          {[6, 7, 8, 9].map(sz => (
            <button key={sz} onClick={() => { setN(sz); newGame(sz); }}
              style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontFamily: "'DM Mono',monospace", border: `1.5px solid ${N === sz ? "#c8a060" : "#2a2a2a"}`, background: N === sz ? "rgba(200,160,96,0.1)" : "transparent", color: N === sz ? "#c8a060" : "#555", cursor: "pointer", transition: "all 0.12s" }}>
              {sz}×{sz}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => {
              setBoard(Array.from({ length: N }, () => Array(N).fill(0)));
              setAutoXMap({});
              setSolved(false);
            }}
            disabled={board.every(row => row.every(v => v === 0))}
            style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono',monospace", background: "#1e1e1e", border: "1.5px solid #2a2a2a", color: board.every(row => row.every(v => v === 0)) ? "#2a2a2a" : "#888", cursor: board.every(row => row.every(v => v === 0)) ? "default" : "pointer", transition: "all 0.12s", letterSpacing: "0.06em" }}
            onMouseEnter={e => { if (!board.every(row => row.every(v => v === 0))) e.target.style.borderColor="#555"; }}
            onMouseLeave={e => e.target.style.borderColor="#2a2a2a"}>
            CLEAR
          </button>
          <button onClick={() => newGame()} style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono',monospace", background: "#1e1e1e", border: "1.5px solid #2a2a2a", color: "#888", cursor: "pointer", transition: "all 0.12s", letterSpacing: "0.06em" }}
            onMouseEnter={e => e.target.style.borderColor="#555"} onMouseLeave={e => e.target.style.borderColor="#2a2a2a"}>
            NEW
          </button>
        </div>
      </div>

      {/* Auto-X toggle */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "10px 16px", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}>
            Auto-mark ×
          </div>
          <div style={{ fontSize: 10, color: "#444", fontFamily: "'DM Sans',sans-serif", marginTop: 2, lineHeight: 1.4 }}>
            {autoX
              ? "Placing a crown auto-fills × on its row, column & neighbours"
              : "Manually place × markers yourself"}
          </div>
        </div>
        <div
          onClick={() => setAutoX(v => !v)}
          style={{
            width: 44, height: 24, borderRadius: 12, flexShrink: 0, marginLeft: 16,
            background: autoX ? "#c8a060" : "#2a2a2a",
            position: "relative", cursor: "pointer",
            transition: "background 0.2s ease",
            boxShadow: autoX ? "0 0 10px rgba(200,160,96,0.3)" : "none",
          }}
        >
          <div style={{
            position: "absolute", top: 3, left: autoX ? 23 : 3,
            width: 18, height: 18, borderRadius: "50%",
            background: autoX ? "#fff" : "#555",
            transition: "left 0.2s ease, background 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, ${cellSize}px)`, border: "2.5px solid #2a2a2a", borderRadius: 4, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
          {Array.from({ length: n }, (_, r) =>
            Array.from({ length: n }, (_, c) => {
              const color = colorGrid[r][c];
              const val = board[r]?.[c] ?? 0;
              const isError = errors.has(color);
              const bg = palette[color] ?? "#ccc";
              return (
                <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)}
                  className={isError ? "cell-error-hatch" : ""}
                  style={{
                    width: cellSize, height: cellSize,
                    background: isError ? bg : bg,
                    backgroundColor: bg,
                    borderTop: getBorderStyle(r, c, "top"),
                    borderRight: getBorderStyle(r, c, "right"),
                    borderBottom: getBorderStyle(r, c, "bottom"),
                    borderLeft: getBorderStyle(r, c, "left"),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", position: "relative", userSelect: "none",
                    transition: "filter 0.15s",
                  }}
                  onMouseEnter={e => !solved && (e.currentTarget.style.filter = "brightness(1.1)")}
                  onMouseLeave={e => e.currentTarget.style.filter = "brightness(1)"}
                >
                  {/* Error hatch overlay */}
                  {isError && (
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(-45deg, rgba(180,20,20,0.3) 0px, rgba(180,20,20,0.3) 3px, transparent 3px, transparent 9px)", pointerEvents: "none" }} />
                  )}
                  {val === 1 && (
                    <div style={{ fontSize: cellSize * 0.4, color: "rgba(0,0,0,0.4)", fontWeight: 700, lineHeight: 1, animation: "xPlace 0.15s ease", position: "relative", zIndex: 1 }}>×</div>
                  )}
                  {val === 2 && (
                    <div style={{ fontSize: cellSize * 0.42, lineHeight: 1, animation: "crownPop 0.25s ease", position: "relative", zIndex: 1, filter: isError ? "hue-rotate(0deg) saturate(1)" : "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }}>
                      👑
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Solved overlay */}
        {solved && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,14,14,0.85)", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👑</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 900, color: "#f0ede8", marginBottom: 4 }}>Solved!</div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 28, color: "#a0c8a0", fontWeight: 500 }}>{formatTime(elapsed)}</div>
            <button onClick={() => newGame()} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 10, fontSize: 12, fontFamily: "'DM Mono',monospace", background: "#f0ede8", color: "#0e0e0e", border: "none", cursor: "pointer", letterSpacing: "0.1em", fontWeight: 500 }}>
              NEW GAME
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ width: "100%", maxWidth: 520, background: "#141414", border: "1px solid #1e1e1e", borderRadius: 12, padding: "14px 18px" }}>
        <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.2em", fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>HOW TO PLAY</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
          {[
            ["Click once", "Place an × marker"],
            ["Click ×", "Place a 👑 crown"],
            ["Click 👑", "Remove & undo auto-×"],
            ["1 crown per row & column", ""],
            ["1 crown per colour region", ""],
            ["Crowns can't touch (even diagonally)", ""],
          ].map(([a, b], i) => (
            <div key={i} style={{ fontSize: 11, color: "#555", fontFamily: "'DM Mono',monospace", lineHeight: 1.5 }}>
              <span style={{ color: "#888" }}>{a}</span>{b ? <span style={{ color: "#444" }}> → {b}</span> : null}
            </div>
          ))}
        </div>
        {autoX && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1a1a1a", fontSize: 10, color: "#555", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>
            <span style={{ color: "#c8a060", fontFamily: "'DM Mono',monospace" }}>Auto-× is ON</span> — crowns automatically mark their row, column & diagonal neighbours. These clear when you remove the crown.
          </div>
        )}
      </div>
    </div>
  );
}

export default QueensGame;
