import { useState, useEffect, useCallback, useRef } from 'react';

// ╔══════════════════════════════════════════════════════════╗
// ║  GLOBAL STYLES                                           ║
// ╚══════════════════════════════════════════════════════════╝
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0e0e0e; color: #f0ede8; font-family: 'DM Sans', sans-serif; }
    button { cursor: pointer; font-family: inherit; }
    input { font-family: inherit; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #1a1a1a; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

    .page-enter { animation: pageIn 0.3s ease forwards; }
    @keyframes pageIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    .card-hover { transition: transform 0.2s ease, border-color 0.2s ease; }
    .card-hover:hover { transform: translateY(-3px); }

    .crown-icon { display: inline-block; }

    /* Queens error hatch */
    .cell-error-hatch {
      background-image: repeating-linear-gradient(
        -45deg,
        rgba(220,38,38,0.25) 0px,
        rgba(220,38,38,0.25) 3px,
        transparent 3px,
        transparent 9px
      ) !important;
    }

    /* Queens animations */
    @keyframes crownPop { 0%{transform:scale(0) rotate(-20deg);} 70%{transform:scale(1.2) rotate(5deg);} 100%{transform:scale(1) rotate(0);} }
    @keyframes xPlace { 0%{transform:scale(0);opacity:0;} 100%{transform:scale(1);opacity:1;} }
    @keyframes solveFlash { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
    @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
    @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
  `}</style>
);

export default GlobalStyles;
