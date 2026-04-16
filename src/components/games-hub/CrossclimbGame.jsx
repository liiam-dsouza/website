import { useState, useEffect, useCallback, useRef } from 'react';
import { createRng, seedFromString, shuffleWith, formatTime, formatTimeFull } from './utils.js';

// ╔══════════════════════════════════════════════════════════╗
// ║  CROSSCLIMB GAME                                         ║
// ╚══════════════════════════════════════════════════════════╝

function diffsByOne(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d === 1;
}

// 4-letter word dictionary — ~670 common English words
const WORD_DICT = [
  "able","ache","acid","acre","aged","ally","aloe","also","alto","ante","arch","area","aria","arid","army","arty",
  "away","axle","babe","baby","back","bade","bail","bale","balk","ball","balm","band","bane","bang","bank","bare",
  "bark","barn","base","bask","bath","baud","bawl","bear","beat","been","bell","belt","best","bias","bile","bill",
  "bind","bins","bird","bite","blew","blob","blot","blow","blue","boat","bode","bold","bolt","bond","bone","book",
  "boom","boon","boot","bore","born","bosh","boss","both","bowl","brag","bran","bred","brew","brim","buck","buoy",
  "burn","burp","bury","busy","cafe","cage","call","calm","came","camp","carb","card","care","cart","case","cash",
  "cast","cave","cede","cell","chap","char","chat","chew","chin","chip","chop","chum","cite","city","clad","clam",
  "clan","clap","claw","clay","clip","clog","clot","club","clue","coal","coat","cobs","code","cogs","coil","cola",
  "cold","colt","come","cook","cool","cope","copy","cord","core","corn","cost","coup","cram","crew","crib","crop",
  "crow","cuff","cure","curl","damp","dare","darn","dart","data","date","dawn","days","dead","deal","dear","debt",
  "deep","deft","deny","desk","diet","dike","dill","ding","dire","dirt","disk","diva","dive","dock","does","dole",
  "dolt","dome","done","door","dose","dote","dove","down","drab","drag","dram","draw","drew","drip","drop","drub",
  "drug","drum","dual","duct","dull","dump","dune","dusk","dust","duty","each","earl","earn","ease","east","easy",
  "edge","edgy","elan","else","emit","envy","epic","etch","euro","even","ever","evil","exam","face","fact","fade",
  "fail","fair","fall","fame","fang","fare","farm","fast","fate","fawn","faze","feat","feel","feet","fell","felt",
  "feud","fife","file","fill","film","find","fine","fire","firm","fish","fist","five","flab","flag","flat","flaw",
  "flea","fled","flew","flex","flip","flit","floe","flog","flop","flow","flux","foal","foam","fold","folk","fond",
  "font","food","fool","foot","ford","fore","fork","form","fort","foul","four","fowl","fray","free","fret","frog",
  "from","fuel","full","fund","fuse","gain","gale","gall","game","gang","gash","gasp","gave","gawk","gaze","gear",
  "geld","gems","gene","gift","gild","gill","girl","gist","give","glad","glob","glow","glue","gnaw","goad","goal",
  "gobs","goes","gold","golf","gone","good","gory","gown","grab","gray","grew","grey","grid","grim","grip","grow",
  "gulf","gust","hack","hade","haft","hail","hair","hale","half","hall","halt","hams","hand","hang","hard","harm",
  "harp","hash","hasp","hate","haul","have","hawk","haze","head","heal","heap","heat","heed","heel","held","helm",
  "help","herd","here","hero","hide","high","hike","hill","hint","hire","hoax","hold","hole","home","hood","hook",
  "hope","hops","horn","host","hour","howl","hubs","hued","huge","hull","hump","hung","hunt","hurl","hurt","idea",
  "idle","inch","into","iron","isle","item","jade","jags","jail","jars","jaws","jazz","jibe","jigs","jinx","join",
  "joke","jots","joys","jugs","jump","just","juts","keen","keep","kegs","kelp","kerb","kern","keys","kick","kill",
  "kiln","kilo","kind","king","kink","kits","knee","knit","knob","knot","know","labs","lace","lack","lads","laid",
  "lake","lame","land","lane","lash","lass","last","late","laud","lava","lawn","laze","lazy","lead","leaf","leak",
  "lean","leap","leek","left","lend","lens","lest","lick","life","lift","like","limb","lime","limp","line","link",
  "lion","lisp","list","live","load","loan","lock","lode","loft","loll","lone","long","loop","lops","lore","lose",
  "loss","lost","loud","lout","love","luck","lull","lump","lung","lure","lurk","lute","lyre","mace","made","mail",
  "main","make","male","mall","mane","many","mare","mark","mass","mast","mate","math","maws","maze","mead","meal",
  "mean","meek","meet","meld","melt","menu","mere","mesh","mice","miff","mild","mile","milk","mill","mind","mine",
  "mire","miss","mist","mitt","moat","mobs","mock","mode","mole","monk","mood","moon","mope","mops","more","most",
  "move","much","muck","mugs","mull","must","myth","nail","name","nape","navy","neap","near","neck","need","newt",
  "next","nice","nine","node","nods","none","nook","norm","nose","note","nude","null","oaks","oars","oast","oath",
  "oboe","odds","oils","okra","once","only","open","orbs","ores","oval","oven","over","owns","oxen","pace","pack",
  "pact","page","pain","pair","pale","palm","pang","pans","park","part","pass","past","pate","path","pave","pawn",
  "paws","pays","peak","peel","peer","pegs","pens","perk","pets","pews","pick","pier","pike","pile","pill","pine",
  "pink","pint","pipe","pits","plan","play","plea","plod","plop","plot","plow","plug","plum","plus","pods","poem",
  "poll","polo","pond","pool","poor","pore","port","pose","post","posy","pots","pour","pray","prey","prod","prop",
  "pubs","pull","pump","pure","push","quay","rack","raga","rage","raid","rail","rain","ramp","rand","rank","rant",
  "rare","rasp","rate","rave","raze","read","real","reap","reed","reef","reek","reel","refs","rein","rely","rent",
  "rest","rice","rich","ride","rife","rigs","rime","rind","ring","rink","riot","rips","rise","risk","road","roam",
  "roan","roar","robe","rock","rode","rods","role","roll","romp","roof","room","root","rope","rose","rows","rubs",
  "rugs","ruin","rule","rush","rust","ruts","safe","saga","sage","sags","said","sail","sale","salt","same","sand",
  "saps","save","saws","says","scam","scan","scar","seal","seam","sear","seed","seek","seem","seen","seep","self",
  "sell","send","sent","serf","sets","shag","shed","shin","ship","shod","shoe","shop","shot","show","shut","sick",
  "sign","silk","sing","sink","site","size","skin","skip","slam","slim","slip","slog","slop","slow","slur","smog",
  "smug","snag","snap","snob","snow","snug","soak","soar","sobs","sock","sods","soft","soil","sole","some","song",
  "sops","sore","sort","soul","soup","sour","spin","spit","spot","spud","spun","spur","stab","stag","star","stay",
  "stem","step","stir","stop","stub","stud","subs","such","suds","suit","sulk","sump","sung","sunk","sure","swab",
  "swam","swan","swap","swat","swim","tabs","tads","tags","tail","take","tale","tall","tamp","tank","tans","taps",
  "tarp","tart","task","taut","teak","team","tear","teem","tell","tend","term","test","thaw","thew","thud","thug",
  "tick","tide","tidy","tier","tiff","tile","time","tint","tiny","tips","tire","toga","toil","toll","tone","tong",
  "took","tool","toot","tops","tore","tosh","toss","tour","town","trap","trek","trim","trio","trip","trod","trot",
  "true","tube","tuck","tugs","tune","turf","turn","twin","type","ugly","ulna","undo","unit","upon","urge","used",
  "vale","vamp","vane","vast","vats","veer","vein","verb","vest","view","vile","vine","visa","void","vole","vote",
  "wade","wads","waft","wage","wait","wake","walk","wall","wane","ward","warm","warn","wasp","wave","weak","weal",
  "weds","weep","weir","weld","well","went","west","whey","whim","whip","wide","wife","wigs","wild","will","wind",
  "wine","wing","wink","wire","wise","wish","woes","woke","wolf","womb","wood","wool","woos","word","wore","work",
  "worm","worn","wrap","writ","yard","yawn","year","yell","yore","yule","zany","zeal","zero","zest","zinc","zing",
  "zone"
].map(w => w.toUpperCase());

// Pre-compute adjacency map once at module load
const WORD_ADJ = (() => {
  const adj = {};
  WORD_DICT.forEach(w => { adj[w] = []; });
  for (let i = 0; i < WORD_DICT.length; i++)
    for (let j = i+1; j < WORD_DICT.length; j++)
      if (diffsByOne(WORD_DICT[i], WORD_DICT[j])) {
        adj[WORD_DICT[i]].push(WORD_DICT[j]);
        adj[WORD_DICT[j]].push(WORD_DICT[i]);
      }
  return adj;
})();

