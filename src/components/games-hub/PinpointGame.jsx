import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  PINPOINT GAME                                           ║
// ╚══════════════════════════════════════════════════════════╝

const PINPOINT_PUZZLES = [
  { category:"Words that follow SPEED", clues:["boat","way","bump","limit","dial"] },
  { category:"Words that precede BALL", clues:["foot","basket","base","snow","fire"] },
  { category:"Types of pasta", clues:["penne","rigatoni","fusilli","linguine","orzo"] },
  { category:"Things in a toolbox", clues:["hammer","wrench","pliers","drill","level"] },
  { category:"Words after FIRE", clues:["place","work","side","fly","arm"] },
  { category:"Capital cities in Europe", clues:["Paris","Berlin","Rome","Madrid","Athens"] },
  { category:"Things that are black and white", clues:["zebra","penguin","panda","piano","newspaper"] },
  { category:"Words before CAKE", clues:["cup","cheese","pan","short","birth"] },
  { category:"Things with strings", clues:["guitar","kite","puppet","bow","harp"] },
  { category:"Words after SUN", clues:["flower","burn","set","screen","rise"] },
  { category:"Ocean animals", clues:["shark","dolphin","octopus","whale","lobster"] },
  { category:"Words before HOUSE", clues:["green","ware","light","tree","power"] },
  { category:"Ways to cook eggs", clues:["fry","poach","scramble","boil","bake"] },
  { category:"Words after OVER", clues:["coat","look","due","come","time"] },
  { category:"Shades of blue", clues:["cobalt","azure","navy","teal","indigo"] },
  { category:"Things on a desk", clues:["lamp","stapler","keyboard","mouse","calendar"] },
  { category:"Words before SIDE", clues:["out","in","bed","fire","road"] },
  { category:"Things with wheels", clues:["car","trolley","skateboard","wheelchair","unicycle"] },
  { category:"Words after BACK", clues:["pack","fire","yard","flip","stroke"] },
  { category:"Musical genres", clues:["jazz","blues","reggae","soul","funk"] },
  { category:"Words before LIGHT", clues:["day","moon","sun","spot","flash"] },
  { category:"Things in a kitchen", clues:["oven","colander","spatula","whisk","pantry"] },
  { category:"Words after OUT", clues:["door","side","fit","run","break"] },
  { category:"Parts of a tree", clues:["trunk","bark","branch","root","canopy"] },
  { category:"Words before YARD", clues:["back","court","vine","body","grave"] },
  { category:"Types of clouds", clues:["cumulus","cirrus","nimbus","stratus","anvil"] },
  { category:"Words after BLACK", clues:["bird","berry","board","out","smith"] },
  { category:"Things that float", clues:["cork","balloon","iceberg","oil","bubble"] },
  { category:"Words before STONE", clues:["sand","key","corner","lime","cobble"] },
  { category:"Dances", clues:["waltz","tango","salsa","foxtrot","polka"] },
  { category:"Words after HAND", clues:["bag","shake","made","rail","writing"] },
  { category:"Things in a bathroom", clues:["towel","mirror","tap","basin","grout"] },
  { category:"Words before WORK", clues:["net","frame","over","team","hand"] },
  { category:"Types of bridges", clues:["suspension","arch","drawbridge","cable","truss"] },
  { category:"Words after WATER", clues:["fall","proof","way","colour","front"] },
  { category:"Things that are sharp", clues:["needle","thorn","razor","knife","shard"] },
  { category:"Words before FALL", clues:["down","free","water","night","rain"] },
  { category:"Types of cheese", clues:["cheddar","brie","gouda","feta","mozzarella"] },
  { category:"Words after UNDER", clues:["cover","ground","wear","tow","dog"] },
  { category:"Things you can catch", clues:["cold","train","ball","wave","flight"] },
  { category:"Words before BIRD", clues:["lady","thunder","song","black","early"] },
  { category:"Types of hat", clues:["fedora","beanie","beret","stetson","trilby"] },
  { category:"Words after GOOD", clues:["will","bye","night","looking","natured"] },
  { category:"Things with wings", clues:["butterfly","bat","plane","angel","bee"] },
  { category:"Words before BOX", clues:["sand","music","jack","post","lunch"] },
  { category:"Things in a library", clues:["shelf","catalogue","bookmark","atlas","stacks"] },
  { category:"Words after CROSS", clues:["word","bow","road","walk","bar"] },
  { category:"Things that are sticky", clues:["glue","honey","tape","toffee","resin"] },
  { category:"Words before DOOR", clues:["out","back","trap","revolving","stage"] },
  { category:"Things that are round", clues:["globe","coin","wheel","orange","planet"] },
  { category:"Types of tea", clues:["green","chamomile","oolong","rooibos","jasmine"] },
  { category:"Words before ROOM", clues:["bath","bed","living","class","show"] },
  { category:"Things that are cold", clues:["ice","snow","glacier","wind","marble"] },
  { category:"Words after FOOT", clues:["ball","note","print","wear","step"] },
  { category:"Types of bread", clues:["sourdough","rye","ciabatta","brioche","focaccia"] },
  { category:"Words before FISH", clues:["sword","star","cat","blow","jelly"] },
  { category:"Things you find underground", clues:["roots","tunnel","fossil","worm","ore"] },
  { category:"Words after HIGH", clues:["light","land","way","rise","chair"] },
  { category:"Types of steak", clues:["ribeye","sirloin","fillet","rump","brisket"] },
  { category:"Words before BOOK", clues:["note","hand","cook","year","text"] },
  { category:"Things in a garden", clues:["spade","hose","compost","trellis","trowel"] },
  { category:"Words after HEAD", clues:["band","line","lights","quarters","board"] },
  { category:"Types of nut", clues:["walnut","pecan","macadamia","pistachio","hazel"] },
  { category:"Words before LINE", clues:["dead","guide","on","base","over"] },
  { category:"Things that spin", clues:["top","turbine","ballerina","compass","lathe"] },
  { category:"Types of flower", clues:["peony","dahlia","iris","marigold","freesia"] },
  { category:"Words before SHIP", clues:["relation","hard","friend","scholar","sports"] },
  { category:"Things that glow", clues:["lava","firefly","moon","neon","ember"] },
  { category:"Words after DOWN", clues:["town","load","stairs","fall","pour"] },
  { category:"Sports played on a court", clues:["tennis","squash","netball","badminton","volleyball"] },
  { category:"Words before SCREEN", clues:["sun","big","touch","silver","wide"] },
  { category:"Things that are transparent", clues:["glass","water","ice","cellophane","air"] },
  { category:"Words after BOOK", clues:["case","shelf","let","mark","worm"] },
  { category:"Collective nouns for animals", clues:["pack","flock","pod","pride","swarm"] },
  { category:"Words before STORM", clues:["thunder","brain","snow","fire","hail"] },
  { category:"Things on a ship", clues:["anchor","mast","hull","porthole","gangway"] },
  { category:"Words after BREAK", clues:["down","out","fast","through","water"] },
  { category:"Types of shark", clues:["hammerhead","bull","tiger","nurse","whale"] },
  { category:"Words before GROUND", clues:["back","camp","play","under","common"] },
  { category:"Things that make noise", clues:["bell","drum","thunder","kettle","crowd"] },
  { category:"Words after BLUE", clues:["bell","bird","berry","print","tooth"] },
  { category:"Things in a hospital", clues:["scalpel","drip","ward","gurney","suture"] },
  { category:"Words before PLACE", clues:["fire","birth","market","hiding","common"] },
  { category:"Things you wear in winter", clues:["scarf","gloves","beanie","earmuffs","thermals"] },
  { category:"Words after UP", clues:["stairs","town","beat","lift","load"] },
  { category:"Types of fish", clues:["salmon","trout","tuna","halibut","snapper"] },
  { category:"Words before TIME", clues:["over","bed","day","half","part"] },
  { category:"Things that are magnetic", clues:["iron","nickel","compass","lodestone","magnet"] },
  { category:"Words after LOCK", clues:["smith","down","out","jaw","pick"] },
  { category:"Things in space", clues:["comet","nebula","quasar","pulsar","asteroid"] },
  { category:"Words before POWER", clues:["will","man","over","horse","super"] },
  { category:"Things you can pour", clues:["water","sand","concrete","syrup","grain"] },
  { category:"Types of weather", clues:["hail","sleet","drizzle","blizzard","fog"] },
  { category:"Things with a screen", clues:["phone","laptop","cinema","tablet","ATM"] },
  { category:"Words after NIGHT", clues:["club","fall","cap","stand","gown"] },
  { category:"Things that are hollow", clues:["log","pipe","drum","straw","skull"] },
  { category:"Words before TOWN", clues:["down","ghost","small","up","boom"] },
  { category:"Things that are striped", clues:["tiger","zebra","barcode","bee","rugby shirt"] },
  { category:"Words after GRAND", clues:["mother","piano","stand","child","tour"] },
  { category:"Things found in a forest", clues:["moss","acorn","badger","fern","canopy"] },
  { category:"Words before BOARD", clues:["card","skate","surf","key","snow"] },
  { category:"Things that are very small", clues:["atom","pixel","flea","grain","microbe"] },
  { category:"Words after EYE", clues:["lash","brow","sight","lid","liner"] },
  { category:"Types of exercise", clues:["squat","lunge","plank","burpee","deadlift"] },
  { category:"Words before BREAK", clues:["day","heart","jail","ground","wave"] },
  { category:"Things you can knit", clues:["scarf","jumper","blanket","sock","beanie"] },
  { category:"Words after SHORT", clues:["cut","fall","coming","hand","sighted"] },
  { category:"Things that are very tall", clues:["skyscraper","giraffe","sequoia","mast","cliff"] },
  { category:"Things that evaporate", clues:["water","alcohol","petrol","dew","perfume"] },
  { category:"Words after OLD", clues:["fashioned","school","age","gold","timer"] },
  { category:"Types of sauce", clues:["bechamel","hollandaise","pesto","aioli","tzatziki"] },
  { category:"Words before WAY", clues:["gate","high","run","motor","cause"] },
  { category:"Things you can fold", clues:["paper","towel","map","dough","tent"] },
  { category:"Words after GREEN", clues:["house","back","ery","land","card"] },
  { category:"Things that are rough", clues:["sandpaper","gravel","bark","stubble","stone"] },
  { category:"Things in a theatre", clues:["curtain","spotlight","wings","stalls","footlights"] },
  { category:"Words after HOT", clues:["dog","shot","bed","line","pot"] },
  { category:"Types of fabric", clues:["velvet","denim","linen","chiffon","tweed"] },
  { category:"Things you blow", clues:["whistle","candle","bubble","trumpet","dandelion"] },
  { category:"Words after AIR", clues:["port","craft","field","line","tight"] },
  { category:"Types of dog breed", clues:["labrador","beagle","whippet","dalmatian","poodle"] },
  { category:"Things that are elastic", clues:["rubber band","spring","waistband","trampoline","bungee"] },
  { category:"Words after COLD", clues:["water","blooded","front","snap","storage"] },
  { category:"Things found in the desert", clues:["cactus","dune","oasis","scorpion","mirage"] },
  { category:"Words before MARK", clues:["book","trade","water","bench","hall"] },
  { category:"Things that tick", clues:["clock","bomb","metronome","watch","meter"] },
  { category:"Words after LAND", clues:["mark","lord","slide","fill","owner"] },
  { category:"Types of punctuation", clues:["comma","colon","apostrophe","hyphen","ellipsis"] },
  { category:"Words before RING", clues:["ear","boxing","wed","spring","key"] },
  { category:"Things you can stir", clues:["soup","paint","cocktail","porridge","concrete"] },
  { category:"Words after MOON", clues:["light","shine","beam","stone","lit"] },
  { category:"Things that are loud", clues:["thunder","jet","crowd","drum","siren"] },
  { category:"Words before WORD", clues:["cross","pass","fore","swear","watch"] },
  { category:"Things that melt", clues:["ice","wax","chocolate","metal","snow"] },
  { category:"Words after LIGHT", clues:["house","weight","ning","year","bulb"] },
  { category:"Types of tree", clues:["oak","birch","maple","willow","cedar"] },
  { category:"Things that are invisible", clues:["air","radio waves","gravity","scent","pressure"] },
  { category:"Words after RAIN", clues:["bow","drop","coat","fall","water"] },
  { category:"Things in a classroom", clues:["chalk","register","whiteboard","ruler","projector"] },
  { category:"Things that are spotted", clues:["leopard","ladybird","dice","dalmatian","domino"] },
  { category:"Words before BALL", clues:["cannon","pin","gum","volley","butter"] },
  { category:"Words after SNOW", clues:["flake","ball","drop","fall","plough"] },
  { category:"Things with a blade", clues:["sword","razor","fan","turbine","ice skate"] },
  { category:"Things that are recycled", clues:["glass","paper","tin","plastic","cardboard"] },
  { category:"Words after BUTTER", clues:["cup","fly","milk","fingers","scotch"] },
  { category:"Things you find at the beach", clues:["shell","seaweed","driftwood","pebble","crab"] }
];



