import type { BackgroundId, HandColor, MarkerColor, MaterialId } from './types';

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two hex colours; t=0 → a, t=1 → b */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/** amt in -1..1 — negative darkens toward black, positive lightens toward white */
export function shade(hex: string, amt: number): string {
  return amt < 0 ? mix(hex, '#000000', -amt) : mix(hex, '#ffffff', amt);
}

export function luma(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** A legible ink colour (light or dark) on the given background */
export function inkOn(hex: string): string {
  return luma(hex) > 0.55 ? '#1d2025' : '#f2f0ea';
}

export interface Metal {
  label: string;
  hi: string;
  mid: string;
  lo: string;
}

export const MATERIALS: Record<MaterialId, Metal> = {
  steel: { label: 'Steel', hi: '#f4f6f8', mid: '#c3c9d1', lo: '#828a96' },
  gold: { label: 'Gold', hi: '#f9e7b3', mid: '#d4af5f', lo: '#967732' },
  rose: { label: 'Rose gold', hi: '#f6d9c8', mid: '#d49a7f', lo: '#9c6850' },
  titanium: { label: 'Titanium', hi: '#d6dade', mid: '#99a0a8', lo: '#62696f' },
  black: { label: 'Black PVD', hi: '#5e646c', mid: '#2e3238', lo: '#0e1013' },
  bronze: { label: 'Bronze', hi: '#e8c9a0', mid: '#b08d57', lo: '#735630' },
};

export const HAND_COLORS: Record<HandColor, Metal> = {
  silver: { label: 'Silver', hi: '#fafbfc', mid: '#c8cdd4', lo: '#80889a' },
  gold: { label: 'Gold', hi: '#f9e7b3', mid: '#d4af5f', lo: '#967732' },
  rose: { label: 'Rose', hi: '#f6d9c8', mid: '#d49a7f', lo: '#9c6850' },
  black: { label: 'Black', hi: '#4a4e54', mid: '#26292e', lo: '#0c0d0f' },
  white: { label: 'White', hi: '#ffffff', mid: '#f0eee9', lo: '#c9c6be' },
  blued: { label: 'Blued', hi: '#8fb3ec', mid: '#3a6cc0', lo: '#16306b' },
};

export const LUME = '#dffbee';
export const LUME_EDGE = '#9fd9bd';

export function resolveMarkerMetal(marker: MarkerColor, caseMaterial: MaterialId, accent: string, dial: string): Metal {
  switch (marker) {
    case 'auto': {
      const m = MATERIALS[caseMaterial];
      // Black cases read poorly for markers on dark dials — fall back to silver
      if (caseMaterial === 'black' && luma(dial) < 0.4) return HAND_COLORS.silver;
      return m;
    }
    case 'silver':
      return HAND_COLORS.silver;
    case 'gold':
      return HAND_COLORS.gold;
    case 'black':
      return HAND_COLORS.black;
    case 'white':
      return HAND_COLORS.white;
    case 'accent':
      return { label: 'Accent', hi: shade(accent, 0.35), mid: accent, lo: shade(accent, -0.35) };
    case 'lume':
      return { label: 'Lume', hi: '#f1fff7', mid: LUME, lo: LUME_EDGE };
  }
}

export const DIAL_SWATCHES: string[] = [
  '#101114', '#2a2d33', '#f4f2ec', '#efe7d6', '#d7dade', '#8e9196',
  '#16243d', '#2c3e5d', '#1d5e74', '#3fa9c9', '#1f6f6b', '#1f4d3a',
  '#5c5a3c', '#e6d3a7', '#e8b4a0', '#d96f32', '#5d1f2c', '#3c2a55',
  '#b9aed4', '#4a3328',
];

export const STRAP_SWATCHES: string[] = [
  '#16181c', '#3a2a20', '#6b4a2f', '#a87444', '#c8a06a', '#7a7d82',
  '#283a55', '#1f4d3a', '#5a6248', '#5d1f2c', '#8f3024', '#d8d4cb',
  '#e8b4a0', '#2f6f74',
];

export const ACCENT_SWATCHES: string[] = [
  '#d23b32', '#e8762c', '#e6b13a', '#3fc1c9', '#3a6cc0', '#3f9a5f',
  '#e87ca0', '#b9aed4', '#d4af5f', '#f2f0ea', '#16181c', '#7fd1b9',
];

export const BEZEL_SWATCHES: string[] = [
  '#101114', '#16243d', '#1d5e74', '#1f4d3a', '#5d1f2c', '#3c2a55',
  '#d96f32', '#e6d3a7', '#f4f2ec', '#2a2d33',
];

export interface Background {
  label: string;
  top: string;
  bottom: string;
}

export const BACKGROUNDS: Record<BackgroundId, Background> = {
  slate: { label: 'Slate', top: '#46506a', bottom: '#181c26' },
  paper: { label: 'Paper', top: '#ffffff', bottom: '#ddd8cd' },
  blush: { label: 'Blush', top: '#f8e3da', bottom: '#dba89a' },
  sage: { label: 'Sage', top: '#e3ebdf', bottom: '#a3b59d' },
  ocean: { label: 'Ocean', top: '#d4e4ef', bottom: '#7f9fb8' },
  noir: { label: 'Noir', top: '#34343a', bottom: '#0a0a0c' },
};