// Find a 7-word chain using seeded DFS from a random starting word
function generateChain(seedStr) {
  const rng = createRng(seedFromString("crossclimb" + seedStr));
  // Filter to words that have enough neighbours (makes chains easier to find)
  const richWords = WORD_DICT.filter(w => WORD_ADJ[w].length >= 3);

  for (let attempt = 0; attempt < 60; attempt++) {
    const start = richWords[Math.floor(rng() * richWords.length)];
    const path  = [start];
    const visited = new Set([start]);

    function dfs() {
      if (path.length === 7) return true;
      const neighbours = shuffleWith([...WORD_ADJ[path[path.length-1]]], rng);
      for (const w of neighbours) {
        if (!visited.has(w)) {
          path.push(w); visited.add(w);
          if (dfs()) return true;
          path.pop(); visited.delete(w);
        }
      }
      return false;
    }

    if (dfs()) return path;
  }
  return null;
}

// Clue bank: word → short trivia clue
const CLUE_BANK = {
  ABLE:"Capable or competent",ACHE:"Dull persistent pain",ACID:"Sour chemical substance",ACRE:"Unit of land area",
  AGED:"Matured over time",ALLY:"Partner or supporter",ALOE:"Succulent used in skincare",ALSO:"In addition to",
  ALTO:"Low female singing voice",ANTE:"Poker stake before cards are dealt",ARCH:"Curved structure over a gap",AREA:"Enclosed region or space",
  ARIA:"Solo opera song",ARID:"Extremely dry and barren",ARMY:"Military land force",ARTY:"Pretentiously artistic",
  AWAY:"At a distance",AXLE:"Rod connecting two wheels",BABE:"Infant or attractive person",BABY:"Very young child",
  BACK:"Rear side",BADE:"Past tense of bid farewell",BAIL:"Release from custody on payment",BALE:"Bundle of hay or compressed goods",
  BALK:"Refuse to proceed",BALL:"Round sport object",BALM:"Soothing ointment or lotion",BAND:"Musical group",
  BANE:"Cause of great distress",BANG:"Loud explosive sound",BANK:"Place to keep money",BARE:"Without covering or clothing",
  BARK:"Outer skin of a tree or dog sound",BARN:"Farm storage building",BASE:"Foundation or bottom",BASK:"Lie in warmth and sunshine",
  BATH:"Soak in a tub",BAUD:"Unit of data transmission speed",BAWL:"Cry loudly and noisily",BEAR:"Large woodland animal",
  BEAT:"Rhythm or pulse",BEEN:"Past participle of be",BELL:"Rings to announce",BELT:"Worn around the waist",
  BEST:"Highest quality",BIAS:"Unfair preference or slant",BILE:"Bitter digestive fluid from liver",BILL:"Invoice for payment",
  BIND:"Tie or fasten",BINS:"Containers for rubbish or storage",BIRD:"Feathered flying animal",BITE:"Use teeth on",
  BLEW:"Past tense of blow",BLOB:"Small drop of thick liquid",BLOT:"Ink stain or dark mark",BLOW:"Expel air forcefully",
  BLUE:"Colour of the sky",BOAT:"Small watercraft",BODE:"Be an omen of things to come",BOLD:"Brave and daring",
  BOLT:"Door fastener or lightning",BOND:"Strong connection",BONE:"Hard tissue in the body",BOOK:"Bound printed pages",
  BOOM:"Loud deep sound",BOON:"Welcome benefit or blessing",BOOT:"Footwear above ankle",BORE:"To drill or make dull",
  BORN:"Came into existence",BOSH:"Nonsense or rubbish",BOSS:"Manager or supervisor",BOTH:"Two considered together",
  BOWL:"Deep round dish",BRAG:"Boast about achievements",BRAN:"Outer husk of cereal grain",BRED:"Raised and brought up",
  BREW:"Make beer or tea",BRIM:"Top edge of a cup or hat",BUCK:"Male deer or resist forcefully",BUOY:"Floating marker in water",
  BURN:"Damage by fire",BURP:"Belch of gas from stomach",BURY:"Place a body underground",BUSY:"Occupied or active",
  CAFE:"Small informal restaurant",CAGE:"Enclosure with bars for animals",CALL:"Shout or phone someone",CALM:"Peaceful and still",
  CAME:"Past tense of come",CAMP:"Outdoor temporary shelter",CARB:"Carbohydrate in food",CARD:"Stiff paper rectangle",
  CARE:"Look after something",CART:"Two-wheeled vehicle",CASE:"Container or legal matter",CASH:"Physical money",
  CAST:"Throw or set of actors",CAVE:"Underground hollow",CEDE:"Give up territory or rights",CELL:"Smallest living unit",
  CHAP:"Man or fellow informally",CHAR:"Burn the surface of something",CHAT:"Informal conversation",CHEW:"Grind food with teeth",
  CHIN:"Lower part of the face",CHIP:"Small fragment or snack",CHOP:"Cut with a sharp blow",CHUM:"Close friend or buddy",
  CITE:"Quote as evidence",CITY:"Large urban settlement",CLAD:"Wearing particular clothing",CLAM:"Bivalve shellfish",
  CLAN:"Close-knit family group",CLAP:"Strike palms together sharply",CLAW:"Sharp curved nail",CLAY:"Modelling material",
  CLIP:"Fasten or cut",CLOG:"Block up or obstruct",CLOT:"Thickened mass of blood",CLUB:"Group or thick stick",
  CLUE:"Hint or lead",COAL:"Black fossil fuel",COAT:"Outer garment",COBS:"Corn husks or rounded lumps",
  CODE:"Set of symbols",COGS:"Toothed wheels in machinery",COIL:"Spiral shape",COLA:"Fizzy dark drink",
  COLD:"Low temperature",COLT:"Young male horse",COME:"Move toward a place",CONE:"Pointed shape or ice cream vessel",
  COOK:"Prepare food with heat",COOL:"Slightly cold",COPE:"Manage a difficult situation",COPY:"Duplicate",
  CORD:"Thick string",CORE:"Central part",CORN:"Yellow grain",COST:"Price of something",
  COUP:"Sudden seizure of power",CRAM:"Study intensively before an exam",CREW:"Team on a vessel",CRIB:"Baby's bed with bars",
  CROP:"Cultivated plant harvest",CROW:"Large black bird or boast loudly",CUFF:"Sleeve end or strike lightly",CURE:"Treatment that heals",
  CURL:"Spiral or curved shape",DAMP:"Slightly wet or moist",DARE:"Challenge",DARK:"Absence of light",
  DARN:"Mend a hole by weaving thread",DART:"Pointed thrown object",DATA:"Facts and statistics",DATE:"Calendar day or fruit",
  DAWN:"First light of day",DAYS:"Periods of twenty-four hours",DEAD:"No longer living",DEAL:"Business agreement",
  DEAR:"Beloved or expensive",DEBT:"Money owed",DEEP:"Far down",DEFT:"Skilful and nimble",
  DENY:"Refuse to accept",DESK:"Work table",DIET:"Food intake plan",DIKE:"Embankment holding back water",
  DILL:"Feathery herb used for pickling",DING:"Small dent or bell sound",DIRE:"Extremely serious",DIRT:"Soil or grime",
  DISK:"Flat circular object",DIVA:"Celebrated female singer",DIVE:"Plunge head first into water",DOCK:"Harbour platform",
  DOES:"Third person of do",DOLE:"Unemployment benefit payment",DOLT:"Stupid or slow-witted person",DOME:"Rounded roof or ceiling",
  DONE:"Finished",DOOR:"Hinged entrance",DOSE:"Measured amount of medicine",DOTE:"Be excessively fond of",
  DOVE:"White peace bird",DOWN:"Lower direction",DRAB:"Dull and uninteresting colour",DRAG:"Pull along with effort",
  DRAM:"Small measure of whisky",DRAW:"Create with a pencil",DREW:"Past tense of draw",DRIP:"Small falling drop",
  DROP:"Fall or small amount",DRUB:"Beat thoroughly",DRUG:"Medicinal substance",DRUM:"Percussion instrument",
  DUAL:"Having two parts or purposes",DUCT:"Tube for carrying fluid or air",DULL:"Boring or not sharp",DUMP:"Discard waste",
  DUNE:"Sand hill",DUSK:"Time just after sunset",DUST:"Fine dry particles",DUTY:"Responsibility or tax",
  EACH:"Every one individually",EARL:"British nobleman ranking below marquess",EARN:"Receive payment for work",EASE:"Reduce difficulty",
  EAST:"Direction of sunrise",EASY:"Not difficult or strenuous",EDGE:"Outer boundary",EDGY:"Tense and irritable",
  ELAN:"Energetic style and flair",ELSE:"Instead or otherwise",EMIT:"Send out light heat or sound",ENVY:"Resentful desire for another's qualities",
  EPIC:"Heroic or impressively large",ETCH:"Cut a design into a surface",EURO:"Currency of the European Union",EVEN:"Level or divisible by two",
  EVER:"At any time",EVIL:"Profoundly immoral",EXAM:"Formal test of knowledge",FACE:"Front of the head",
  FACT:"True piece of information",FADE:"Gradually lose colour or strength",FAIL:"Not succeed",FAIR:"Just or funfair",
  FALL:"Drop downward or autumn",FAME:"Public renown",FANG:"Long sharp tooth",FARE:"Cost of a journey",
  FARM:"Agricultural land",FAST:"Quick or abstain from food",FATE:"Destiny",FAWN:"Young deer or pale yellow-brown",
  FAZE:"Disturb or disconcert",FEAT:"Achievement requiring skill",FEEL:"Sense by touch",FEET:"Plural of foot",
  FELL:"Cut down or past of fall",FELT:"Past of feel or fabric",FEUD:"Long-running bitter quarrel",FIFE:"Small shrill flute",
  FILE:"Store documents or a tool",FILL:"Make full",FILM:"Movie or thin coating",FIND:"Locate something",
  FINE:"Excellent or penalty",FIRE:"Combustion or dismiss",FIRM:"Solid or a company",FISH:"Aquatic animal",
  FIST:"Clenched hand",FIVE:"Number after four",FLAB:"Soft excess body fat",FLAG:"Identify or national symbol",
  FLAT:"Level surface or apartment",FLAW:"Imperfection or defect",FLEA:"Tiny jumping bloodsucking insect",FLED:"Past tense of flee",
  FLEW:"Past tense of fly",FLEX:"Bend or tighten muscles",FLIP:"Turn over quickly",FLIT:"Move lightly and quickly",
  FLOE:"Floating sheet of ice",FLOG:"Beat or sell aggressively",FLOP:"Fall loosely or fail badly",FLOW:"Move steadily",
  FLUX:"Continuous change or flow",FOAL:"Young horse",FOAM:"Mass of tiny bubbles",FOLD:"Bend over itself",
  FOLK:"Ordinary people or traditional music",FOND:"Having affection for",FONT:"Typeface or baptismal basin",FOOD:"Eaten for nutrition",
  FOOL:"Person lacking judgment",FOOT:"Base of the leg",FORD:"Cross a shallow river",FORE:"Front part",
  FORK:"Eating utensil",FORM:"Shape or document",FORT:"Military stronghold",FOUL:"Unfair play or bad smell",
  FOUR:"Number after three",FOWL:"Domestic bird kept for eggs or meat",FRAY:"Fight or unravel at edges",FREE:"At no cost or liberate",
  FRET:"Worry unnecessarily",FROG:"Amphibian that jumps and croaks",FROM:"Indicating a starting point",FUEL:"Energy source",
  FULL:"Containing maximum",FUND:"Pool of money",FUSE:"Safety device or join together",GAIN:"Obtain or increase in",
  GALE:"Very strong wind",GALL:"Bold impudence or bile from liver",GAME:"Activity with rules",GANG:"Group of criminals",
  GASH:"Deep cut or slash",GASP:"Sharp intake of breath",GAVE:"Past tense of give",GAWK:"Stare rudely and openly",
  GAZE:"Look steadily for a long time",GEAR:"Equipment or cog",GELD:"Castrate a male animal",GEMS:"Precious or semiprecious stones",
  GENE:"Unit of heredity in DNA",GIFT:"Present or talent",GILD:"Cover thinly with gold",GILL:"Breathing organ of fish",
  GIRL:"Young female",GIST:"Main point or substance",GIVE:"Hand over",GLAD:"Happy",
  GLOB:"Rounded lump of something",GLOW:"Emit soft light",GLUE:"Adhesive",GNAW:"Bite or chew persistently",
  GOAD:"Provoke or stimulate action",GOAL:"Aim or scoring point",GOBS:"Large amounts of something",GOES:"Third person of go",
  GOLD:"Precious yellow metal",GOLF:"Club and ball sport",GONE:"Departed",GOOD:"Of high quality",
  GORY:"Involving blood and violence",GOWN:"Long formal dress or robe",GRAB:"Seize quickly",GRAY:"Neutral colour",
  GREW:"Past of grow",GREY:"Alternative spelling of gray",GRID:"Network of lines",GRIM:"Stern or unpleasant",
  GRIP:"Firm hold",GROW:"Increase in size",GULF:"Large deep bay or divide",GUST:"Sudden burst of wind",
  HACK:"Cut roughly or unauthorised access",HADE:"Angle of a geological fault",HAFT:"Handle of an axe or knife",HAIL:"Ice precipitation or greet",
  HAIR:"Strand on the head",HALE:"Strong and healthy",HALF:"One of two equal parts",HALL:"Corridor or large room",
  HALT:"Come to a stop",HAMS:"Cured thighs of pork",HAND:"End of the arm",HANG:"Suspend from above",
  HARD:"Firm or difficult",HARM:"Cause damage",HARP:"Stringed instrument played by plucking",HASH:"Chopped mixture or pound sign",
  HASP:"Hinged metal clasp for a lock",HATE:"Intense dislike",HAUL:"Pull or drag with effort",HAVE:"Possess",
  HAWK:"Bird of prey that hunts",HAZE:"Thin mist or confusion",HEAD:"Top of the body",HEAL:"Recover from injury",
  HEAP:"Untidy pile",HEAT:"Warmth or high temperature",HEED:"Pay careful attention to",HEEL:"Back of the foot",
  HELD:"Past of hold",HELM:"Steering wheel of a ship",HELP:"Assist",HERD:"Group of animals moving together",
  HERE:"In this place",HERO:"Brave person",HIDE:"Conceal",HIGH:"Far above ground",
  HIKE:"Long country walk",HILL:"Raised ground",HINT:"Indirect suggestion",HIRE:"Employ or rent",
  HOAX:"Deliberate deception or trick",HOLD:"Grasp or keep",HOLE:"Hollow space",HOME:"Where you live",
  HONE:"Sharpen or perfect",HOOD:"Head covering",HOOK:"Curved fastener",HOPE:"Desire for good outcome",
  HOPS:"Jumps or beer flavouring plant",HORN:"Animal protrusion or wind instrument",HOST:"Entertain guests",HOUR:"Sixty minutes",
  HOWL:"Long wailing cry of pain",HUBS:"Centres of activity or wheel centres",HUED:"Having a particular colour",HUGE:"Very large",
  HULL:"Body of a ship",HUMP:"Rounded lump on a camel's back",HUNG:"Past of hang",HUNT:"Search for prey",
  HURL:"Throw with great force",HURT:"Cause pain",IDEA:"Thought or plan in the mind",IDLE:"Not working or active",
  INCH:"Unit of length or move slowly",INTO:"Moving to the inside of",IRON:"Metal element or clothes tool",ISLE:"Small island",
  ITEM:"Individual thing or entry",JADE:"Green gemstone or make weary",JAGS:"Sharp projections or periods of excess",JAIL:"Prison",
  JARS:"Glass containers or shocks unpleasantly",JAWS:"Bones forming the mouth",JAZZ:"Genre of music with improvisation",JIBE:"Be consistent with or sailing turn",
  JIGS:"Lively folk dances or guiding tools",JINX:"Bring bad luck to",JOIN:"Connect",JOKE:"Something funny",
  JOTS:"Writes briefly or tiny amounts",JOYS:"Feelings of great happiness",JUGS:"Containers with handles and spouts",JUMP:"Spring off the ground",
  JUST:"Fair or only",JUTS:"Protrudes outward",KEEN:"Enthusiastic",KEEP:"Retain",
  KEGS:"Small barrels of beer",KELP:"Large brown seaweed",KERB:"Edge of a pavement",KERN:"Inner part of a grain",
  KEYS:"Instruments for unlocking locks",KICK:"Strike with foot",KILL:"End a life",KILN:"Furnace for firing pottery or bricks",
  KILO:"One thousand grams",KIND:"Generous or type",KING:"Male monarch",KINK:"Sharp twist or quirk",
  KITS:"Sets of tools or equipment",KNEE:"Joint in the leg",KNIT:"Make fabric by looping yarn",KNOB:"Rounded handle or protrusion",
  KNOT:"Fastening made by tying cord",KNOW:"Have information",LABS:"Scientific research rooms",LACE:"Delicate openwork fabric or bootlace",
  LACK:"Be without",LADS:"Young men or boys",LAID:"Past tense of lay",LAKE:"Inland body of water",
  LAME:"Unable to walk properly or weak excuse",LAND:"Solid ground",LANE:"Narrow path or road division",LASH:"Strike with a whip or eyelash",
  LASS:"Young woman or girl",LAST:"Final or continue",LATE:"After expected time",LAUD:"Praise highly",
  LAVA:"Molten rock from a volcano",LAWN:"Mown grass area",LAZE:"Relax and do little",LAZY:"Unwilling to work or exert effort",
  LEAD:"Guide or heavy metal",LEAF:"Part of a plant",LEAK:"Escape of liquid through a hole",LEAN:"Rest against or thin",
  LEAP:"Jump or bound",LEEK:"Long green and white vegetable",LEFT:"Opposite of right",LEND:"Loan temporarily",
  LENS:"Curved glass for focussing light",LEST:"For fear that",LICK:"Pass tongue over a surface",LIFE:"State of being alive",
  LIFT:"Raise upward or elevator",LIKE:"Enjoy or similar to",LIMB:"Arm leg or branch",LIME:"Green citrus fruit",
  LIMP:"Walk unevenly or lacking firmness",LINE:"Long thin mark",LINK:"Connection",LION:"Large wild cat",
  LISP:"Pronounce s as th",LIST:"Series of items",LIVE:"Be alive or reside",LOAD:"Amount carried",
  LOAN:"Borrowed money",LOCK:"Secure with a key",LODE:"Vein of metal ore in rock",LOFT:"Upper room or kick high in the air",
  LOLL:"Sit or lie in a relaxed way",LONE:"Solitary",LONG:"Extended length",LOOP:"Curved shape",
  LOPS:"Cuts branches off a tree",LORE:"Body of traditional knowledge",LOSE:"Fail to keep",LOSS:"Amount lost",
  LOST:"No longer found",LOUD:"High volume",LOUT:"Rough aggressive person",LOVE:"Deep affection",
  LUCK:"Good fortune",LULL:"Calm period or soothe to sleep",LUMP:"Irregular mass",LUNG:"Breathing organ",
  LURE:"Tempt with something attractive",LURK:"Wait in hiding",LUTE:"Plucked stringed instrument",LYRE:"Ancient harp-like instrument",
  MACE:"Spice or ceremonial staff",MADE:"Past of make",MAIL:"Postal delivery",MAIN:"Most important",
  MAKE:"Create",MALE:"Masculine gender",MALL:"Large covered shopping centre",MANE:"Long hair on a horse or lion",
  MANY:"Large number",MARE:"Female horse",MARK:"Sign or symbol",MASS:"Quantity of matter",
  MAST:"Tall pole on a ship",MATE:"Partner or friend",MATH:"Mathematics",MAWS:"Stomachs or throats of animals",
  MAZE:"Network of paths",MEAD:"Alcoholic honey drink",MEAL:"Occasion of eating",MEAN:"Average or unkind",
  MEEK:"Gentle and submissive",MEET:"Come together",MELD:"Blend or merge together",MELT:"Change from solid to liquid",
  MENU:"List of available food choices",MERE:"Nothing more than",MESH:"Network of interlocked material",MICE:"Plural of mouse",
  MIFF:"Make slightly annoyed",MILD:"Gentle or not strong",MILE:"Unit of distance",MILK:"White dairy drink",
  MILL:"Grinding machine",MIND:"Mental faculties",MINE:"Belonging to me or excavation",MIRE:"Swampy or boggy ground",
  MISS:"Fail to hit or title",MIST:"Light thin fog",MITT:"Type of glove or baseball glove",MOAT:"Water-filled ditch around a castle",
  MOBS:"Disorderly crowds",MOCK:"Ridicule or imitate",MODE:"Method or fashion",MOLE:"Small burrowing animal",
  MONK:"Member of a religious community",MOOD:"Emotional state",MOON:"Earth's natural satellite",MOPE:"Be listless and dejected",
  MOPS:"Cleaning tools with absorbent heads",MORE:"Additional amount",MOST:"Greatest in amount or degree",MOVE:"Change position",
  MUCH:"Large quantity",MUCK:"Dirt or farmyard manure",MUGS:"Cups with handles or attacks and robs",MULL:"Ponder or heat wine with spices",
  MUST:"Be obliged to",MYTH:"Traditional story or false belief",NAIL:"Thin metal pin or finger covering",NAME:"Word for identification",
  NAPE:"Back of the neck",NAVY:"Country's warships and sailors",NEAP:"Low tidal range period",NEAR:"Close in distance",
  NECK:"Part connecting head to body",NEED:"Require",NEWT:"Small amphibian living in ponds",NEXT:"Immediately following",
  NICE:"Pleasant",NINE:"Number between eight and ten",NODE:"Junction point",NODS:"Moves head up and down",
  NONE:"Not any",NOOK:"Small corner or recess",NORM:"Standard or usual",NOSE:"Organ of smell",
  NOTE:"Brief written record or musical tone",NUDE:"Unclothed or naked",NULL:"Having no value or effect",OAKS:"Large trees producing acorns",
  OARS:"Paddles for rowing a boat",OAST:"Kiln for drying hops",OATH:"Solemn promise or swear word",OBOE:"Woodwind instrument with a double reed",
  ODDS:"Probability or ratio of likelihood",OILS:"Liquid fats or lubricants",OKRA:"Green vegetable used in stews",ONCE:"One time",
  ONLY:"Solely or exclusively",OPEN:"Not closed",ORBS:"Spheres or eyes poetically",ORES:"Rocks containing valuable minerals",
  OVAL:"Egg-shaped or elliptical",OVEN:"Enclosed compartment for cooking",OVER:"Above or finished",OWNS:"Possesses as property",
  OXEN:"Plural of ox",PACE:"Speed of movement",PACK:"Put items in a container",PACT:"Formal agreement between parties",
  PAGE:"Sheet of paper",PAIN:"Unpleasant feeling",PAIR:"Two of a kind",PALE:"Light in colour",
  PALM:"Inner hand or tree",PANG:"Sudden sharp feeling of pain",PANS:"Wide shallow cooking vessels",PARK:"Green public space",
  PART:"Section of a whole",PASS:"Move past or permit",PAST:"Previous time",PATE:"Top of the head or meat paste",
  PATH:"Way or track",PAVE:"Cover with flat stones",PAWN:"Chess piece or pledge as security",PAWS:"Animal feet with claws",
  PAYS:"Gives money in exchange",PEAK:"Highest point",PEEL:"Remove outer layer",PEER:"Look or equal",
  PEGS:"Pins or clips for fastening",PENS:"Writing instruments or small enclosures",PERK:"Additional benefit of a job",PETS:"Domesticated companion animals",
  PEWS:"Long wooden seats in a church",PICK:"Choose or pointed tool",PIER:"Structure over water",PIKE:"Freshwater fish or long spear",
  PILE:"Heap",PILL:"Small medicinal tablet",PINE:"Evergreen tree or yearn",PINK:"Light red colour",
  PINT:"Unit of liquid measure",PIPE:"Hollow tube",PITS:"Holes in the ground or worst parts",PLAN:"Scheme or blueprint",
  PLAY:"Engage in fun or drama",PLEA:"Urgent request",PLOD:"Walk heavily and slowly",PLOP:"Fall with a soft sound",
  PLOT:"Plan or area of land",PLOW:"Turn soil for planting",PLUG:"Block a hole or electrical connector",PLUM:"Sweet purple fruit or desirable thing",
  PLUS:"Addition or positive",PODS:"Seed cases of peas or beans",POEM:"Literary composition",POLE:"Long cylindrical rod",
  POLL:"Survey or vote",POLO:"Horse sport or shirt style",POND:"Small body of water",POOL:"Shared resource or water",
  POOR:"Lacking money",PORE:"Tiny opening",PORT:"Harbour or side of ship",POSE:"Position or pretend",
  POST:"Mail or upright stake",POSY:"Small bunch of flowers",POTS:"Round containers for cooking or plants",POUR:"Flow liquid",
  PRAY:"Speak to a deity",PREY:"Hunted animal",PROD:"Poke or prompt into action",PROP:"Support or theatrical object",
  PUBS:"Places serving alcoholic drinks",PULL:"Draw toward you",PUMP:"Move fluid by pressure",PURE:"Unmixed or innocent",
  PUSH:"Apply force to move",QUAY:"Wharf for loading and unloading ships",RACK:"Framework for storage",RAGA:"Pattern of notes in Indian music",
  RAGE:"Violent anger",RAID:"Surprise attack",RAIL:"Horizontal bar or train track",RAIN:"Water falling from clouds",
  RAMP:"Sloping surface connecting two levels",RAND:"South African currency",RANK:"Level in hierarchy",RANT:"Speak at length angrily",
  RARE:"Uncommon",RASP:"Harsh grating sound or coarse file",RATE:"Measure of speed or cost",RAVE:"Speak wildly or dance party",
  RAZE:"Completely destroy a building",READ:"Interpret written words",REAL:"Genuine",REAP:"Harvest grain or receive consequences",
  REED:"Tall marsh grass",REEF:"Underwater rock formation",REEK:"Smell strongly and unpleasantly",REEL:"Spool or stagger",
  REFS:"Officials in sports matches",REIN:"Strap to control a horse",RELY:"Depend on with confidence",RENT:"Payment for use",
  REST:"Pause or remainder",RICE:"Grain staple food",RICH:"Wealthy",RIDE:"Travel on or in",
  RIFE:"Widespread or common",RIGS:"Sets up equipment or large vehicles",RIME:"Frost formed from frozen fog",RIND:"Tough outer skin of fruit",
  RING:"Circular band or sound of bell",RINK:"Ice or roller skating surface",RIOT:"Violent public disturbance",RIPS:"Tears apart forcefully",
  RISE:"Go upward",RISK:"Possibility of loss",ROAD:"Route for vehicles",ROAM:"Wander freely",
  ROAN:"Having a mixed colour coat",ROAR:"Loud deep sound",ROBE:"Long loose garment",ROCK:"Stone or music genre",
  RODE:"Past tense of ride",RODS:"Straight thin poles",ROLE:"Part one plays",ROLL:"Turn over or bread",
  ROMP:"Play boisterously or easy win",ROOF:"Top covering of a building",ROOM:"Space or chamber",ROOT:"Underground plant part",
  ROPE:"Thick twisted cord",ROSE:"Flowering plant or past of rise",ROWS:"Lines of things or arguments",RUBS:"Applies friction to a surface",
  RUGS:"Floor coverings or small carpets",RUIN:"Destroy or remains",RULE:"Regulation or govern",RUSH:"Move fast or plant",
  RUST:"Corrosion of iron",RUTS:"Deep grooves worn by wheels",SAFE:"Free from danger or strongbox",SAGA:"Long story of heroic deeds",
  SAGE:"Wise person or herb",SAGS:"Droops or sinks downward",SAID:"Past tense of say",SAIL:"Move by wind or fabric on mast",
  SALE:"Exchange for money",SALT:"Mineral seasoning",SAME:"Identical",SAND:"Tiny rock particles",
  SAPS:"Weakens gradually or plant fluid",SAVE:"Preserve or rescue",SAWS:"Cutting tools with toothed blades",SAYS:"Speaks or states",
  SCAM:"Dishonest scheme to cheat someone",SCAN:"Look over quickly or medical imaging",SCAR:"Mark left after wound heals",SEAL:"Wax closure or marine mammal",
  SEAM:"Line where two pieces join",SEAR:"Cook surface quickly at high heat",SEED:"Plant embryo",SEEK:"Search for",
  SEEM:"Appear to be",SEEN:"Past participle of see",SEEP:"Ooze slowly through small gaps",SELF:"One's own person",
  SELL:"Exchange for money",SEND:"Cause to go",SENT:"Past tense of send",SERF:"Feudal labourer bound to the land",
  SETS:"Groups of things or hardened",SHAG:"Coarse tobacco or thick carpet",SHED:"Small outbuilding or lose",SHIN:"Front of the lower leg",
  SHIP:"Large watercraft",SHOD:"Having shoes fitted",SHOE:"Foot covering",SHOP:"Place to buy things",
  SHOT:"Fired projectile or attempt",SHOW:"Display",SHUT:"Close",SICK:"Unwell",
  SIDE:"Edge or surface",SIGH:"Exhale slowly",SIGN:"Symbol or indication",SILK:"Soft shiny fabric",
  SING:"Produce musical tones",SINK:"Go below surface",SITE:"Location or website",SIZE:"Dimensions",
  SKIN:"Outer body covering",SKIP:"Jump lightly or miss",SLAM:"Shut forcefully",SLIM:"Slender",
  SLIP:"Slide accidentally",SLOG:"Work hard or hit heavily",SLOP:"Spill liquid messily",SLOW:"Not fast",
  SLUR:"Speak unclearly or insult",SMOG:"Pollution fog over cities",SMUG:"Excessively self-satisfied",SNAG:"Unexpected problem or catch on something",
  SNAP:"Break sharply",SNOB:"Person who looks down on others",SNOW:"Frozen precipitation",SNUG:"Warm and comfortable",
  SOAK:"Wet thoroughly",SOAR:"Fly high",SOBS:"Cries with convulsive breaths",SOCK:"Foot clothing",
  SODS:"Pieces of turf",SOFT:"Not hard",SOIL:"Earth for plants",SOLE:"Only or bottom of shoe",
  SOME:"Part of a group",SONG:"Musical composition",SOPS:"Things offered to pacify someone",SORE:"Painful or causing distress",
  SORT:"Arrange by type",SOUL:"Spiritual essence",SOUP:"Liquid food",SOUR:"Acidic taste",
  SPIN:"Rotate",SPIT:"Eject saliva",SPOT:"Location or notice",SPUD:"Potato or tool for digging",
  SPUN:"Past tense of spin",SPUR:"Urge on or device on riding boot",STAB:"Pierce with a sharp object",STAG:"Male deer or bachelor party",
  STAR:"Celestial body or celebrity",STAY:"Remain",STEM:"Plant stalk or stop",STEP:"Footstep or stair",
  STIR:"Mix or cause",STOP:"Cease moving",STUB:"Short remaining end or stub a toe",STUD:"Male breeding animal or decorative nail",
  SUBS:"Substitutes or submarine sandwiches",SUCH:"Of that kind",SUDS:"Frothy soap bubbles",SUIT:"Set of clothes or be appropriate",
  SULK:"Be silently resentful",SUMP:"Pit for collecting liquid",SUNG:"Past of sing",SUNK:"Past of sink",
  SURE:"Certain",SWAB:"Absorbent pad for cleaning wounds",SWAM:"Past tense of swim",SWAN:"Large white water bird",
  SWAP:"Exchange one thing for another",SWAT:"Hit sharply",SWIM:"Move through water",TABS:"Small flaps or keeping watch over",
  TADS:"Small amounts",TAGS:"Labels or graffiti signatures",TAIL:"Animal appendage",TAKE:"Grasp or require",
  TALE:"Story",TALL:"High in stature",TAMP:"Pack down tightly",TANK:"Large container or armoured vehicle",
  TANS:"Browns in the sun or light brown shades",TAPS:"Light touches or water faucets",TARP:"Waterproof protective sheet",TART:"Sharp in taste or small pastry",
  TASK:"Assigned work",TAUT:"Pulled tight with no slack",TEAK:"Hard tropical wood for furniture",TEAM:"Group working together",
  TEAR:"Drop of liquid from eye or rip",TEEM:"Be full of or swarm with",TELL:"Communicate",TEND:"Look after or be likely to",
  TERM:"Period of time or word",TEST:"Examination",THAW:"Melt from frozen state",THEW:"Muscular strength",
  THUD:"Dull heavy sound of impact",THUG:"Violent criminal person",TICK:"Mark or small insect",TIDE:"Rise and fall of sea",
  TIDY:"Neat and well-organised",TIER:"Level or rank in a hierarchy",TIFF:"Minor quarrel or disagreement",TILE:"Flat square piece",
  TIME:"The ongoing sequence of events",TINT:"Slight shade of colour",TINY:"Very small",TIPS:"Ends of things or gratuities",
  TIRE:"Fatigue or rubber wheel",TOGA:"Draped Roman garment",TOIL:"Work hard with difficulty",TOLL:"Tax for use or ring slowly",
  TONE:"Sound quality or shade",TONG:"Gripping tool with two arms",TOOK:"Past of take",TOOL:"Implement for work",
  TOOT:"Short blast on a horn",TOPS:"Highest parts or spinning toys",TORE:"Past of tear",TOSH:"Nonsense or rubbish talk",
  TOSS:"Throw lightly",TOUR:"Journey visiting places",TOWN:"Settlement larger than village",TRAP:"Catch in a snare",
  TREK:"Long difficult journey on foot",TRIM:"Cut neatly",TRIO:"Group of three performers",TRIP:"Short journey or stumble",
  TROD:"Past tense of tread",TROT:"Pace between walk and canter",TRUE:"In accordance with fact",TUBE:"Hollow cylinder",
  TUCK:"Push edges in neatly or comfort food",TUGS:"Pulls sharply or small powerful boats",TUNE:"Melody",TURF:"Grass surface",
  TURN:"Change direction",TWIN:"One of two identical",TYPE:"Kind or category",UGLY:"Unpleasant to look at",
  ULNA:"Inner bone of the forearm",UNDO:"Reverse or unfasten something",UNIT:"Single quantity",UPON:"On top of",
  URGE:"Strong desire or encourage strongly",USED:"Previously owned",VALE:"Valley especially in poetry",VAMP:"Seduce or repair shoe uppers",
  VANE:"Wind direction indicator",VAST:"Immense",VATS:"Large containers for liquid",VEER:"Change direction suddenly",
  VEIN:"Blood vessel",VERB:"Action word",VEST:"Sleeveless garment",VIEW:"Visual scene",
  VILE:"Extremely unpleasant",VINE:"Climbing plant",VISA:"Official permit to enter a country",VOID:"Empty space",
  VOLE:"Small rodent related to mice",VOTE:"Express a choice",WADE:"Walk through water",WADS:"Thick bundles of paper or money",
  WAFT:"Float gently through the air",WAGE:"Payment for work",WAIT:"Remain until",WAKE:"Stop sleeping or track behind boat",
  WALK:"Move on foot",WALL:"Vertical structure",WANE:"Decrease gradually",WARD:"Hospital room or guard",
  WARM:"Moderately hot",WARN:"Alert to danger",WASP:"Stinging black and yellow insect",WAVE:"Move hand or water movement",
  WEAK:"Not strong",WEAL:"Welfare or raised mark on skin",WEDS:"Gets married",WEEP:"Cry or shed tears",
  WEIR:"Low dam across a river",WELD:"Join metal with heat",WELL:"In good health or water source",WENT:"Past of go",
  WEST:"Direction of sunset",WHEY:"Watery part of curdled milk",WHIM:"Sudden impulse or notion",WHIP:"Strike with a lash or mix rapidly",
  WIDE:"Of great extent",WIFE:"Married woman",WIGS:"Hairpieces worn on the head",WILD:"Undomesticated",
  WILL:"Future intention or document",WIND:"Moving air",WINE:"Fermented grape drink",WING:"Limb for flying",
  WINK:"Close one eye briefly",WIRE:"Thin metal strand",WISE:"Having knowledge and judgement",WISH:"Desire",
  WOES:"Troubles and misfortunes",WOKE:"Became aware or socially conscious",WOLF:"Large wild canine",WOMB:"Organ where foetus develops",
  WOOD:"Material from trees",WOOL:"Sheep's fleece",WOOS:"Courts or tries to win over",WORD:"Unit of language",
  WORE:"Past of wear",WORK:"Effort or employment",WORM:"Limbless creature",WORN:"Damaged by use",
  WRAP:"Cover by winding",WRIT:"Court order or formal document",YARD:"Unit of length or enclosed space",YAWN:"Open mouth wide when tired",
  YEAR:"12 months",YELL:"Shout loudly",YORE:"Long ago in the past",YULE:"Christmas or yuletide season",
  ZANY:"Amusingly unconventional",ZEAL:"Great energy and enthusiasm",ZERO:"Nothing or the number 0",ZEST:"Enthusiasm or citrus peel flavouring",
  ZINC:"Bluish-white metallic element",ZING:"Sharp high-pitched sound or energy",ZONE:"Designated region"
};

