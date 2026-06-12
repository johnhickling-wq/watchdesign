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

  // honest lug-width spec: 20mm lugs on a 40mm case = half the diameter
  const strapHalfW = caseR * Math.min(0.56, Math.max(0.4, (d.lugWidthMm ?? 20) / d.caseMm));
  const strapTopEnd = 52;
  const strapBottomEnd = 596;
  const caseTop = CY - shapeInfo.topY;
  const caseBottom = CY + shapeInfo.topY;

  const metalBand =
    d.strapType === 'oyster' || d.strapType === 'jubilee' || d.strapType === 'president' || d.strapType === 'mesh';
  // effective lug style — fall back on combinations that make no physical sense
  let lugStyle = d.lugStyle ?? 'tapered';
  if (lugStyle === 'wire' && metalBand) lugStyle = 'straight';
  if (lugStyle === 'integrated' && d.strapType === 'nato') lugStyle = 'tapered';
  const integrated = lugStyle === 'integrated';
  const finish = d.caseFinish ?? 'polished';
  const brushedCase = finish === 'brushed' || finish === 'mixed';
  // where bands tuck under the case (integrated lugs join at the flare instead)
  const bandJTop = integrated ? caseTop - 14 : caseTop + 12;
  const bandJBot = integrated ? caseBottom + 14 : caseBottom - 12;

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
  /** Case silhouette factory — re-emitted for finish overlays (brushing, chamfer) */
  function caseShapeEl(props: Record<string, unknown>, scale = 1) {
    const el = (() => {
      switch (d.caseShape) {
        case 'round':
          return <circle cx={CX} cy={CY} r={caseR} {...props} />;
        case 'cushion': {
          const s = caseR * 0.985;
          return <rect x={CX - s} y={CY - s} width={s * 2} height={s * 2} rx={s * 0.52} {...props} />;
        }
        case 'square': {
          const s = caseR * 0.96;
          return <rect x={CX - s} y={CY - s} width={s * 2} height={s * 2} rx={s * 0.18} {...props} />;
        }
        case 'octagon': {
          const rc = caseR * 1.045;
          const pts = Array.from({ length: 8 }, (_, k) => {
            const a = ((22.5 + 45 * k) * Math.PI) / 180;
            return `${CX + rc * Math.cos(a)},${CY + rc * Math.sin(a)}`;
          }).join(' ');
          return <polygon points={pts} strokeLinejoin="round" {...props} />;
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
          return <path d={p} {...props} />;
        }
      }
    })();
    if (scale === 1) return el;
    return <g transform={`translate(${CX} ${CY}) scale(${scale}) translate(${-CX} ${-CY})`}>{el}</g>;
  }

  function caseBody() {
    const base =
      d.caseShape === 'octagon'
        ? { fill: url('case'), stroke: shade(metal.lo, -0.15), strokeWidth: 6 }
        : { fill: url('case'), stroke: shade(metal.lo, -0.25), strokeWidth: 1.5 };
    return (
      <g>
        {caseShapeEl(base)}
        {brushedCase && caseShapeEl({ fill: url('brushPat'), stroke: 'none' })}
        {(finish === 'mixed' || finish === 'polished') &&
          caseShapeEl(
            {
              fill: 'none',
              stroke: url('chamfer'),
              strokeWidth: finish === 'mixed' ? 2.2 : 1.3,
              opacity: finish === 'mixed' ? 1 : 0.55,
            },
            0.972,
          )}
      </g>
    );
  }

  // ------------------------------------------------------------- lugs & crown
  const mirrorY = `translate(0 ${2 * CY}) scale(1 -1)`;

  function lugs() {
    if (!shapeInfo.lugs) {
      // shaped cases keep their fitted mounts unless fully integrated
      return integrated ? integratedFlare() : null;
    }
    switch (lugStyle) {
      case 'integrated':
        return integratedFlare();
      case 'wire':
        return wireLugs();
      case 'hooded':
        return hoodedLugs();
      default:
        return hornLugs();
    }
  }

  /** tapered / straight / twisted horns */
  function hornLugs() {
    const xi = strapHalfW + 2;
    const xo = strapHalfW + (lugStyle === 'twisted' ? 17 : 15);
    const tipY = CY - caseR - 15;
    const baseY = CY - caseR * 0.4;
    const straight = lugStyle === 'straight';
    const horn = (s: 1 | -1) => {
      const x1 = CX + s * xi;
      const x1t = CX + s * (xi + (straight ? 0.5 : 1.5));
      const x2 = CX + s * xo;
      const x2t = CX + s * (xo - (straight ? 1 : 3.5));
      const midX = (x1t + x2t) / 2;
      const tip = straight
        ? ` L ${x1t},${tipY + 2.5} Q ${x1t},${tipY} ${x1t + s * 2.5},${tipY} L ${x2t - s * 2.5},${tipY} Q ${x2t},${tipY} ${x2t},${tipY + 2.5}`
        : ` L ${x1t},${tipY + 7} Q ${x1t},${tipY} ${midX},${tipY} Q ${x2t},${tipY} ${x2t},${tipY + 7}`;
      return (
        `M ${x1},${baseY}` +
        tip +
        ` C ${x2t + s * 2},${tipY + 28} ${x2},${CY - caseR * 0.78} ${x2},${baseY}` +
        ` Z`
      );
    };
    // twisted "lyre" facet: the outer half catches light opposite to the top surface
    const facet = (s: 1 | -1) => {
      const x1t = CX + s * (xi + 1.5);
      const x2 = CX + s * xo;
      const x2t = CX + s * (xo - 3.5);
      const midX = (x1t + x2t) / 2;
      return (
        `M ${midX},${tipY}` +
        ` C ${midX + s},${tipY + 26} ${CX + s * (xi + 6)},${CY - caseR * 0.75} ${CX + s * (xi + 6)},${baseY}` +
        ` L ${x2},${baseY}` +
        ` C ${x2},${CY - caseR * 0.78} ${x2t + s * 2},${tipY + 28} ${x2t},${tipY + 7}` +
        ` Q ${x2t},${tipY} ${midX},${tipY} Z`
      );
    };
    const spine = (s: 1 | -1) => {
      const x1t = CX + s * (xi + 1.5);
      const x2t = CX + s * (xo - 3.5);
      const midX = (x1t + x2t) / 2;
      return `M ${midX},${tipY + 1} C ${midX + s},${tipY + 26} ${CX + s * (xi + 6)},${CY - caseR * 0.75} ${CX + s * (xi + 6)},${baseY}`;
    };
    const outerEdge = (s: 1 | -1) => {
      const x2 = CX + s * xo;
      const x2t = CX + s * (xo - (straight ? 1 : 3.5));
      return `M ${x2t},${tipY + (straight ? 2.5 : 7)} C ${x2t + s * 2},${tipY + 28} ${x2},${CY - caseR * 0.78} ${x2},${baseY}`;
    };
    const one = (s: 1 | -1) => (
      <>
        <path d={horn(s)} fill={url('lug')} stroke={shade(metal.lo, -0.25)} strokeWidth={1.1} />
        {brushedCase && <path d={horn(s)} fill={url('brushPatV')} stroke="none" />}
        {lugStyle === 'twisted' && (
          <>
            <path d={facet(s)} fill={url('lugTwist')} />
            <path d={spine(s)} fill="none" stroke="#fff" strokeWidth={1.1} opacity={0.55} />
          </>
        )}
        {finish === 'mixed' && (
          <path d={outerEdge(s)} fill="none" stroke="#fff" strokeWidth={1.1} opacity={0.38} />
        )}
      </>
    );
    return (
      <g>
        {([1, -1] as const).map((s) => (
          <g key={s}>
            {one(s)}
            <g transform={mirrorY}>{one(s)}</g>
          </g>
        ))}
      </g>
    );
  }

  function wireLugs() {
    const prong = (s: 1 | -1) =>
      `M ${CX + s * (strapHalfW - 14)},${caseTop + 28}` +
      ` C ${CX + s * (strapHalfW + 13)},${caseTop + 22} ${CX + s * (strapHalfW + 12)},${caseTop - 10} ${CX + s * (strapHalfW - 1)},${caseTop - 16}`;
    const one = (s: 1 | -1) => (
      <>
        <path d={prong(s)} fill="none" stroke="#000" strokeWidth={8} opacity={0.18} strokeLinecap="round" transform="translate(1.5 2)" />
        <path d={prong(s)} fill="none" stroke={url('lug')} strokeWidth={6.5} strokeLinecap="round" />
        <path d={prong(s)} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.35} strokeLinecap="round" transform="translate(-1 -1)" />
      </>
    );
    return (
      <g>
        {([1, -1] as const).map((s) => (
          <g key={s}>
            {one(s)}
            <g transform={mirrorY}>{one(s)}</g>
          </g>
        ))}
      </g>
    );
  }

  function hoodedLugs() {
    const w = strapHalfW + 9;
    const hood = (y: number, slotY: number) => (
      <g>
        <rect x={CX - w + 3} y={slotY} width={(w - 3) * 2} height={5} fill="#000" opacity={0.25} />
        <rect x={CX - w} y={y} width={w * 2} height={30} rx={9} fill={url('lug')} stroke={shade(metal.lo, -0.25)} strokeWidth={1.1} />
        {brushedCase && <rect x={CX - w} y={y} width={w * 2} height={30} rx={9} fill={url('brushPat')} />}
        {finish === 'mixed' && (
          <rect x={CX - w + 1.5} y={y + 1.5} width={(w - 1.5) * 2} height={27} rx={8} fill="none" stroke={url('chamfer')} strokeWidth={1.4} opacity={0.8} />
        )}
      </g>
    );
    return (
      <g>
        {hood(caseTop - 20, caseTop - 25)}
        {hood(caseBottom - 10, caseBottom + 20)}
      </g>
    );
  }

  /** Royal-Oak-style integrated flare from the case flank into the band */
  function integratedFlare() {
    const wTop = Math.min(shapeInfo.halfW * 0.9, strapHalfW + 26);
    const wB = strapHalfW + 4;
    const flare = (yCase: number, yBand: number) =>
      `M ${CX - wTop},${yCase}` +
      ` C ${CX - wTop},${yCase + (yBand - yCase) * 0.55} ${CX - wB - 5},${yBand - (yBand - yCase) * 0.2} ${CX - wB},${yBand}` +
      ` L ${CX + wB},${yBand}` +
      ` C ${CX + wB + 5},${yBand - (yBand - yCase) * 0.2} ${CX + wTop},${yCase + (yBand - yCase) * 0.55} ${CX + wTop},${yCase}` +
      ` Z`;
    return (
      <g>
        <path d={flare(CY - caseR * 0.68, caseTop - 22)} fill={url('lug')} stroke={shade(metal.lo, -0.25)} strokeWidth={1.1} />
        <path d={flare(CY + caseR * 0.68, caseBottom + 22)} fill={url('lug')} stroke={shade(metal.lo, -0.25)} strokeWidth={1.1} />
        {brushedCase && (
          <>
            <path d={flare(CY - caseR * 0.68, caseTop - 22)} fill={url('brushPat')} />
            <path d={flare(CY + caseR * 0.68, caseBottom + 22)} fill={url('brushPat')} />
          </>
        )}
      </g>
    );
  }

  function crown() {
    const x = CX + shapeInfo.halfW - 2;
    if (d.crownStyle === 'onion') {
      return (
        <g>
          <rect x={x} y={CY - 6} width={8} height={12} rx={2} fill={url('lug')} stroke={shade(metal.lo, -0.2)} strokeWidth={1} />
          <circle cx={x + 16} cy={CY} r={10} fill={url('crownDome')} stroke={shade(metal.lo, -0.25)} strokeWidth={1.1} />
          {[-4.5, 0, 4.5].map((dx) => {
            const half = Math.sqrt(Math.max(0, 100 - dx * dx)) - 1.6;
            return (
              <line key={dx} x1={x + 16 + dx} y1={CY - half} x2={x + 16 + dx} y2={CY + half}
                stroke={shade(metal.lo, -0.15)} strokeWidth={1} opacity={0.55} />
            );
          })}
          <circle cx={x + 27} cy={CY} r={3} fill={url('lug')} stroke={shade(metal.lo, -0.25)} strokeWidth={0.8} />
        </g>
      );
    }
    if (d.crownStyle === 'cabochon') {
      return (
        <g>
          <rect x={x} y={CY - 5.5} width={12} height={11} rx={3.5} fill={url('lug')} stroke={shade(metal.lo, -0.2)} strokeWidth={1} />
          <line x1={x + 9} y1={CY - 4.5} x2={x + 9} y2={CY + 4.5} stroke={shade(metal.lo, -0.2)} strokeWidth={1} opacity={0.6} />
          <ellipse cx={x + 16.5} cy={CY} rx={6} ry={6.5} fill={url('gem')} stroke={shade(d.accentColor, -0.5)} strokeWidth={0.8} />
          <circle cx={x + 14.5} cy={CY - 2.2} r={1.5} fill="#fff" opacity={0.8} />
        </g>
      );
    }
    const cw = 15;
    const ch = 28;
    return (
      <g>
        <rect x={x} y={CY - ch / 2} width={cw} height={ch} rx={5} fill={url('case')} stroke={shade(metal.lo, -0.2)} strokeWidth={1.2} />
        {[-8, -3, 2, 7].map((dy) => (
          <line key={dy} x1={x + 2} y1={CY + dy} x2={x + cw - 2} y2={CY + dy} stroke={shade(metal.lo, -0.1)} strokeWidth={1.4} opacity={0.7} />
        ))}
      </g>
    );
  }

  function crownGuards() {
    if (!d.crownGuards) return null;
    const gx = CX + shapeInfo.halfW - 6;
    const guard =
      `M ${gx - 4},${CY - 24}` +
      ` C ${gx + 12},${CY - 22} ${gx + 17},${CY - 14} ${gx + 17},${CY - 4}` +
      ` L ${gx + 8},${CY - 4}` +
      ` C ${gx + 8},${CY - 12} ${gx + 4},${CY - 16} ${gx - 4},${CY - 17}` +
      ` Z`;
    return (
      <g fill={url('case')} stroke={shade(metal.lo, -0.25)} strokeWidth={1.1}>
        <path d={guard} />
        <path d={guard} transform={mirrorY} />
      </g>
    );
  }

  /** Fitted mounts for shaped cases (no horns) with non-metal bands */
  function strapConnectors() {
    if (shapeInfo.lugs || integrated || metalBand) return null;
    const w = strapHalfW + 6;
    return (
      <g fill={url('lug')} stroke={shade(metal.lo, -0.25)} strokeWidth={1.1}>
        <rect x={CX - w} y={caseTop - 16} width={w * 2} height={32} rx={7} />
        <rect x={CX - w} y={caseBottom - 16} width={w * 2} height={32} rx={7} />
      </g>
    );
  }

  // ------------------------------------------------------------- strap
  function strapPieces() {
    const t = d.strapType;
    if (t === 'nato') return natoStrap();
    if (t === 'oyster' || t === 'jubilee' || t === 'president' || t === 'mesh') return bracelet(t);
    return classicStrap(t);
  }

  function classicStrap(t: 'leather' | 'rubber') {
    const c = d.strapColor;
    const wLug = strapHalfW; // sits between the lugs
    const wEnd = strapHalfW * 0.76;
    const wTip = strapHalfW * 0.74;
    const stitch = luma(c) > 0.5 ? shade(c, -0.5) : mix(c, '#f2e9d8', 0.65);
    const edge = shade(c, -0.45);

    const yBuckle = strapTopEnd + 12;
    const yTopStart = yBuckle + 10;
    const yJTop = bandJTop;
    const yJBot = bandJBot;
    const yTip = strapBottomEnd;

    const topPath =
      `M ${CX - wEnd},${yTopStart}` +
      ` C ${CX - wEnd - 1},${yTopStart + 42} ${CX - wLug},${yJTop - 40} ${CX - wLug},${yJTop}` +
      ` L ${CX + wLug},${yJTop}` +
      ` C ${CX + wLug},${yJTop - 40} ${CX + wEnd + 1},${yTopStart + 42} ${CX + wEnd},${yTopStart}` +
      ` Z`;
    const botPath =
      `M ${CX - wLug},${yJBot}` +
      ` C ${CX - wLug},${yJBot + 44} ${CX - wTip - 1},${yTip - 150} ${CX - wTip},${yTip - 44}` +
      ` Q ${CX - wTip},${yTip} ${CX},${yTip}` +
      ` Q ${CX + wTip},${yTip} ${CX + wTip},${yTip - 44}` +
      ` C ${CX + wTip + 1},${yTip - 150} ${CX + wLug},${yJBot + 44} ${CX + wLug},${yJBot}` +
      ` Z`;
    const topStitch =
      `M ${CX - wEnd + 5},${yTopStart + 5}` +
      ` C ${CX - wEnd + 4},${yTopStart + 44} ${CX - wLug + 5},${yJTop - 38} ${CX - wLug + 5},${yJTop - 2}` +
      ` M ${CX + wEnd - 5},${yTopStart + 5}` +
      ` C ${CX + wEnd - 4},${yTopStart + 44} ${CX + wLug - 5},${yJTop - 38} ${CX + wLug - 5},${yJTop - 2}`;
    const botStitch =
      `M ${CX - wLug + 5},${yJBot + 2}` +
      ` C ${CX - wLug + 5},${yJBot + 44} ${CX - wTip + 4},${yTip - 148} ${CX - wTip + 5},${yTip - 44}` +
      ` Q ${CX - wTip + 5},${yTip - 5} ${CX},${yTip - 5}` +
      ` Q ${CX + wTip - 5},${yTip - 5} ${CX + wTip - 5},${yTip - 44}` +
      ` C ${CX + wTip - 4},${yTip - 148} ${CX + wLug - 5},${yJBot + 44} ${CX + wLug - 5},${yJBot + 2}`;

    const wAtTop = (y: number) => wEnd + (wLug - wEnd) * ((y - yTopStart) / (yJTop - yTopStart));
    const wAtBot = (y: number) => wLug + (wTip - wLug) * ((y - yJBot) / (yTip - 44 - yJBot));

    const ribs: JSX.Element[] = [];
    if (t === 'rubber') {
      const rib = (key: string, y: number, w: number) => {
        ribs.push(
          <g key={key}>
            <line x1={CX - w} y1={y} x2={CX + w} y2={y} stroke={shade(c, -0.34)} strokeWidth={2.2} opacity={0.65} strokeLinecap="round" />
            <line x1={CX - w} y1={y + 1.8} x2={CX + w} y2={y + 1.8} stroke={shade(c, 0.22)} strokeWidth={1} opacity={0.45} strokeLinecap="round" />
          </g>,
        );
      };
      for (let y = yTopStart + 18; y < yJTop - 8; y += 12) rib(`t${y}`, y, wAtTop(y) - 7);
      for (let y = yJBot + 16; y < yTip - 52; y += 12) rib(`b${y}`, y, wAtBot(y) - 7);
    }

    // rally-strap perforations
    const rallyHoles: JSX.Element[] = [];
    if (t === 'leather' && d.leatherFinish === 'rally') {
      const cols = [-0.42, 0, 0.42];
      const hole = (key: string, hx: number, hy: number) => {
        rallyHoles.push(
          <g key={key}>
            <circle cx={hx} cy={hy + 1.1} r={4} fill={shade(c, 0.2)} opacity={0.55} />
            <circle cx={hx} cy={hy} r={4} fill={shade(c, -0.58)} />
          </g>,
        );
      };
      for (let y = yTopStart + 30; y < yJTop - 32; y += 15) {
        cols.forEach((f, i) => hole(`t${y}-${i}`, CX + wAtTop(y) * f, y));
      }
      for (let y = yJBot + 26; y < yTip - 108; y += 15) {
        cols.forEach((f, i) => hole(`b${y}-${i}`, CX + wAtBot(y) * f, y));
      }
    }

    const keeper = (y: number) => {
      const w = wAtTop(y + 5) + 3;
      return (
        <g key={y}>
          <rect x={CX - w} y={y} width={w * 2} height={11} rx={4.5} fill={shade(c, -0.22)} stroke={edge} strokeWidth={1} />
          <line x1={CX - w + 3} y1={y + 2.5} x2={CX + w - 3} y2={y + 2.5} stroke={shade(c, 0.18)} strokeWidth={1} opacity={0.6} />
        </g>
      );
    };

    return (
      <g>
        <clipPath id={id('strapClip')}>
          <path d={topPath} />
          <path d={botPath} />
        </clipPath>
        {/* free tail poking out above the buckle */}
        <path
          d={`M ${CX - wEnd * 0.84},${yBuckle + 6} L ${CX - wEnd * 0.78},${yBuckle - 30} Q ${CX},${yBuckle - 40} ${CX + wEnd * 0.78},${yBuckle - 30} L ${CX + wEnd * 0.84},${yBuckle + 6} Z`}
          fill={url('strap')}
          stroke={edge}
          strokeWidth={1.2}
        />
        <path d={topPath} fill={url('strap')} stroke={edge} strokeWidth={1.4} />
        <path d={botPath} fill={url('strap')} stroke={edge} strokeWidth={1.4} />
        {/* padded-centre bulge highlight */}
        <g clipPath={url('strapClip')}>
          <rect x={CX - 15} y={40} width={30} height={570} fill={url('padHi')} />
        </g>
        {t === 'leather' && (
          <>
            {(d.leatherFinish === 'grained' || d.leatherFinish === 'alligator') && (
              <>
                <path d={topPath} fill="#000" filter={url('grain')}
                  opacity={(luma(c) > 0.5 ? 0.14 : 0.26) * (d.leatherFinish === 'alligator' ? 0.5 : 1)} />
                <path d={botPath} fill="#000" filter={url('grain')}
                  opacity={(luma(c) > 0.5 ? 0.14 : 0.26) * (d.leatherFinish === 'alligator' ? 0.5 : 1)} />
              </>
            )}
            {d.leatherFinish === 'alligator' && (
              <>
                <path d={topPath} fill={url('gatorPat')} />
                <path d={botPath} fill={url('gatorPat')} />
              </>
            )}
            {rallyHoles}
            {/* soft crease just outside the padding, then the stitch */}
            <path d={topStitch} fill="none" stroke={shade(c, -0.4)} strokeWidth={3} opacity={0.18} />
            <path d={botStitch} fill="none" stroke={shade(c, -0.4)} strokeWidth={3} opacity={0.18} />
            <path d={topStitch} fill="none" stroke={stitch} strokeWidth={1.5} strokeDasharray="4 3.6" opacity={0.95} />
            <path d={botStitch} fill="none" stroke={stitch} strokeWidth={1.5} strokeDasharray="4 3.6" opacity={0.95} />
          </>
        )}
        {ribs}
        {/* tang buckle */}
        <rect x={CX - wEnd - 7} y={yBuckle - 13} width={(wEnd + 7) * 2} height={27} rx={10} fill="none" stroke={url('lug')} strokeWidth={7} />
        <rect x={CX - wEnd - 7} y={yBuckle - 13} width={(wEnd + 7) * 2} height={27} rx={10} fill="none" stroke={shade(metal.lo, -0.35)} strokeWidth={0.8} opacity={0.6} />
        <line x1={CX} y1={yBuckle + 15} x2={CX} y2={yBuckle - 15} stroke={url('lug')} strokeWidth={4.5} strokeLinecap="round" />
        {keeper(yTopStart + 24)}
        {keeper(yTopStart + 42)}
        {/* tail holes */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={CX} cy={yTip - 64 - i * 19} r={3.2} fill={shade(c, -0.6)} stroke={shade(c, -0.25)} strokeWidth={0.8} />
        ))}
        {/* photographic falloff + sheen, then case contact shadow */}
        <g clipPath={url('strapClip')}>
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('falloffTop')} />
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('falloffBot')} />
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('sheenTop')}
            opacity={t === 'rubber' || d.leatherFinish === 'smooth' ? 1 : 0.6} />
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('sheenBot')}
            opacity={t === 'rubber' || d.leatherFinish === 'smooth' ? 1 : 0.6} />
          <ellipse cx={CX} cy={integrated ? caseTop - 14 : caseTop + 6} rx={strapHalfW + 16} ry={17} fill="#000" opacity={0.38} filter={url('contact')} />
          <ellipse cx={CX} cy={integrated ? caseBottom + 14 : caseBottom - 6} rx={strapHalfW + 16} ry={17} fill="#000" opacity={0.38} filter={url('contact')} />
        </g>
      </g>
    );
  }

  function natoStrap() {
    const wN = strapHalfW * 0.94;
    const c = d.strapColor;
    const yTop = strapTopEnd - 2;
    const yTip = strapBottomEnd;
    const bandH = yTip - yTop;
    const stripeW = wN * 0.24;
    const keeperMetal = (y: number) => (
      <g key={y}>
        <rect x={CX - wN - 3} y={y} width={wN * 2 + 6} height={10} rx={4} fill={url('lug')} stroke={shade(metal.lo, -0.3)} strokeWidth={0.9} />
        <line x1={CX - wN} y1={y + 2} x2={CX + wN} y2={y + 2} stroke="#fff" strokeWidth={0.8} opacity={0.35} />
      </g>
    );
    return (
      <g>
        <clipPath id={id('natoClip')}>
          <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} rx={13} />
        </clipPath>
        <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} rx={13} fill={c} stroke={shade(c, -0.45)} strokeWidth={1.4} />
        <g clipPath={url('natoClip')}>
          <rect x={CX - wN} y={yTop} width={stripeW} height={bandH} fill={d.accentColor} opacity={0.9} />
          <rect x={CX + wN - stripeW} y={yTop} width={stripeW} height={bandH} fill={d.accentColor} opacity={0.9} />
          <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} fill={url('natoWeave')} />
          <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} fill={url('braceletShade')} opacity={0.7} />
          <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} fill={url('falloffTop')} />
          <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} fill={url('falloffBot')} />
          <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} fill={url('sheenTop')} opacity={0.55} />
          <rect x={CX - wN} y={yTop} width={wN * 2} height={bandH} fill={url('sheenBot')} opacity={0.55} />
          {/* case contact shadow */}
          <ellipse cx={CX} cy={caseTop + 4} rx={wN + 14} ry={16} fill="#000" opacity={0.4} filter={url('contact')} />
          <ellipse cx={CX} cy={caseBottom - 4} rx={wN + 14} ry={16} fill="#000" opacity={0.4} filter={url('contact')} />
        </g>
        {/* hardware */}
        <rect x={CX - wN - 5} y={yTop + 16} width={(wN + 5) * 2} height={24} rx={8} fill="none" stroke={url('lug')} strokeWidth={6} />
        <line x1={CX} y1={yTop + 42} x2={CX} y2={yTop + 13} stroke={url('lug')} strokeWidth={4} strokeLinecap="round" />
        {keeperMetal(caseTop - 32)}
        {keeperMetal(caseBottom + 22)}
        {keeperMetal(caseBottom + 74)}
      </g>
    );
  }

  function bracelet(t: 'oyster' | 'jubilee' | 'president' | 'mesh') {
    const yTopEnd = strapTopEnd - 6;
    const yBotEnd = strapBottomEnd;
    const yJTop = integrated ? caseTop - 14 : caseTop + 8;
    const yJBot = integrated ? caseBottom + 14 : caseBottom - 8;
    const taper = (y: number) => {
      const dist = Math.max(0, Math.abs(y - CY) - caseR * 0.9);
      const f = Math.min(1, dist / 260);
      return strapHalfW * (1 - 0.18 * f);
    };
    const dark = shade(metal.lo, -0.55);

    const claspY = yBotEnd - 110;
    const claspH = 54;
    const claspW = taper(claspY + claspH / 2);

    const linkH0 = t === 'jubilee' ? 16 : 20;
    const rowStart = integrated ? 4 : 28; // end link occupies 26px when present

    const cells: JSX.Element[] = [];
    const emitRow = (y: number, h: number, key: string) => {
      const w = taper(y + h / 2);
      const hh = h - 2;
      if (t === 'oyster') {
        const cg = 1.5;
        const total = w * 2 - cg * 2;
        const ow = total * 0.3;
        const cw = total * 0.4;
        cells.push(
          <g key={key}>
            <rect x={CX - w} y={y} width={ow} height={hh} rx={4} fill={url('linkOut')} />
            <rect x={CX - w + ow + cg} y={y} width={cw} height={hh} rx={4} fill={url('linkMid')} />
            <rect x={CX + w - ow} y={y} width={ow} height={hh} rx={4} fill={url('linkOut')} />
            <line x1={CX - w + ow + cg + 2} y1={y + 1.2} x2={CX + w - ow - cg - 2} y2={y + 1.2}
              stroke="#fff" strokeWidth={0.9} opacity={0.3} />
          </g>,
        );
      } else if (t === 'president') {
        const cg = 1.5;
        const total = w * 2 - cg * 2;
        const cw = total / 3;
        const r = Math.min(hh / 2, 8);
        cells.push(
          <g key={key}>
            {[0, 1, 2].map((k) => (
              <rect key={k} x={CX - w + k * (cw + cg)} y={y} width={cw} height={hh} rx={r} fill={url('linkMid')} />
            ))}
          </g>,
        );
      } else {
        const fr = [0.26, 0.14, 0.16, 0.14, 0.26];
        const cg = 1.2;
        const total = w * 2 - cg * 4;
        let xA = CX - w;
        cells.push(
          <g key={key}>
            {fr.map((f2, k) => {
              const cw = total * f2;
              const cell = <rect key={k} x={xA} y={y} width={cw} height={hh} rx={3.5} fill={k === 0 || k === 4 ? url('linkOut') : url('linkMid')} />;
              xA += cw + cg;
              return cell;
            })}
          </g>,
        );
      }
    };

    // foreshortened rows: links compress as the band curves away from the camera
    const topJoints: number[] = [];
    const botJoints: number[] = [];
    if (t !== 'mesh') {
      let h = linkH0;
      let y = yJTop - rowStart;
      while (y > yTopEnd) {
        topJoints.push(y);
        y -= h;
        emitRow(y, h, `t${y}`);
        h = Math.max(linkH0 * 0.62, h * 0.93);
      }
      h = linkH0;
      y = yJBot + rowStart;
      while (y < yBotEnd) {
        botJoints.push(y);
        emitRow(y, h, `b${y}`);
        y += h;
        h = Math.max(linkH0 * 0.62, h * 0.93);
      }
    }

    // silhouette with interlock notches at the row joints
    const flatSil = (yA: number, yB: number) =>
      `M ${CX - taper(yA)},${yA} L ${CX - taper(yB)},${yB} L ${CX + taper(yB)},${yB} L ${CX + taper(yA)},${yA} Z`;
    const scallopSil = (yMin: number, yMax: number, joints: number[]) => {
      const js = joints.filter((j) => j > yMin + 4 && j < yMax - 4).sort((a, b) => a - b);
      let p = `M ${CX - taper(yMin)},${yMin}`;
      for (const j of js) {
        const w = taper(j);
        p += ` L ${CX - w},${j - 2} Q ${CX - w + 2.2},${j} ${CX - w},${j + 2}`;
      }
      p += ` L ${CX - taper(yMax)},${yMax} L ${CX + taper(yMax)},${yMax}`;
      for (const j of [...js].reverse()) {
        const w = taper(j);
        p += ` L ${CX + w},${j + 2} Q ${CX + w - 2.2},${j} ${CX + w},${j - 2}`;
      }
      p += ` L ${CX + taper(yMin)},${yMin} Z`;
      return p;
    };
    const topSil = t === 'mesh' ? flatSil(yTopEnd, yJTop) : scallopSil(yTopEnd, yJTop, topJoints);
    const botSil = t === 'mesh' ? flatSil(yJBot, yBotEnd) : scallopSil(yJBot, yBotEnd, botJoints);

    // end link contoured to hug the case arc
    const endLink = (yEdge: number, s: 1 | -1, key: string) => {
      const y2 = yEdge + s * 26;
      const wA = strapHalfW + 1;
      const wB = taper(y2);
      const bow = yEdge - s * 9;
      return (
        <g key={key}>
          <path
            d={`M ${CX - wA},${yEdge} Q ${CX},${bow} ${CX + wA},${yEdge} L ${CX + wB},${y2} L ${CX - wB},${y2} Z`}
            fill={url('linkOut')}
            stroke={shade(metal.lo, -0.3)}
            strokeWidth={0.8}
          />
          <path d={`M ${CX - wA},${yEdge} Q ${CX},${bow} ${CX + wA},${yEdge}`} fill="none" stroke="#fff" strokeWidth={1} opacity={0.35} />
          <line x1={CX - wB * 0.36} y1={Math.min(yEdge, y2) + 4} x2={CX - wB * 0.36} y2={Math.max(yEdge, y2) - 4} stroke={dark} strokeWidth={1} opacity={0.5} />
          <line x1={CX + wB * 0.36} y1={Math.min(yEdge, y2) + 4} x2={CX + wB * 0.36} y2={Math.max(yEdge, y2) - 4} stroke={dark} strokeWidth={1} opacity={0.5} />
        </g>
      );
    };

    const domeOpacity = 0.3 + luma(metal.mid) * 0.35;
    return (
      <g>
        <clipPath id={id('braceletClip')}>
          <path d={topSil} />
          <path d={botSil} />
        </clipPath>
        <path d={topSil} fill={dark} />
        <path d={botSil} fill={dark} />
        {t === 'mesh' ? (
          <g clipPath={url('braceletClip')}>
            <path d={topSil} fill={url('caseLine')} />
            <path d={botSil} fill={url('caseLine')} />
            <path d={topSil} fill={url('meshPat')} />
            <path d={botSil} fill={url('meshPat')} />
          </g>
        ) : (
          <g clipPath={url('braceletClip')}>
            {cells}
            {/* domed polished centre column */}
            <rect x={CX - strapHalfW * 0.22} y={yTopEnd} width={strapHalfW * 0.44} height={yJTop - yTopEnd}
              fill={url('domeHi')} opacity={domeOpacity} />
            <rect x={CX - strapHalfW * 0.22} y={yJBot} width={strapHalfW * 0.44} height={yBotEnd - yJBot}
              fill={url('domeHi')} opacity={domeOpacity} />
          </g>
        )}
        {!integrated && endLink(yJTop, -1, 'elTop')}
        {!integrated && endLink(yJBot, 1, 'elBot')}
        {/* deployant clasp */}
        <g>
          <rect x={CX - claspW - 6} y={claspY + claspH / 2 - 7} width={7} height={14} rx={2.5} fill={url('linkOut')} stroke={dark} strokeWidth={0.8} />
          <rect x={CX + claspW - 1} y={claspY + claspH / 2 - 7} width={7} height={14} rx={2.5} fill={url('linkOut')} stroke={dark} strokeWidth={0.8} />
          <rect x={CX - claspW + 1} y={claspY} width={claspW * 2 - 2} height={claspH} rx={9}
            fill={url('linkOut')} stroke={shade(metal.lo, -0.3)} strokeWidth={1} />
          <rect x={CX - claspW + 1} y={claspY} width={claspW * 2 - 2} height={claspH} rx={9}
            fill={url('brushPat')} opacity={0.5} />
          <line x1={CX - claspW + 9} y1={claspY + claspH / 2 + 6} x2={CX + claspW - 9} y2={claspY + claspH / 2 + 6} stroke={dark} strokeWidth={1.2} opacity={0.55} />
          {d.brand.trim() && (
            <>
              <text x={CX} y={claspY + 16.7} fontSize={7} fontFamily={`'Jost', sans-serif`} letterSpacing={1.4}
                textAnchor="middle" dominantBaseline="central" fill="#fff" opacity={0.2}>
                {d.brand.toUpperCase()}
              </text>
              <text x={CX} y={claspY + 16} fontSize={7} fontFamily={`'Jost', sans-serif`} letterSpacing={1.4}
                textAnchor="middle" dominantBaseline="central" fill={shade(metal.lo, -0.5)} opacity={0.65}>
                {d.brand.toUpperCase()}
              </text>
            </>
          )}
        </g>
        {/* wrist curvature, falloff, sheen + case contact shadow */}
        <g clipPath={url('braceletClip')}>
          <path d={topSil} fill={url('braceletShade')} />
          <path d={botSil} fill={url('braceletShade')} />
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('falloffTop')} />
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('falloffBot')} />
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('sheenTop')} />
          <rect x={CX - strapHalfW - 6} y={40} width={strapHalfW * 2 + 12} height={570} fill={url('sheenBot')} />
          <ellipse cx={CX} cy={integrated ? caseTop - 16 : caseTop + 4} rx={strapHalfW + 14} ry={15} fill="#000" opacity={0.38} filter={url('contact')} />
          <ellipse cx={CX} cy={integrated ? caseBottom + 16 : caseBottom - 4} rx={strapHalfW + 14} ry={15} fill="#000" opacity={0.38} filter={url('contact')} />
        </g>
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
        <path d={shape.d} transform="translate(2 3)" fill="#000" opacity={0.3} filter={url('handShadow')} />
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
        {/* case + lug gradients vary with the surface finish */}
        {finish === 'matte' ? (
          <linearGradient id={id('case')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={mix(metal.hi, metal.mid, 0.62)} />
            <stop offset="0.5" stopColor={metal.mid} />
            <stop offset="1" stopColor={mix(metal.mid, metal.lo, 0.55)} />
          </linearGradient>
        ) : brushedCase ? (
          <linearGradient id={id('case')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={mix(metal.hi, metal.mid, 0.4)} />
            <stop offset="0.45" stopColor={metal.mid} />
            <stop offset="0.75" stopColor={mix(metal.mid, metal.lo, 0.6)} />
            <stop offset="1" stopColor={mix(metal.mid, metal.lo, 0.3)} />
          </linearGradient>
        ) : (
          metalGrad('case', metal)
        )}
        {metalGrad('caseLine', metal, true)}
        {metalGrad('hand', handMetal)}
        {metalGrad('marker', markerMetal)}
        {metalGrad('bezelMetal', metal)}
        <linearGradient id={id('lug')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={finish === 'polished' ? metal.hi : mix(metal.hi, metal.mid, 0.45)} />
          <stop offset="0.5" stopColor={metal.mid} />
          <stop offset="1" stopColor={finish === 'matte' ? mix(metal.mid, metal.lo, 0.6) : metal.lo} />
        </linearGradient>
        {lugStyle === 'twisted' && (
          <linearGradient id={id('lugTwist')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={shade(metal.lo, -0.18)} />
            <stop offset="0.42" stopColor={metal.hi} />
            <stop offset="1" stopColor={shade(metal.lo, -0.28)} />
          </linearGradient>
        )}
        {(brushedCase || metalBand) && (
          <>
            <pattern id={id('brushPat')} width="5" height="2.4" patternUnits="userSpaceOnUse">
              <path d="M0,0.5 H5" stroke="#fff" strokeWidth="0.7" opacity="0.12" />
              <path d="M0,1.7 H5" stroke="#000" strokeWidth="0.7" opacity="0.14" />
            </pattern>
            <pattern id={id('brushPatV')} width="5" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
              <path d="M0,0.5 H5" stroke="#fff" strokeWidth="0.7" opacity="0.12" />
              <path d="M0,1.7 H5" stroke="#000" strokeWidth="0.7" opacity="0.14" />
            </pattern>
          </>
        )}
        {(finish === 'mixed' || finish === 'polished') && (
          <linearGradient id={id('chamfer')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#000" stopOpacity="0.35" />
          </linearGradient>
        )}
        {d.crownStyle === 'onion' && (
          <radialGradient id={id('crownDome')} cx="0.35" cy="0.35" r="0.8">
            <stop offset="0" stopColor={metal.hi} />
            <stop offset="0.6" stopColor={metal.mid} />
            <stop offset="1" stopColor={metal.lo} />
          </radialGradient>
        )}
        {d.crownStyle === 'cabochon' && (
          <radialGradient id={id('gem')} cx="0.35" cy="0.3" r="0.9">
            <stop offset="0" stopColor={shade(d.accentColor, 0.55)} />
            <stop offset="0.55" stopColor={d.accentColor} />
            <stop offset="1" stopColor={shade(d.accentColor, -0.45)} />
          </radialGradient>
        )}
        {/* flat-lay photography cues: exposure falloff toward band ends + softbox sheen */}
        <linearGradient id={id('falloffTop')} gradientUnits="userSpaceOnUse" x1="0" y1={caseTop} x2="0" y2={strapTopEnd}>
          <stop offset="0.2" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={id('falloffBot')} gradientUnits="userSpaceOnUse" x1="0" y1={caseBottom} x2="0" y2={strapBottomEnd}>
          <stop offset="0.2" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={id('sheenTop')} gradientUnits="userSpaceOnUse" x1="0" y1={CY - caseR - 80} x2="0" y2={CY - caseR - 8}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('sheenBot')} gradientUnits="userSpaceOnUse" x1="0" y1={caseBottom + 26} x2="0" y2={caseBottom + 100}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('domeHi')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.26" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="0.58" stopColor="#fff" stopOpacity="0.26" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('padHi')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {d.strapType === 'leather' && d.leatherFinish === 'alligator' && (
          <pattern id={id('gatorPat')} width="17.2" height="24.8" patternUnits="userSpaceOnUse">
            {[
              [0.5, 0.8],
              [9.1, 0.8],
              [4.8, 13.2],
              [13.4, 13.2],
              [-3.8, 13.2],
            ].map(([px, py], i) => (
              <rect key={i} x={px} y={py} width={7.6} height={11.4} rx={2.8}
                fill="#fff" fillOpacity="0.05" stroke={shade(d.strapColor, -0.45)} strokeWidth="1" opacity="0.55" />
            ))}
          </pattern>
        )}
        <linearGradient id={id('linkOut')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(metal.hi, metal.mid, 0.45)} />
          <stop offset="0.45" stopColor={metal.mid} />
          <stop offset="1" stopColor={shade(metal.lo, -0.08)} />
        </linearGradient>
        <linearGradient id={id('linkMid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.05" stopColor={metal.hi} />
          <stop offset="0.45" stopColor={mix(metal.hi, metal.mid, 0.5)} />
          <stop offset="0.96" stopColor={shade(metal.mid, -0.15)} />
        </linearGradient>
        {/* asymmetric — light comes from the upper-left */}
        <linearGradient id={id('braceletShade')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.24" />
          <stop offset="0.14" stopColor="#000" stopOpacity="0" />
          <stop offset="0.78" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
        <pattern id={id('meshPat')} width="7" height="6" patternUnits="userSpaceOnUse">
          <path d="M0,1.5 Q1.75,4 3.5,1.5 T7,1.5" fill="none" stroke="#000" strokeWidth="1.1" opacity="0.3" />
          <path d="M0,4.5 Q1.75,7 3.5,4.5 T7,4.5" fill="none" stroke="#fff" strokeWidth="1" opacity="0.16" />
        </pattern>
        <pattern id={id('natoWeave')} width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0,2 L2,0" stroke="#000" strokeWidth="0.8" opacity="0.14" />
          <path d="M2,4 L4,2" stroke="#fff" strokeWidth="0.8" opacity="0.08" />
        </pattern>
        <filter id={id('contact')} x="-40%" y="-150%" width="180%" height="400%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id('handShadow')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.7" />
        </filter>
        <filter id={id('grain')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.24" numOctaves="3" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0.9 0.9 0 -1.1" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <linearGradient id={id('bezelInsert')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(d.bezelColor, 0.18)} />
          <stop offset="0.5" stopColor={d.bezelColor} />
          <stop offset="1" stopColor={shade(d.bezelColor, -0.3)} />
        </linearGradient>
        {/* padded strap profile, lit from the upper-left */}
        <linearGradient id={id('strap')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={shade(d.strapColor, -0.34)} />
          <stop offset="0.14" stopColor={d.strapColor} />
          <stop offset="0.34" stopColor={shade(d.strapColor, 0.18)} />
          <stop offset="0.6" stopColor={d.strapColor} />
          <stop offset="1" stopColor={shade(d.strapColor, -0.42)} />
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
      {strapConnectors()}
      {lugs()}
      {crown()}
      {crownGuards()}
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

      {/* rim lighting on the bezel edge */}
      {(() => {
        const r = bezelOuter - 1;
        const [ax, ay] = xy(r, 300);
        const [bx, by] = xy(r, 60);
        const [cx2, cy2] = xy(r, 120);
        const [dx2, dy2] = xy(r, 240);
        return (
          <g fill="none" pointerEvents="none">
            <path d={`M ${ax},${ay} A ${r},${r} 0 0 1 ${bx},${by}`} stroke="#fff" strokeWidth={1.6} opacity={0.2} strokeLinecap="round" />
            <path d={`M ${cx2},${cy2} A ${r},${r} 0 0 1 ${dx2},${dy2}`} stroke="#000" strokeWidth={1.6} opacity={0.22} strokeLinecap="round" />
          </g>
        );
      })()}
    </svg>
  );
});
