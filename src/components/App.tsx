import { useCallback, useEffect, useRef, useState } from 'react';
import { downloadBlob, exportConceptSheet, exportWatchPng, slug } from '../export/exporter';
import { BACKGROUNDS } from '../model/colors';
import { PRESETS } from '../model/presets';
import { randomDesign } from '../model/random';
import { DEFAULT_DESIGN, type BackgroundId, type WatchDesign } from '../model/types';
import { SHOWCASE_TIME, WatchSVG, type WatchTime } from '../render/WatchSVG';
import { ControlPanel } from './ControlPanel';
import { GalleryDrawer, loadGallery, persistGallery, type SavedDesign } from './GalleryDrawer';
import { VariationsModal } from './VariationsModal';

const CURRENT_KEY = 'watchlab.current.v1';

function loadCurrent(): WatchDesign {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (raw) {
      const d = JSON.parse(raw) as WatchDesign;
      if (d?.v === 1) return { ...DEFAULT_DESIGN, ...d };
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_DESIGN;
}

/** Design state with undo/redo; rapid tweaks (sliders, colour drags) coalesce. */
function useDesignHistory(initial: () => WatchDesign) {
  const [present, setPresent] = useState(initial);
  const past = useRef<WatchDesign[]>([]);
  const future = useRef<WatchDesign[]>([]);
  const lastEdit = useRef<{ keys: string; at: number }>({ keys: '', at: 0 });

  const patch = useCallback((p: Partial<WatchDesign>) => {
    setPresent((cur) => {
      const keys = Object.keys(p).sort().join(',');
      const now = Date.now();
      const coalesce = keys === lastEdit.current.keys && now - lastEdit.current.at < 700;
      if (!coalesce) {
        past.current.push(cur);
        if (past.current.length > 60) past.current.shift();
      }
      lastEdit.current = { keys, at: now };
      future.current = [];
      return { ...cur, ...p };
    });
  }, []);

  const replace = useCallback((d: WatchDesign) => {
    setPresent((cur) => {
      past.current.push(cur);
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      lastEdit.current = { keys: '', at: 0 };
      return d;
    });
  }, []);

  const undo = useCallback(() => {
    setPresent((cur) => {
      const prev = past.current.pop();
      if (!prev) return cur;
      future.current.unshift(cur);
      lastEdit.current = { keys: '', at: 0 };
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setPresent((cur) => {
      const next = future.current.shift();
      if (!next) return cur;
      past.current.push(cur);
      lastEdit.current = { keys: '', at: 0 };
      return next;
    });
  }, []);

  return {
    design: present,
    patch,
    replace,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}

function useNow(enabled: boolean): WatchTime {
  const [now, setNow] = useState<WatchTime>(SHOWCASE_TIME);
  useEffect(() => {
    if (!enabled) {
      setNow(SHOWCASE_TIME);
      return;
    }
    const tick = () => {
      const t = new Date();
      setNow({ h: t.getHours(), m: t.getMinutes() + t.getSeconds() / 60, s: t.getSeconds() });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [enabled]);
  return now;
}

export function App() {
  const { design, patch, replace, undo, redo, canUndo, canRedo } = useDesignHistory(loadCurrent);
  const svgRef = useRef<SVGSVGElement>(null);
  const [showVariations, setShowVariations] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [liveTime, setLiveTime] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [gallery, setGallery] = useState<SavedDesign[]>(loadGallery);
  const time = useNow(liveTime);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(design));
    } catch {
      // ignore storage issues — the session simply won't restore
    }
  }, [design]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = (msg: string) => setToast(msg);

  const saveToGallery = () => {
    const item: SavedDesign = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, savedAt: Date.now(), design };
    const next = [item, ...gallery].slice(0, 40);
    setGallery(next);
    persistGallery(next);
    notify(`Saved “${design.model}” to your gallery ♡`);
  };

  const runExport = async (kind: 'png' | 'png-bg' | 'sheet') => {
    const svg = svgRef.current;
    if (!svg || exporting) return;
    setExporting(true);
    setShowExport(false);
    try {
      const blob =
        kind === 'sheet'
          ? await exportConceptSheet(svg, design)
          : await exportWatchPng(svg, design, { backdrop: kind === 'png-bg' });
      const suffix = kind === 'sheet' ? 'concept-sheet' : 'render';
      downloadBlob(blob, `${slug(design)}-${suffix}.png`);
      notify(kind === 'sheet' ? 'Concept sheet exported 📋' : 'Render exported 🖼');
    } catch (err) {
      notify(`Export failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const bg = BACKGROUNDS[design.background];

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <span className="logo-mark">⌚</span>
          <span className="logo-name">WatchLab</span>
          <span className="logo-tag">concept studio</span>
        </div>
        <div className="top-actions">
          <button type="button" className="btn ghost" onClick={undo} disabled={!canUndo} title="Undo">
            ↩
          </button>
          <button type="button" className="btn ghost" onClick={redo} disabled={!canRedo} title="Redo">
            ↪
          </button>
          <span className="divider" />
          <button type="button" className="btn" onClick={() => replace(randomDesign(design))} title="Random concept">
            🎲 Surprise me
          </button>
          <button type="button" className="btn" onClick={() => setShowVariations(true)} title="Generate variations">
            ✨ Variations
          </button>
          <span className="divider" />
          <button type="button" className="btn" onClick={saveToGallery} title="Save to gallery">
            ♡ Save
          </button>
          <button type="button" className="btn ghost" onClick={() => setShowGallery((s) => !s)} title="Saved designs">
            🗂 {gallery.length > 0 ? gallery.length : ''}
          </button>
          <div className="export-wrap">
            <button type="button" className="btn primary" onClick={() => setShowExport((s) => !s)} disabled={exporting}>
              {exporting ? 'Exporting…' : '⬇ Export'}
            </button>
            {showExport && (
              <div className="export-menu" onMouseLeave={() => setShowExport(false)}>
                <button type="button" onClick={() => runExport('sheet')}>
                  📋 Concept sheet <small>watch + specs + palette</small>
                </button>
                <button type="button" onClick={() => runExport('png-bg')}>
                  🖼 Studio render <small>PNG on backdrop</small>
                </button>
                <button type="button" onClick={() => runExport('png')}>
                  ✂️ Cut-out render <small>transparent PNG</small>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <div className="preset-block">
            <div className="ctl-label">Start from a style</div>
            <div className="preset-row">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    replace({ ...p.design, brand: design.brand, background: p.design.background });
                    notify(`${p.emoji} ${p.label} style applied`);
                  }}
                >
                  <span>{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>
          <ControlPanel design={design} onPatch={patch} />
          <p className="sidebar-foot">Just for fun — concepts, not manufacturing specs.</p>
        </aside>

        <section
          className="stage"
          style={{ background: `radial-gradient(120% 90% at 50% 18%, ${bg.top} 0%, ${bg.bottom} 100%)` }}
        >
          <div className="stage-watch">
            <WatchSVG ref={svgRef} design={design} time={time} />
          </div>
          <div className="stage-caption" style={{ color: 'rgba(255,255,255,0.85)', mixBlendMode: 'difference' }}>
            <strong>{design.brand}</strong> · {design.model}
          </div>
          <div className="stage-tools">
            <label className="live-toggle" title="Show the actual time on the watch">
              <input type="checkbox" checked={liveTime} onChange={(e) => setLiveTime(e.target.checked)} />
              <span>Live time</span>
            </label>
            <div className="bg-dots" role="radiogroup" aria-label="Backdrop">
              {(Object.keys(BACKGROUNDS) as BackgroundId[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  title={`${BACKGROUNDS[b].label} backdrop`}
                  className={`bg-dot ${design.background === b ? 'selected' : ''}`}
                  style={{ background: `linear-gradient(160deg, ${BACKGROUNDS[b].top}, ${BACKGROUNDS[b].bottom})` }}
                  onClick={() => patch({ background: b })}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      {showVariations && (
        <VariationsModal
          base={design}
          onClose={() => setShowVariations(false)}
          onPick={(d) => {
            replace(d);
            setShowVariations(false);
            notify('Variation adopted — undo to go back');
          }}
        />
      )}

      {showGallery && (
        <GalleryDrawer
          items={gallery}
          onClose={() => setShowGallery(false)}
          onLoad={(d) => {
            replace({ ...DEFAULT_DESIGN, ...d });
            setShowGallery(false);
            notify(`Loaded “${d.model}”`);
          }}
          onDelete={(id) => {
            const next = gallery.filter((g) => g.id !== id);
            setGallery(next);
            persistGallery(next);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
