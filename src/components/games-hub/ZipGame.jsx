import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  ZIP GAME (migrated & themed)                           ║
// ╚══════════════════════════════════════════════════════════╝

function cellKey(r, c) { return `${r},${c}`; }
function parseKey(k) { const [r, c] = k.split(",").map(Number); return { r, c }; }
function wallKey(r1, c1, r2, c2) {
  const a = cellKey(r1, c1), b = cellKey(r2, c2);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

function dotsForSize(s) { return { 5:5, 6:6, 7:8, 8:10 }[s] ?? 6; }

function generateZipPuzzle(seedStr, size = 6, wallDensity = 0.35) {
  const seed = seedFromString(seedStr + size);
  const rng  = createRng(seed);
  const NUM_DOTS = dotsForSize(size), TOTAL = size * size;

  function tryPath() {
    const sr = Math.floor(rng() * size), sc = Math.floor(rng() * size);
    const path = [{ r: sr, c: sc }];
    const visited = new Set([cellKey(sr, sc)]);
    function dfs(r, c) {
      if (path.length === TOTAL) return true;
      for (const [dr, dc] of shuffleWith(DIRS, rng)) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const k = cellKey(nr, nc);
        if (visited.has(k)) continue;
        visited.add(k); path.push({ r: nr, c: nc });
        if (dfs(nr, nc)) return true;
        visited.delete(k); path.pop();
      }
      return false;
    }
    return dfs(sr, sc) ? path : null;
  }

  let solution = null;
  for (let i = 0; i < 400 && !solution; i++) solution = tryPath();
  if (!solution) return null;

  const step = Math.floor((TOTAL - 1) / (NUM_DOTS - 1));
  const dotIndices = Array.from({ length: NUM_DOTS - 1 }, (_, i) => i * step);
  dotIndices.push(TOTAL - 1);
  const dots = dotIndices.map((idx, i) => ({ number: i + 1, r: solution[idx].r, c: solution[idx].c }));

  const solutionEdges = new Set();
  for (let i = 1; i < solution.length; i++) {
    const { r: r1, c: c1 } = solution[i - 1], { r: r2, c: c2 } = solution[i];
    solutionEdges.add(wallKey(r1, c1, r2, c2));
  }
  const rng3 = createRng(seed + 2);
  const walls = new Set();
  const candidates = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      for (const [dr, dc] of [[0,1],[1,0]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= size || nc >= size) continue;
        const wk = wallKey(r, c, nr, nc);
        if (!solutionEdges.has(wk)) candidates.push(wk);
      }
  const shuffled = shuffleWith(candidates, rng3);
  for (let i = 0; i < Math.floor(shuffled.length * wallDensity); i++) walls.add(shuffled[i]);

  return { size, total: TOTAL, dots, walls, solution, seed: seedStr };
}

const ZIP_ADJECTIVES = ["FAST","BOLD","DARK","NEON","WILD","IRON","GOLD","BLUE","CYAN","VOID","DEEP","KEEN","APEX","FLUX","GRID"];
const ZIP_NOUNS = ["PATH","LOOP","NODE","WIRE","LINK","MAZE","GRID","FLOW","TIDE","SPARK","BOLT","RING","ARC","CORE"];
function randomZipSeed() {
  const rng = createRng(Date.now() ^ (Math.random() * 0xffffffff));
  return `${ZIP_ADJECTIVES[Math.floor(rng() * ZIP_ADJECTIVES.length)]}-${ZIP_NOUNS[Math.floor(rng() * ZIP_NOUNS.length)]}-${Math.floor(rng() * 9000) + 1000}`;
}

