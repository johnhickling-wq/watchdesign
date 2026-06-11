import {
  ACCENT_SWATCHES,
  BEZEL_SWATCHES,
  DIAL_SWATCHES,
  HAND_COLORS,
  MATERIALS,
  STRAP_SWATCHES,
} from '../model/colors';
import { FONTS } from '../model/fonts';
import {
  BEZEL_LABELS, CASE_SHAPE_LABELS, DATE_LABELS, HAND_COLOR_LABELS, HAND_LABELS,
  INDEX_LABELS, MARKER_LABELS, MARK_LABELS, STRAP_LABELS, TEXTURE_LABELS, TRACK_LABELS,
} from '../model/labels';
import { randomModelName } from '../model/random';
import type {
  BezelStyle, CaseShape, DialTexture, FontId, HandColor, HandStyle, IndexStyle,
  LogoMark, MarkerColor, MaterialId, MinuteTrack, StrapType, WatchDesign,
} from '../model/types';
import {
  BezelIcon, CaseShapeIcon, HandIcon, IndexIcon, MarkIcon, StrapIcon, TextureIcon, TrackIcon,
} from '../render/icons';
import {
  OptionGrid, Row, Section, Segment, SliderRow, SwatchRow, TextRow, Toggle, type Opt,
} from './controls';

interface Props {
  design: WatchDesign;
  onPatch: (patch: Partial<WatchDesign>) => void;
}

const CASE_SHAPES = (Object.keys(CASE_SHAPE_LABELS) as CaseShape[]).map((v): Opt<CaseShape> => ({
  value: v, label: CASE_SHAPE_LABELS[v], icon: <CaseShapeIcon shape={v} />,
}));
const BEZELS = (Object.keys(BEZEL_LABELS) as BezelStyle[]).map((v): Opt<BezelStyle> => ({
  value: v, label: BEZEL_LABELS[v], icon: <BezelIcon style={v} />,
}));
const TEXTURES = (Object.keys(TEXTURE_LABELS) as DialTexture[]).map((v): Opt<DialTexture> => ({
  value: v, label: TEXTURE_LABELS[v], icon: <TextureIcon texture={v} />,
}));
const TRACKS = (Object.keys(TRACK_LABELS) as MinuteTrack[]).map((v): Opt<MinuteTrack> => ({
  value: v, label: TRACK_LABELS[v], icon: <TrackIcon track={v} />,
}));
const INDEXES = (Object.keys(INDEX_LABELS) as IndexStyle[]).map((v): Opt<IndexStyle> => ({
  value: v, label: INDEX_LABELS[v], icon: <IndexIcon style={v} />,
}));
const HANDS = (Object.keys(HAND_LABELS) as HandStyle[]).map((v): Opt<HandStyle> => ({
  value: v, label: HAND_LABELS[v], icon: <HandIcon style={v} />,
}));
const STRAPS = (Object.keys(STRAP_LABELS) as StrapType[]).map((v): Opt<StrapType> => ({
  value: v, label: STRAP_LABELS[v], icon: <StrapIcon type={v} />,
}));
const MARKS = (Object.keys(MARK_LABELS) as LogoMark[]).map((v): Opt<LogoMark> => ({
  value: v, label: MARK_LABELS[v], icon: <MarkIcon mark={v} />,
}));

const MATERIAL_OPTS = (Object.keys(MATERIALS) as MaterialId[]).map((v): Opt<MaterialId> => ({
  value: v,
  label: MATERIALS[v].label,
  icon: (
    <span
      className="metal-dot"
      style={{ background: `linear-gradient(135deg, ${MATERIALS[v].hi}, ${MATERIALS[v].mid} 55%, ${MATERIALS[v].lo})` }}
    />
  ),
}));

const HAND_COLOR_OPTS = (Object.keys(HAND_COLOR_LABELS) as HandColor[]).map((v): Opt<HandColor> => ({
  value: v,
  label: HAND_COLOR_LABELS[v],
  icon: (
    <span
      className="metal-dot"
      style={{ background: `linear-gradient(135deg, ${HAND_COLORS[v].hi}, ${HAND_COLORS[v].mid} 55%, ${HAND_COLORS[v].lo})` }}
    />
  ),
}));

const MARKER_OPTS = (Object.keys(MARKER_LABELS) as MarkerColor[]).map((v): Opt<MarkerColor> => ({
  value: v, label: MARKER_LABELS[v],
}));

const FONT_OPTS: Opt<FontId>[] = FONTS.map((f) => ({
  value: f.id,
  label: f.label,
  icon: (
    <span className="font-sample" style={{ fontFamily: `'${f.family}', sans-serif` }}>
      Aa
    </span>
  ),
}));

