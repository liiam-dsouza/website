import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  TANGO GAME                                              ║
// ╚══════════════════════════════════════════════════════════╝

const SUN  = 1;
const MOON = 2;

const TANGO_PUZZLES = [
  {
    solution: [[1,2,1,2,2,1],[2,1,2,1,1,2],[1,1,2,2,1,2],[2,2,1,1,2,1],[1,2,2,1,2,1],[2,1,1,2,1,2]],
    givens: [{r:0,c:0,v:1},{r:0,c:3,v:2},{r:1,c:1,v:1},{r:3,c:0,v:2},{r:4,c:2,v:2},{r:5,c:5,v:2}],
    hConstraints: [{r:1,c:3,type:"x"},{r:0,c:1,type:"eq"},{r:2,c:0,type:"eq"},{r:4,c:4,type:"x"},{r:3,c:1,type:"eq"},{r:5,c:2,type:"x"}],
    vConstraints: [{r:0,c:2,type:"eq"},{r:1,c:5,type:"x"},{r:2,c:1,type:"x"},{r:3,c:4,type:"eq"},{r:0,c:4,type:"x"},{r:4,c:0,type:"x"}],
  },
  {
    solution: [[1,2,1,2,1,2],[2,1,2,1,2,1],[1,1,2,2,1,2],[2,2,1,1,2,1],[1,2,2,1,1,2],[2,1,1,2,2,1]],
    givens: [{r:0,c:0,v:1},{r:0,c:5,v:2},{r:2,c:3,v:2},{r:3,c:2,v:1},{r:5,c:1,v:1},{r:5,c:4,v:2}],
    hConstraints: [{r:0,c:0,type:"x"},{r:1,c:1,type:"x"},{r:2,c:1,type:"eq"},{r:3,c:0,type:"eq"},{r:4,c:2,type:"eq"},{r:5,c:3,type:"x"}],
    vConstraints: [{r:0,c:0,type:"x"},{r:1,c:5,type:"x"},{r:2,c:2,type:"x"},{r:3,c:3,type:"x"},{r:0,c:2,type:"eq"},{r:4,c:1,type:"eq"}],
  },
  {
    solution: [[2,1,2,1,1,2],[1,2,1,2,2,1],[2,2,1,1,2,1],[1,1,2,2,1,2],[2,1,1,2,1,2],[1,2,2,1,2,1]],
    givens: [{r:0,c:1,v:1},{r:1,c:4,v:2},{r:2,c:0,v:2},{r:3,c:5,v:2},{r:4,c:2,v:1},{r:5,c:3,v:1}],
    hConstraints: [{r:0,c:3,type:"eq"},{r:1,c:0,type:"x"},{r:2,c:1,type:"eq"},{r:3,c:2,type:"eq"},{r:4,c:0,type:"x"},{r:5,c:4,type:"x"}],
    vConstraints: [{r:0,c:4,type:"eq"},{r:1,c:1,type:"eq"},{r:2,c:5,type:"x"},{r:3,c:0,type:"x"},{r:0,c:2,type:"x"},{r:4,c:3,type:"x"}],
  },
];