function buildZipPath(pathKeys, CELL, TC) {
  const r = CELL * 0.38;
  if (pathKeys.length < 2) return "";
  const pts = pathKeys.map(k => { const { r: row, c: col } = parseKey(k); return { x: col * TC + CELL / 2, y: row * TC + CELL / 2 }; });
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[i-1], curr = pts[i], next = pts[i+1];
    if (i === 0) { d += next ? `M ${curr.x} ${curr.y} L ${curr.x+(next.x-curr.x)*0.5} ${curr.y+(next.y-curr.y)*0.5}` : `M ${curr.x} ${curr.y}`; continue; }
    if (!next) { d += ` L ${curr.x} ${curr.y}`; continue; }
    const dxIn = curr.x-prev.x, dyIn = curr.y-prev.y, dxOut = next.x-curr.x, dyOut = next.y-curr.y;
    const lenIn = Math.sqrt(dxIn*dxIn+dyIn*dyIn)||1, lenOut = Math.sqrt(dxOut*dxOut+dyOut*dyOut)||1;
    const dot = (dxIn/lenIn)*(dxOut/lenOut)+(dyIn/lenIn)*(dyOut/lenOut);
    if (Math.abs(dot-1)<0.001) { d += ` L ${curr.x} ${curr.y}`; continue; }
    const cr = Math.min(r, lenIn*0.5, lenOut*0.5);
    d += ` L ${curr.x-(dxIn/lenIn)*cr} ${curr.y-(dyIn/lenIn)*cr} Q ${curr.x} ${curr.y} ${curr.x+(dxOut/lenOut)*cr} ${curr.y+(dyOut/lenOut)*cr}`;
  }
  return d;
}

