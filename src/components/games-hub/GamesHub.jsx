import { useState, useEffect, useCallback, useRef } from 'react';
import GlobalStyles   from './GlobalStyles.jsx';
import HubPage        from './HubPage.jsx';
import QueensGame     from './QueensGame.jsx';
import ZipGame        from './ZipGame.jsx';
import PinpointGame   from './PinpointGame.jsx';
import CrossclimbGame from './CrossclimbGame.jsx';
import TangoGame      from './TangoGame.jsx';
import MiniSudokuGame from './MiniSudokuGame.jsx';
import PatchesGame    from './PatchesGame.jsx';

export default function GamesHub() {
  const [page, setPage] = useState('hub');

  return (
    <>
      <GlobalStyles />
      {page === 'hub'         && <HubPage        onPlay={setPage} />}
      {page === 'queens'      && <QueensGame      onBack={() => setPage('hub')} />}
      {page === 'zip'         && <ZipGame         onBack={() => setPage('hub')} />}
      {page === 'pinpoint'    && <PinpointGame    onBack={() => setPage('hub')} />}
      {page === 'crossclimb'  && <CrossclimbGame  onBack={() => setPage('hub')} />}
      {page === 'tango'       && <TangoGame       onBack={() => setPage('hub')} />}
      {page === 'minisudoku'  && <MiniSudokuGame  onBack={() => setPage('hub')} />}
      {page === 'patches'     && <PatchesGame     onBack={() => setPage('hub')} />}
    </>
  );
}