function getTangoErrors(grid, puzzle) {
  if (!puzzle) return { cells: new Set(), rows: new Set(), cols: new Set() };
  const N = 6;
  const errorRows = new Set(), errorCols = new Set(), errorCells = new Set();
  function key(r, c) { return `${r},${c}`; }
  puzzle.hConstraints.forEach(({r,c,type}) => {
    const v1=grid[r]?.[c], v2=grid[r]?.[c+1]; if(!v1||!v2) return;
    if ((type==="eq"&&v1!==v2)||(type==="x"&&v1===v2)) { errorCells.add(key(r,c)); errorCells.add(key(r,c+1)); }
  });
  puzzle.vConstraints.forEach(({r,c,type}) => {
    const v1=grid[r]?.[c], v2=grid[r+1]?.[c]; if(!v1||!v2) return;
    if ((type==="eq"&&v1!==v2)||(type==="x"&&v1===v2)) { errorCells.add(key(r,c)); errorCells.add(key(r+1,c)); }
  });
  for (let r=0;r<N;r++) {
    const row=grid[r]; const filled=row.every(v=>v!==0);
    if (filled && row.filter(v=>v===SUN).length!==3) errorRows.add(r);
    for (let c=0;c<N-2;c++) if(row[c]&&row[c]===row[c+1]&&row[c]===row[c+2]){errorCells.add(key(r,c));errorCells.add(key(r,c+1));errorCells.add(key(r,c+2));}
  }
  for (let c=0;c<N;c++) {
    const col=grid.map(r=>r[c]); const filled=col.every(v=>v!==0);
    if (filled && col.filter(v=>v===SUN).length!==3) errorCols.add(c);
    for (let r=0;r<N-2;r++) if(col[r]&&col[r]===col[r+1]&&col[r]===col[r+2]){errorCells.add(key(r,c));errorCells.add(key(r+1,c));errorCells.add(key(r+2,c));}
  }
  return { cells: errorCells, rows: errorRows, cols: errorCols };
}

