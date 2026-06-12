import { MATERIALS } from './colors';
import type {
  BezelStyle, CaseFinish, CaseShape, CrownStyle, DateWindow, DialTexture, HandColor, HandStyle,
  IndexStyle, LeatherFinish, LogoMark, LugStyle, MarkerColor, MinuteTrack, StrapType, WatchDesign,
} from './types';

export const CASE_SHAPE_LABELS: Record<CaseShape, string> = {
  round: 'Round', cushion: 'Cushion', tonneau: 'Tonneau', square: 'Square', octagon: 'Octagon',
};

export const BEZEL_LABELS: Record<BezelStyle, string> = {
  smooth: 'Polished', fluted: 'Fluted', dive: 'Dive', tachymeter: 'Tachymeter', coin: 'Coin-edge', none: 'Slim',
};

export const TEXTURE_LABELS: Record<DialTexture, string> = {
  matte: 'Matte', sunburst: 'Sunburst', guilloche: 'Guilloché', waves: 'Waves',
  linen: 'Linen', fume: 'Fumé', starry: 'Starlit',
};

export const TRACK_LABELS: Record<MinuteTrack, string> = {
  lines: 'Ticks', railroad: 'Railroad', dots: 'Dots', none: 'Clean',
};

export const INDEX_LABELS: Record<IndexStyle, string> = {
  baton: 'Batons', arabic: 'Arabic', roman: 'Roman', dots: 'Dots',
  mixed: 'Mixed', minimal: 'Minimal', none: 'None',
};

export const MARKER_LABELS: Record<MarkerColor, string> = {
  auto: 'Match case', silver: 'Silver', gold: 'Gold', black: 'Black',
  white: 'White', accent: 'Accent', lume: 'Lume',
};

export const HAND_LABELS: Record<HandStyle, string> = {
  dauphine: 'Dauphine', sword: 'Sword', baton: 'Baton', mercedes: 'Mercedes',
  syringe: 'Syringe', snowflake: 'Snowflake', leaf: 'Leaf',
};

export const HAND_COLOR_LABELS: Record<HandColor, string> = {
  silver: 'Silver', gold: 'Gold', rose: 'Rose', black: 'Black', white: 'White', blued: 'Blued',
};

export const STRAP_LABELS: Record<StrapType, string> = {
  leather: 'Leather', rubber: 'Rubber', nato: 'NATO', oyster: 'Link bracelet',
  jubilee: 'Five-link', president: 'President', mesh: 'Milanese',
};

export const LUG_LABELS: Record<LugStyle, string> = {
  tapered: 'Tapered', straight: 'Straight', twisted: 'Lyre', wire: 'Wire',
  hooded: 'Hooded', integrated: 'Integrated',
};

export const CROWN_LABELS: Record<CrownStyle, string> = {
  knurled: 'Knurled', onion: 'Onion', cabochon: 'Cabochon',
};

export const FINISH_LABELS: Record<CaseFinish, string> = {
  polished: 'Polished', brushed: 'Brushed', mixed: 'Two-finish', matte: 'Matte',
};

export const LEATHER_LABELS: Record<LeatherFinish, string> = {
  smooth: 'Smooth', grained: 'Grained', alligator: 'Alligator', rally: 'Rally',
};

export const MARK_LABELS: Record<LogoMark, string> = {
  none: 'None', diamond: 'Diamond', circle: 'Ring', triangle: 'Delta', star: 'Star',
};

export const DATE_LABELS: Record<DateWindow, string> = {
  none: 'None', '3': 'At 3', '6': 'At 6',
};

export interface SpecRow {
  label: string;
  value: string;
}

export function specSheet(d: WatchDesign): SpecRow[] {
  const rows: SpecRow[] = [
    {
      label: 'Case',
      value: `${CASE_SHAPE_LABELS[d.caseShape]} · ${d.caseMm} mm · ${MATERIALS[d.caseMaterial].label.toLowerCase()} · ${FINISH_LABELS[d.caseFinish].toLowerCase()}`,
    },
    {
      label: 'Lugs',
      value: d.lugStyle === 'integrated' ? 'Integrated' : `${LUG_LABELS[d.lugStyle]} · ${d.lugWidthMm} mm`,
    },
    { label: 'Bezel', value: BEZEL_LABELS[d.bezelStyle] },
    { label: 'Dial', value: `${TEXTURE_LABELS[d.dialTexture]} · ${d.dialColor.toUpperCase()}` },
    { label: 'Markers', value: `${INDEX_LABELS[d.indexStyle]} · ${MARKER_LABELS[d.markerColor].toLowerCase()}` },
    { label: 'Hands', value: `${HAND_LABELS[d.handStyle]} · ${HAND_COLOR_LABELS[d.handColor].toLowerCase()}` },
    {
      label: 'Strap',
      value: d.strapType === 'leather' ? `Leather · ${LEATHER_LABELS[d.leatherFinish].toLowerCase()}` : STRAP_LABELS[d.strapType],
    },
  ];
  const extras: string[] = [];
  if (d.dateWindow !== 'none') extras.push(`date at ${d.dateWindow}`);
  if (d.lume) extras.push('Super-Glow lume');
  if (d.crownGuards) extras.push('crown guards');
  if (d.crownStyle !== 'knurled') extras.push(`${CROWN_LABELS[d.crownStyle].toLowerCase()} crown`);
  if (extras.length) rows.push({ label: 'Details', value: extras.join(' · ') });
  return rows;
}
