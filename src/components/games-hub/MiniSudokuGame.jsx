import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  MINI SUDOKU GAME                                        ║
// ╚══════════════════════════════════════════════════════════╝

function sudokuBox(r, c) { return Math.floor(r / 2) * 3 + Math.floor(c / 3); }

function getMiniSudokuErrors(grid) {
  const errorCells = new Set();
  for (let r = 0; r < 6; r++) {
    const seen = {};
    for (let c = 0; c < 6; c++) { const v=grid[r][c]; if(!v) continue; if(seen[v]!==undefined){errorCells.add(`${r},${c}`);errorCells.add(`${r},${seen[v]}`);} else seen[v]=c; }
  }
  for (let c = 0; c < 6; c++) {
    const seen = {};
    for (let r = 0; r < 6; r++) { const v=grid[r][c]; if(!v) continue; if(seen[v]!==undefined){errorCells.add(`${r},${c}`);errorCells.add(`${seen[v]},${c}`);} else seen[v]=r; }
  }
  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 2; boxC++) {
      const seen = {};
      for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 3; dc++) {
        const r=boxR*2+dr, c=boxC*3+dc, v=grid[r][c], k=`${r},${c}`;
        if(!v) continue;
        if(seen[v]!==undefined){errorCells.add(k);errorCells.add(seen[v]);} else seen[v]=k;
      }
    }
  }
  return errorCells;
}

function generateSudoku(seed) {
  const rng = createRng(seedFromString("sudoku" + seed));
  const grid = Array.from({ length: 6 }, () => Array(6).fill(0));
  function isValid(g, r, c, n) {
    for (let i=0;i<6;i++) { if(g[r][i]===n||g[i][c]===n) return false; }
    const br=Math.floor(r/2)*2, bc=Math.floor(c/3)*3;
    for (let dr=0;dr<2;dr++) for (let dc=0;dc<3;dc++) if(g[br+dr][bc+dc]===n) return false;
    return true;
  }
  function fill(pos) {
    if (pos===36) return true;
    const r=Math.floor(pos/6), c=pos%6;
    const nums=shuffleWith([1,2,3,4,5,6],rng);
    for (const n of nums) { if(isValid(grid,r,c,n)){grid[r][c]=n;if(fill(pos+1))return true;grid[r][c]=0;} }
    return false;
  }
  fill(0);
  const solution = grid.map(row => [...row]);
  const positions = shuffleWith(Array.from({length:36},(_,i)=>[Math.floor(i/6),i%6]), rng);
  const puzzle = solution.map(row => [...row]);
  let removed = 0;
  for (const [r,c] of positions) { if(removed>=14) break; puzzle[r][c]=0; removed++; }
  return { puzzle, solution };
}

const SUDOKU_SEEDS = ["APEX-1","BOLT-2","CORE-3","DEEP-4","EDGE-5","FLUX-6","GRID-7","HAZE-8"];