function TangoGame({ onBack }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [grid, setGrid] = useState(null);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [gameState, setGameState] = useState("idle");
  const [bestTime, setBestTime] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  const puzzle = TANGO_PUZZLES[puzzleIdx];
  const N = 6;
  const CELL_SIZE = Math.min(52, Math.floor((Math.min(360, window.innerWidth - 48)) / N));
  const ICON_SIZE = Math.round(CELL_SIZE * 0.52);
  const CONSTRAINT_ZONE = 20;
  const GRID_INNER = N * CELL_SIZE + (N - 1) * CONSTRAINT_ZONE;

  function initGrid(p) {
    const g = Array.from({ length: N }, () => Array(N).fill(0));
    p.givens.forEach(({ r, c, v }) => { g[r][c] = v; });
    return g;
  }

  useEffect(() => { setGrid(initGrid(puzzle)); }, []);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 50);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  function newGame(idx) {
    const i = idx !== undefined ? idx : (puzzleIdx + 1) % TANGO_PUZZLES.length;
    setPuzzleIdx(i);
    setGrid(initGrid(TANGO_PUZZLES[i]));
    setSolved(false); setGameState("idle"); setElapsed(0); setIsNewBest(false);
    startRef.current = null; clearInterval(timerRef.current);
  }

  function retryGame() {
    setGrid(initGrid(puzzle));
    setSolved(false); setGameState("idle"); setElapsed(0);
    startRef.current = null; clearInterval(timerRef.current);
  }

  function isGiven(r, c) { return puzzle.givens.some(g => g.r === r && g.c === c); }

  function handleCellClick(r, c) {
    if (solved || isGiven(r, c) || !grid) return;
    if (gameState === "idle") { startRef.current = Date.now(); setGameState("playing"); }
    const ng = grid.map(row => [...row]);
    ng[r][c] = (ng[r][c] + 1) % 3;
    setGrid(ng);
    if (!ng.every(row => row.every(v => v !== 0))) return;
    const errs = getTangoErrors(ng, puzzle);
    if (errs.cells.size === 0 && errs.rows.size === 0 && errs.cols.size === 0) {
      const t = Date.now() - startRef.current;
      setSolved(true); setGameState("done");
      const nb = !bestTime || t < bestTime; setIsNewBest(nb); if (nb) setBestTime(t);
    }
  }

  if (!grid) return null;

  const errors = solved ? { cells: new Set(), rows: new Set(), cols: new Set() } : getTangoErrors(grid, puzzle);
  const hMap = {}, vMap = {};
  puzzle.hConstraints.forEach(({ r, c, type }) => { hMap[`${r},${c}`] = type; });
  puzzle.vConstraints.forEach(({ r, c, type }) => { vMap[`${r},${c}`] = type; });

  function renderIcon(val) {
    if (val === SUN)  return <span style={{ fontSize: ICON_SIZE, lineHeight: 1, pointerEvents: "none" }}>🌕</span>;
    if (val === MOON) return <span style={{ fontSize: ICON_SIZE, lineHeight: 1, pointerEvents: "none" }}>🌙</span>;
    return null;
  }
  function renderConstraint(type) {
    return (
      <div style={{ width:18, height:18, borderRadius:"50%", background:"#1a1a2a", border:"1.5px solid #3a3a4a",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#aaa",
        flexShrink:0, pointerEvents:"none", userSelect:"none" }}>
        {type === "eq" ? "=" : "×"}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minHeight:"100vh", padding:"20px 16px 40px", background:"#0e0e0e" }} className="page-enter">
      <style>{`
        .tc { display:flex; align-items:center; justify-content:center; border-radius:8px; position:relative; flex-shrink:0; transition:filter 0.1s; }
        .tc:not(.tg):not(.ts) { cursor:pointer; }
        .tc:not(.tg):not(.ts):hover { filter:brightness(1.2); }
        .tc.te { background-image:repeating-linear-gradient(-45deg,rgba(210,50,50,0.28) 0px,rgba(210,50,50,0.28) 3px,transparent 3px,transparent 9px) !important; border-color:rgba(210,50,50,0.5) !important; }
        @keyframes tangoWin { 0%{transform:scale(1)} 50%{transform:scale(1.05)} 100%{transform:scale(1)} }
        .ts { animation:tangoWin 0.5s ease; }
      `}</style>
      <div style={{ width:"100%", maxWidth:440, display:"flex", alignItems:"center", marginBottom:20, gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"1.5px solid #2a2a2a", borderRadius:8, padding:"7px 14px", color:"#888", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em", cursor:"pointer" }}
          onMouseEnter={e=>e.target.style.borderColor="#555"} onMouseLeave={e=>e.target.style.borderColor="#2a2a2a"}>← HUB</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color:"#f0ede8", lineHeight:1 }}>Tango</div>
          <div style={{ fontSize:10, color:"#444", letterSpacing:"0.2em", marginTop:2, fontFamily:"'DM Mono',monospace" }}>SUNS & MOONS</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:20, fontWeight:500, color: solved?"#a0c8a0":gameState==="playing"?"#f0ede8":"#222" }}>
            {formatTime(solved||gameState==="playing"?elapsed:null)}
          </div>
          {bestTime && <div style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace", marginTop:2 }}>BEST {formatTime(bestTime)}</div>}
        </div>
      </div>
      <div style={{ width:"100%", maxWidth:440, display:"flex", gap:8, marginBottom:16 }}>
        {TANGO_PUZZLES.map((_,i) => (
          <button key={i} onClick={() => newGame(i)}
            style={{ flex:1, padding:"7px 0", borderRadius:8, fontSize:11, fontFamily:"'DM Mono',monospace",
              border:`1.5px solid ${puzzleIdx===i?"#c8a060":"#2a2a2a"}`, background:puzzleIdx===i?"rgba(200,160,96,0.1)":"transparent",
              color:puzzleIdx===i?"#c8a060":"#555", cursor:"pointer" }}>Puzzle {i+1}</button>
        ))}
        <button onClick={retryGame} style={{ flex:1, padding:"7px 0", borderRadius:8, fontSize:11, fontFamily:"'DM Mono',monospace", border:"1.5px solid #2a2a2a", background:"transparent", color:"#888", cursor:"pointer" }}>Retry</button>
      </div>
      <div style={{ position:"relative" }}>
        {[...errors.rows].map(r => (
          <div key={`re-${r}`} style={{ position:"absolute", pointerEvents:"none", zIndex:10, top:r*(CELL_SIZE+CONSTRAINT_ZONE), left:0, width:GRID_INNER, height:CELL_SIZE, border:"2px solid rgba(210,50,50,0.5)", borderRadius:8 }} />
        ))}
        {[...errors.cols].map(c => (
          <div key={`ce-${c}`} style={{ position:"absolute", pointerEvents:"none", zIndex:10, left:c*(CELL_SIZE+CONSTRAINT_ZONE), top:0, width:CELL_SIZE, height:GRID_INNER, border:"2px solid rgba(210,50,50,0.5)", borderRadius:8 }} />
        ))}
        <div style={{ display:"flex", flexDirection:"column" }}>
          {Array.from({ length: N }, (_, r) => (
            <div key={r}>
              <div style={{ display:"flex", alignItems:"center" }}>
                {Array.from({ length: N }, (_, c) => {
                  const val=grid[r][c], given=isGiven(r,c), isErr=errors.cells.has(`${r},${c}`), hCon=hMap[`${r},${c}`];
                  const bg=given?(solved?"rgba(74,144,128,0.15)":"#222"):val===0?"#141414":"#111";
                  return (
                    <div key={c} style={{ display:"flex", alignItems:"center" }}>
                      <div className={`tc${given?" tg":""}${isErr?" te":""}${solved?" ts":""}`}
                        onClick={() => handleCellClick(r, c)}
                        style={{ width:CELL_SIZE, height:CELL_SIZE, background:bg, border:`1.5px solid ${isErr?"rgba(210,50,50,0.5)":given?"#333":"#1e1e1e"}` }}>
                        {renderIcon(val)}
                      </div>
                      {c < N-1 && (
                        <div style={{ width:CONSTRAINT_ZONE, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {hCon && renderConstraint(hCon)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {r < N-1 && (
                <div style={{ display:"flex", height:CONSTRAINT_ZONE }}>
                  {Array.from({ length: N }, (_, c) => {
                    const vCon=vMap[`${r},${c}`];
                    return (
                      <div key={c} style={{ display:"flex", alignItems:"center" }}>
                        <div style={{ width:CELL_SIZE, height:CONSTRAINT_ZONE, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {vCon && renderConstraint(vCon)}
                        </div>
                        {c < N-1 && <div style={{ width:CONSTRAINT_ZONE }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {solved && (
        <div style={{ marginTop:20, width:"100%", maxWidth:440, background:"rgba(74,144,128,0.1)", border:"1.5px solid rgba(74,144,128,0.3)", borderRadius:14, padding:"22px 24px", textAlign:"center", animation:"slideUp 0.35s ease" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🌟</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:isNewBest?"#c8a060":"#a0c8a0", marginBottom:4 }}>{isNewBest?"New Best!":"Solved!"}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:30, color:"#f0ede8", marginBottom:16 }}>{formatTime(elapsed)}</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={() => newGame((puzzleIdx+1)%TANGO_PUZZLES.length)} style={{ padding:"10px 22px", borderRadius:10, fontSize:12, fontFamily:"'DM Mono',monospace", background:"#f0ede8", color:"#0e0e0e", border:"none", cursor:"pointer", fontWeight:500 }}>NEXT PUZZLE</button>
            <button onClick={retryGame} style={{ padding:"10px 22px", borderRadius:10, fontSize:12, fontFamily:"'DM Mono',monospace", background:"transparent", border:"1px solid #2a2a2a", color:"#888", cursor:"pointer" }}>RETRY</button>
          </div>
        </div>
      )}
      {gameState==="idle" && !solved && (
        <div style={{ marginTop:16, width:"100%", maxWidth:440, background:"#111", border:"1px solid #1a1a1a", borderRadius:12, padding:"14px 18px" }}>
          <div style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace", letterSpacing:"0.2em", marginBottom:10 }}>HOW TO PLAY</div>
          <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Mono',monospace", lineHeight:1.9 }}>
            • Click a cell to cycle: empty → 🌕 → 🌙 → empty<br/>
            • Each row &amp; column must have <span style={{ color:"#888" }}>3 suns and 3 moons</span><br/>
            • No more than <span style={{ color:"#888" }}>2 in a row</span> vertically or horizontally<br/>
            • <span style={{ color:"#aaa" }}>=</span> between cells: must be the same · <span style={{ color:"#aaa" }}>×</span> between cells: must be opposite
          </div>
        </div>
      )}
    </div>
  );
}

export default TangoGame;
