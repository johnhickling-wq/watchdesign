import { useMemo, useState } from 'react';
import { mutateDesign, recolorDesign } from '../model/random';
import type { WatchDesign } from '../model/types';
import { WatchSVG } from '../render/WatchSVG';

interface Props {
  base: WatchDesign;
  onPick: (d: WatchDesign) => void;
  onClose: () => void;
}

type Mode = 'remix' | 'recolor';

export function VariationsModal({ base, onPick, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('remix');
  const [nonce, setNonce] = useState(0);

  const variants = useMemo(() => {
    const gen = mode === 'remix' ? mutateDesign : recolorDesign;
    return Array.from({ length: 8 }, () => gen(base));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, mode, nonce]);

  return (
    <div className="overlay" onClick={onClose} role="dialog" aria-label="Design variations">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>✨ Variations on “{base.model}”</h2>
          <div className="modal-tools">
            <div className="segment">
              <button type="button" className={mode === 'remix' ? 'selected' : ''} onClick={() => setMode('remix')}>
                Remix
              </button>
              <button type="button" className={mode === 'recolor' ? 'selected' : ''} onClick={() => setMode('recolor')}>
                Recolour
              </button>
            </div>
            <button type="button" className="btn" onClick={() => setNonce((n) => n + 1)}>
              🎲 Reroll
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>
        <p className="modal-hint">Click a variation to adopt it — undo brings you back.</p>
        <div className="var-grid">
          {variants.map((v, i) => (
            <button key={`${nonce}-${mode}-${i}`} type="button" className="var-tile" onClick={() => onPick(v)}>
              <WatchSVG design={v} shadow={false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