function MiniSudokuGame({ onBack }) {
  const [seedIdx,    setSeedIdx]    = useState(0);
  const [puzzleData, setPuzzleData] = useState(null);
  const [grid,       setGrid]       = useState(null);
  const [givens,     setGivens]     = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [notesMode,  setNotesMode]  = useState(false);
  const [notes,      setNotes]      = useState({});
  const [history,    setHistory]    = useState([]);
  const [solved,     setSolved]     = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const [gameState,  setGameState]  = useState("idle");
  const [bestTime,   setBestTime]   = useState(null);
  const [isNewBest,  setIsNewBest]  = useState(false);
  const [hintFlash,  setHintFlash]  = useState(null);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  function initFromSeed(idx) {
    const seed = SUDOKU_SEEDS[idx % SUDOKU_SEEDS.length];
    const data = generateSudoku(seed);
    const givenSet = new Set();
    for (let r=0;r<6;r++) for (let c=0;c<6;c++) if(data.puzzle[r][c]!==0) givenSet.add(`${r},${c}`);
    setPuzzleData(data); setGrid(data.puzzle.map(row=>[...row])); setGivens(givenSet);
    setSelected(null); setNotesMode(false); setNotes({}); setHistory([]);
    setSolved(false); setElapsed(0); setGameState("idle"); setIsNewBest(false);
    startRef.current=null; clearInterval(timerRef.current);
  }

  useEffect(() => { initFromSeed(0); }, []);

  useEffect(() => {
    if (gameState==="playing") { timerRef.current=setInterval(()=>setElapsed(Date.now()-startRef.current),100); }
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  function startTimer() { if(gameState!=="idle") return; startRef.current=Date.now(); setGameState("playing"); }

  function newGame() { const next=(seedIdx+1)%SUDOKU_SEEDS.length; setSeedIdx(next); initFromSeed(next); }

  function resetGame() {
    if(!puzzleData) return;
    setGrid(puzzleData.puzzle.map(row=>[...row])); setNotes({}); setHistory([]);
    setSolved(false); setGameState("idle"); setElapsed(0); startRef.current=null; clearInterval(timerRef.current); setSelected(null);
  }

  function saveHistory(g, n) { setHistory(prev=>[...prev.slice(-30),{grid:g.map(r=>[...r]),notes:{...n}}]); }

  function handleCellClick(r, c) { setSelected(`${r},${c}`); }

  function handleNumberInput(num) {
    if(!selected||solved) return;
    const [r,c]=selected.split(",").map(Number);
    if(givens.has(selected)) return;
    startTimer();
    if(notesMode) {
      saveHistory(grid,notes);
      const prev=notes[selected]?new Set(notes[selected]):new Set();
      if(prev.has(num)) prev.delete(num); else prev.add(num);
      setNotes({...notes,[selected]:prev}); return;
    }
    saveHistory(grid,notes);
    const ng=grid.map(row=>[...row]); ng[r][c]=ng[r][c]===num?0:num;
    const nn={...notes}; delete nn[selected]; setNotes(nn); setGrid(ng);
    if(ng.every((row,ri)=>row.every((v,ci)=>v===puzzleData.solution[ri][ci]))) {
      const t=Date.now()-startRef.current; setSolved(true); setGameState("done");
      const nb=!bestTime||t<bestTime; setIsNewBest(nb); if(nb) setBestTime(t);
    }
  }

  function handleErase() {
    if(!selected||solved) return;
    const [r,c]=selected.split(",").map(Number);
    if(givens.has(selected)) return;
    startTimer(); saveHistory(grid,notes);
    const ng=grid.map(row=>[...row]); ng[r][c]=0;
    const nn={...notes}; delete nn[selected]; setNotes(nn); setGrid(ng);
  }

  function handleUndo() {
    if(history.length===0) return;
    const prev=history[history.length-1]; setGrid(prev.grid); setNotes(prev.notes); setHistory(h=>h.slice(0,-1));
  }

  function handleHint() {
    if(!selected||solved||!puzzleData) return;
    const [r,c]=selected.split(",").map(Number);
    if(givens.has(selected)) return;
    const answer=puzzleData.solution[r][c];
    saveHistory(grid,notes);
    const ng=grid.map(row=>[...row]); ng[r][c]=answer;
    const nn={...notes}; delete nn[selected]; setNotes(nn); setGrid(ng);
    setHintFlash(selected); setTimeout(()=>setHintFlash(null),800); startTimer();
    let found=false;
    for(let i=0;i<36&&!found;i++){const nr=Math.floor(i/6),nc=i%6;if(ng[nr][nc]===0&&!givens.has(`${nr},${nc}`)){setSelected(`${nr},${nc}`);found=true;}}
    if(ng.every((row,ri)=>row.every((v,ci)=>v===puzzleData.solution[ri][ci]))){
      const t=Date.now()-startRef.current; setSolved(true); setGameState("done");
      const nb=!bestTime||t<bestTime; setIsNewBest(nb); if(nb) setBestTime(t);
    }
  }

  useEffect(() => {
    function onKey(e) {
      const n=parseInt(e.key);
      if(n>=1&&n<=6){handleNumberInput(n);return;}
      if(e.key==="Backspace"||e.key==="Delete"){handleErase();return;}
      if(!selected) return;
      const [r,c]=selected.split(",").map(Number);
      const moves={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
      if(moves[e.key]){const[dr,dc]=moves[e.key];setSelected(`${Math.max(0,Math.min(5,r+dr))},${Math.max(0,Math.min(5,c+dc))}`);e.preventDefault();}
    }
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[selected,grid,notes,notesMode,givens,solved,puzzleData]);

  if(!grid||!givens||!puzzleData) return null;

  const errors=solved?new Set():getMiniSudokuErrors(grid);
  const selR=selected?Number(selected.split(",")[0]):-1;
  const selC=selected?Number(selected.split(",")[1]):-1;
  const selVal=selected?grid[selR]?.[selC]:0;
  const selBox=selected?sudokuBox(selR,selC):-1;
  const numCount=Array(7).fill(0);
  for(let r=0;r<6;r++) for(let c=0;c<6;c++) if(grid[r][c]) numCount[grid[r][c]]++;
  const CELL=Math.min(52,Math.floor((Math.min(360,window.innerWidth-32))/6));
  const ACCENT="#4a9080";

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",background:"#0e0e0e",paddingBottom:20}} className="page-enter">
      <style>{`
        .sdk-cell{display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:background 0.08s;flex-shrink:0;user-select:none;}
        .sdk-cell:active{filter:brightness(1.3);}
        @keyframes hintPop{0%{transform:scale(0.6);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        .hint-pop{animation:hintPop 0.35s ease;}
      `}</style>
      <div style={{width:"100%",maxWidth:440,display:"flex",alignItems:"center",padding:"16px 16px 12px",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"1.5px solid #2a2a2a",borderRadius:8,padding:"7px 14px",color:"#888",fontSize:12,fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}}
          onMouseEnter={e=>e.target.style.borderColor="#555"} onMouseLeave={e=>e.target.style.borderColor="#2a2a2a"}>← HUB</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:"#f0ede8",lineHeight:1}}>Mini Sudoku</div>
          <div style={{fontSize:10,color:"#444",letterSpacing:"0.2em",marginTop:2,fontFamily:"'DM Mono',monospace"}}>6×6 PUZZLE</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,color:solved?"#a0c8a0":gameState==="playing"?"#f0ede8":"#222"}}>
            {formatTime(solved||gameState==="playing"?elapsed:null)}
          </div>
          {bestTime&&<div style={{fontSize:9,color:"#333",fontFamily:"'DM Mono',monospace",marginTop:2}}>BEST {formatTime(bestTime)}</div>}
        </div>
      </div>
      <div style={{width:"100%",maxWidth:440,display:"flex",gap:8,padding:"0 16px 12px",alignItems:"center"}}>
        <button onClick={handleHint} disabled={!selected||givens.has(selected)||solved}
          style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"transparent",border:`1.5px solid ${!selected||givens.has(selected)||solved?"#1e1e1e":"#3a3a3a"}`,color:!selected||givens.has(selected)||solved?"#2a2a2a":"#888",cursor:!selected||givens.has(selected)||solved?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span style={{fontSize:14}}>💡</span> Hint
        </button>
        <button onClick={()=>setNotesMode(m=>!m)}
          style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:notesMode?"rgba(74,144,128,0.12)":"transparent",border:`1.5px solid ${notesMode?ACCENT:"#3a3a3a"}`,color:notesMode?ACCENT:"#888",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span style={{fontSize:14}}>✏️</span> Notes {notesMode?"ON":"OFF"}
        </button>
        <button onClick={resetGame} style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"transparent",border:"1.5px solid #3a3a3a",color:"#888",cursor:"pointer"}}>Reset</button>
        <button onClick={newGame} style={{flex:1,padding:"9px 0",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"transparent",border:"1.5px solid #3a3a3a",color:"#888",cursor:"pointer"}}>New</button>
      </div>
      <div style={{padding:"0 16px",width:"100%",maxWidth:440}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(6,${CELL}px)`,border:"2px solid #555",borderRadius:4,overflow:"hidden",width:CELL*6,margin:"0 auto"}}>
          {Array.from({length:6},(_,r)=>Array.from({length:6},(_,c)=>{
            const key=`${r},${c}`,val=grid[r][c],isGivenCell=givens.has(key),isSel=key===selected;
            const isErr=errors.has(key),isHinted=key===hintFlash;
            const isPeer=selected&&!isSel&&(selR===r||selC===c||sudokuBox(r,c)===selBox);
            const isSameVal=selected&&selVal&&val===selVal&&!isSel;
            const cellNotes=notes[key];
            const borderRight=c<5?(c===2?"2px solid #555":"1px solid #2a2a2a"):"none";
            const borderBottom=r<5?(r===1||r===3?"2px solid #555":"1px solid #2a2a2a"):"none";
            let bg="#141414";
            if(isGivenCell) bg="#1e1e1e";
            if(isPeer) bg="#1a1a28";
            if(isSameVal) bg="#1e2e1e";
            if(isSel) bg="#1e3040";
            if(isErr) bg="#2a1218";
            if(solved) bg=isGivenCell?"#162216":"#111a11";
            return(
              <div key={key} className={`sdk-cell${isHinted?" hint-pop":""}`}
                onClick={()=>handleCellClick(r,c)}
                style={{width:CELL,height:CELL,background:bg,borderRight,borderBottom,outline:isSel?`2px solid ${ACCENT}`:"none",outlineOffset:"-2px",zIndex:isSel?2:1}}>
                {val?(
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:CELL*0.46,fontWeight:700,lineHeight:1,
                    color:isErr?"#e06060":solved?ACCENT:isGivenCell?"#d0d0d0":isSameVal?"#80c880":ACCENT,pointerEvents:"none"}}>{val}</span>
                ):cellNotes&&cellNotes.size>0?(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gridTemplateRows:"repeat(2,1fr)",width:"100%",height:"100%",padding:2,pointerEvents:"none"}}>
                    {[1,2,3,4,5,6].map(n=>(
                      <div key={n} style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {cellNotes.has(n)&&<span style={{fontSize:CELL*0.22,color:"#5a8a7a",fontFamily:"'DM Mono',monospace",lineHeight:1}}>{n}</span>}
                      </div>
                    ))}
                  </div>
                ):null}
              </div>
            );
          }))}
        </div>
      </div>
      <div style={{width:"100%",maxWidth:440,padding:"14px 16px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
          {[1,2,3].map(n=>(
            <button key={n} onClick={()=>handleNumberInput(n)}
              style={{height:64,borderRadius:12,fontSize:26,fontFamily:"'Playfair Display',serif",fontWeight:700,
                background:numCount[n]>=6?"#111":"#1e1e1e",border:`1.5px solid ${numCount[n]>=6?"#1a1a1a":"#2a2a2a"}`,
                color:numCount[n]>=6?"#2a2a2a":selVal===n?ACCENT:"#d0d0d0",cursor:numCount[n]>=6?"default":"pointer"}}>{n}</button>
          ))}
          <button onClick={handleErase} style={{height:64,borderRadius:12,fontSize:13,fontFamily:"'DM Mono',monospace",background:"#1e1e1e",border:"1.5px solid #2a2a2a",color:"#777",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
            <span style={{fontSize:20,lineHeight:1}}>×</span><span style={{fontSize:10}}>Erase</span>
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
          {[4,5,6].map(n=>(
            <button key={n} onClick={()=>handleNumberInput(n)}
              style={{height:64,borderRadius:12,fontSize:26,fontFamily:"'Playfair Display',serif",fontWeight:700,
                background:numCount[n]>=6?"#111":"#1e1e1e",border:`1.5px solid ${numCount[n]>=6?"#1a1a1a":"#2a2a2a"}`,
                color:numCount[n]>=6?"#2a2a2a":selVal===n?ACCENT:"#d0d0d0",cursor:numCount[n]>=6?"default":"pointer"}}>{n}</button>
          ))}
          <button onClick={handleUndo} disabled={history.length===0}
            style={{height:64,borderRadius:12,fontSize:13,fontFamily:"'DM Mono',monospace",background:"#1e1e1e",border:`1.5px solid ${history.length===0?"#1a1a1a":"#2a2a2a"}`,color:history.length===0?"#2a2a2a":"#777",cursor:history.length===0?"default":"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
            <span style={{fontSize:18,lineHeight:1}}>↺</span><span style={{fontSize:10}}>Undo</span>
          </button>
        </div>
      </div>
      {solved&&(
        <div style={{margin:"20px 16px 0",width:"calc(100% - 32px)",maxWidth:408,background:"rgba(74,144,128,0.1)",border:"1.5px solid rgba(74,144,128,0.3)",borderRadius:14,padding:"20px 24px",textAlign:"center",animation:"slideUp 0.35s ease"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:isNewBest?"#c8a060":ACCENT,marginBottom:4}}>{isNewBest?"New Best!":"Solved!"}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:28,color:"#f0ede8",marginBottom:14}}>{formatTime(elapsed)}</div>
          <button onClick={newGame} style={{padding:"10px 28px",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"#f0ede8",color:"#0e0e0e",border:"none",cursor:"pointer",fontWeight:500}}>NEW PUZZLE</button>
        </div>
      )}
    </div>
  );
}

export default MiniSudokuGame;
