import { MATERIALS } from './colors';
import type {
  BezelStyle, CaseShape, DateWindow, DialTexture, HandColor, HandStyle,
  IndexStyle, LogoMark, MarkerColor, MinuteTrack, StrapType, WatchDesign,
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
  jubilee: 'Five-link', mesh: 'Milanese',
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
    { label: 'Case', value: `${CASE_SHAPE_LABELS[d.caseShape]} · ${d.caseMm} mm · ${MATERIALS[d.caseMaterial].label.toLowerCase()}` },
    { label: 'Bezel', value: BEZEL_LABELS[d.bezelStyle] },
    { label: 'Dial', value: `${TEXTURE_LABELS[d.dialTexture]} · ${d.dialColor.toUpperCase()}` },
    { label: 'Markers', value: `${INDEX_LABELS[d.indexStyle]} · ${MARKER_LABELS[d.markerColor].toLowerCase()}` },
    { label: 'Hands', value: `${HAND_LABELS[d.handStyle]} · ${HAND_COLOR_LABELS[d.handColor].toLowerCase()}` },
    { label: 'Strap', value: STRAP_LABELS[d.strapType] },
  ];
  const extras: string[] = [];
  if (d.dateWindow !== 'none') extras.push(`date at ${d.dateWindow}`);
  if (d.lume) extras.push('Super-Glow lume');
  if (extras.length) rows.push({ label: 'Details', value: extras.join(' · ') });
  return rows;
}
