import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  PATCHES GAME                                            ║
// ╚══════════════════════════════════════════════════════════╝

const PATCH_COLORS = [
  { bg:"#2196f3" }, { bg:"#f59e0b" }, { bg:"#10b981" }, { bg:"#8b5cf6" },
  { bg:"#ef4444" }, { bg:"#06b6d4" }, { bg:"#f97316" }, { bg:"#6366f1" },
  { bg:"#64748b" }, { bg:"#ec4899" },
];
function patchColor(idx) { return PATCH_COLORS[idx % PATCH_COLORS.length] ?? PATCH_COLORS[0]; }

function ShapeIcon({ type, size = 14, color = "currentColor" }) {
  const s = size;
  if (type === "square") return <svg width={s} height={s} viewBox="0 0 10 10" style={{display:"block"}}><rect x="1" y="1" width="8" height="8" rx="1" fill={color} /></svg>;
  if (type === "wide")   return <svg width={s} height={s*0.6} viewBox="0 0 14 8" style={{display:"block"}}><rect x="0.5" y="0.5" width="13" height="7" rx="1" fill={color} /></svg>;
  if (type === "tall")   return <svg width={s*0.6} height={s} viewBox="0 0 8 14" style={{display:"block"}}><rect x="0.5" y="0.5" width="7" height="13" rx="1" fill={color} /></svg>;
  return <svg width={s} height={s} viewBox="0 0 10 10" style={{display:"block"}}><rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="2,1.5" /></svg>;
}

function checkRegionValid(cells, size, shapeType) {
  if (cells.length !== size) return false;
  const rows=cells.map(k=>Number(k.split(",")[0])), cols=cells.map(k=>Number(k.split(",")[1]));
  const minR=Math.min(...rows),maxR=Math.max(...rows),minC=Math.min(...cols),maxC=Math.max(...cols);
  const h=maxR-minR+1, w=maxC-minC+1;
  if (h*w !== size) return false;
  const cs=new Set(cells);
  for(let r=minR;r<=maxR;r++) for(let c=minC;c<=maxC;c++) if(!cs.has(`${r},${c}`)) return false;
  if (shapeType==="square"&&h!==w) return false;
  if (shapeType==="wide"&&w<=h) return false;
  if (shapeType==="tall"&&h<=w) return false;
  return true;
}

const PATCH_ADJECTIVES = ["BOLD","FAST","DEEP","NEON","IRON","GOLD","CYAN","DARK","KEEN","APEX","WIDE","TALL","SOFT","WARM","COOL"];
const PATCH_NOUNS      = ["GRID","TILE","PATCH","FILL","BLOCK","RECT","ZONE","AREA","FORM","PANE","SLICE","PIECE","SLAB","QUAD"];

function randomPatchSeed() {
  const rng=createRng(Date.now()^(Math.random()*0xffffffff));
  const adj=PATCH_ADJECTIVES[Math.floor(rng()*PATCH_ADJECTIVES.length)];
  const noun=PATCH_NOUNS[Math.floor(rng()*PATCH_NOUNS.length)];
  return `${adj}-${noun}-${String(Math.floor(rng()*9000)+1000)}`;
}

