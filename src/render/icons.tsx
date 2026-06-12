import type { ReactNode } from 'react';
import type {
  BezelStyle, CaseShape, CrownStyle, DialTexture, HandStyle, IndexStyle,
  LeatherFinish, LogoMark, LugStyle, MinuteTrack, StrapType,
} from '../model/types';
import { handShape } from './hands';

/**
 * Tiny 30×30 monochrome glyphs (currentColor) used by the option pickers so
 * choices read visually instead of as jargon.
 */

const S = 30;
const C = 15;

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" height="100%" aria-hidden="true">
      {children}
    </svg>
  );
}

export function CaseShapeIcon({ shape }: { shape: CaseShape }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const;
  return (
    <Frame>
      {shape === 'round' && <circle cx={C} cy={C} r={11} {...common} />}
      {shape === 'cushion' && <rect x={4} y={4} width={22} height={22} rx={8.5} {...common} />}
      {shape === 'square' && <rect x={4.5} y={4.5} width={21} height={21} rx={4} {...common} />}
      {shape === 'octagon' && (
        <polygon
          points={Array.from({ length: 8 }, (_, k) => {
            const a = ((22.5 + 45 * k) * Math.PI) / 180;
            return `${C + 11.5 * Math.cos(a)},${C + 11.5 * Math.sin(a)}`;
          }).join(' ')}
          {...common}
          strokeLinejoin="round"
        />
      )}
      {shape === 'tonneau' && (
        <path
          d="M9.5,4.5 C4,9 4,21 9.5,25.5 C12,27.5 18,27.5 20.5,25.5 C26,21 26,9 20.5,4.5 C18,2.5 12,2.5 9.5,4.5 Z"
          {...common}
        />
      )}
    </Frame>
  );
}

export function BezelIcon({ style }: { style: BezelStyle }) {
  const ring = <circle cx={C} cy={C} r={11} fill="none" stroke="currentColor" strokeWidth={2} />;
  return (
    <Frame>
      {ring}
      {style === 'none' && <circle cx={C} cy={C} r={7.5} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.5} />}
      {style === 'smooth' && <circle cx={C} cy={C} r={8} fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.7} />}
      {style === 'coin' && (
        <circle cx={C} cy={C} r={12.6} fill="none" stroke="currentColor" strokeWidth={1.8} strokeDasharray="1.2 1.8" />
      )}
      {style === 'fluted' &&
        Array.from({ length: 18 }, (_, i) => {
          const a = (i * 20 * Math.PI) / 180;
          return (
            <line key={i} x1={C + 8.4 * Math.sin(a)} y1={C - 8.4 * Math.cos(a)}
              x2={C + 11.3 * Math.sin(a)} y2={C - 11.3 * Math.cos(a)} stroke="currentColor" strokeWidth={1.4} />
          );
        })}
      {style === 'dive' && (
        <>
          <path d={`M${C},3 L${C + 2.6},7.2 L${C - 2.6},7.2 Z`} fill="currentColor" />
          {[90, 180, 270].map((a) => {
            const r1 = 8.6, r2 = 11.4;
            const rad = (a * Math.PI) / 180;
            return (
              <line key={a} x1={C + r1 * Math.sin(rad)} y1={C - r1 * Math.cos(rad)}
                x2={C + r2 * Math.sin(rad)} y2={C - r2 * Math.cos(rad)} stroke="currentColor" strokeWidth={2} />
            );
          })}
        </>
      )}
      {style === 'tachymeter' &&
        [0, 51.4, 102.9, 154.3, 205.7, 257.1, 308.6].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <circle key={a} cx={C + 10 * Math.sin(rad)} cy={C - 10 * Math.cos(rad)} r={1.1} fill="currentColor" />
          );
        })}
    </Frame>
  );
}

