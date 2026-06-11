import { forwardRef, useId } from 'react';
import {
  HAND_COLORS,
  LUME,
  LUME_EDGE,
  MATERIALS,
  type Metal,
  inkOn,
  luma,
  mix,
  resolveMarkerMetal,
  shade,
} from '../model/colors';
import { fontById } from '../model/fonts';
import type { WatchDesign } from '../model/types';
import { handShape } from './hands';

export const VIEW_W = 480;
export const VIEW_H = 640;
const CX = 240;
const CY = 312;

export interface WatchTime {
  h: number;
  m: number;
  s: number;
}

/** Classic catalogue time */
export const SHOWCASE_TIME: WatchTime = { h: 10, m: 9.5, s: 32 };

interface Props {
  design: WatchDesign;
  time?: WatchTime;
  width?: number | string;
  shadow?: boolean;
}

function xy(r: number, deg: number, cx = CX, cy = CY): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
}

/** Deterministic rng so textures don't shimmer between renders */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROMANS = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

export const WatchSVG = forwardRef<SVGSVGElement, Props>(function WatchSVG(
  { design: d, time = SHOWCASE_TIME, width = '100%', shadow = true },
  ref,
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (n: string) => `${uid}-${n}`;
  const url = (n: string) => `url(#${id(n)})`;

  // ------------------------------------------------------------- geometry
  const caseR = 96 + (d.caseMm - 36) * 3.2;
  const shapeInfo = {
    round: { bezelOuter: caseR * 1.0, halfW: caseR, topY: caseR * 0.96, lugs: true },
    cushion: { bezelOuter: caseR * 0.94, halfW: caseR * 0.97, topY: caseR * 0.99, lugs: true },
    tonneau: { bezelOuter: caseR * 0.88, halfW: caseR * 0.96, topY: caseR * 1.14, lugs: false },
    square: { bezelOuter: caseR * 0.91, halfW: caseR * 0.95, topY: caseR * 0.97, lugs: false },
    octagon: { bezelOuter: caseR * 0.96, halfW: caseR * 1.0, topY: caseR * 0.99, lugs: false },
  }[d.caseShape];

  const bezelW = { smooth: 13, coin: 13, fluted: 16, dive: 21, tachymeter: 22, none: 7 }[d.bezelStyle];
  const bezelOuter = shapeInfo.bezelOuter;
  const dialR = bezelOuter - bezelW - 5;

  const metal = MATERIALS[d.caseMaterial];
  const handMetal: Metal = HAND_COLORS[d.handColor];
  const markerMetal = resolveMarkerMetal(d.markerColor, d.caseMaterial, d.accentColor, d.dialColor);
  const ink = inkOn(d.dialColor);
  const dialIsLight = luma(d.dialColor) > 0.55;
  const numFont = fontById(d.numeralFont).family;
  const brandFont = fontById(d.brandFont).family;

  const strapHalfW = Math.min(caseR * 0.54, 62);
  const strapTopEnd = 52;
  const strapBottomEnd = 596;
  const caseTop = CY - shapeInfo.topY;
  const caseBottom = CY + shapeInfo.topY;

  // ------------------------------------------------------------- helpers
  const metalGrad = (n: string, m: Metal, rotated = false) => (
    <linearGradient key={n} id={id(n)} x1="0" y1="0" x2={rotated ? '0' : '1'} y2="1">
      <stop offset="0" stopColor={m.hi} />
      <stop offset="0.35" stopColor={m.mid} />
      <stop offset="0.62" stopColor={m.lo} />
      <stop offset="0.82" stopColor={m.mid} />
      <stop offset="1" stopColor={m.hi} />
    </linearGradient>
  );

  // ------------------------------------------------------------- case shape
  function caseBody() {
    const common = { fill: url('case'), stroke: shade(metal.lo, -0.25), strokeWidth: 1.5 };
    switch (d.caseShape) {
      case 'round':
        return <circle cx={CX} cy={CY} r={caseR} {...common} />;
      case 'cushion': {
        const s = caseR * 0.985;
        return <rect x={CX - s} y={CY - s} width={s * 2} height={s * 2} rx={s * 0.52} {...common} />;
      }
      case 'square': {
        const s = caseR * 0.96;
        return <rect x={CX - s} y={CY - s} width={s * 2} height={s * 2} rx={s * 0.18} {...common} />;
      }
      case 'octagon': {
        const rc = caseR * 1.045;
        const pts = Array.from({ length: 8 }, (_, k) => {
          const a = ((22.5 + 45 * k) * Math.PI) / 180;
          return `${CX + rc * Math.cos(a)},${CY + rc * Math.sin(a)}`;
        }).join(' ');
        return <polygon points={pts} {...common} strokeLinejoin="round" strokeWidth={6} stroke={shade(metal.lo, -0.15)} />;
      }
      case 'tonneau': {
        const W = caseR * 0.96;
        const H = caseR * 1.16;
        const p =
          `M${CX - W * 0.62},${CY - H * 0.84} ` +
          `C${CX - W * 1.06},${CY - H * 0.26} ${CX - W * 1.06},${CY + H * 0.26} ${CX - W * 0.62},${CY + H * 0.84} ` +
          `C${CX - W * 0.28},${CY + H} ${CX + W * 0.28},${CY + H} ${CX + W * 0.62},${CY + H * 0.84} ` +
          `C${CX + W * 1.06},${CY + H * 0.26} ${CX + W * 1.06},${CY - H * 0.26} ${CX + W * 0.62},${CY - H * 0.84} ` +
          `C${CX + W * 0.28},${CY - H} ${CX - W * 0.28},${CY - H} ${CX - W * 0.62},${CY - H * 0.84} Z`;
        return <path d={p} {...common} />;
      }
    }
  }

  // ------------------------------------------------------------- lugs & crown
  function lugs() {
    if (!shapeInfo.lugs) return null;
    const lx = strapHalfW - 8;
    const lugW = 15;
    const ys = CY - caseR - 22;
    const ye = CY + caseR - 18;
    return (
      <g fill={url('case')} stroke={shade(metal.lo, -0.2)} strokeWidth={1.2}>
        <rect x={CX - lx - lugW} y={ys} width={lugW} height={42} rx={6} />
        <rect x={CX + lx} y={ys} width={lugW} height={42} rx={6} />
        <rect x={CX - lx - lugW} y={ye} width={lugW} height={42} rx={6} />
        <rect x={CX + lx} y={ye} width={lugW} height={42} rx={6} />
      </g>
    );
  }

  function crown() {
    const cw = 15;
    const ch = 28;
    const x = CX + shapeInfo.halfW - 2;
    return (
      <g>
        <rect x={x} y={CY - ch / 2} width={cw} height={ch} rx={5} fill={url('case')} stroke={shade(metal.lo, -0.2)} strokeWidth={1.2} />
        {[-8, -3, 2, 7].map((dy) => (
          <line key={dy} x1={x + 2} y1={CY + dy} x2={x + cw - 2} y2={CY + dy} stroke={shade(metal.lo, -0.1)} strokeWidth={1.4} opacity={0.7} />
        ))}
      </g>
    );
  }

  // ------------------------------------------------------------- strap
  function strapPieces() {
    const t = d.strapType;
    const metalStrap = t === 'oyster' || t === 'jubilee' || t === 'mesh';
    if (t === 'nato') return natoStrap();
    if (metalStrap) return bracelet(t);
    return classicStrap(t);
  }

  function classicStrap(t: 'leather' | 'rubber') {
    const wTop = strapHalfW;
    const wEnd = strapHalfW * 0.84;
    const c = d.strapColor;
    const stitch = luma(c) > 0.5 ? shade(c, -0.5) : mix(c, '#f2e9d8', 0.7);
    const topLen = caseTop + 14 - strapTopEnd;
    const top = (
      <g>
        <path
          d={`M${CX - wEnd},${strapTopEnd + 16} L${CX - wTop},${caseTop + 14} L${CX + wTop},${caseTop + 14} L${CX + wEnd},${strapTopEnd + 16} Z`}
          fill={url('strap')}
          stroke={shade(c, -0.45)}
          strokeWidth={1.5}
        />
        {t === 'leather' && (
          <>
            <path
              d={`M${CX - wEnd + 6},${strapTopEnd + 22} L${CX - wTop + 6},${caseTop + 8}`}
              stroke={stitch} strokeWidth={1.6} strokeDasharray="4 4" fill="none" opacity={0.9}
            />
            <path
              d={`M${CX + wEnd - 6},${strapTopEnd + 22} L${CX + wTop - 6},${caseTop + 8}`}
              stroke={stitch} strokeWidth={1.6} strokeDasharray="4 4" fill="none" opacity={0.9}
            />
          </>
        )}
        {t === 'rubber' &&
          Array.from({ length: Math.floor(topLen / 13) }, (_, i) => {
            const y = strapTopEnd + 26 + i * 13;
            const f = (y - strapTopEnd) / topLen;
            const w = wEnd + (wTop - wEnd) * f;
            return <line key={i} x1={CX - w + 7} y1={y} x2={CX + w - 7} y2={y} stroke={shade(c, -0.3)} strokeWidth={2} opacity={0.55} />;
          })}
        {/* buckle */}
        <rect x={CX - wEnd - 5} y={strapTopEnd - 4} width={wEnd * 2 + 10} height={24} rx={9}
          fill="none" stroke={url('caseLine')} strokeWidth={7} />
        <line x1={CX} y1={strapTopEnd - 5} x2={CX} y2={strapTopEnd + 12} stroke={metal.mid} strokeWidth={4.5} strokeLinecap="round" />
        {/* keeper */}
        <rect x={CX - wEnd - 3} y={strapTopEnd + 34} width={wEnd * 2 + 6} height={10} rx={4} fill={shade(c, -0.35)} />
      </g>
    );
    const tipY = strapBottomEnd;
    const bLen = tipY - (caseBottom - 14);
    const bottom = (
      <g>
        <path
          d={`M${CX - wTop},${caseBottom - 14} L${CX - wEnd},${tipY - 36} Q${CX - wEnd},${tipY} ${CX},${tipY} Q${CX + wEnd},${tipY} ${CX + wEnd},${tipY - 36} L${CX + wTop},${caseBottom - 14} Z`}
          fill={url('strap')}
          stroke={shade(c, -0.45)}
          strokeWidth={1.5}
        />
        {t === 'leather' && (
          <path
            d={`M${CX - wTop + 6},${caseBottom - 6} L${CX - wEnd + 6},${tipY - 34} Q${CX - wEnd + 6},${tipY - 6} ${CX},${tipY - 6} Q${CX + wEnd - 6},${tipY - 6} ${CX + wEnd - 6},${tipY - 34} L${CX + wTop - 6},${caseBottom - 6}`}
            fill="none" stroke={stitch} strokeWidth={1.6} strokeDasharray="4 4" opacity={0.9}
          />
        )}
        {t === 'rubber' &&
          Array.from({ length: Math.floor((bLen - 40) / 13) }, (_, i) => {
            const y = caseBottom + 4 + i * 13;
            const f = (y - (caseBottom - 14)) / bLen;
            const w = wTop + (wEnd - wTop) * f;
            return <line key={i} x1={CX - w + 7} y1={y} x2={CX + w - 7} y2={y} stroke={shade(c, -0.3)} strokeWidth={2} opacity={0.55} />;
          })}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={CX} cy={tipY - 56 - i * 19} r={3.6} fill={shade(c, -0.55)} />
        ))}
      </g>
    );
    return (
      <g>
        {top}
        {bottom}
      </g>
    );
  }

  function natoStrap() {
    const w = strapHalfW * 0.94;
    const c = d.strapColor;
    const stripeW = w * 0.34;
    const tipY = strapBottomEnd;
    return (
      <g>
        <path
          d={`M${CX - w},${strapTopEnd} L${CX + w},${strapTopEnd} L${CX + w},${tipY - 26} Q${CX + w},${tipY} ${CX},${tipY} Q${CX - w},${tipY} ${CX - w},${tipY - 26} Z`}
          fill={c}
          stroke={shade(c, -0.45)}
          strokeWidth={1.5}
        />
        <rect x={CX - w * 0.78} y={strapTopEnd} width={stripeW} height={tipY - strapTopEnd - 10} fill={d.accentColor} opacity={0.92} />
        <rect x={CX + w * 0.78 - stripeW} y={strapTopEnd} width={stripeW} height={tipY - strapTopEnd - 10} fill={d.accentColor} opacity={0.92} />
        <rect x={CX - w * 0.06} y={strapTopEnd} width={w * 0.12} height={tipY - strapTopEnd - 10} fill={shade(c, -0.35)} opacity={0.6} />
        {/* fabric weave */}
        {Array.from({ length: Math.floor((tipY - strapTopEnd) / 7) }, (_, i) => (
          <line key={i} x1={CX - w} y1={strapTopEnd + 4 + i * 7} x2={CX + w} y2={strapTopEnd + 4 + i * 7} stroke="#000" strokeWidth={1} opacity={0.08} />
        ))}
        {/* metal keepers + buckle */}
        <rect x={CX - w - 3} y={strapTopEnd + 8} width={w * 2 + 6} height={13} rx={5} fill={url('caseLine')} />
        <rect x={CX - w - 3} y={caseTop - 34} width={w * 2 + 6} height={11} rx={5} fill={url('caseLine')} />
        <rect x={CX - w - 3} y={caseBottom + 24} width={w * 2 + 6} height={11} rx={5} fill={url('caseLine')} />
        <rect x={CX - w - 3} y={caseBottom + 78} width={w * 2 + 6} height={11} rx={5} fill={url('caseLine')} />
      </g>
    );
  }

  function bracelet(t: 'oyster' | 'jubilee' | 'mesh') {
    const rows: JSX.Element[] = [];
    const linkH = t === 'mesh' ? 7 : 21;
    const span = (y: number, end: number, dir: 1 | -1) => {
      const out: number[] = [];
      for (let yy = y; dir > 0 ? yy < end : yy > end; yy += dir * linkH) out.push(yy);
      return out;
    };
    const topYs = span(caseTop + 6 - linkH, strapTopEnd, -1);
    const botYs = span(caseBottom - 6, strapBottomEnd - linkH, 1);
    const taper = (y: number) => {
      const dist = Math.abs(y - CY) - caseR;
      const f = Math.max(0, Math.min(1, dist / 240));
      return strapHalfW * (1 - 0.16 * f);
    };
    const drawRow = (y: number, i: number, keyP: string) => {
      const w = taper(y);
      if (t === 'mesh') {
        rows.push(
          <g key={`${keyP}${i}`}>
            <rect x={CX - w} y={y} width={w * 2} height={linkH} fill={i % 2 ? metal.mid : mix(metal.mid, metal.hi, 0.3)} />
            <line x1={CX - w} y1={y} x2={CX + w} y2={y} stroke={metal.lo} strokeWidth={0.8} opacity={0.7} />
          </g>,
        );
        return;
      }
      const tone = i % 2 ? 0 : 0.12;
      if (t === 'oyster') {
        const cw = w * 0.78;
        rows.push(
          <g key={`${keyP}${i}`} stroke={shade(metal.lo, -0.15)} strokeWidth={1}>
            <rect x={CX - w} y={y} width={w - cw / 2 - 1} height={linkH - 1.5} rx={4} fill={mix(metal.mid, metal.lo, 0.25 - tone)} />
            <rect x={CX - cw / 2} y={y} width={cw} height={linkH - 1.5} rx={4} fill={mix(metal.hi, metal.mid, 0.35 - tone)} />
            <rect x={CX + cw / 2 + 1} y={y} width={w - cw / 2 - 1} height={linkH - 1.5} rx={4} fill={mix(metal.mid, metal.lo, 0.25 - tone)} />
          </g>,
        );
      } else {
        // jubilee: five links
        const widths = [0.24, 0.16, 0.2, 0.16, 0.24];
        let xAcc = CX - w;
        const cells = widths.map((fr, k) => {
          const cw2 = w * 2 * fr - 1;
          const cell = (
            <rect key={k} x={xAcc} y={y} width={cw2} height={linkH - 1.5} rx={4}
              fill={k % 2 ? mix(metal.hi, metal.mid, 0.25 - tone) : mix(metal.mid, metal.lo, 0.3 - tone)} />
          );
          xAcc += cw2 + 1;
          return cell;
        });
        rows.push(
          <g key={`${keyP}${i}`} stroke={shade(metal.lo, -0.15)} strokeWidth={0.8}>
            {cells}
          </g>,
        );
      }
    };
    topYs.forEach((y, i) => drawRow(y, i, 't'));
    botYs.forEach((y, i) => drawRow(y, i, 'b'));
    return (
      <g>
        {rows}
        {/* clasp hint */}
        <rect x={CX - taper(strapBottomEnd - 70)} y={strapBottomEnd - 78} width={taper(strapBottomEnd - 70) * 2} height={30} rx={5}
          fill="none" stroke={metal.lo} strokeWidth={1.6} opacity={0.85} />
      </g>
    );
  }

  // ------------------------------------------------------------- bezel
  function bezel() {
    const rOut = bezelOuter;
    const rIn = bezelOuter - bezelW;
    const rMid = (rOut + rIn) / 2;
    const ring = (
      <circle cx={CX} cy={CY} r={rMid} fill="none" stroke={url('bezelMetal')} strokeWidth={bezelW} />
    );
    const edges = (
      <>
        <circle cx={CX} cy={CY} r={rOut} fill="none" stroke={shade(metal.lo, -0.3)} strokeWidth={1.4} />
        <circle cx={CX} cy={CY} r={rIn} fill="none" stroke={shade(metal.lo, -0.2)} strokeWidth={1} opacity={0.8} />
      </>
    );
    switch (d.bezelStyle) {
      case 'none':
      case 'smooth':
        return (
          <g>
            {ring}
            {edges}
            {d.caseShape === 'octagon' && d.bezelStyle !== 'none' && octagonScrews(rOut)}
          </g>
        );
      case 'coin':
        return (
          <g>
            {ring}
            <circle cx={CX} cy={CY} r={rOut - 1.6} fill="none" stroke={shade(metal.lo, -0.25)} strokeWidth={3.4} strokeDasharray="2 2.4" />
            {edges}
          </g>
        );
      case 'fluted': {
        const teeth = Array.from({ length: 56 }, (_, i) => {
          const a = (i * 360) / 56;
          const [x1, y1] = xy(rIn + 1, a);
          const [x2, y2] = xy(rOut - 1, a);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={i % 2 ? shade(metal.lo, -0.1) : metal.hi} strokeWidth={3.2} opacity={0.75} />
          );
        });
        return (
          <g>
            {ring}
            {teeth}
            {edges}
          </g>
        );
      }
      case 'dive': {
        const insertIn = rIn + 2.5;
        const insertMid = (rOut - 2 + insertIn) / 2;
        const insertW = rOut - 2 - insertIn;
        const bink = inkOn(d.bezelColor);
        const marks: JSX.Element[] = [];
        for (let m = 5; m < 60; m += 5) {
          const a = m * 6;
          if (m % 10 === 0) {
            const [tx, ty] = xy(insertMid, a);
            marks.push(
              <text key={m} x={tx} y={ty} fontSize={insertW * 0.62} fontFamily={`'Jost', sans-serif`}
                fill={bink} textAnchor="middle" dominantBaseline="central" fontWeight={600}>
                {m}
              </text>,
            );
          } else {
            const [x1, y1] = xy(insertIn + insertW * 0.25, a);
            const [x2, y2] = xy(rOut - 2 - insertW * 0.25, a);
            marks.push(<line key={m} x1={x1} y1={y1} x2={x2} y2={y2} stroke={bink} strokeWidth={2.4} />);
          }
        }
        for (let m = 1; m < 15; m++) {
          if (m % 5 === 0) continue;
          const [x1, y1] = xy(insertMid + insertW * 0.18, m * 6);
          const [x2, y2] = xy(rOut - 3, m * 6);
          marks.push(<line key={`s${m}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={bink} strokeWidth={1.4} opacity={0.85} />);
        }
        const [px, py] = xy(insertMid, 0);
        const tri = `M${px},${py - insertW * 0.32} L${px + insertW * 0.3},${py + insertW * 0.26} L${px - insertW * 0.3},${py + insertW * 0.26} Z`;
        return (
          <g>
            {ring}
            <circle cx={CX} cy={CY} r={insertMid} fill="none" stroke={url('bezelInsert')} strokeWidth={insertW} />
            {marks}
            <path d={tri} fill={bink} />
            <circle cx={px} cy={py - insertW * 0.02} r={insertW * 0.12} fill={d.lume ? LUME : d.bezelColor} />
            {edges}
            <circle cx={CX} cy={CY} r={insertIn} fill="none" stroke={shade(d.bezelColor, -0.4)} strokeWidth={1} />
          </g>
        );
      }
      case 'tachymeter': {
        const insertIn = rIn + 2;
        const insertMid = (rOut - 2 + insertIn) / 2;
        const insertW = rOut - 2 - insertIn;
        const bink = inkOn(d.bezelColor);
        const speeds = [400, 300, 240, 200, 180, 160, 140, 120, 110, 100, 90, 80, 75, 70, 65];
        const items = speeds.map((v) => {
          const a = (3600 / v) * 6;
          const [tx, ty] = xy(insertMid, a);
          return (
            <g key={v}>
              <text x={tx} y={ty} fontSize={insertW * 0.42} fontFamily={`'Jost', sans-serif`}
                fill={bink} textAnchor="middle" dominantBaseline="central" fontWeight={600}
                transform={`rotate(${a > 180 ? a + 90 : a - 90} ${tx} ${ty})`}>
                {v}
              </text>
            </g>
          );
        });
        const [t60x, t60y] = xy(insertMid, 0);
        return (
          <g>
            {ring}
            <circle cx={CX} cy={CY} r={insertMid} fill="none" stroke={url('bezelInsert')} strokeWidth={insertW} />
            {items}
            <text x={t60x} y={t60y} fontSize={insertW * 0.46} fontFamily={`'Jost', sans-serif`} fill={d.accentColor}
              textAnchor="middle" dominantBaseline="central" fontWeight={700}>
              60
            </text>
            {edges}
          </g>
        );
      }
    }
  }

  function octagonScrews(rOut: number) {
    return (
      <g>
        {Array.from({ length: 8 }, (_, k) => {
          const a = 22.5 + 45 * k;
          const [sx, sy] = xy(rOut + (caseR * 1.045 - rOut) * 0.52, a);
          return (
            <g key={k}>
              <circle cx={sx} cy={sy} r={4} fill={mix(metal.mid, metal.lo, 0.4)} stroke={shade(metal.lo, -0.3)} strokeWidth={0.8} />
              <line x1={sx - 2.4} y1={sy} x2={sx + 2.4} y2={sy} stroke={shade(metal.lo, -0.4)} strokeWidth={1.1}
                transform={`rotate(${k * 45 + 20} ${sx} ${sy})`} />
            </g>
          );
        })}
      </g>
    );
  }

  // ------------------------------------------------------------- dial + textures
  function dialTexture() {
    const t = d.dialTexture;
    if (t === 'matte') return null;
    if (t === 'sunburst') {
      const r = mulberry32(7);
      return (
        <g clipPath={url('dialClip')}>
          {Array.from({ length: 120 }, (_, i) => {
            const a = i * 3 + r() * 1.5;
            const [x2, y2] = xy(dialR, a);
            const light = i % 2 === 0;
            return (
              <line key={i} x1={CX} y1={CY} x2={x2} y2={y2}
                stroke={light ? '#ffffff' : '#000000'} strokeWidth={2.2}
                opacity={(light ? 0.05 : 0.045) + r() * 0.05} />
            );
          })}
          <circle cx={CX} cy={CY} r={dialR} fill={url('sunGlow')} />
        </g>
      );
    }
    if (t === 'guilloche') {
      const c = dialIsLight ? '#000' : '#fff';
      return (
        <g clipPath={url('dialClip')}>
          {Array.from({ length: Math.floor(dialR / 4.5) }, (_, i) => (
            <circle key={i} cx={CX} cy={CY} r={4.5 * (i + 1)} fill="none" stroke={c} strokeWidth={1} opacity={0.085} />
          ))}
        </g>
      );
    }
    if (t === 'waves') {
      return <circle cx={CX} cy={CY} r={dialR} fill={url('wavesPat')} opacity={0.55} />;
    }
    if (t === 'linen') {
      return <circle cx={CX} cy={CY} r={dialR} fill={url('linenPat')} opacity={0.6} />;
    }
    if (t === 'fume') {
      return <circle cx={CX} cy={CY} r={dialR} fill={url('fumeGrad')} />;
    }
    // starry
    const r = mulberry32(99);
    // keep the big sparkles clear of the brand / caption bands
    const inTextBand = (sx: number, sy: number) => {
      const dx = Math.abs(sx - CX);
      const dy = (sy - CY) / dialR;
      return dx < dialR * 0.6 && ((dy > -0.56 && dy < -0.2) || (dy > 0.2 && dy < 0.56));
    };
    const stars = Array.from({ length: 80 }, (_, i) => {
      const a = r() * 360;
      const rr = Math.sqrt(r()) * dialR * 0.96;
      const [sx, sy] = xy(rr, a);
      return <circle key={i} cx={sx} cy={sy} r={0.6 + r() * 1.4} fill="#fff" opacity={0.25 + r() * 0.6} />;
    });
    const sparkles = Array.from({ length: 9 }, (_, i) => {
      const a = r() * 360;
      const rr = Math.sqrt(r()) * dialR * 0.8;
      const [sx, sy] = xy(rr, a);
      const s = 3 + r() * 3;
      if (inTextBand(sx, sy)) return null;
      return (
        <path key={i} d={`M${sx},${sy - s} Q${sx + s * 0.18},${sy - s * 0.18} ${sx + s},${sy} Q${sx + s * 0.18},${sy + s * 0.18} ${sx},${sy + s} Q${sx - s * 0.18},${sy + s * 0.18} ${sx - s},${sy} Q${sx - s * 0.18},${sy - s * 0.18} ${sx},${sy - s} Z`}
          fill="#fff" opacity={0.8} />
      );
    });
    return (
      <g clipPath={url('dialClip')}>
        <circle cx={CX} cy={CY} r={dialR} fill={url('fumeGrad')} opacity={0.8} />
        {stars}
        {sparkles}
      </g>
    );
  }

  // ------------------------------------------------------------- minute track
  function minuteTrack() {
    const t = d.minuteTrack;
    if (t === 'none') return null;
    const col = ink;
    if (t === 'dots') {
      return (
        <g>
          {Array.from({ length: 60 }, (_, i) => {
            const [px, py] = xy(dialR * 0.93, i * 6);
            return <circle key={i} cx={px} cy={py} r={i % 5 === 0 ? 2 : 1.1} fill={col} opacity={0.8} />;
          })}
        </g>
      );
    }
    if (t === 'railroad') {
      return (
        <g>
          <circle cx={CX} cy={CY} r={dialR * 0.965} fill="none" stroke={col} strokeWidth={1} opacity={0.75} />
          <circle cx={CX} cy={CY} r={dialR * 0.895} fill="none" stroke={col} strokeWidth={1} opacity={0.75} />
          {Array.from({ length: 60 }, (_, i) => {
            const [x1, y1] = xy(dialR * 0.895, i * 6);
            const [x2, y2] = xy(dialR * 0.965, i * 6);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={i % 5 === 0 ? 2.2 : 1} opacity={0.8} />;
          })}
        </g>
      );
    }
    return (
      <g>
        {Array.from({ length: 60 }, (_, i) => {
          const major = i % 5 === 0;
          const [x1, y1] = xy(dialR * (major ? 0.875 : 0.905), i * 6);
          const [x2, y2] = xy(dialR * 0.965, i * 6);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={major ? 2.4 : 1.1} opacity={0.85} />;
        })}
      </g>
    );
  }

  // ------------------------------------------------------------- indices
  function indices() {
    const style = d.indexStyle;
    if (style === 'none') return null;
    const skip = new Set<number>();
    if (d.dateWindow === '3') skip.add(3);
    if (d.dateWindow === '6') skip.add(6);

    const items: JSX.Element[] = [];
    const grad = url('marker');

    const baton = (h: number, twelve: boolean) => {
      const a = h * 30;
      const len = dialR * 0.205;
      const w = dialR * 0.055;
      const rOut = dialR * 0.86;
      const cy = -(rOut - len / 2);
      const lumeInset = d.lume ? (
        <rect x={-w * 0.27} y={cy - len / 2 + 2.5} width={w * 0.54} height={len - 5} fill={LUME} stroke={LUME_EDGE} strokeWidth={0.5} />
      ) : null;
      items.push(
        <g key={`b${h}`} transform={`rotate(${a} ${CX} ${CY}) translate(${CX} ${CY})`}>
          {twelve ? (
            <>
              <rect x={-w - 1.5} y={cy - len / 2} width={w} height={len} fill={grad} stroke={markerMetal.lo} strokeWidth={0.6} />
              <rect x={1.5} y={cy - len / 2} width={w} height={len} fill={grad} stroke={markerMetal.lo} strokeWidth={0.6} />
            </>
          ) : (
            <>
              <rect x={-w / 2} y={cy - len / 2} width={w} height={len} fill={grad} stroke={markerMetal.lo} strokeWidth={0.6} />
              {lumeInset}
            </>
          )}
        </g>,
      );
    };

    const numeral = (h: number, text: string, size: number) => {
      const [nx, ny] = xy(dialR * 0.72, h * 30);
      items.push(
        <text key={`n${h}`} x={nx} y={ny} fontSize={size} fontFamily={`'${numFont}', serif`}
          fill={grad} stroke={markerMetal.lo} strokeWidth={0.3} textAnchor="middle" dominantBaseline="central">
          {text}
        </text>,
      );
    };

    for (let h = 1; h <= 12; h++) {
      if (skip.has(h)) continue;
      switch (style) {
        case 'baton':
          baton(h, h === 12);
          break;
        case 'arabic':
          numeral(h, String(h), dialR * 0.21);
          break;
        case 'roman':
          numeral(h, ROMANS[h % 12], dialR * 0.15);
          break;
        case 'mixed':
          if (h % 3 === 0) numeral(h, String(h), dialR * 0.21);
          else baton(h, false);
          break;
        case 'dots': {
          const [px, py] = xy(dialR * 0.78, h * 30);
          const rr = dialR * 0.052;
          if (h === 12) {
            items.push(
              <path key={`d${h}`}
                d={`M${px},${py - rr * 1.3} L${px + rr * 1.25},${py + rr} L${px - rr * 1.25},${py + rr} Z`}
                fill={d.lume ? LUME : markerMetal.mid} stroke={markerMetal.lo} strokeWidth={1} />,
            );
          } else {
            items.push(
              <circle key={`d${h}`} cx={px} cy={py} r={h % 3 === 0 ? rr * 1.15 : rr}
                fill={d.lume ? LUME : markerMetal.mid} stroke={markerMetal.lo} strokeWidth={1} />,
            );
          }
          break;
        }
        case 'minimal':
          if (h % 3 === 0) {
            const a = h * 30;
            const len = dialR * 0.16;
            const rOut = dialR * 0.88;
            items.push(
              <g key={`m${h}`} transform={`rotate(${a} ${CX} ${CY}) translate(${CX} ${CY})`}>
                <rect x={-dialR * 0.012} y={-(rOut - 1)} width={dialR * 0.024} height={len} fill={grad} />
              </g>,
            );
          }
          break;
      }
    }
    return <g>{items}</g>;
  }

  // ------------------------------------------------------------- text & date
  function dialText() {
    const items: JSX.Element[] = [];
    const markSize = dialR * 0.075;
    const brandSize = dialR * 0.105;
    const subSize = dialR * 0.062;
    const top = d.logoPosition === 'top';
    const brandY = top ? CY - dialR * 0.36 : CY + dialR * (d.dateWindow === '6' ? 0.3 : 0.38);
    const markY = brandY - dialR * 0.16;
    const subY = top ? CY + dialR * (d.dateWindow === '6' ? 0.3 : 0.42) : brandY + dialR * 0.13;

    if (d.logoMark !== 'none') {
      const m = d.logoMark;
      const s = markSize / 2;
      let mark: JSX.Element | null = null;
      if (m === 'diamond') mark = <path d={`M${CX},${markY - s} L${CX + s * 0.8},${markY} L${CX},${markY + s} L${CX - s * 0.8},${markY} Z`} fill={ink} />;
      if (m === 'circle') mark = <circle cx={CX} cy={markY} r={s * 0.8} fill="none" stroke={ink} strokeWidth={1.8} />;
      if (m === 'triangle') mark = <path d={`M${CX},${markY - s} L${CX + s * 0.95},${markY + s * 0.7} L${CX - s * 0.95},${markY + s * 0.7} Z`} fill={ink} />;
      if (m === 'star') {
        const pts = Array.from({ length: 10 }, (_, i) => {
          const rr = i % 2 === 0 ? s : s * 0.45;
          const a = (i * 36 * Math.PI) / 180;
          return `${CX + rr * Math.sin(a)},${markY - rr * Math.cos(a)}`;
        }).join(' ');
        mark = <polygon points={pts} fill={ink} />;
      }
      if (mark) items.push(<g key="mark">{mark}</g>);
    }

    if (d.brand.trim()) {
      items.push(
        <text key="brand" x={CX} y={brandY} fontSize={brandSize} fontFamily={`'${brandFont}', serif`}
          fill={ink} textAnchor="middle" dominantBaseline="central" letterSpacing={brandSize * 0.22}>
          {d.brand.toUpperCase()}
        </text>,
      );
    }
    if (d.subLabel.trim()) {
      items.push(
        <text key="sub" x={CX} y={subY} fontSize={subSize} fontFamily={`'Jost', sans-serif`}
          fill={ink} opacity={0.78} textAnchor="middle" dominantBaseline="central" letterSpacing={subSize * 0.3}>
          {d.subLabel.toUpperCase()}
        </text>,
      );
    }
    return <g>{items}</g>;
  }

  function dateWindow() {
    if (d.dateWindow === 'none') return null;
    const at3 = d.dateWindow === '3';
    const r = dialR * (at3 ? 0.64 : 0.62);
    const [wx, wy] = at3 ? [CX + r, CY] : [CX, CY + r];
    const w = dialR * 0.21;
    const h = dialR * 0.16;
    const day = new Date().getDate();
    return (
      <g>
        <rect x={wx - w / 2} y={wy - h / 2} width={w} height={h} rx={2.5} fill="#f7f5ef"
          stroke={shade(metal.lo, -0.2)} strokeWidth={1.4} />
        <text x={wx} y={wy + h * 0.03} fontSize={h * 0.74} fontFamily={`'Jost', sans-serif`} fontWeight={600}
          fill="#23252a" textAnchor="middle" dominantBaseline="central">
          {day}
        </text>
      </g>
    );
  }

  // ------------------------------------------------------------- hands
  function hands() {
    const hourA = ((time.h % 12) + time.m / 60) * 30;
    const minA = (time.m + time.s / 60) * 6;
    const secA = time.s * 6;
    const hourL = dialR * 0.52;
    const minL = dialR * 0.78;
    const secL = dialR * 0.84;

    const hour = handShape(d.handStyle, 'hour', hourL);
    const minute = handShape(d.handStyle, 'minute', minL);

    const renderHand = (shape: ReturnType<typeof handShape>, angle: number, key: string) => (
      <g key={key} transform={`translate(${CX} ${CY}) rotate(${angle})`}>
        <path d={shape.d} transform="translate(1.6 2.4)" fill="#000" opacity={0.28} />
        <path d={shape.d} fill={url('hand')} stroke={handMetal.lo} strokeWidth={0.7} strokeLinejoin="round" />
        {shape.emblem && (
          <g>
            <circle cx={0} cy={shape.emblem.cy} r={shape.emblem.r} fill={url('hand')} stroke={handMetal.lo} strokeWidth={0.7} />
            {d.lume && (
              <circle cx={0} cy={shape.emblem.cy} r={shape.emblem.r * 0.72} fill={LUME} stroke={LUME_EDGE} strokeWidth={0.5} />
            )}
            <line x1={0} y1={shape.emblem.cy - shape.emblem.r} x2={0} y2={shape.emblem.cy + shape.emblem.r} stroke={handMetal.lo} strokeWidth={1.6} />
            <line x1={0} y1={shape.emblem.cy} x2={-shape.emblem.r * 0.85} y2={shape.emblem.cy + shape.emblem.r * 0.6} stroke={handMetal.lo} strokeWidth={1.6} />
            <line x1={0} y1={shape.emblem.cy} x2={shape.emblem.r * 0.85} y2={shape.emblem.cy + shape.emblem.r * 0.6} stroke={handMetal.lo} strokeWidth={1.6} />
          </g>
        )}
        {d.lume && shape.lume && !shape.emblem && (
          <path d={shape.lume} fill={LUME} stroke={LUME_EDGE} strokeWidth={0.5} />
        )}
      </g>
    );

    return (
      <g>
        {renderHand(hour, hourA, 'hour')}
        {renderHand(minute, minA, 'min')}
        <g transform={`translate(${CX} ${CY}) rotate(${secA})`}>
          <line x1={0} y1={secL * 0.22} x2={0} y2={-secL} stroke={d.accentColor} strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={0} cy={secL * 0.17} r={4.6} fill={d.accentColor} />
        </g>
        <circle cx={CX} cy={CY} r={dialR * 0.05} fill={url('hand')} stroke={handMetal.lo} strokeWidth={0.8} />
        <circle cx={CX} cy={CY} r={dialR * 0.018} fill={d.accentColor} />
      </g>
    );
  }

  // ------------------------------------------------------------- defs
  const wavesInk = dialIsLight ? '#000' : '#fff';

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={width}
      role="img"
      aria-label={`${d.brand} ${d.model} watch concept`}
      style={{ display: 'block' }}
    >
      <defs>
        {metalGrad('case', metal)}
        {metalGrad('caseLine', metal, true)}
        {metalGrad('hand', handMetal)}
        {metalGrad('marker', markerMetal)}
        {metalGrad('bezelMetal', metal)}
        <linearGradient id={id('bezelInsert')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(d.bezelColor, 0.18)} />
          <stop offset="0.5" stopColor={d.bezelColor} />
          <stop offset="1" stopColor={shade(d.bezelColor, -0.3)} />
        </linearGradient>
        <linearGradient id={id('strap')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={shade(d.strapColor, -0.32)} />
          <stop offset="0.18" stopColor={d.strapColor} />
          <stop offset="0.5" stopColor={shade(d.strapColor, 0.1)} />
          <stop offset="0.82" stopColor={d.strapColor} />
          <stop offset="1" stopColor={shade(d.strapColor, -0.32)} />
        </linearGradient>
        <radialGradient id={id('dialBase')} cx="0.5" cy="0.42" r="0.72">
          <stop offset="0" stopColor={shade(d.dialColor, 0.1)} />
          <stop offset="0.72" stopColor={d.dialColor} />
          <stop offset="1" stopColor={shade(d.dialColor, -0.16)} />
        </radialGradient>
        <radialGradient id={id('sunGlow')} cx="0.38" cy="0.34" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.02" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>
        <radialGradient id={id('fumeGrad')} cx="0.5" cy="0.5" r="0.62">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.62" stopColor="#000" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <pattern id={id('wavesPat')} width="46" height="13" patternUnits="userSpaceOnUse">
          <path d="M0,8 Q11.5,1 23,8 T46,8" fill="none" stroke={wavesInk} strokeWidth="1.1" opacity="0.16" />
          <path d="M0,12.5 Q11.5,5.5 23,12.5 T46,12.5" fill="none" stroke={wavesInk} strokeWidth="1.1" opacity="0.10" />
        </pattern>
        <pattern id={id('linenPat')} width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0,3.5 H7" stroke={wavesInk} strokeWidth="0.8" opacity="0.13" />
          <path d="M3.5,0 V7" stroke={wavesInk} strokeWidth="0.8" opacity="0.13" />
        </pattern>
        <clipPath id={id('dialClip')}>
          <circle cx={CX} cy={CY} r={dialR} />
        </clipPath>
        <filter id={id('softShadow')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {shadow && (
        <g filter={url('softShadow')} opacity={0.32}>
          <rect x={CX - strapHalfW + 4} y={strapTopEnd + 14} width={strapHalfW * 2} height={strapBottomEnd - strapTopEnd - 18} rx={strapHalfW * 0.7} fill="#000" opacity={0.55} />
          <circle cx={CX + 5} cy={CY + 9} r={caseR * 1.05} fill="#000" />
        </g>
      )}

      {strapPieces()}
      {lugs()}
      {crown()}
      {caseBody()}

      {/* rehaut + dial */}
      <circle cx={CX} cy={CY} r={dialR + 4.5} fill={shade(d.dialColor, -0.45)} />
      <circle cx={CX} cy={CY} r={dialR} fill={url('dialBase')} />
      {dialTexture()}
      {minuteTrack()}
      {indices()}
      {dialText()}
      {dateWindow()}
      {hands()}

      {/* crystal sheen */}
      <g clipPath={url('dialClip')} pointerEvents="none">
        <ellipse cx={CX - dialR * 0.3} cy={CY - dialR * 0.42} rx={dialR * 0.95} ry={dialR * 0.42}
          fill="#fff" opacity={0.055} transform={`rotate(-24 ${CX - dialR * 0.3} ${CY - dialR * 0.42})`} />
        <ellipse cx={CX + dialR * 0.45} cy={CY + dialR * 0.55} rx={dialR * 0.7} ry={dialR * 0.25}
          fill="#fff" opacity={0.03} transform={`rotate(-24 ${CX + dialR * 0.45} ${CY + dialR * 0.55})`} />
      </g>

      {bezel()}
    </svg>
  );
});