function generatePatchesPuzzle(seedStr, gs=6) {
  for (let attempt=0;attempt<40;attempt++) {
    const rng=createRng(seedFromString("patches"+seedStr+attempt));
    function split(r1,c1,r2,c2,depth) {
      const h=r2-r1+1,w=c2-c1+1,area=h*w;
      if(area<=4||depth>=5) return [[r1,c1,r2,c2]];
      const shouldSplit=area>9||rng()<0.62;
      if(!shouldSplit) return [[r1,c1,r2,c2]];
      const canH=h>=4,canV=w>=4;
      if(!canH&&!canV) return [[r1,c1,r2,c2]];
      const doH=canH&&canV?rng()<0.5:canH;
      if(doH){const opts=[];for(let row=r1+2;row<=r2-1;row++)opts.push(row);if(!opts.length)return[[r1,c1,r2,c2]];const sp=opts[Math.floor(rng()*opts.length)];return[...split(r1,c1,sp-1,c2,depth+1),...split(sp,c1,r2,c2,depth+1)];}
      else{const opts=[];for(let col=c1+2;col<=c2-1;col++)opts.push(col);if(!opts.length)return[[r1,c1,r2,c2]];const sp=opts[Math.floor(rng()*opts.length)];return[...split(r1,c1,r2,sp-1,depth+1),...split(r1,sp,r2,c2,depth+1)];}
    }
    const rects=split(0,0,gs-1,gs-1,0);
    if(rects.length<5||rects.length>9) continue;
    const covered=new Set();
    rects.forEach(([r1,c1,r2,c2])=>{for(let r=r1;r<=r2;r++) for(let c=c1;c<=c2;c++) covered.add(`${r},${c}`);});
    if(covered.size!==gs*gs) continue;
    const rng2=createRng(seedFromString("patches2"+seedStr+attempt));
    const colorOrder=shuffleWith([...Array(PATCH_COLORS.length).keys()],rng2);
    const seeds=rects.map(([r1,c1,r2,c2],id)=>{
      const h=r2-r1+1,w=c2-c1+1,size=h*w;
      let shape; if(h===w) shape="square"; else { const nat=w>h?"wide":"tall"; shape=rng2()<0.35?"any":nat; }
      const allCells=[]; for(let r=r1;r<=r2;r++) for(let c=c1;c<=c2;c++) allCells.push([r,c]);
      const[sr,sc]=allCells[Math.floor(rng2()*allCells.length)];
      return {id,r:sr,c:sc,size,shape,colorIdx:colorOrder[id%colorOrder.length]};
    });
    return {gridSize:gs, seeds};
  }
  return {gridSize:gs,seeds:[
    {id:0,r:0,c:1,size:6,shape:"wide",colorIdx:0},{id:1,r:0,c:4,size:6,shape:"wide",colorIdx:1},
    {id:2,r:2,c:0,size:4,shape:"square",colorIdx:2},{id:3,r:3,c:2,size:4,shape:"square",colorIdx:3},
    {id:4,r:2,c:5,size:4,shape:"square",colorIdx:4},{id:5,r:4,c:1,size:6,shape:"wide",colorIdx:5},
    {id:6,r:5,c:4,size:6,shape:"wide",colorIdx:6},
  ]};
}