function ZipGame({ onBack }) {
  const [zipSettings, setZipSettings] = useState({ size: 6, wallDensity: 0.35 });
  const [puzzle, setPuzzle] = useState(null);
  const [currentSeed, setCurrentSeed] = useState("");
  const [playerPath, setPlayerPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameState, setGameState] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const [finalTime, setFinalTime] = useState(null);
  const [bestTimes, setBestTimes] = useState({});
  const [isNewBest, setIsNewBest] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const [showSeedPanel, setShowSeedPanel] = useState(false);
  const [badSeed, setBadSeed] = useState(false);
  const [copied, setCopied] = useState(false);

  const timerRef = useRef(null);
  const playerPathRef = useRef([]);
  const dotMapRef = useRef({});
  const puzzleRef = useRef(null);
  const startTimeRef = useRef(null);
  const settingsRef = useRef(zipSettings);
  useEffect(() => { settingsRef.current = zipSettings; }, [zipSettings]);

  const CELL = Math.floor((Math.min(360, window.innerWidth - 80)) / zipSettings.size);
  const GAP = 4;
  const TC = CELL + GAP;

  function loadZipPuzzle(seed, overrideSettings) {
    const s = overrideSettings ?? settingsRef.current;
    const p = generateZipPuzzle(seed, s.size, s.wallDensity);
    if (!p) return false;
    const dm = {};
    p.dots.forEach(d => { dm[cellKey(d.r, d.c)] = d; });
    dotMapRef.current = dm; puzzleRef.current = p;
    setPuzzle(p); setCurrentSeed(seed);
    setPlayerPath([]); playerPathRef.current = [];
    setIsDrawing(false); setGameState("idle");
    startTimeRef.current = null; setElapsed(0); setFinalTime(null); setIsNewBest(false); setWrongFlash(false);
    return true;
  }

  const newZipGame = useCallback((overrideSettings) => { loadZipPuzzle(randomZipSeed(), overrideSettings); }, []);
  useEffect(() => { newZipGame(); }, []);

  useEffect(() => {
    if (gameState === "playing") { timerRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 30); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  function isWalled(r1, c1, r2, c2) { return puzzleRef.current?.walls.has(wallKey(r1,c1,r2,c2)) ?? false; }
  function getZipDotOrder(path) { const dm = dotMapRef.current; return path.filter(k => dm[k]).map(k => dm[k].number); }
  function checkZipCompletion(path) {
    const p = puzzleRef.current;
    if (!p || path.length !== p.total) return false;
    const order = getZipDotOrder(path);
    if (order.length !== p.dots.length) return false;
    return order.every((n, i) => n === i + 1);
  }

  function tryAddZipCell(r, c, currentPath) {
    const p = puzzleRef.current; if (!p) return currentPath;
    const k = cellKey(r, c);
    const pathSet = new Set(currentPath);
    if (currentPath.length >= 2 && k === currentPath[currentPath.length - 2]) return currentPath.slice(0, -1);
    if (pathSet.has(k)) return currentPath;
    if (currentPath.length > 0) {
      const { r: lr, c: lc } = parseKey(currentPath[currentPath.length - 1]);
      if (Math.abs(r - lr) + Math.abs(c - lc) !== 1) return currentPath;
      if (isWalled(lr, lc, r, c)) { setWrongFlash(true); setTimeout(() => setWrongFlash(false), 400); return currentPath; }
    }
    const dm = dotMapRef.current;
    if (dm[k]) {
      const nextExp = getZipDotOrder(currentPath).length + 1;
      if (dm[k].number !== nextExp) { setWrongFlash(true); setTimeout(() => setWrongFlash(false), 400); return currentPath; }
    }
    const newPath = [...currentPath, k];
    if (checkZipCompletion(newPath)) {
      const tt = Date.now() - startTimeRef.current;
      setFinalTime(tt); setGameState("done"); setIsDrawing(false);
      const seed = puzzleRef.current.seed;
      setBestTimes(prev => { const nb = !prev[seed] || tt < prev[seed]; setIsNewBest(nb); return nb ? { ...prev, [seed]: tt } : prev; });
    }
    return newPath;
  }

  function handleZipCellDown(r, c) {
    const p = puzzleRef.current;
    if (!p || gameState === "done") return;
    const k = cellKey(r, c);
    if (dotMapRef.current[k]?.number === 1) {
      if (gameState === "idle") { startTimeRef.current = Date.now(); setElapsed(0); setGameState("playing"); }
      playerPathRef.current = [k]; setPlayerPath([k]); setIsDrawing(true);
    } else if (playerPathRef.current.length > 0 && k === playerPathRef.current[playerPathRef.current.length - 1]) {
      setIsDrawing(true);
    }
  }

  function handleZipCellEnter(r, c) {
    if (!isDrawing || gameState === "done") return;
    const np = tryAddZipCell(r, c, playerPathRef.current);
    playerPathRef.current = np; setPlayerPath([...np]);
  }

  function getTouchCell(e) {
    const touch = e.touches[0] || e.changedTouches[0]; if (!touch) return null;
    const el = document.elementFromPoint(touch.clientX, touch.clientY); if (!el) return null;
    const r = el.getAttribute("data-r"), c = el.getAttribute("data-c");
    if (r === null || c === null) return null;
    return { r: Number(r), c: Number(c) };
  }

  function handleLoadSeed() {
    const s = seedInput.trim().toUpperCase(); if (!s) return;
    if (!loadZipPuzzle(s)) { setBadSeed(true); setTimeout(() => setBadSeed(false), 1500); }
    else { setSeedInput(""); setShowSeedPanel(false); }
  }

  if (!puzzle) return <div style={{ color: "#f0ede8", padding: 40 }}>Generating…</div>;

  const pathSet = new Set(playerPath);
  const dm = dotMapRef.current;
  const dotOrder = getZipDotOrder(playerPath);
  const nextDotExp = dotOrder.length + 1;
  const fillPct = Math.round(playerPath.length / puzzle.total * 100);
  const bestTime = bestTimes[currentSeed] ?? null;
  const SIZE = puzzle.size;
  const pathD = buildZipPath(playerPath, CELL, TC);
  const wallLines = [];
  puzzle.walls.forEach(wk => {
    const [a, b] = wk.split("|");
    const { r: r1, c: c1 } = parseKey(a), { r: r2, c: c2 } = parseKey(b);
    const mx = ((c1+c2)/2)*TC+CELL/2, my = ((r1+r2)/2)*TC+CELL/2;
    if (r1 === r2) wallLines.push({ x1: mx, y1: my-CELL*0.44, x2: mx, y2: my+CELL*0.44 });
    else wallLines.push({ x1: mx-CELL*0.44, y1: my, x2: mx+CELL*0.44, y2: my });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "20px 16px", background: "#0e0e0e", userSelect: "none" }} onMouseUp={() => setIsDrawing(false)} onTouchEnd={() => setIsDrawing(false)} className="page-enter">
      <style>{`
        .zip-cell { width:${CELL}px;height:${CELL}px;background:#111;border-radius:${Math.max(4,CELL*0.14)}px;border:1px solid #1a1a1a;cursor:crosshair;transition:background 0.08s; }
        .zip-cell.active { background:#1a1020; }
        .zip-cell.flash { background:#2a0f18!important; }
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", alignItems: "center", marginBottom: 20, gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "1.5px solid #2a2a2a", borderRadius: 8, padding: "7px 14px", color: "#888", fontSize: 12, fontFamily: "'DM Mono',monospace", letterSpacing: "0.06em" }}
          onMouseEnter={e=>e.target.style.borderColor="#555"} onMouseLeave={e=>e.target.style.borderColor="#2a2a2a"}>
          ← HUB
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 900, color: "#f0ede8", lineHeight: 1 }}>Zip</div>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.2em", marginTop: 2, fontFamily: "'DM Mono',monospace" }}>FILL EVERY CELL</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {bestTime && <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono',monospace" }}>BEST</div>}
          {bestTime && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, color: "#a0c8a0" }}>{formatTimeFull(bestTime)}</div>}
        </div>
      </div>

      {/* Size selector */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", gap: 6, marginBottom: 12 }}>
        {[5,6,7,8].map(s => (
          <button key={s} onClick={() => { const ns = { ...zipSettings, size: s }; setZipSettings(ns); newZipGame(ns); }}
            style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 11, fontFamily: "'DM Mono',monospace", border: `1.5px solid ${zipSettings.size===s?"#c0392b":"#2a2a2a"}`, background: zipSettings.size===s?"rgba(192,57,43,0.1)":"transparent", color: zipSettings.size===s?"#e74c3c":"#555", cursor:"pointer", transition:"all 0.12s" }}>
            {s}×{s}
          </button>
        ))}
        <button onClick={() => newZipGame()}
          style={{ flex:1, padding:"7px 0", borderRadius:8, fontSize:11, fontFamily:"'DM Mono',monospace", border:"1.5px solid #2a2a2a", background:"transparent", color:"#888", cursor:"pointer" }}>
          NEW
        </button>
      </div>

      {/* Seed row */}
      <div style={{ width:"100%", maxWidth:420, marginBottom:12 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div onClick={() => setShowSeedPanel(p=>!p)} style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"#111", border:"1px solid #1e1e1e", borderRadius:8, padding:"6px 12px", cursor:"pointer", overflow:"hidden" }}>
            <span style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace" }}>SEED</span>
            <span style={{ fontSize:11, color:"#555", fontFamily:"'DM Mono',monospace", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{currentSeed}</span>
            <span style={{ fontSize:9, color:"#333", marginLeft:"auto" }}>{showSeedPanel?"▲":"▼"}</span>
          </div>
          <button onClick={() => navigator.clipboard.writeText(currentSeed).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);})}
            style={{ padding:"6px 12px", borderRadius:8, fontSize:10, fontFamily:"'DM Mono',monospace", background:"#111", border:"1px solid #1e1e1e", color:copied?"#a0c8a0":"#555", cursor:"pointer" }}>
            {copied?"✓":"COPY"}
          </button>
        </div>
        {showSeedPanel && (
          <div style={{ marginTop:8, background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:14 }}>
            <div style={{ display:"flex", gap:8 }}>
              <input value={seedInput} onChange={e=>setSeedInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&handleLoadSeed()}
                placeholder="e.g. FAST-PATH-4291" style={{ flex:1, background:"#0e0e0e", border:`1px solid ${badSeed?"#c0392b":"#1e1e1e"}`, borderRadius:7, padding:"7px 10px", color:"#f0ede8", fontSize:11, fontFamily:"'DM Mono',monospace", outline:"none" }} />
              <button onClick={handleLoadSeed} style={{ padding:"7px 14px", borderRadius:8, fontSize:11, fontFamily:"'DM Mono',monospace", background:"#c8a060", border:"none", color:"#0e0e0e", cursor:"pointer", fontWeight:500 }}>LOAD</button>
            </div>
            {badSeed && <div style={{ fontSize:9, color:"#c0392b", marginTop:6, fontFamily:"'DM Mono',monospace" }}>Couldn't generate — try another seed.</div>}
          </div>
        )}
      </div>

      {/* Timer + progress */}
      <div style={{ width:"100%", maxWidth:420, marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, lineHeight:1, color: gameState==="done"?"#a0c8a0":gameState==="playing"?"#f0ede8":"#222" }}>
          {gameState==="done"?formatTimeFull(finalTime):formatTimeFull(gameState==="playing"?elapsed:null)}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ height:3, background:"#1a1a1a", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${fillPct}%`, background:"#c0392b", borderRadius:2, transition:"width 0.1s" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace" }}>
            <span>{playerPath.length}/{puzzle.total} CELLS</span>
            <span>{gameState==="playing"&&nextDotExp<=puzzle.dots.length?`→ DOT ${nextDotExp}`:gameState==="done"?"ALL FILLED ✓":""}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${SIZE},${CELL}px)`, gap:`${GAP}px`, padding:10, background:"#0a0a0a", borderRadius:14, border:"1px solid #1a1a1a", marginBottom:14, position:"relative" }}
        onMouseLeave={()=>setIsDrawing(false)}
        onTouchMove={e=>{e.preventDefault();const cell=getTouchCell(e);if(cell)handleZipCellEnter(cell.r,cell.c);}}
        onTouchStart={e=>{const cell=getTouchCell(e);if(cell)handleZipCellDown(cell.r,cell.c);}}>

        <svg style={{ position:"absolute", top:10, left:10, pointerEvents:"none", zIndex:5 }} width={SIZE*TC-GAP} height={SIZE*TC-GAP}>
          {playerPath.length>=2&&<path d={pathD} fill="none" stroke="#1a0820" strokeWidth={CELL*0.60} strokeLinecap="round" strokeLinejoin="round"/>}
          {playerPath.length>=2&&<path d={pathD} fill="none" stroke="#c0392b" strokeWidth={CELL*0.50} strokeLinecap="round" strokeLinejoin="round"/>}
          {wallLines.map((w,i)=><line key={i} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#c8a060" strokeWidth={Math.max(3,CELL*0.08)} strokeLinecap="round" opacity="0.9"/>)}
          {puzzle.dots.map(dot=>{
            const cx=dot.c*TC+CELL/2, cy=dot.r*TC+CELL/2, R=CELL*0.30;
            const visited=pathSet.has(cellKey(dot.r,dot.c));
            const isNext=!visited&&dot.number===nextDotExp&&gameState==="playing";
            const ringColor=visited?"#e74c3c":isNext?"#c8a060":"#2a2a2a";
            const textColor=visited?"#fff":isNext?"#c8a060":"#444";
            return (
              <g key={`dot-${dot.number}`}>
                <circle cx={cx} cy={cy} r={R} fill="#0e0e0e" stroke={ringColor} strokeWidth={visited||isNext?2.5:1.5}/>
                <circle cx={cx} cy={cy} r={R-1.5} fill="#b91c1c" style={{transformOrigin:`${cx}px ${cy}px`,transform:visited?"scale(1)":"scale(0)",transition:visited?"transform 0.22s cubic-bezier(0.34,1.56,0.64,1)":"none"}}/>
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={dot.number>=10?R*0.9:R*1.1} fontWeight="800" fontFamily="'Playfair Display',serif" fill={textColor} style={{userSelect:"none",pointerEvents:"none",transition:"fill 0.18s"}}>{dot.number}</text>
                {isNext&&<circle cx={cx} cy={cy} r={R+3} fill="none" stroke="#c8a060" strokeWidth={1.5} opacity="0.4"><animate attributeName="r" values={`${R+2};${R+8};${R+2}`} dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="1.2s" repeatCount="indefinite"/></circle>}
              </g>
            );
          })}
        </svg>

        {Array.from({length:SIZE},(_,r)=>Array.from({length:SIZE},(_,c)=>{
          const k=cellKey(r,c), inPath=pathSet.has(k);
          return <div key={k} data-r={r} data-c={c} className={`zip-cell${inPath?" active":""}${wrongFlash&&!inPath?" flash":""}`}
            onMouseDown={()=>handleZipCellDown(r,c)} onMouseEnter={()=>handleZipCellEnter(r,c)}/>;
        }))}
      </div>

      {/* Controls */}
      <div style={{ display:"flex", gap:8, width:"100%", maxWidth:420, marginBottom:14 }}>
        <button onClick={()=>{const np=playerPathRef.current.length<=1?[]:playerPathRef.current.slice(0,-1);playerPathRef.current=np;setPlayerPath([...np]);}} disabled={playerPath.length===0}
          style={{ flex:1, padding:"10px 0", borderRadius:9, fontSize:11, fontFamily:"'DM Mono',monospace", background:"#111", border:"1px solid #1e1e1e", color:"#555", cursor:"pointer", opacity:playerPath.length===0?0.3:1 }}>UNDO</button>
        <button onClick={()=>{playerPathRef.current=[];setPlayerPath([]);}} disabled={playerPath.length===0}
          style={{ flex:1, padding:"10px 0", borderRadius:9, fontSize:11, fontFamily:"'DM Mono',monospace", background:"#111", border:"1px solid #1e1e1e", color:"#555", cursor:"pointer", opacity:playerPath.length===0?0.3:1 }}>RESET</button>
        <button onClick={()=>newZipGame()}
          style={{ flex:1, padding:"10px 0", borderRadius:9, fontSize:11, fontFamily:"'DM Mono',monospace", background:"#111", border:"1px solid #1e1e1e", color:"#888", cursor:"pointer" }}>NEW</button>
      </div>

      {/* Done card */}
      {gameState==="done"&&(
        <div style={{ width:"100%", maxWidth:420, background:"#111", border:"1px solid #1e1e1e", borderRadius:14, padding:22, textAlign:"center", animation:"slideUp 0.35s ease" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:isNewBest?"#c8a060":"#f0ede8", marginBottom:4 }}>{isNewBest?"New Best!":"Complete"}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:36, color:"#a0c8a0", fontWeight:500, marginBottom:12 }}>{formatTimeFull(finalTime)}</div>
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button onClick={()=>newZipGame()} style={{ padding:"10px 22px", borderRadius:9, fontSize:12, fontFamily:"'DM Mono',monospace", background:"#f0ede8", color:"#0e0e0e", border:"none", cursor:"pointer", fontWeight:500 }}>NEW PUZZLE</button>
            <button onClick={()=>loadZipPuzzle(currentSeed)} style={{ padding:"10px 22px", borderRadius:9, fontSize:12, fontFamily:"'DM Mono',monospace", background:"transparent", border:"1px solid #2a2a2a", color:"#888", cursor:"pointer" }}>RETRY</button>
          </div>
        </div>
      )}

      {gameState==="idle"&&(
        <div style={{ width:"100%", maxWidth:420, background:"#111", border:"1px solid #1a1a1a", borderRadius:12, padding:"14px 18px" }}>
          <div style={{ fontSize:9, color:"#333", letterSpacing:"0.2em", marginBottom:10, fontFamily:"'DM Mono',monospace" }}>HOW TO PLAY</div>
          <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Mono',monospace", lineHeight:1.85 }}>
            • <span style={{color:"#c8a060"}}>Click & drag</span> from dot 1 to draw your path<br/>
            • Connect all dots in order: 1 → 2 → 3 → …<br/>
            • Fill <span style={{color:"#c0392b"}}>every cell</span> — cover the whole grid<br/>
            • <span style={{color:"#c8a060"}}>Gold lines</span> are walls — you cannot cross them<br/>
            • Drag back over your path to erase
          </div>
        </div>
      )}
    </div>
  );
}

export default ZipGame;