export function TextureIcon({ texture }: { texture: DialTexture }) {
  const clip = `tex-${texture}`;
  return (
    <Frame>
      <defs>
        <clipPath id={clip}>
          <circle cx={C} cy={C} r={11} />
        </clipPath>
      </defs>
      <circle cx={C} cy={C} r={11} fill="none" stroke="currentColor" strokeWidth={1.6} />
      <g clipPath={`url(#${clip})`} stroke="currentColor">
        {texture === 'sunburst' &&
          Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <line key={i} x1={C} y1={C} x2={C + 11 * Math.sin(a)} y2={C - 11 * Math.cos(a)} strokeWidth={1} opacity={0.75} />;
          })}
        {texture === 'guilloche' && [3, 6, 9].map((r) => <circle key={r} cx={C} cy={C} r={r} fill="none" strokeWidth={1} opacity={0.75} />)}
        {texture === 'waves' &&
          [9, 14, 19].map((y) => <path key={y} d={`M3,${y} Q9,${y - 4} 15,${y} T27,${y}`} fill="none" strokeWidth={1.2} opacity={0.75} />)}
        {texture === 'linen' && (
          <>
            {[8, 13, 18, 23].map((y) => <line key={`h${y}`} x1={3} y1={y} x2={27} y2={y} strokeWidth={0.9} opacity={0.7} />)}
            {[8, 13, 18, 23].map((x) => <line key={`v${x}`} x1={x} y1={3} x2={x} y2={27} strokeWidth={0.9} opacity={0.7} />)}
          </>
        )}
        {texture === 'fume' && <circle cx={C} cy={C} r={11} fill="currentColor" opacity={0.35} stroke="none" />}
        {texture === 'starry' &&
          [[10, 9, 1.2], [18, 13, 0.9], [13, 19, 1.4], [21, 20, 0.8], [8, 16, 0.8], [16, 6, 0.8]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="currentColor" stroke="none" />
          ))}
      </g>
    </Frame>
  );
}

export function HandIcon({ style }: { style: HandStyle }) {
  const hour = handShape(style, 'hour', 13);
  const minute = handShape(style, 'minute', 18);
  return (
    <Frame>
      <g transform={`translate(${C} 22) rotate(-42)`}>
        <path d={hour.d} fill="currentColor" />
        {hour.emblem && <circle cx={0} cy={hour.emblem.cy} r={hour.emblem.r} fill="currentColor" />}
      </g>
      <g transform={`translate(${C} 22) rotate(38)`}>
        <path d={minute.d} fill="currentColor" />
      </g>
      <circle cx={C} cy={22} r={1.8} fill="currentColor" />
    </Frame>
  );
}

export function IndexIcon({ style }: { style: IndexStyle }) {
  const r = 10.5;
  const items: ReactNode[] = [];
  const pos = (h: number, rr: number): [number, number] => {
    const a = (h * 30 * Math.PI) / 180;
    return [C + rr * Math.sin(a), C - rr * Math.cos(a)];
  };
  if (style === 'baton' || style === 'minimal' || style === 'mixed') {
    for (let h = 0; h < 12; h += 3) {
      if (style === 'mixed' && h % 6 === 0) continue;
      const [x, y] = pos(h, r - 2);
      items.push(
        <rect key={h} x={x - 1} y={y - 2.6} width={2} height={5.2} fill="currentColor"
          transform={`rotate(${h * 30} ${x} ${y})`} rx={0.5} />,
      );
    }
  }
  if (style === 'arabic' || style === 'mixed') {
    const [x12, y12] = pos(0, r - 2);
    const [x6, y6] = pos(6, r - 2);
    items.push(
      <text key="t12" x={x12} y={y12 + 0.5} fontSize={8} fontFamily="sans-serif" fill="currentColor" textAnchor="middle" dominantBaseline="central">12</text>,
      <text key="t6" x={x6} y={y6} fontSize={8} fontFamily="sans-serif" fill="currentColor" textAnchor="middle" dominantBaseline="central">6</text>,
    );
  }
  if (style === 'roman') {
    const [x12, y12] = pos(0, r - 2.4);
    const [x6, y6] = pos(6, r - 2.4);
    items.push(
      <text key="r12" x={x12} y={y12 + 0.5} fontSize={7} fontFamily="serif" fill="currentColor" textAnchor="middle" dominantBaseline="central">XII</text>,
      <text key="r6" x={x6} y={y6} fontSize={7} fontFamily="serif" fill="currentColor" textAnchor="middle" dominantBaseline="central">VI</text>,
    );
  }
  if (style === 'dots') {
    for (let h = 0; h < 12; h += 3) {
      const [x, y] = pos(h, r - 2);
      items.push(<circle key={h} cx={x} cy={y} r={1.7} fill="currentColor" />);
    }
  }
  if (style === 'none') {
    items.push(<circle key="c" cx={C} cy={C} r={1.4} fill="currentColor" opacity={0.6} />);
  }
  return (
    <Frame>
      <circle cx={C} cy={C} r={12.4} fill="none" stroke="currentColor" strokeWidth={1.2} opacity={0.45} />
      {items}
    </Frame>
  );
}