// Get a clue for a word — fallback to a generic one
function getClue(word) {
  return CLUE_BANK[word.toUpperCase()] || "A 4-letter word";
}

// Pick a bookend clue (describes first and last word of the chain)
function getBookendClue(w1, w7) {
  const c1 = getClue(w1).split(/[,;]/)[0].toLowerCase();
  const c2 = getClue(w7).split(/[,;]/)[0].toLowerCase();
  return `${c1.charAt(0).toUpperCase()}${c1.slice(1)} / ${c2.charAt(0).toUpperCase()}${c2.slice(1)}`;
}

// Seed generation
const CC_ADJECTIVES = ["FAST","BOLD","DARK","NEON","WILD","IRON","GOLD","BLUE","CYAN","VOID","DEEP","KEEN","APEX","FLUX","GRID"];
const CC_NOUNS      = ["PATH","LOOP","NODE","WIRE","LINK","MAZE","FLOW","TIDE","BOLT","RING","ARC","CORE"];
function randomCCSeed() {
  const rng  = createRng(Date.now() ^ (Math.random() * 0xffffffff));
  const adj  = CC_ADJECTIVES[Math.floor(rng() * CC_ADJECTIVES.length)];
  const noun = CC_NOUNS[Math.floor(rng() * CC_NOUNS.length)];
  return `${adj}-${noun}-${String(Math.floor(rng() * 9000) + 1000)}`;
}