// Seeded shuffle so the same seed gives the same puzzle order
function getPinpointPuzzle(seed) {
  const rng = createRng(seedFromString("pinpoint" + seed));
  const idx = Math.floor(rng() * PINPOINT_PUZZLES.length);
  const p   = PINPOINT_PUZZLES[idx];
  // Shuffle clue order (hardest first when fully random is fine for a bank)
  const clues = shuffleWith([...p.clues], rng);
  return { ...p, clues };
}

// Guess validation: case-insensitive substring check
// "words that follow speed" → accept "speed", "speed ___", "follows speed", etc.
function checkPinpointGuess(guess, category) {
  const g = guess.toLowerCase().trim();
  const c = category.toLowerCase().trim();
  if (!g) return false;
  // Direct substring either way
  if (c.includes(g) || g.includes(c)) return true;
  // Strip common prefixes/suffixes and compare key words
  const keyWords = c.replace(/^(types? of|words? (that )?(follow|precede|before|after|come after|come before)|things? (that are|in a|with|on a))\s+/i, "").split(/\s+/);
  const guessWords = g.split(/\s+/);
  // Any key word appears in guess
  return keyWords.some(kw => kw.length > 3 && guessWords.some(gw => gw.includes(kw) || kw.includes(gw)));
}

function PinpointGame({ onBack }) {
  const [seedIdx,    setSeedIdx]    = useState(() => Math.floor(Math.random() * 10000));
  const [puzzle,     setPuzzle]     = useState(null);
  const [revealed,   setRevealed]   = useState(1);
  const [guesses,    setGuesses]    = useState([]);
  const [input,      setInput]      = useState("");
  const [phase,      setPhase]      = useState("playing"); // playing | won | lost
  const [score,      setScore]      = useState(null);
  const [bestScore,  setBestScore]  = useState(null);
  const [history,    setHistory]    = useState([]);
  const inputRef = useRef(null);

  function loadPuzzle(idx) {
    const p = getPinpointPuzzle(String(idx));
    setPuzzle(p);
    setRevealed(1);
    setGuesses([]);
    setInput("");
    setPhase("playing");
    setScore(null);
    setSeedIdx(idx);
  }

  useEffect(() => { loadPuzzle(seedIdx); }, []);
  useEffect(() => { if (phase === "playing") inputRef.current?.focus(); }, [puzzle]);

  function handleGuess() {
    if (!input.trim() || phase !== "playing") return;
    const guess = input.trim();
    setInput("");
    const correct = checkPinpointGuess(guess, puzzle.category);
    const newGuesses = [...guesses, { text: guess, correct }];
    setGuesses(newGuesses);
    if (correct) {
      setScore(revealed);
      setPhase("won");
      setBestScore(prev => prev === null || revealed < prev ? revealed : prev);
      setHistory(prev => [{ score: revealed, category: puzzle.category }, ...prev.slice(0, 9)]);
    } else {
      if (revealed < 5) {
        setRevealed(r => r + 1);
      } else if (newGuesses.filter(g => !g.correct).length >= 5) {
        setPhase("lost");
        setHistory(prev => [{ score: 0, category: puzzle.category }, ...prev.slice(0, 9)]);
      }
    }
  }

  function newGame() { loadPuzzle(Math.floor(Math.random() * 10000)); }

  const SCORE_LABELS = { 1:"Genius", 2:"Impressive", 3:"Solid", 4:"Getting there", 5:"Squeaked it" };
  const SCORE_COLORS = { 1:"#f0c060", 2:"#a0d0a0", 3:"#80b0d8", 4:"#c8a080", 5:"#9090a8" };

  function ScoreDots({ n }) {
    return (
      <div style={{ display:"flex", gap:5, alignItems:"center" }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ width:10, height:10, borderRadius:"50%",
            background: i===n ? (SCORE_COLORS[n]??"#7060c8") : "#1e1e1e",
            border:`1.5px solid ${i===n?(SCORE_COLORS[n]??"#7060c8"):"#2a2a2a"}`,
            transition:"all 0.2s" }} />
        ))}
      </div>
    );
  }

  if (!puzzle) return null;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", minHeight:"100vh", padding:"20px 16px", background:"#0e0e0e" }} className="page-enter">
      <style>{`
        @keyframes clueReveal{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes wrongShake{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}
        .clue-card{animation:clueReveal 0.3s ease;}
        .guess-wrong{animation:wrongShake 0.35s ease;}
        .pinput:focus{outline:none;border-color:#7060c8!important;}
        .pinput::placeholder{color:#333;}
      `}</style>

      {/* Header */}
      <div style={{ width:"100%", maxWidth:480, display:"flex", alignItems:"center", marginBottom:28, gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"1.5px solid #2a2a2a", borderRadius:8, padding:"7px 14px", color:"#888", fontSize:12, fontFamily:"'DM Mono',monospace", letterSpacing:"0.06em", cursor:"pointer" }}
          onMouseEnter={e=>e.target.style.borderColor="#555"} onMouseLeave={e=>e.target.style.borderColor="#2a2a2a"}>← HUB</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color:"#f0ede8", lineHeight:1 }}>Pinpoint</div>
          <div style={{ fontSize:10, color:"#444", letterSpacing:"0.2em", marginTop:2, fontFamily:"'DM Mono',monospace" }}>FIND THE CATEGORY</div>
        </div>
        <div style={{ textAlign:"right" }}>
          {bestScore && <>
            <div style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace", letterSpacing:"0.1em", marginBottom:2 }}>BEST</div>
            <ScoreDots n={bestScore} />
          </>}
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:480 }}>
        {/* Clue reveal dots */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace", letterSpacing:"0.2em" }}>CLUES REVEALED</div>
          <div style={{ display:"flex", gap:5 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ width:8, height:8, borderRadius:"50%",
                background:i<=revealed?"#7060c8":"#1e1e1e",
                border:`1.5px solid ${i<=revealed?"#7060c8":"#2a2a2a"}`,
                transition:"all 0.3s" }} />
            ))}
          </div>
        </div>

        {/* Clue cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {puzzle.clues.slice(0, revealed).map((clue, i) => (
            <div key={i} className="clue-card"
              style={{ background: phase==="won" ? "rgba(112,96,200,0.12)" : "#141414",
                border:`1.5px solid ${phase==="won"?"#7060c8":i===revealed-1?"#2a2a3a":"#1a1a1a"}`,
                borderRadius:12, padding:"14px 20px", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:"#1e1e1e", border:"1px solid #2a2a2a",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, color:"#555", fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{i+1}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"#f0ede8" }}>{clue}</div>
            </div>
          ))}
          {/* Hidden cards */}
          {phase==="playing" && puzzle.clues.slice(revealed).map((_,i) => (
            <div key={`h${i}`} style={{ background:"#0e0e0e", border:"1.5px solid #181818", borderRadius:12,
              padding:"14px 20px", display:"flex", alignItems:"center", gap:14, opacity:0.35 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:"#141414", border:"1px solid #1e1e1e", flexShrink:0 }} />
              <div style={{ height:12, width:`${55+Math.floor(Math.random()*40)}px`, background:"#1a1a1a", borderRadius:6 }} />
            </div>
          ))}
          {/* Reveal all on loss */}
          {phase==="lost" && puzzle.clues.slice(revealed).map((clue,i) => (
            <div key={`l${i}`} className="clue-card"
              style={{ background:"#141414", border:"1.5px solid #1a1a1a", borderRadius:12, padding:"14px 20px",
                display:"flex", alignItems:"center", gap:14, opacity:0.5 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:"#1e1e1e", border:"1px solid #2a2a2a",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, color:"#444", fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{revealed+i+1}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"#555" }}>{clue}</div>
            </div>
          ))}
        </div>

        {/* Guess log */}
        {guesses.length > 0 && (
          <div style={{ marginBottom:16, display:"flex", flexDirection:"column", gap:6 }}>
            {guesses.map((g,i) => (
              <div key={i} className={g.correct?"":"guess-wrong"}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderRadius:8,
                  background:g.correct?"rgba(160,200,160,0.08)":"rgba(200,80,80,0.06)",
                  border:`1px solid ${g.correct?"rgba(160,200,160,0.2)":"rgba(200,80,80,0.15)"}` }}>
                <span style={{ fontSize:14 }}>{g.correct?"✓":"✗"}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:g.correct?"#a0c8a0":"#888" }}>{g.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Won state */}
        {phase==="won" && (
          <div style={{ background:"rgba(112,96,200,0.1)", border:"1.5px solid rgba(112,96,200,0.3)", borderRadius:14,
            padding:"20px 22px", marginBottom:16, animation:"slideUp 0.35s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900,
                  color:SCORE_COLORS[score]??"#7060c8", marginBottom:4 }}>{SCORE_LABELS[score]??"Done"}</div>
                <div style={{ fontSize:10, color:"#555", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em" }}>
                  {score===1?"GOT IT IN 1 CLUE":`GOT IT IN ${score} CLUES`}
                </div>
              </div>
              <ScoreDots n={score} />
            </div>
            <div style={{ background:"#111", borderRadius:8, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>🎯</span>
              <div>
                <div style={{ fontSize:9, color:"#444", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", marginBottom:2 }}>THE CATEGORY WAS</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#f0ede8" }}>{puzzle.category}</div>
              </div>
            </div>
          </div>
        )}

        {/* Lost state */}
        {phase==="lost" && (
          <div style={{ background:"rgba(180,60,60,0.08)", border:"1.5px solid rgba(180,60,60,0.2)", borderRadius:14,
            padding:"20px 22px", marginBottom:16, animation:"slideUp 0.35s ease" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#c87070", marginBottom:10 }}>
              Better luck next time
            </div>
            <div style={{ background:"#111", borderRadius:8, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>🎯</span>
              <div>
                <div style={{ fontSize:9, color:"#444", fontFamily:"'DM Mono',monospace", letterSpacing:"0.12em", marginBottom:2 }}>THE CATEGORY WAS</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#f0ede8" }}>{puzzle.category}</div>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        {phase==="playing" && (
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", gap:8 }}>
              <input ref={inputRef} className="pinput" value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleGuess()}
                placeholder={`Guess the category… (${5-guesses.length} left)`}
                style={{ flex:1, background:"#111", border:"1.5px solid #2a2a2a", borderRadius:10,
                  padding:"13px 16px", color:"#f0ede8", fontSize:14,
                  fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.15s" }} />
              <button onClick={handleGuess} disabled={!input.trim()}
                style={{ padding:"13px 20px", borderRadius:10, fontSize:12, fontFamily:"'DM Mono',monospace",
                  background:!input.trim()?"#1a1a1a":"#7060c8",
                  color:!input.trim()?"#333":"#fff", border:"none",
                  cursor:!input.trim()?"default":"pointer", transition:"all 0.15s", letterSpacing:"0.08em" }}>
                GUESS
              </button>
            </div>
          </div>
        )}

        {/* New game button */}
        {phase!=="playing" && (
          <button onClick={newGame}
            style={{ width:"100%", padding:"13px", borderRadius:10, fontSize:12, fontFamily:"'DM Mono',monospace",
              background:"#f0ede8", color:"#0e0e0e", border:"none", cursor:"pointer",
              letterSpacing:"0.1em", fontWeight:500, marginBottom:16 }}>
            NEW PUZZLE
          </button>
        )}

        {/* History */}
        {history.length > 1 && (
          <div style={{ background:"#111", border:"1px solid #1a1a1a", borderRadius:12, padding:"14px 18px" }}>
            <div style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace", letterSpacing:"0.2em", marginBottom:10 }}>RECENT GAMES</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {history.slice(1).map((h,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Mono',monospace",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, marginRight:12 }}>{h.category}</div>
                  {h.score>0 ? <ScoreDots n={h.score}/> : <span style={{ fontSize:10, color:"#444", fontFamily:"'DM Mono',monospace" }}>✗ LOST</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to play */}
        {phase==="playing" && guesses.length===0 && (
          <div style={{ marginTop:16, background:"#111", border:"1px solid #1a1a1a", borderRadius:12, padding:"14px 18px" }}>
            <div style={{ fontSize:9, color:"#333", fontFamily:"'DM Mono',monospace", letterSpacing:"0.2em", marginBottom:10 }}>HOW TO PLAY</div>
            <div style={{ fontSize:11, color:"#555", fontFamily:"'DM Mono',monospace", lineHeight:1.85 }}>
              • Guess the <span style={{ color:"#7060c8" }}>category</span> linking all 5 words<br />
              • Wrong guess → next word is revealed<br />
              • Fewer clues needed = better score<br />
              • 5 guesses total — use them wisely
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PinpointGame;