export function TrackIcon({ track }: { track: MinuteTrack }) {
  const marks: ReactNode[] = [];
  if (track !== 'none') {
    for (let i = 0; i < 24; i++) {
      const a = (i * 15 * Math.PI) / 180;
      if (track === 'dots') {
        marks.push(<circle key={i} cx={C + 11 * Math.sin(a)} cy={C - 11 * Math.cos(a)} r={i % 2 ? 0.6 : 1.1} fill="currentColor" />);
      } else {
        const r1 = i % 2 ? 10 : 9;
        marks.push(
          <line key={i} x1={C + r1 * Math.sin(a)} y1={C - r1 * Math.cos(a)}
            x2={C + 12 * Math.sin(a)} y2={C - 12 * Math.cos(a)} stroke="currentColor" strokeWidth={i % 2 ? 0.7 : 1.2} />,
        );
      }
    }
  }
  return (
    <Frame>
      {track === 'railroad' && <circle cx={C} cy={C} r={9} fill="none" stroke="currentColor" strokeWidth={0.8} />}
      {track === 'railroad' && <circle cx={C} cy={C} r={12} fill="none" stroke="currentColor" strokeWidth={0.8} />}
      {track === 'none' && <circle cx={C} cy={C} r={11} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.4} strokeDasharray="2 4" />}
      {marks}
    </Frame>
  );
}

export function StrapIcon({ type }: { type: StrapType }) {
  const x = 9, w = 12;
  const body = <rect x={x} y={3} width={w} height={24} rx={3} fill="none" stroke="currentColor" strokeWidth={1.8} />;
  return (
    <Frame>
      {body}
      {type === 'leather' && (
        <>
          <line x1={x + 2.4} y1={5.5} x2={x + 2.4} y2={24.5} stroke="currentColor" strokeWidth={1} strokeDasharray="1.8 1.8" opacity={0.8} />
          <line x1={x + w - 2.4} y1={5.5} x2={x + w - 2.4} y2={24.5} stroke="currentColor" strokeWidth={1} strokeDasharray="1.8 1.8" opacity={0.8} />
        </>
      )}
      {type === 'rubber' &&
        [7, 11, 15, 19, 23].map((y) => <line key={y} x1={x + 2} y1={y} x2={x + w - 2} y2={y} stroke="currentColor" strokeWidth={1} opacity={0.7} />)}
      {type === 'nato' && (
        <>
          <line x1={x + 3.4} y1={3.8} x2={x + 3.4} y2={26.2} stroke="currentColor" strokeWidth={2.2} opacity={0.65} />
          <line x1={x + w - 3.4} y1={3.8} x2={x + w - 3.4} y2={26.2} stroke="currentColor" strokeWidth={2.2} opacity={0.65} />
        </>
      )}
      {type === 'oyster' &&
        [7.5, 12.5, 17.5, 22.5].map((y) => (
          <g key={y} stroke="currentColor" strokeWidth={0.9} opacity={0.8}>
            <line x1={x} y1={y} x2={x + w} y2={y} />
            <line x1={x + 3.6} y1={y} x2={x + 3.6} y2={Math.min(y + 5, 27)} />
            <line x1={x + w - 3.6} y1={y} x2={x + w - 3.6} y2={Math.min(y + 5, 27)} />
          </g>
        ))}
      {type === 'jubilee' &&
        [7.5, 12.5, 17.5, 22.5].map((y) => (
          <g key={y} stroke="currentColor" strokeWidth={0.8} opacity={0.8}>
            <line x1={x} y1={y} x2={x + w} y2={y} />
            {[2.4, 4.8, 7.2, 9.6].map((dx) => (
              <line key={dx} x1={x + dx} y1={y} x2={x + dx} y2={Math.min(y + 5, 27)} />
            ))}
          </g>
        ))}
      {type === 'president' &&
        [7.5, 12.5, 17.5, 22.5].map((y) => (
          <g key={y} opacity={0.85}>
            {[0, 4.2, 8.4].map((dx) => (
              <rect key={dx} x={x + 0.4 + dx} y={y} width={3.4} height={4.2} rx={1.8} fill="none" stroke="currentColor" strokeWidth={0.9} />
            ))}
          </g>
        ))}
      {type === 'mesh' &&
        [5, 8, 11, 14, 17, 20, 23].map((y) => (
          <line key={y} x1={x + 1} y1={y} x2={x + w - 1} y2={y} stroke="currentColor" strokeWidth={0.7} opacity={0.7} />
        ))}
    </Frame>
  );
}