export function ControlPanel({ design: d, onPatch }: Props) {
  const metalStrap = d.strapType === 'oyster' || d.strapType === 'jubilee' || d.strapType === 'mesh';
  return (
    <div className="control-panel">
      <Section title="Case" emoji="⬡" defaultOpen>
        <Row label="Shape">
          <OptionGrid options={CASE_SHAPES} value={d.caseShape} onChange={(caseShape) => onPatch({ caseShape })} columns={5} />
        </Row>
        <Row label="Material">
          <OptionGrid options={MATERIAL_OPTS} value={d.caseMaterial} onChange={(caseMaterial) => onPatch({ caseMaterial })} columns={3} />
        </Row>
        <SliderRow label="Diameter" min={36} max={46} value={d.caseMm} display={`${d.caseMm} mm`} onChange={(caseMm) => onPatch({ caseMm })} />
      </Section>

      <Section title="Bezel" emoji="◎">
        <Row label="Style">
          <OptionGrid options={BEZELS} value={d.bezelStyle} onChange={(bezelStyle) => onPatch({ bezelStyle })} columns={3} />
        </Row>
        {(d.bezelStyle === 'dive' || d.bezelStyle === 'tachymeter') && (
          <Row label="Insert colour">
            <SwatchRow colors={BEZEL_SWATCHES} value={d.bezelColor} onChange={(bezelColor) => onPatch({ bezelColor })} />
          </Row>
        )}
      </Section>

      <Section title="Dial" emoji="🎨" defaultOpen>
        <Row label="Colour">
          <SwatchRow colors={DIAL_SWATCHES} value={d.dialColor} onChange={(dialColor) => onPatch({ dialColor })} />
        </Row>
        <Row label="Texture">
          <OptionGrid options={TEXTURES} value={d.dialTexture} onChange={(dialTexture) => onPatch({ dialTexture })} columns={4} />
        </Row>
        <Row label="Minute track">
          <OptionGrid options={TRACKS} value={d.minuteTrack} onChange={(minuteTrack) => onPatch({ minuteTrack })} columns={4} />
        </Row>
        <Row label="Accent colour">
          <SwatchRow colors={ACCENT_SWATCHES} value={d.accentColor} onChange={(accentColor) => onPatch({ accentColor })} />
        </Row>
      </Section>

      <Section title="Hands" emoji="🕙">
        <Row label="Style">
          <OptionGrid options={HANDS} value={d.handStyle} onChange={(handStyle) => onPatch({ handStyle })} columns={4} />
        </Row>
        <Row label="Finish">
          <OptionGrid options={HAND_COLOR_OPTS} value={d.handColor} onChange={(handColor) => onPatch({ handColor })} columns={3} />
        </Row>
        <Toggle label="Lume (glow details)" checked={d.lume} onChange={(lume) => onPatch({ lume })} />
      </Section>

      <Section title="Markers & numerals" emoji="🔢">
        <Row label="Style">
          <OptionGrid options={INDEXES} value={d.indexStyle} onChange={(indexStyle) => onPatch({ indexStyle })} columns={4} />
        </Row>
        <Row label="Marker colour">
          <Segment options={MARKER_OPTS} value={d.markerColor} onChange={(markerColor) => onPatch({ markerColor })} />
        </Row>
        <Row label="Numeral typeface">
          <OptionGrid options={FONT_OPTS} value={d.numeralFont} onChange={(numeralFont) => onPatch({ numeralFont })} columns={5} />
        </Row>
        <Row label="Date window">
          <Segment
            options={(Object.keys(DATE_LABELS) as Array<WatchDesign['dateWindow']>).map((v) => ({ value: v, label: DATE_LABELS[v] }))}
            value={d.dateWindow}
            onChange={(dateWindow) => onPatch({ dateWindow })}
          />
        </Row>
      </Section>

      <Section title="Logo & text" emoji="✒️">
        <TextRow label="Brand name" value={d.brand} placeholder="Your brand" onChange={(brand) => onPatch({ brand })} />
        <TextRow
          label="Model name"
          value={d.model}
          placeholder="Model"
          onChange={(model) => onPatch({ model })}
          trailing={
            <button type="button" className="mini-btn" title="Random name" onClick={() => onPatch({ model: randomModelName() })}>
              🎲
            </button>
          }
        />
        <TextRow label="Dial caption" value={d.subLabel} placeholder="e.g. AUTOMATIC · 200M" maxLength={26} onChange={(subLabel) => onPatch({ subLabel })} />
        <Row label="Logo emblem">
          <OptionGrid options={MARKS} value={d.logoMark} onChange={(logoMark) => onPatch({ logoMark })} columns={5} />
        </Row>
        <Row label="Logo position">
          <Segment
            options={[
              { value: 'top', label: 'Above centre' },
              { value: 'bottom', label: 'Below centre' },
            ] as Opt<WatchDesign['logoPosition']>[]}
            value={d.logoPosition}
            onChange={(logoPosition) => onPatch({ logoPosition })}
          />
        </Row>
        <Row label="Brand typeface">
          <OptionGrid options={FONT_OPTS} value={d.brandFont} onChange={(brandFont) => onPatch({ brandFont })} columns={5} />
        </Row>
      </Section>

      <Section title="Strap & bracelet" emoji="〰️">
        <Row label="Type">
          <OptionGrid options={STRAPS} value={d.strapType} onChange={(strapType) => onPatch({ strapType })} columns={3} />
        </Row>
        {metalStrap ? (
          <p className="hint">Metal bracelets follow the case material.</p>
        ) : (
          <Row label={d.strapType === 'nato' ? 'Base colour (stripes use accent)' : 'Colour'}>
            <SwatchRow colors={STRAP_SWATCHES} value={d.strapColor} onChange={(strapColor) => onPatch({ strapColor })} />
          </Row>
        )}
      </Section>
    </div>
  );
}