function PatchesGame({ onBack }) {
  const [currentSeed,   setCurrentSeed]   = useState(()=>randomPatchSeed());
  const [puzzle,        setPuzzle]        = useState(null);
  const [playerGrid,    setPlayerGrid]    = useState(null);
  const [solved,        setSolved]        = useState(false);
  const [elapsed,       setElapsed]       = useState(0);
  const [gameState,     setGameState]     = useState("idle");
  const [bestTime,      setBestTime]      = useState(null);
  const [isNewBest,     setIsNewBest]     = useState(false);
  const [dragStart,     setDragStart]     = useState(null);
  const [dragCurrent,   setDragCurrent]   = useState(null);
  const [seedInput,     setSeedInput]     = useState("");
  const [showSeedPanel, setShowSeedPanel] = useState(false);
  const [seedCopied,    setSeedCopied]    = useState(false);
  const [badSeed,       setBadSeed]       = useState(false);
  const startRef=useRef(null), timerRef=useRef(null), gridRef=useRef(null);

  function initFromSeed(seed) {
    const p=generatePatchesPuzzle(seed);
    const gs=p.gridSize;
    const g=Array.from({length:gs},()=>Array(gs).fill(-1));
    p.seeds.forEach(s=>{g[s.r][s.c]=s.id;});
    setCurrentSeed(seed); setPuzzle(p); setPlayerGrid(g);
    setSolved(false); setGameState("idle"); setElapsed(0); setIsNewBest(false);
    setDragStart(null); setDragCurrent(null);
    startRef.current=null; clearInterval(timerRef.current);
  }

  useEffect(()=>{initFromSeed(currentSeed);},[]);

  useEffect(()=>{
    if(gameState==="playing"){timerRef.current=setInterval(()=>setElapsed(Date.now()-startRef.current),100);}
    else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[gameState]);

  function startTimer(){if(gameState!=="idle") return; startRef.current=Date.now(); setGameState("playing");}
  function newGame(){initFromSeed(randomPatchSeed());}
  function retryGame(){
    if(!puzzle) return;
    const gs=puzzle.gridSize;
    const g=Array.from({length:gs},()=>Array(gs).fill(-1));
    puzzle.seeds.forEach(s=>{g[s.r][s.c]=s.id;});
    setPlayerGrid(g); setSolved(false); setGameState("idle"); setElapsed(0);
    startRef.current=null; clearInterval(timerRef.current); setDragStart(null); setDragCurrent(null);
  }
  function handleLoadSeed(){
    const s=seedInput.trim().toUpperCase(); if(!s) return;
    const test=generatePatchesPuzzle(s);
    if(!test||test.seeds.length<2){setBadSeed(true);setTimeout(()=>setBadSeed(false),1500);return;}
    setSeedInput(""); setShowSeedPanel(false); initFromSeed(s);
  }
  function handleCopySeed(){navigator.clipboard.writeText(currentSeed).then(()=>{setSeedCopied(true);setTimeout(()=>setSeedCopied(false),2000);});}

  const isDragging=dragStart!==null;
  function rectCells(r1,c1,r2,c2){const out=[];for(let r=Math.min(r1,r2);r<=Math.max(r1,r2);r++) for(let c=Math.min(c1,c2);c<=Math.max(c1,c2);c++) out.push(`${r},${c}`);return out;}
  function cellFromPoint(clientX,clientY){
    const el=gridRef.current; if(!el) return null;
    const rect=el.getBoundingClientRect();
    const gs=puzzle?.gridSize??6;
    const CELL=Math.min(50,Math.floor((Math.min(360,window.innerWidth-32))/gs));
    const c=Math.floor((clientX-rect.left)/CELL), r=Math.floor((clientY-rect.top)/CELL);
    if(r<0||r>=gs||c<0||c>=gs) return null;
    return {r,c};
  }
  function getDragCandidate(){
    if(!dragStart||!dragCurrent||!puzzle) return null;
    const cells=rectCells(dragStart.r,dragStart.c,dragCurrent.r,dragCurrent.c);
    const cellSet=new Set(cells);
    const inside=puzzle.seeds.filter(s=>cellSet.has(`${s.r},${s.c}`));
    if(inside.length!==1) return {cells,seedId:null};
    return {cells,seedId:inside[0].id,seed:inside[0]};
  }
  function commitDrag(){
    if(!dragStart||!dragCurrent||!playerGrid||!puzzle){setDragStart(null);setDragCurrent(null);return;}
    const candidate=getDragCandidate();
    if(!candidate||candidate.seedId===null){setDragStart(null);setDragCurrent(null);return;}
    const{cells,seedId}=candidate, gs=puzzle.gridSize;
    startTimer();
    const ng=playerGrid.map(row=>[...row]);
    for(let r=0;r<gs;r++) for(let c=0;c<gs;c++) if(ng[r][c]===seedId&&!puzzle.seeds.some(s=>s.id===seedId&&s.r===r&&s.c===c)) ng[r][c]=-1;
    for(const key of cells){const[r,c]=key.split(",").map(Number);if(puzzle.seeds.some(s=>s.r===r&&s.c===c&&s.id!==seedId)){setDragStart(null);setDragCurrent(null);return;}ng[r][c]=seedId;}
    setPlayerGrid(ng); setDragStart(null); setDragCurrent(null);
    if(ng.every(row=>row.every(v=>v>=0))){
      let allValid=true;
      for(const seed of puzzle.seeds){const sc=[];for(let r=0;r<gs;r++) for(let c=0;c<gs;c++) if(ng[r][c]===seed.id) sc.push(`${r},${c}`);if(!checkRegionValid(sc,seed.size,seed.shape)){allValid=false;break;}}
      if(allValid){const t=Date.now()-startRef.current;setSolved(true);setGameState("done");const nb=!bestTime||t<bestTime;setIsNewBest(nb);if(nb)setBestTime(t);}
    }
  }
  function handlePointerDown(e){if(solved)return;const cell=cellFromPoint(e.clientX,e.clientY);if(!cell)return;e.preventDefault();try{gridRef.current?.setPointerCapture(e.pointerId);}catch(_){}setDragStart(cell);setDragCurrent(cell);}
  function handlePointerMove(e){if(!isDragging||solved)return;e.preventDefault();const cell=cellFromPoint(e.clientX,e.clientY);if(cell)setDragCurrent(cell);}
  function handlePointerUp(e){if(!isDragging||solved)return;e.preventDefault();commitDrag();}

  if(!puzzle||!playerGrid) return null;
  if(playerGrid.length!==puzzle.gridSize) return null;

  const gs=puzzle.gridSize;
  const CELL=Math.min(50,Math.floor((Math.min(360,window.innerWidth-32))/gs));
  const candidate=getDragCandidate();
  const dragCells=candidate?new Set(candidate.cells):new Set();
  const dragSeedId=candidate?.seedId??null;
  function seedById(id){return puzzle.seeds.find(s=>s.id===id);}
  function colorOf(id){return patchColor(seedById(id)?.colorIdx??0);}
  function getRegionErrors(){
    const errs=new Set();
    for(const seed of puzzle.seeds){
      const cells=[];for(let r=0;r<gs;r++) for(let c=0;c<gs;c++) if(playerGrid[r][c]===seed.id) cells.push(`${r},${c}`);
      if(cells.length===0) continue;
      if(cells.length>seed.size) errs.add(seed.id);
      else if(cells.length===seed.size&&!checkRegionValid(cells,seed.size,seed.shape)) errs.add(seed.id);
    }
    return errs;
  }
  const regionErrors=solved?new Set():getRegionErrors();
  const regionCounts={};
  for(let r=0;r<gs;r++) for(let c=0;c<gs;c++){const v=playerGrid[r][c];if(v>=0)regionCounts[v]=(regionCounts[v]||0)+1;}

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",background:"#0e0e0e",padding:"20px 16px 40px"}} className="page-enter">
      <style>{`.patch-grid{touch-action:none;cursor:crosshair;} @keyframes patchSolve{0%{opacity:1}50%{opacity:0.7}100%{opacity:1}} .patch-solved{animation:patchSolve 0.6s ease 2;} .seed-input-p{background:#080812;border:1.5px solid #1a1a38;border-radius:8px;padding:8px 12px;font-family:'DM Mono',monospace;font-size:11px;color:#f0ede8;letter-spacing:0.1em;outline:none;flex:1;} .seed-input-p.bad{border-color:#ef4444;}`}</style>
      <div style={{width:"100%",maxWidth:420,display:"flex",alignItems:"center",marginBottom:16,gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"1.5px solid #2a2a2a",borderRadius:8,padding:"7px 14px",color:"#888",fontSize:12,fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}} onMouseEnter={e=>e.target.style.borderColor="#555"} onMouseLeave={e=>e.target.style.borderColor="#2a2a2a"}>← HUB</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"#f0ede8",lineHeight:1}}>Patches</div>
          <div style={{fontSize:10,color:"#444",letterSpacing:"0.2em",marginTop:2,fontFamily:"'DM Mono',monospace"}}>FILL THE GRID</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,color:solved?"#a0c8a0":gameState==="playing"?"#f0ede8":"#222"}}>{formatTime(solved||gameState==="playing"?elapsed:null)}</div>
          {bestTime&&<div style={{fontSize:9,color:"#333",fontFamily:"'DM Mono',monospace",marginTop:2}}>BEST {formatTime(bestTime)}</div>}
        </div>
      </div>
      <div style={{width:"100%",maxWidth:420,marginBottom:12}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div onClick={()=>setShowSeedPanel(p=>!p)} style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"#111",border:"1px solid #1e1e1e",borderRadius:8,padding:"6px 12px",cursor:"pointer",overflow:"hidden"}}>
            <span style={{fontSize:9,color:"#333",fontFamily:"'DM Mono',monospace",flexShrink:0}}>SEED</span>
            <span style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{currentSeed}</span>
            <span style={{fontSize:9,color:"#333",marginLeft:"auto",flexShrink:0}}>{showSeedPanel?"▲":"▼"}</span>
          </div>
          <button onClick={handleCopySeed} style={{padding:"6px 12px",borderRadius:8,fontSize:10,fontFamily:"'DM Mono',monospace",background:"#111",border:"1px solid #1e1e1e",color:seedCopied?"#a0c8a0":"#555",cursor:"pointer",flexShrink:0}}>{seedCopied?"✓":"COPY"}</button>
          <button onClick={newGame} style={{padding:"6px 14px",borderRadius:8,fontSize:10,fontFamily:"'DM Mono',monospace",background:"#111",border:"1px solid #1e1e1e",color:"#888",cursor:"pointer",flexShrink:0}}>NEW</button>
        </div>
        {showSeedPanel&&(
          <div style={{marginTop:8,background:"#111",border:"1px solid #1e1e1e",borderRadius:10,padding:14}}>
            <div style={{fontSize:9,color:"#333",fontFamily:"'DM Mono',monospace",letterSpacing:"0.15em",marginBottom:8}}>LOAD A PUZZLE BY SEED</div>
            <div style={{display:"flex",gap:8}}>
              <input className={`seed-input-p${badSeed?" bad":""}`} placeholder="e.g. BOLD-GRID-4291" value={seedInput} onChange={e=>setSeedInput(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&handleLoadSeed()} />
              <button onClick={handleLoadSeed} style={{padding:"7px 14px",borderRadius:8,fontSize:11,fontFamily:"'DM Mono',monospace",background:"#c8a060",border:"none",color:"#0e0e0e",cursor:"pointer",fontWeight:500}}>LOAD</button>
            </div>
            {badSeed&&<div style={{fontSize:9,color:"#ef4444",marginTop:6,fontFamily:"'DM Mono',monospace"}}>Couldn't generate — try another seed.</div>}
          </div>
        )}
      </div>
      <div style={{width:"100%",maxWidth:420,marginBottom:10,minHeight:22}}>
        {isDragging&&candidate?(
          dragSeedId!==null?(
            <div style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'DM Mono',monospace",fontSize:11}}>
              <div style={{width:10,height:10,borderRadius:2,background:colorOf(dragSeedId).bg,flexShrink:0}}/>
              <span style={{color:"#888"}}>{candidate.cells.length} cells · region {dragSeedId+1} (needs {seedById(dragSeedId)?.size})</span>
            </div>
          ):<span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#444"}}>{candidate.cells.length} cells · no seed inside</span>
        ):!solved?<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#2a2a2a"}}>Click and drag to draw a rectangle over a seed tile</div>:null}
      </div>
      <div ref={gridRef} className="patch-grid" style={{border:"2px solid #333",borderRadius:6,overflow:"hidden",position:"relative",width:CELL*gs,height:CELL*gs,flexShrink:0}} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        {Array.from({length:gs},(_,r)=>Array.from({length:gs},(_,c)=>{
          const key=`${r},${c}`, regionId=playerGrid[r][c], seedDef=puzzle.seeds.find(s=>s.r===r&&s.c===c);
          const isSeed=!!seedDef, isErr=regionId>=0&&regionErrors.has(regionId), inDrag=dragCells.has(key);
          const col=regionId>=0?colorOf(regionId):null;
          let bg="#141414", opacity=1;
          if(inDrag){bg=dragSeedId!==null?colorOf(dragSeedId).bg+"cc":"#3a3a4a";if(dragSeedId===null)opacity=0.6;}
          else if(regionId>=0&&col){bg=isErr?"#2a1010":col.bg+"88";}
          return(
            <div key={key} className={solved?"patch-solved":""} style={{position:"absolute",left:c*CELL,top:r*CELL,width:CELL,height:CELL,background:bg,opacity,borderRight:c<gs-1?"1px solid rgba(255,255,255,0.07)":"none",borderBottom:r<gs-1?"1px solid rgba(255,255,255,0.07)":"none",display:"flex",alignItems:"center",justifyContent:"center",transition:inDrag?"none":"background 0.1s"}}>
              {isSeed&&(
                <div style={{width:CELL-8,height:CELL-8,borderRadius:8,background:isErr?"#c0392b":patchColor(seedDef.colorIdx).bg,border:`2.5px solid ${isErr?"#ff6060":"rgba(255,255,255,0.5)"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",gap:1,zIndex:2,position:"relative",boxShadow:inDrag&&dragSeedId===seedDef.id?"0 0 0 3px rgba(255,255,255,0.5)":"none"}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:CELL*0.3,fontWeight:700,color:"#fff",lineHeight:1}}>{seedDef.size}</span>
                  <ShapeIcon type={seedDef.shape} size={CELL*0.2} color="rgba(255,255,255,0.85)"/>
                </div>
              )}
              {isErr&&!isSeed&&!inDrag&&<div style={{position:"absolute",inset:0,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(-45deg,rgba(200,50,50,0.35) 0px,rgba(200,50,50,0.35) 3px,transparent 3px,transparent 8px)"}}/>}
              {inDrag&&dragSeedId!==null&&<div style={{position:"absolute",inset:0,pointerEvents:"none",boxShadow:"inset 0 0 0 1.5px rgba(255,255,255,0.3)"}}/>}
            </div>
          );
        }))}
        {isDragging&&dragStart&&dragCurrent&&(()=>{
          const minR=Math.min(dragStart.r,dragCurrent.r),maxR=Math.max(dragStart.r,dragCurrent.r);
          const minC=Math.min(dragStart.c,dragCurrent.c),maxC=Math.max(dragStart.c,dragCurrent.c);
          const oc=dragSeedId!==null?colorOf(dragSeedId).bg:"#666";
          return <div style={{position:"absolute",pointerEvents:"none",zIndex:10,left:minC*CELL,top:minR*CELL,width:(maxC-minC+1)*CELL,height:(maxR-minR+1)*CELL,border:`2.5px solid ${oc}`,borderRadius:4,boxShadow:dragSeedId!==null?`0 0 12px ${oc}66`:"none"}}/>;
        })()}
      </div>
      <div style={{width:"100%",maxWidth:420,marginTop:12,display:"flex",flexWrap:"wrap",gap:6}}>
        {puzzle.seeds.map(seed=>{
          const count=regionCounts[seed.id]||0, done=count===seed.size&&!regionErrors.has(seed.id), isErr=regionErrors.has(seed.id), col=patchColor(seed.colorIdx);
          return(
            <div key={seed.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,fontSize:10,fontFamily:"'DM Mono',monospace",background:done?"rgba(74,144,128,0.15)":isErr?"rgba(180,30,30,0.12)":"#111",border:`1px solid ${done?"rgba(74,144,128,0.4)":isErr?"rgba(180,30,30,0.3)":"#1e1e1e"}`,color:done?"#4ade80":isErr?"#e06060":"#666"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:col.bg,flexShrink:0}}/>
              <ShapeIcon type={seed.shape} size={10} color={done?"#4ade80":isErr?"#e06060":"#555"}/>
              <span>{count}/{seed.size}</span>
            </div>
          );
        })}
      </div>
      <div style={{width:"100%",maxWidth:420,marginTop:12,background:"#111",border:"1px solid #1a1a1a",borderRadius:12,padding:"12px 16px"}}>
        <div style={{fontSize:9,color:"#333",fontFamily:"'DM Mono',monospace",letterSpacing:"0.2em",marginBottom:8}}>HOW TO PLAY</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 20px",marginBottom:8}}>
          {[["square","Square"],["wide","Wide rectangle"],["tall","Tall rectangle"],["any","Any shape"]].map(([t,l])=>(
            <div key={t} style={{display:"flex",alignItems:"center",gap:6}}><ShapeIcon type={t} size={13} color="#666"/><span style={{fontSize:10,color:"#444",fontFamily:"'DM Mono',monospace"}}>{l}</span></div>
          ))}
        </div>
        <div style={{fontSize:10,color:"#444",fontFamily:"'DM Mono',monospace",lineHeight:1.7}}>Drag to draw a rectangle. If it contains exactly one seed tile, it claims that region.</div>
      </div>
      {solved&&(
        <div style={{marginTop:16,width:"100%",maxWidth:420,background:"rgba(74,144,128,0.1)",border:"1.5px solid rgba(74,144,128,0.3)",borderRadius:14,padding:"22px 24px",textAlign:"center",animation:"slideUp 0.35s ease"}}>
          <div style={{fontSize:32,marginBottom:8}}>🧩</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:isNewBest?"#c8a060":"#a0c8a0",marginBottom:4}}>{isNewBest?"New Best!":"Grid complete!"}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:28,color:"#f0ede8",marginBottom:4}}>{formatTime(elapsed)}</div>
          <div style={{fontSize:10,color:"#555",fontFamily:"'DM Mono',monospace",marginBottom:14}}>SEED: {currentSeed}</div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={newGame} style={{padding:"10px 22px",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"#f0ede8",color:"#0e0e0e",border:"none",cursor:"pointer",fontWeight:500}}>NEW PUZZLE</button>
            <button onClick={retryGame} style={{padding:"10px 22px",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"transparent",border:"1px solid #2a2a2a",color:"#888",cursor:"pointer"}}>RETRY</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatchesGame;
