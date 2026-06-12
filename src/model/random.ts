import {
  ACCENT_SWATCHES,
  BEZEL_SWATCHES,
  DIAL_SWATCHES,
  STRAP_SWATCHES,
} from './colors';
import { PRESETS } from './presets';
import type {
  BezelStyle,
  CaseFinish,
  CaseShape,
  CrownStyle,
  DialTexture,
  FontId,
  HandColor,
  HandStyle,
  IndexStyle,
  LeatherFinish,
  LogoMark,
  LugStyle,
  MarkerColor,
  MaterialId,
  MinuteTrack,
  StrapType,
  WatchDesign,
} from './types';

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chance(p: number): boolean {
  return Math.random() < p;
}

const ADJECTIVES = [
  'Azure', 'Midnight', 'Solar', 'Polar', 'Velvet', 'Crimson', 'Atlas', 'Nebula',
  'Pacific', 'Alpine', 'Ivory', 'Obsidian', 'Aurora', 'Ember', 'Cobalt', 'Sage',
  'Lunar', 'Coral', 'Onyx', 'Amber', 'Boreal', 'Golden', 'Silver', 'Tidal',
];

const NOUNS = [
  'Meridian', 'Voyager', 'Sonnet', 'Tempest', 'Drift', 'Mariner', 'Aviator',
  'Sovereign', 'Echo', 'Cadence', 'Vesper', 'Horizon', 'Riviera', 'Comet',
  'Daybreak', 'Monarch', 'Pioneer', 'Solstice', 'Mirage', 'Scout', 'Régate',
];

export function randomModelName(): string {
  const a = pick(ADJECTIVES);
  let b = pick(NOUNS);
  while (b.toLowerCase() === a.toLowerCase()) b = pick(NOUNS);
  return `${a} ${b}`;
}

const CASE_SHAPES: CaseShape[] = ['round', 'round', 'round', 'cushion', 'tonneau', 'square', 'octagon'];
const MATERIALS_POOL: MaterialId[] = ['steel', 'steel', 'gold', 'rose', 'titanium', 'black', 'bronze'];
const BEZELS: BezelStyle[] = ['smooth', 'smooth', 'fluted', 'dive', 'tachymeter', 'coin', 'none'];
const TEXTURES: DialTexture[] = ['matte', 'sunburst', 'sunburst', 'guilloche', 'waves', 'linen', 'fume', 'starry'];
const TRACKS: MinuteTrack[] = ['lines', 'railroad', 'dots', 'none'];
const INDEXES: IndexStyle[] = ['baton', 'baton', 'arabic', 'roman', 'dots', 'mixed', 'minimal'];
const MARKERS: MarkerColor[] = ['auto', 'auto', 'silver', 'gold', 'black', 'white', 'accent', 'lume'];
const HANDS: HandStyle[] = ['dauphine', 'sword', 'baton', 'mercedes', 'syringe', 'snowflake', 'leaf'];
const HAND_COLORS_POOL: HandColor[] = ['silver', 'silver', 'gold', 'rose', 'black', 'white', 'blued'];
const STRAPS: StrapType[] = ['leather', 'leather', 'rubber', 'nato', 'oyster', 'jubilee', 'president', 'mesh'];
const LUGS_POOL: LugStyle[] = ['tapered', 'tapered', 'straight', 'twisted', 'wire', 'hooded', 'integrated'];
const CROWNS_POOL: CrownStyle[] = ['knurled', 'knurled', 'onion', 'cabochon'];
const FINISH_POOL: CaseFinish[] = ['polished', 'polished', 'brushed', 'mixed', 'matte'];
const LEATHER_POOL: LeatherFinish[] = ['grained', 'grained', 'smooth', 'alligator', 'rally'];
const FONT_POOL: FontId[] = ['marcellus', 'playfair', 'jost', 'jost', 'oswald', 'orbitron'];
const MARKS: LogoMark[] = ['none', 'none', 'diamond', 'circle', 'triangle', 'star'];
const SUB_LABELS = [
  'AUTOMATIC', 'AUTOMATIC · 200M', 'CHRONOMETER', 'HAND-WOUND', 'SWISS MADE',
  'ANTIMAGNETIC', 'MOONLIGHT EDITION', 'GMT', '', 'SINCE 2026',
];

/**
 * Generates a believable random design: starts from a preset archetype so
 * combinations stay coherent, then shuffles the expressive parts.
 */