export function LugIcon({ style }: { style: LugStyle }) {
  // case arc at the bottom, lugs reaching up toward a strap bar
  const caseArc = <path d="M4,27 A13.5,13.5 0 0 1 26,27" fill="none" stroke="currentColor" strokeWidth={2} />;
  return (
    <Frame>
      {caseArc}
      {style === 'tapered' && (
        <>
          <path d="M8,20 L6.5,7 Q6.5,5.5 8,5.5 Q9.5,5.5 9.7,7 L11,20" fill="currentColor" opacity={0.9} />
          <path d="M22,20 L23.5,7 Q23.5,5.5 22,5.5 Q20.5,5.5 20.3,7 L19,20" fill="currentColor" opacity={0.9} />
        </>
      )}
      {style === 'straight' && (
        <>
          <rect x={6.5} y={5.5} width={4} height={15} rx={1.2} fill="currentColor" opacity={0.9} />
          <rect x={19.5} y={5.5} width={4} height={15} rx={1.2} fill="currentColor" opacity={0.9} />
        </>
      )}
      {style === 'twisted' && (
        <>
          <path d="M7,20 C5,14 7.5,11 6.5,6 L10,5.5 C10.5,11 9,14 10.5,20 Z" fill="currentColor" opacity={0.9} />
          <path d="M23,20 C25,14 22.5,11 23.5,6 L20,5.5 C19.5,11 21,14 19.5,20 Z" fill="currentColor" opacity={0.9} />
        </>
      )}
      {style === 'wire' && (
        <>
          <path d="M8.5,20 C5.5,15 6,9 8,5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          <path d="M21.5,20 C24.5,15 24,9 22,5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {style === 'hooded' && <rect x={5} y={9} width={20} height={8} rx={3} fill="currentColor" opacity={0.9} />}
      {style === 'integrated' && (
        <path d="M6,20 C7,13 9,9 10.5,4 L19.5,4 C21,9 23,13 24,20 Z" fill="currentColor" opacity={0.9} />
      )}
    </Frame>
  );
}

export function CrownIcon({ style }: { style: CrownStyle }) {
  return (
    <Frame>
      {/* case edge on the left */}
      <path d="M9,3 A24,24 0 0 1 9,27" fill="none" stroke="currentColor" strokeWidth={2} />
      {style === 'knurled' && (
        <>
          <rect x={13} y={9} width={7} height={12} rx={2.5} fill="none" stroke="currentColor" strokeWidth={1.8} />
          {[12.5, 15, 17.5].map((y) => (
            <line key={y} x1={14.5} y1={y} x2={18.5} y2={y} stroke="currentColor" strokeWidth={1.1} opacity={0.8} />
          ))}
        </>
      )}
      {style === 'onion' && (
        <>
          <rect x={12.5} y={13} width={4} height={4} fill="currentColor" />
          <circle cx={21} cy={15} r={5.5} fill="none" stroke="currentColor" strokeWidth={1.8} />
          <line x1={21} y1={10.5} x2={21} y2={19.5} stroke="currentColor" strokeWidth={1} opacity={0.7} />
        </>
      )}
      {style === 'cabochon' && (
        <>
          <rect x={12.5} y={11.5} width={6} height={7} rx={2} fill="none" stroke="currentColor" strokeWidth={1.6} />
          <ellipse cx={22.5} cy={15} rx={3.6} ry={4} fill="currentColor" />
        </>
      )}
    </Frame>
  );
}

export function LeatherIcon({ finish }: { finish: LeatherFinish }) {
  const body = <rect x={9} y={3} width={12} height={24} rx={3} fill="none" stroke="currentColor" strokeWidth={1.8} />;
  return (
    <Frame>
      {body}
      {finish === 'grained' &&
        [[12, 8], [17, 6.5], [14, 12], [18, 15], [12.5, 17], [16, 21], [13, 24], [18.5, 23.5], [17.5, 10.5], [12, 21]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.8} fill="currentColor" opacity={0.7} />
        ))}
      {finish === 'alligator' &&
        [[11, 6], [16, 6], [13.5, 12], [11, 18], [16, 18], [13.5, 24]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={3.6} height={4.6} rx={1.2} fill="none" stroke="currentColor" strokeWidth={0.9} opacity={0.8} />
        ))}
      {finish === 'rally' &&
        [[15, 8], [15, 14], [15, 20]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2} fill="currentColor" opacity={0.85} />
        ))}
    </Frame>
  );
}

export function MarkIcon({ mark }: { mark: LogoMark }) {
  return (
    <Frame>
      {mark === 'none' && <line x1={9} y1={C} x2={21} y2={C} stroke="currentColor" strokeWidth={1.6} opacity={0.5} />}
      {mark === 'diamond' && <path d={`M${C},6 L21,${C} L${C},24 L9,${C} Z`} fill="currentColor" />}
      {mark === 'circle' && <circle cx={C} cy={C} r={7} fill="none" stroke="currentColor" strokeWidth={2.2} />}
      {mark === 'triangle' && <path d={`M${C},7 L23,23 L7,23 Z`} fill="currentColor" />}
      {mark === 'star' && (
        <polygon
          points={Array.from({ length: 10 }, (_, i) => {
            const r = i % 2 === 0 ? 9 : 4;
            const a = (i * 36 * Math.PI) / 180;
            return `${C + r * Math.sin(a)},${C - r * Math.cos(a)}`;
          }).join(' ')}
          fill="currentColor"
        />
      )}
    </Frame>
  );
}
