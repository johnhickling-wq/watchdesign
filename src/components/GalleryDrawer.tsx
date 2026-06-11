import type { WatchDesign } from '../model/types';
import { WatchSVG } from '../render/WatchSVG';

export interface SavedDesign {
  id: string;
  savedAt: number;
  design: WatchDesign;
}

const KEY = 'watchlab.gallery.v1';

export function loadGallery(): SavedDesign[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedDesign[];
    return Array.isArray(list) ? list.filter((s) => s?.design?.v === 1) : [];
  } catch {
    return [];
  }
}

export function persistGallery(list: SavedDesign[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full / unavailable — gallery just won't persist
  }
}

interface Props {
  items: SavedDesign[];
  onLoad: (d: WatchDesign) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function GalleryDrawer({ items, onLoad, onDelete, onClose }: Props) {
  return (
    <aside className="drawer" role="dialog" aria-label="Saved designs">
      <header className="drawer-head">
        <h2>🗂 Saved designs</h2>
        <button type="button" className="btn ghost" onClick={onClose}>
          ✕
        </button>
      </header>
      {items.length === 0 ? (
        <p className="drawer-empty">Nothing saved yet. Hit ♡ Save to keep a concept here.</p>
      ) : (
        <ul className="drawer-list">
          {items.map((s) => (
            <li key={s.id} className="drawer-item">
              <button type="button" className="drawer-thumb" onClick={() => onLoad(s.design)} title="Load this design">
                <WatchSVG design={s.design} shadow={false} />
              </button>
              <div className="drawer-meta">
                <strong>{s.design.model}</strong>
                <span>{s.design.brand}</span>
                <span className="drawer-date">{new Date(s.savedAt).toLocaleDateString()}</span>
                <div className="drawer-actions">
                  <button type="button" className="mini-btn" onClick={() => onLoad(s.design)}>
                    Load
                  </button>
                  <button type="button" className="mini-btn danger" onClick={() => onDelete(s.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
