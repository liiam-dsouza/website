# LinkedIn Games Hub — Component Files

## File structure

```
games-hub/
├── utils.js            # Shared pure-JS utilities (RNG, formatTime, etc.)
├── GlobalStyles.jsx    # Global CSS injected via <style> tag
├── GamesHub.jsx        # Root component — drop this into your Astro page
├── HubPage.jsx         # Landing page / game selector
├── QueensGame.jsx
├── ZipGame.jsx
├── PinpointGame.jsx
├── CrossclimbGame.jsx
├── TangoGame.jsx
├── MiniSudokuGame.jsx
└── PatchesGame.jsx
```

## Usage in Astro

1. Copy this folder into `src/components/games-hub/`
2. Create an Astro page, e.g. `src/pages/games.astro`:

```astro
---
// No server-side imports needed
---
<html>
  <head><title>Games</title></head>
  <body>
    <div id="games-root" />
    <script>
      import GamesHub from '../components/games-hub/GamesHub.jsx';
      import { createRoot } from 'react-dom/client';
      createRoot(document.getElementById('games-root')).render(
        React.createElement(GamesHub)
      );
    </script>
  </body>
</html>
```

Or more simply with Astro's React integration:

```astro
---
import GamesHub from '../components/games-hub/GamesHub.jsx';
---
<GamesHub client:only="react" />
```

## Requirements

- React 18+
- `@astrojs/react` integration enabled in `astro.config.mjs`

## Notes

- All games are fully static — no API calls, no server required
- Each game file is self-contained and can be imported individually if needed
- The `utils.js` exports are: `createRng`, `seedFromString`, `shuffleWith`, `formatTime`, `formatTimeFull`