function CrossclimbGame({ onBack }) {
  const ACCENT = "#4a9080";
  const LOCKED_BG = "#c8b89a";

  const [seedStr,    setSeedStr]    = useState(() => randomCCSeed());
  const [chain,      setChain]      = useState(null);   // 7-word array
  const [generating, setGenerating] = useState(true);
  const [genError,   setGenError]   = useState(false);

  const [answers,    setAnswers]    = useState(["","","","",""]);
  const [locked,     setLocked]     = useState([false,false,false,false,false]);
  const [activeRow,  setActiveRow]  = useState(0);
  const [shakingRow, setShakingRow] = useState(null);
  const [phase,      setPhase]      = useState("p1");
  const [order,      setOrder]      = useState([0,1,2,3,4]);
  const [dragging,   setDragging]   = useState(null);
  const [dragOver,   setDragOver]   = useState(null);
  const [topAns,     setTopAns]     = useState("");
  const [botAns,     setBotAns]     = useState("");
  const [topLocked,  setTopLocked]  = useState(false);
  const [botLocked,  setBotLocked]  = useState(false);
  const [topShake,   setTopShake]   = useState(false);
  const [botShake,   setBotShake]   = useState(false);
  const [activeBookend, setActiveBookend] = useState("top");
  const [hintCooldown,   setHintCooldown]   = useState(0);
  const [revealCooldown, setRevealCooldown] = useState(0);
  const [hintLetters,    setHintLetters]    = useState({});
  const [elapsed,    setElapsed]    = useState(0);
  const [gameState,  setGameState]  = useState("idle");
  const [bestTime,   setBestTime]   = useState(null);

  const startRef    = useRef(null);
  const timerRef    = useRef(null);
  const coolRef     = useRef(null);
  const inputRefs   = useRef([]);
  const topInputRef = useRef(null);
  const botInputRef = useRef(null);

  function loadChain(seed) {
    setGenerating(true);
    setGenError(false);
    setSeedStr(seed);
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const c = generateChain(seed);
      if (!c) { setGenError(true); setGenerating(false); return; }
      setChain(c);
      setAnswers(["","","","",""]);
      setLocked([false,false,false,false,false]);
      setActiveRow(0);
      setPhase("p1");
      // Shuffle the middle-word display order so it's not pre-solved
      const orderRng = createRng(seedFromString("order" + seed));
      const shuffledOrder = shuffleWith([0,1,2,3,4], orderRng);
      setOrder(shuffledOrder);
      setTopAns(""); setBotAns("");
      setTopLocked(false); setBotLocked(false);
      setTopShake(false); setBotShake(false);
      setActiveBookend("top");
      setHintCooldown(0); setRevealCooldown(0);
      setHintLetters({});
      setElapsed(0); setGameState("idle"); startRef.current = null;
      clearInterval(timerRef.current);
      setGenerating(false);
    }, 30);
  }

  useEffect(() => { loadChain(seedStr); }, []);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 100);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  useEffect(() => {
    clearInterval(coolRef.current);
    if (hintCooldown > 0 || revealCooldown > 0) {
      coolRef.current = setInterval(() => {
        setHintCooldown(v => Math.max(0,v-1));
        setRevealCooldown(v => Math.max(0,v-1));
      }, 1000);
    }
    return () => clearInterval(coolRef.current);
  }, [hintCooldown, revealCooldown]);

  // Validate order on entering p2
  useEffect(() => {
    if (phase === "p2" && chain) {
      if (validateOrder(order)) setTimeout(() => setPhase("p3"), 400);
    }
  }, [phase, chain]);

  function startTimer() {
    if (gameState !== "idle") return;
    startRef.current = Date.now(); setGameState("playing");
  }

  function validateOrder(o) {
    if (!chain) return false;
    const words = o.map(i => chain[i+1]);
    for (let i=0;i<words.length-1;i++) if (!diffsByOne(words[i],words[i+1])) return false;
    return true;
  }

  function applyOrder(o) {
    setOrder(o);
    if (validateOrder(o)) setTimeout(() => setPhase("p3"), 400);
  }

  function handleDragStart(i) { setDragging(i); }
  function handleDragEnter(i) { setDragOver(i); }
  function handleDragEnd() {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      const o=[...order]; const [item]=o.splice(dragging,1); o.splice(dragOver,0,item); applyOrder(o);
    }
    setDragging(null); setDragOver(null);
  }
  function moveRow(from, dir) {
    const to=from+dir; if(to<0||to>=order.length) return;
    const o=[...order]; [o[from],o[to]]=[o[to],o[from]]; applyOrder(o);
  }
  function pairStatuses(o) {
    if(!chain) return [];
    const words=o.map(i=>chain[i+1]);
    return words.map((w,i)=>i===0?true:diffsByOne(words[i-1],w));
  }

  function handleInput(idx, val) {
    if (!chain) return;
    startTimer();
    const clean = val.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0, chain[idx+1].length);
    const na=[...answers]; na[idx]=clean; setAnswers(na);
    if (clean.length === chain[idx+1].length) checkAnswer(idx, clean);
  }

  function checkAnswer(idx, val) {
    if ((val||answers[idx]).toUpperCase() === chain[idx+1]) {
      const nl=[...locked]; nl[idx]=true; setLocked(nl);
      const nextUnlocked=nl.findIndex((l,i)=>!l&&i>idx);
      const anyUnlocked=nl.findIndex(l=>!l);
      const focusIdx=nextUnlocked!==-1?nextUnlocked:anyUnlocked;
      if (focusIdx!==-1) { setActiveRow(focusIdx); setTimeout(()=>inputRefs.current[focusIdx]?.focus(),60); }
      if (nl.every(Boolean)) setTimeout(()=>setPhase("p2"),350);
    } else {
      setShakingRow(idx); setTimeout(()=>setShakingRow(null),400);
    }
  }

  function checkBookend(which, val) {
    if (!chain) return;
    const typed=val.toUpperCase().trim();
    if (which==="top") {
      if (typed===chain[0]) setTopLocked(true);
      else if (typed.length===chain[0].length) { setTopShake(true); setTimeout(()=>setTopShake(false),400); }
    } else {
      if (typed===chain[6]) setBotLocked(true);
      else if (typed.length===chain[6].length) { setBotShake(true); setTimeout(()=>setBotShake(false),400); }
    }
  }

  useEffect(() => {
    if (topLocked && botLocked && phase==="p3") {
      const t=Date.now()-startRef.current;
      setGameState("done"); setPhase("done");
      setBestTime(prev=>(!prev||t<prev)?t:prev);
    }
  }, [topLocked, botLocked]);

  // Hint/reveal targeting
  function currentTarget() {
    if (phase==="p1") return {kind:"middle", idx:activeRow};
    if (phase==="p3") return {kind:"bookend", which:activeBookend};
    return null;
  }
  function isTargetSolved() {
    const t=currentTarget(); if(!t) return true;
    if (t.kind==="middle") return locked[t.idx];
    return t.which==="top"?topLocked:botLocked;
  }
  function getTargetCorrectWord() {
    if (!chain) return "";
    const t=currentTarget(); if(!t) return "";
    if (t.kind==="middle") return chain[t.idx+1];
    return t.which==="top"?chain[0]:chain[6];
  }
  function getTargetTyped() {
    const t=currentTarget(); if(!t) return "";
    if (t.kind==="middle") return answers[t.idx]||"";
    return t.which==="top"?topAns:botAns;
  }
  function getTargetKey() {
    const t=currentTarget(); if(!t) return null;
    if (t.kind==="middle") return t.idx;
    return t.which;
  }

  function handleHint() {
    if (hintCooldown>0||isTargetSolved()||!chain) return;
    startTimer();
    const correct=getTargetCorrectWord(), key=getTargetKey();
    const existing=hintLetters[key]??new Set();
    const typed=getTargetTyped();
    const needHint=[...Array(correct.length).keys()].filter(i=>!existing.has(i)&&typed[i]!==correct[i]);
    const candidates=needHint.length>0?needHint:[...Array(correct.length).keys()].filter(i=>!existing.has(i));
    if (candidates.length===0) return;
    const rng=createRng(seedFromString(correct+candidates.length));
    const pos=candidates[Math.floor(rng()*candidates.length)];
    const newSet=new Set(existing); newSet.add(pos);
    setHintLetters(prev=>({...prev,[key]:newSet}));
    const t=currentTarget();
    if (t.kind==="middle") {
      const na=[...answers];
      const arr=(na[t.idx]||"").split(""); while(arr.length<correct.length) arr.push("");
      arr[pos]=correct[pos]; na[t.idx]=arr.join(""); setAnswers(na);
      if (na[t.idx].length===correct.length) checkAnswer(t.idx,na[t.idx]);
    } else {
      const cur=getTargetTyped().split(""); while(cur.length<correct.length) cur.push("");
      cur[pos]=correct[pos]; const nv=cur.join("");
      if (t.which==="top") { setTopAns(nv); if(nv.length===correct.length) checkBookend("top",nv); }
      else { setBotAns(nv); if(nv.length===correct.length) checkBookend("bot",nv); }
    }
    setHintCooldown(5);
  }

  function handleReveal() {
    if (revealCooldown>0||isTargetSolved()||!chain) return;
    startTimer();
    const correct=getTargetCorrectWord(), key=getTargetKey();
    const newSet=new Set([...Array(correct.length).keys()]);
    setHintLetters(prev=>({...prev,[key]:newSet}));
    const t=currentTarget();
    if (t.kind==="middle") {
      const na=[...answers]; na[t.idx]=correct; setAnswers(na);
      const nl=[...locked]; nl[t.idx]=true; setLocked(nl);
      const anyUnlocked=nl.findIndex(l=>!l);
      if (anyUnlocked!==-1) { setActiveRow(anyUnlocked); setTimeout(()=>inputRefs.current[anyUnlocked]?.focus(),60); }
      else setTimeout(()=>setPhase("p2"),350);
    } else {
      if (t.which==="top") { setTopAns(correct); setTopLocked(true); }
      else { setBotAns(correct); setBotLocked(true); }
    }
    setRevealCooldown(10);
  }

  function getLetterState(rowKey, charIdx) {
    if (!chain) return "empty";
    const isML=typeof rowKey==="number"&&locked[rowKey];
    const isBL=rowKey==="top"?topLocked:rowKey==="bot"?botLocked:false;
    if (isML||isBL) return "correct";
    const correct=typeof rowKey==="number"?chain[rowKey+1]:rowKey==="top"?chain[0]:chain[6];
    const typed=typeof rowKey==="number"?(answers[rowKey]||""):rowKey==="top"?topAns:botAns;
    const hinted=hintLetters[rowKey]??new Set();
    if (hinted.has(charIdx)) return "hinted";
    if (charIdx<typed.length) return typed[charIdx]===correct[charIdx]?"ok":"wrong";
    return "empty";
  }

  if (generating) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",padding:"20px 16px",background:"#0e0e0e"}} className="page-enter">
      <div style={{marginTop:80,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:16,animation:"pulse 1.2s ease infinite"}}>🔤</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#444",letterSpacing:"0.15em"}}>GENERATING PUZZLE…</div>
      </div>
    </div>
  );

  if (genError || !chain) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",padding:"20px 16px",background:"#0e0e0e"}}>
      <div style={{marginTop:80,textAlign:"center"}}>
        <div style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace",marginBottom:16}}>Couldn't find a chain — trying another seed</div>
        <button onClick={()=>loadChain(randomCCSeed())} style={{padding:"10px 24px",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"#f0ede8",color:"#0e0e0e",border:"none",cursor:"pointer"}}>TRY AGAIN</button>
      </div>
    </div>
  );

  const arranged = order.map(i => chain[i+1]);
  const statuses = pairStatuses(order);
  const showToolbar = phase==="p1"||phase==="p3";

  function activeClueText() {
    if (phase==="p1") return locked[activeRow]?"✓ Correct":getClue(chain[activeRow+1]);
    if (phase==="p3") {
      const isLk=activeBookend==="top"?topLocked:botLocked;
      if (isLk) return "✓ Correct";
      return getBookendClue(chain[0],chain[6]);
    }
    return "";
  }

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",minHeight:"100vh",
      padding:`20px 16px ${showToolbar?120:40}px`,background:"#0e0e0e"}} className="page-enter">
      <style>{`
        @keyframes ccShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}60%{transform:translateX(5px)}}
        @keyframes ccLock{0%{transform:scale(0.96)}60%{transform:scale(1.03)}100%{transform:scale(1)}}
        .cc-shake{animation:ccShake 0.35s ease;}
        .cc-lock{animation:ccLock 0.25s ease;}
        .cc-hidden-input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;}
      `}</style>

      {/* Header */}
      <div style={{width:"100%",maxWidth:520,display:"flex",alignItems:"center",marginBottom:20,gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"1.5px solid #2a2a2a",borderRadius:8,padding:"7px 14px",color:"#888",fontSize:12,fontFamily:"'DM Mono',monospace",letterSpacing:"0.06em",cursor:"pointer"}}
          onMouseEnter={e=>e.target.style.borderColor="#555"} onMouseLeave={e=>e.target.style.borderColor="#2a2a2a"}>← HUB</button>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:"#f0ede8",lineHeight:1}}>Crossclimb</div>
          <div style={{fontSize:10,color:"#444",letterSpacing:"0.2em",marginTop:2,fontFamily:"'DM Mono',monospace"}}>WORD LADDER TRIVIA</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:500,letterSpacing:"-0.02em",
            color:phase==="done"?ACCENT:gameState==="playing"?"#f0ede8":"#222"}}>
            {formatTimeFull(gameState==="playing"||phase==="done"?elapsed:null)}
          </div>
          {bestTime&&<div style={{fontSize:10,color:"#333",fontFamily:"'DM Mono',monospace",marginTop:2}}>BEST {formatTimeFull(bestTime)}</div>}
        </div>
      </div>

      <div style={{width:"100%",maxWidth:420}}>

        {/* Top bookend */}
        <div className={topShake?"cc-shake":""} style={{marginBottom:8,borderRadius:12,overflow:"hidden",
          background:topLocked?"rgba(74,144,128,0.15)":LOCKED_BG,
          border:`2px solid ${topLocked?ACCENT:"transparent"}`}}>
          {phase==="p1"||phase==="p2"?(
            <div style={{padding:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:20}}>🔒</span>
            </div>
          ):topLocked?(
            <div className="cc-lock" style={{padding:"14px 16px",display:"flex",justifyContent:"center",gap:16}}>
              {chain[0].split("").map((ch,i)=>(
                <span key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:24,fontWeight:700,color:ACCENT}}>{ch}</span>
              ))}
            </div>
          ):(
            <div style={{padding:"12px 16px",position:"relative"}} onClick={()=>{setActiveBookend("top");topInputRef.current?.focus();}}>
              <input ref={topInputRef} className="cc-hidden-input" value={topAns} maxLength={chain[0].length}
                onChange={e=>{startTimer();const v=e.target.value.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,chain[0].length);setTopAns(v);checkBookend("top",v);}}
                onFocus={()=>setActiveBookend("top")} />
              <div style={{display:"flex",justifyContent:"center",gap:16,alignItems:"center"}}>
                {chain[0].split("").map((_,ci)=>{
                  const state=getLetterState("top",ci);
                  const ch=(topAns||"")[ci]||"";
                  return(
                    <div key={ci} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,lineHeight:1,
                        color:state==="hinted"||state==="correct"?ACCENT:state==="wrong"?"#c06060":"#f0ede8",
                        minWidth:16,textAlign:"center"}}>{ch}</span>
                      <div style={{height:2,width:20,borderRadius:1,
                        background:state==="hinted"||state==="correct"?ACCENT:state==="wrong"?"#c06060":activeBookend==="top"&&ci===topAns.length?"#7060c8":"#555"}}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Phase 1 — middle rows */}
        {phase==="p1" && chain.slice(1,6).map((_,idx)=>{
          const word=chain[idx+1];
          const isLocked=locked[idx];
          const isActive=activeRow===idx&&!isLocked;
          const isShaking=shakingRow===idx;
          return(
            <div key={idx} className={isShaking?"cc-shake":""} style={{marginBottom:8,position:"relative",
              background:isLocked?"rgba(74,144,128,0.1)":isActive?"rgba(74,144,128,0.07)":"#141414",
              border:`2px solid ${isLocked?ACCENT:isActive?"#3a4a3a":"#1e1e1e"}`,
              borderRadius:12,padding:"13px 16px",cursor:"text",transition:"all 0.15s"}}
              onClick={()=>{if(!isLocked){setActiveRow(idx);inputRefs.current[idx]?.focus();}}}>
              <input ref={el=>inputRefs.current[idx]=el} className="cc-hidden-input"
                value={answers[idx]} onChange={e=>handleInput(idx,e.target.value)}
                onFocus={()=>setActiveRow(idx)} maxLength={word.length}
                tabIndex={isLocked?-1:0} readOnly={isLocked} />
              <div style={{display:"flex",justifyContent:"center",gap:16,alignItems:"center"}}>
                {word.split("").map((correctLetter,ci)=>{
                  const state=getLetterState(idx,ci);
                  const typedCh=(answers[idx]||"")[ci]||"";
                  const displayCh=isLocked?correctLetter:typedCh;
                  const isCursor=isActive&&ci===(answers[idx]||"").length;
                  return(
                    <div key={ci} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,lineHeight:1,
                        minWidth:16,textAlign:"center",
                        color:isLocked?ACCENT:state==="hinted"?ACCENT:state==="wrong"?"#c06060":"#f0ede8",
                        transition:"color 0.15s"}}>{displayCh}</span>
                      <div style={{height:2,width:20,borderRadius:1,
                        background:isLocked?ACCENT:isCursor?"#7060c8":state==="wrong"?"#c06060":state==="hinted"?ACCENT:"#2a2a2a"}}/>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Phase 2/3/done — draggable rows */}
        {(phase==="p2"||phase==="p3"||phase==="done")&&order.map((wordIdx,rowPos)=>{
          const word=chain[wordIdx+1];
          const isOk=statuses[rowPos];
          const canDrag=phase==="p2";
          const isDraggingThis=dragging===rowPos;
          const isDragOver=dragOver===rowPos;
          return(
            <div key={wordIdx} draggable={canDrag}
              onDragStart={()=>canDrag&&handleDragStart(rowPos)}
              onDragEnter={()=>canDrag&&handleDragEnter(rowPos)}
              onDragEnd={()=>canDrag&&handleDragEnd()}
              onDragOver={e=>e.preventDefault()}
              style={{marginBottom:8,display:"flex",alignItems:"center",gap:10,
                background:isDragOver?"rgba(74,144,128,0.15)":"#141414",
                border:`2px solid ${phase==="p2"?(isOk?ACCENT:"#2a2a2a"):ACCENT}`,
                borderRadius:12,padding:"13px 14px",opacity:isDraggingThis?0.4:1,
                transition:"border-color 0.15s",cursor:canDrag?"grab":"default"}}>
              {canDrag&&(
                <div style={{display:"flex",flexDirection:"column",gap:0,flexShrink:0}}>
                  <button onClick={()=>moveRow(rowPos,-1)} disabled={rowPos===0}
                    style={{background:"none",border:"none",color:rowPos===0?"#222":"#666",cursor:rowPos===0?"default":"pointer",padding:"2px 5px",fontSize:11,lineHeight:1}}>▲</button>
                  <button onClick={()=>moveRow(rowPos,1)} disabled={rowPos===order.length-1}
                    style={{background:"none",border:"none",color:rowPos===order.length-1?"#222":"#666",cursor:rowPos===order.length-1?"default":"pointer",padding:"2px 5px",fontSize:11,lineHeight:1}}>▼</button>
                </div>
              )}
              <div style={{display:"flex",justifyContent:"center",gap:16,flex:1}}>
                {word.split("").map((ch,i)=>(
                  <span key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,
                    color:phase==="p2"&&isOk?ACCENT:phase!=="p2"?ACCENT:"#f0ede8"}}>{ch}</span>
                ))}
              </div>
              {canDrag&&<div style={{width:22,flexShrink:0}}/>}
            </div>
          );
        })}

        {/* Bottom bookend */}
        <div className={botShake?"cc-shake":""} style={{marginTop:2,borderRadius:12,overflow:"hidden",
          background:botLocked?"rgba(74,144,128,0.15)":LOCKED_BG,
          border:`2px solid ${botLocked?ACCENT:"transparent"}`}}>
          {phase==="p1"||phase==="p2"?(
            <div style={{padding:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:20}}>🔒</span>
            </div>
          ):botLocked?(
            <div className="cc-lock" style={{padding:"14px 16px",display:"flex",justifyContent:"center",gap:16}}>
              {chain[6].split("").map((ch,i)=>(
                <span key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:24,fontWeight:700,color:ACCENT}}>{ch}</span>
              ))}
            </div>
          ):(
            <div style={{padding:"12px 16px",position:"relative"}} onClick={()=>{setActiveBookend("bot");botInputRef.current?.focus();}}>
              <input ref={botInputRef} className="cc-hidden-input" value={botAns} maxLength={chain[6].length}
                onChange={e=>{startTimer();const v=e.target.value.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,chain[6].length);setBotAns(v);checkBookend("bot",v);}}
                onFocus={()=>setActiveBookend("bot")} />
              <div style={{display:"flex",justifyContent:"center",gap:16,alignItems:"center"}}>
                {chain[6].split("").map((_,ci)=>{
                  const state=getLetterState("bot",ci);
                  const ch=(botAns||"")[ci]||"";
                  return(
                    <div key={ci} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,lineHeight:1,
                        color:state==="hinted"||state==="correct"?ACCENT:state==="wrong"?"#c06060":"#f0ede8",
                        minWidth:16,textAlign:"center"}}>{ch}</span>
                      <div style={{height:2,width:20,borderRadius:1,
                        background:state==="hinted"||state==="correct"?ACCENT:state==="wrong"?"#c06060":activeBookend==="bot"&&ci===botAns.length?"#7060c8":"#555"}}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bookend clue + phase instructions */}
        {(phase==="p3"||phase==="done")&&(
          <div style={{marginTop:12,background:"#111",border:"1px solid #1e1e1e",borderRadius:10,padding:"10px 16px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#333",fontFamily:"'DM Mono',monospace",letterSpacing:"0.2em",marginBottom:4}}>COMBINED CLUE</div>
            <div style={{fontSize:13,color:"#888",fontFamily:"'DM Sans',sans-serif"}}>{getBookendClue(chain[0],chain[6])}</div>
          </div>
        )}
        {phase==="p2"&&(
          <div style={{marginTop:12,background:"#111",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
            <div style={{fontSize:12,color:"#555",fontFamily:"'DM Mono',monospace"}}>Drag or use ▲▼ to build the word ladder</div>
            <div style={{fontSize:11,color:"#333",fontFamily:"'DM Mono',monospace",marginTop:4}}>Each word must differ by exactly one letter from its neighbours</div>
          </div>
        )}

        {/* Done card */}
        {phase==="done"&&(
          <div style={{marginTop:16,background:"rgba(74,144,128,0.1)",border:"1.5px solid rgba(74,144,128,0.3)",borderRadius:14,padding:"22px 24px",textAlign:"center",animation:"slideUp 0.35s ease"}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:ACCENT,marginBottom:6}}>Ladder complete!</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:28,color:"#f0ede8",marginBottom:4}}>{formatTimeFull(elapsed)}</div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#444",letterSpacing:"0.1em",marginBottom:16}}>{chain.join(" → ")}</div>
            <button onClick={()=>loadChain(randomCCSeed())}
              style={{padding:"11px 28px",borderRadius:10,fontSize:12,fontFamily:"'DM Mono',monospace",background:"#f0ede8",color:"#0e0e0e",border:"none",cursor:"pointer",fontWeight:500}}>
              NEW PUZZLE
            </button>
          </div>
        )}

        {/* How to play */}
        {phase==="p1"&&(
          <div style={{marginTop:8,background:"#111",border:"1px solid #1a1a1a",borderRadius:12,padding:"14px 18px"}}>
            <div style={{fontSize:9,color:"#333",fontFamily:"'DM Mono',monospace",letterSpacing:"0.2em",marginBottom:10}}>HOW TO PLAY</div>
            <div style={{fontSize:11,color:"#555",fontFamily:"'DM Mono',monospace",lineHeight:1.85}}>
              • Answer each clue with a <span style={{color:ACCENT}}>4-letter word</span><br/>
              • Then arrange them into a <span style={{color:ACCENT}}>word ladder</span> — each step differs by one letter<br/>
              • Finally solve the two bookend words to complete the ladder
            </div>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      {showToolbar&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0e0e0e",borderTop:"1px solid #1a1a1a",padding:"0 16px 20px",zIndex:50}}>
          <div style={{maxWidth:420,margin:"0 auto",paddingTop:10,paddingBottom:10,borderBottom:"1px solid #1a1a1a",textAlign:"center"}}>
            <div style={{fontSize:13,color:isTargetSolved()?"#555":"#d0d0d0",fontFamily:"'DM Sans',sans-serif",fontStyle:isTargetSolved()?"italic":"normal"}}>
              {activeClueText()}
            </div>
          </div>
          <div style={{maxWidth:420,margin:"10px auto 0",display:"flex",gap:10}}>
            <button onClick={handleReveal} disabled={revealCooldown>0||isTargetSolved()}
              style={{flex:1,padding:"12px 0",borderRadius:24,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500,
                background:"transparent",border:`1.5px solid ${revealCooldown>0||isTargetSolved()?"#222":"#3a3a3a"}`,
                color:revealCooldown>0||isTargetSolved()?"#333":"#888",cursor:revealCooldown>0||isTargetSolved()?"default":"pointer",transition:"all 0.15s"}}>
              {revealCooldown>0?`Reveal row (${revealCooldown}s)`:"Reveal row"}
            </button>
            <button onClick={handleHint} disabled={hintCooldown>0||isTargetSolved()}
              style={{flex:1,padding:"12px 0",borderRadius:24,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500,
                background:"transparent",border:`1.5px solid ${hintCooldown>0||isTargetSolved()?"#222":"#3a3a3a"}`,
                color:hintCooldown>0||isTargetSolved()?"#333":"#888",cursor:hintCooldown>0||isTargetSolved()?"default":"pointer",transition:"all 0.15s"}}>
              {hintCooldown>0?`Hint (${hintCooldown}s)`:"Hint"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrossclimbGame;
