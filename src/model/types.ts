export type CaseShape = 'round' | 'cushion' | 'tonneau' | 'square' | 'octagon';
export type MaterialId = 'steel' | 'gold' | 'rose' | 'titanium' | 'black' | 'bronze';
export type BezelStyle = 'smooth' | 'fluted' | 'dive' | 'tachymeter' | 'coin' | 'none';
export type DialTexture = 'matte' | 'sunburst' | 'guilloche' | 'waves' | 'linen' | 'fume' | 'starry';
export type MinuteTrack = 'lines' | 'railroad' | 'dots' | 'none';
export type IndexStyle = 'baton' | 'arabic' | 'roman' | 'dots' | 'mixed' | 'minimal' | 'none';
export type MarkerColor = 'auto' | 'silver' | 'gold' | 'black' | 'white' | 'accent' | 'lume';
export type HandStyle = 'dauphine' | 'sword' | 'baton' | 'mercedes' | 'syringe' | 'snowflake' | 'leaf';
export type HandColor = 'silver' | 'gold' | 'rose' | 'black' | 'white' | 'blued';
export type StrapType = 'leather' | 'rubber' | 'nato' | 'oyster' | 'jubilee' | 'mesh';
export type FontId = 'marcellus' | 'playfair' | 'jost' | 'oswald' | 'orbitron';
export type LogoMark = 'none' | 'diamond' | 'circle' | 'triangle' | 'star';
export type LogoPosition = 'top' | 'bottom';
export type DateWindow = 'none' | '3' | '6';
export type BackgroundId = 'slate' | 'paper' | 'blush' | 'sage' | 'ocean' | 'noir';

export interface WatchDesign {
  v: 1;
  brand: string;
  model: string;
  subLabel: string;
  logoMark: LogoMark;
  logoPosition: LogoPosition;
  brandFont: FontId;
  numeralFont: FontId;

  caseShape: CaseShape;
  caseMaterial: MaterialId;
  caseMm: number; // 36..46

  bezelStyle: BezelStyle;
  bezelColor: string; // insert colour for dive / tachymeter

  dialColor: string;
  dialTexture: DialTexture;
  minuteTrack: MinuteTrack;

  indexStyle: IndexStyle;
  markerColor: MarkerColor;

  handStyle: HandStyle;
  handColor: HandColor;
  lume: boolean;
  accentColor: string;

  dateWindow: DateWindow;

  strapType: StrapType;
  strapColor: string;

  background: BackgroundId;
}

export const DEFAULT_DESIGN: WatchDesign = {
  v: 1,
  brand: 'MERIDIAN',
  model: 'Azure Voyager',
  subLabel: 'AUTOMATIC',
  logoMark: 'diamond',
  logoPosition: 'top',
  brandFont: 'marcellus',
  numeralFont: 'jost',
  caseShape: 'round',
  caseMaterial: 'steel',
  caseMm: 40,
  bezelStyle: 'smooth',
  bezelColor: '#16243d',
  dialColor: '#2c3e5d',
  dialTexture: 'sunburst',
  minuteTrack: 'lines',
  indexStyle: 'baton',
  markerColor: 'auto',
  handStyle: 'dauphine',
  handColor: 'silver',
  lume: true,
  accentColor: '#d23b32',
  dateWindow: '3',
  strapType: 'leather',
  strapColor: '#3a2a20',
  background: 'slate',
};