export function randomDesign(current?: WatchDesign): WatchDesign {
  const skeleton = pick(PRESETS).design;
  const d: WatchDesign = {
    ...skeleton,
    brand: current?.brand ?? skeleton.brand,
    model: randomModelName(),
    subLabel: pick(SUB_LABELS),
    logoMark: pick(MARKS),
    caseShape: chance(0.45) ? pick(CASE_SHAPES) : skeleton.caseShape,
    caseMaterial: pick(MATERIALS_POOL),
    caseMm: 36 + Math.floor(Math.random() * 11),
    dialColor: pick(DIAL_SWATCHES),
    dialTexture: pick(TEXTURES),
    accentColor: pick(ACCENT_SWATCHES),
    strapColor: pick(STRAP_SWATCHES),
    background: current?.background ?? skeleton.background,
  };
  if (chance(0.5)) d.lugStyle = pick(LUGS_POOL);
  d.lugWidthMm = 18 + Math.floor(Math.random() * 7);
  if (chance(0.5)) d.caseFinish = pick(FINISH_POOL);
  if (chance(0.4)) d.crownStyle = pick(CROWNS_POOL);
  d.crownGuards = chance(0.2);
  if (d.strapType === 'leather') d.leatherFinish = pick(LEATHER_POOL);
  if (chance(0.5)) d.bezelStyle = pick(BEZELS);
  if (d.bezelStyle === 'dive' || d.bezelStyle === 'tachymeter') d.bezelColor = pick(BEZEL_SWATCHES);
  if (chance(0.6)) d.handStyle = pick(HANDS);
  if (chance(0.5)) d.handColor = pick(HAND_COLORS_POOL);
  if (chance(0.5)) d.indexStyle = pick(INDEXES);
  if (chance(0.4)) d.markerColor = pick(MARKERS);
  if (chance(0.4)) d.minuteTrack = pick(TRACKS);
  if (chance(0.4)) d.strapType = pick(STRAPS);
  if (chance(0.35)) d.brandFont = pick(FONT_POOL);
  if (chance(0.35)) d.numeralFont = pick(FONT_POOL);
  d.lume = chance(0.6);
  d.dateWindow = chance(0.45) ? (chance(0.7) ? '3' : '6') : 'none';
  return d;
}

type Mutator = (d: WatchDesign) => void;

const MUTATORS: Mutator[] = [
  (d) => (d.dialColor = pick(DIAL_SWATCHES)),
  (d) => (d.dialTexture = pick(TEXTURES)),
  (d) => (d.accentColor = pick(ACCENT_SWATCHES)),
  (d) => (d.handStyle = pick(HANDS)),
  (d) => (d.handColor = pick(HAND_COLORS_POOL)),
  (d) => (d.indexStyle = pick(INDEXES)),
  (d) => (d.markerColor = pick(MARKERS)),
  (d) => {
    d.bezelStyle = pick(BEZELS);
    if (d.bezelStyle === 'dive' || d.bezelStyle === 'tachymeter') d.bezelColor = pick(BEZEL_SWATCHES);
  },
  (d) => (d.caseMaterial = pick(MATERIALS_POOL)),
  (d) => (d.caseShape = pick(CASE_SHAPES)),
  (d) => (d.lugStyle = pick(LUGS_POOL)),
  (d) => (d.caseFinish = pick(FINISH_POOL)),
  (d) => {
    d.crownStyle = pick(CROWNS_POOL);
    d.crownGuards = Math.random() < 0.25;
  },
  (d) => {
    d.strapType = pick(STRAPS);
    d.strapColor = pick(STRAP_SWATCHES);
    if (d.strapType === 'leather') d.leatherFinish = pick(LEATHER_POOL);
  },
  (d) => (d.strapColor = pick(STRAP_SWATCHES)),
  (d) => (d.numeralFont = pick(FONT_POOL)),
  (d) => (d.minuteTrack = pick(TRACKS)),
];

/** A nearby variation of the current design — changes 2-4 traits. */
export function mutateDesign(design: WatchDesign): WatchDesign {
  const d: WatchDesign = { ...design };
  const n = 2 + Math.floor(Math.random() * 3);
  const order = [...MUTATORS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) order[i % order.length](d);
  return d;
}

/** Variation that only plays with colours, keeping all shapes. */
export function recolorDesign(design: WatchDesign): WatchDesign {
  const d: WatchDesign = { ...design };
  d.dialColor = pick(DIAL_SWATCHES);
  d.accentColor = pick(ACCENT_SWATCHES);
  if (chance(0.5)) d.strapColor = pick(STRAP_SWATCHES);
  if (d.bezelStyle === 'dive' || d.bezelStyle === 'tachymeter') d.bezelColor = pick(BEZEL_SWATCHES);
  if (chance(0.35)) d.caseMaterial = pick(MATERIALS_POOL);
  return d;
}
