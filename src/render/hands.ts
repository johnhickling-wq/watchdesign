import type { HandStyle } from '../model/types';

export interface HandShape {
  /** Main body path, hand pointing up from origin, tip at (0,-L) */
  d: string;
  /** Optional lume inset path */
  lume?: string;
  /** Mercedes-style circle emblem, drawn by the renderer */
  emblem?: { cy: number; r: number };
}

export function handShape(style: HandStyle, kind: 'hour' | 'minute', L: number): HandShape {
  const tail = L * 0.16;
  switch (style) {
    case 'dauphine': {
      const w = L * (kind === 'hour' ? 0.105 : 0.07);
      return {
        d: `M0,${-L} L${w},0 L0,${tail} L${-w},0 Z`,
        lume: `M0,${-L * 0.86} L${w * 0.38},0 L0,${tail * 0.4} L${-w * 0.38},0 Z`,
      };
    }
    case 'sword': {
      const w = L * (kind === 'hour' ? 0.13 : 0.085);
      return {
        d: `M${-w / 2},${tail} L${-w * 0.33},${-L * 0.88} L0,${-L} L${w * 0.33},${-L * 0.88} L${w / 2},${tail} Z`,
        lume: `M${-w * 0.26},${-L * 0.18} L${-w * 0.2},${-L * 0.8} L${w * 0.2},${-L * 0.8} L${w * 0.26},${-L * 0.18} Z`,
      };
    }
    case 'baton': {
      const w = L * (kind === 'hour' ? 0.085 : 0.06);
      return {
        d: `M${-w / 2},${tail} L${-w / 2},${-L * 0.97} Q${-w / 2},${-L} ${-w / 2 + w * 0.5},${-L} Q${w / 2},${-L} ${w / 2},${-L * 0.97} L${w / 2},${tail} Z`,
        lume: `M${-w * 0.28},${-L * 0.3} L${-w * 0.28},${-L * 0.9} L${w * 0.28},${-L * 0.9} L${w * 0.28},${-L * 0.3} Z`,
      };
    }
    case 'mercedes': {
      if (kind === 'hour') {
        const w = L * 0.11;
        return {
          d: `M${-w / 2},${tail} L${-w * 0.4},${-L * 0.93} L0,${-L} L${w * 0.4},${-L * 0.93} L${w / 2},${tail} Z`,
          emblem: { cy: -L * 0.6, r: L * 0.17 },
        };
      }
      const w = L * 0.075;
      return {
        d: `M${-w / 2},${tail} L${-w / 2},${-L * 0.8} L0,${-L} L${w / 2},${-L * 0.8} Z`,
        lume: `M${-w * 0.3},${-L * 0.2} L${-w * 0.3},${-L * 0.75} L${w * 0.3},${-L * 0.75} L${w * 0.3},${-L * 0.2} Z`,
      };
    }
    case 'syringe': {
      const wb = L * (kind === 'hour' ? 0.075 : 0.06);
      const wn = L * 0.018;
      const split = kind === 'hour' ? 0.58 : 0.66;
      return {
        d:
          `M${-wb},${tail} L${-wb},${-L * split} L${-wn},${-L * split} L${-wn},${-L * 0.96} ` +
          `L0,${-L} L${wn},${-L * 0.96} L${wn},${-L * split} L${wb},${-L * split} L${wb},${tail} Z`,
        lume: `M${-wb * 0.5},${-L * 0.15} L${-wb * 0.5},${-L * (split - 0.05)} L${wb * 0.5},${-L * (split - 0.05)} L${wb * 0.5},${-L * 0.15} Z`,
      };
    }
    case 'snowflake': {
      const w = L * 0.06;
      const s = L * (kind === 'hour' ? 0.2 : 0.13);
      const cy = -L * (kind === 'hour' ? 0.58 : 0.68);
      return {
        d:
          `M${-w / 2},${tail} L${-w / 2},${-L * 0.92} L0,${-L} L${w / 2},${-L * 0.92} L${w / 2},${tail} Z ` +
          `M0,${cy - s} L${s},${cy} L0,${cy + s} L${-s},${cy} Z`,
        lume: `M0,${cy - s * 0.62} L${s * 0.62},${cy} L0,${cy + s * 0.62} L${-s * 0.62},${cy} Z`,
      };
    }
    case 'leaf': {
      const w = L * (kind === 'hour' ? 0.15 : 0.1);
      return {
        d: `M0,${tail} C${w},${-L * 0.18} ${w * 0.66},${-L * 0.74} 0,${-L} C${-w * 0.66},${-L * 0.74} ${-w},${-L * 0.18} 0,${tail} Z`,
        lume: `M0,${-L * 0.12} C${w * 0.34},${-L * 0.3} ${w * 0.26},${-L * 0.68} 0,${-L * 0.86} C${-w * 0.26},${-L * 0.68} ${-w * 0.34},${-L * 0.3} 0,${-L * 0.12} Z`,
      };
    }
  }
}
