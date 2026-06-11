import { useState, type ReactNode } from 'react';

export function Section({
  title,
  emoji,
  defaultOpen = false,
  children,
}: {
  title: string;
  emoji: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`panel-section ${open ? 'open' : ''}`}>
      <button type="button" className="section-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="section-emoji">{emoji}</span>
        <span className="section-title">{title}</span>
        <span className="section-chev">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}

export function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="ctl-row">
      {label && <div className="ctl-label">{label}</div>}
      {children}
    </div>
  );
}

export interface Opt<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function OptionGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 4,
}: {
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="opt-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`opt-tile ${o.value === value ? 'selected' : ''}`}
          onClick={() => onChange(o.value)}
          title={o.label}
        >
          {o.icon && <span className="opt-icon">{o.icon}</span>}
          <span className="opt-name">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function SwatchRow({
  colors,
  value,
  onChange,
  custom = true,
}: {
  colors: string[];
  value: string;
  onChange: (hex: string) => void;
  custom?: boolean;
}) {
  const isPreset = colors.includes(value.toLowerCase());
  return (
    <div className="swatch-row">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch ${c === value.toLowerCase() ? 'selected' : ''}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
          aria-label={`Colour ${c}`}
        />
      ))}
      {custom && (
        <label className={`swatch custom ${!isPreset ? 'selected' : ''}`} title="Custom colour…">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#888888'}
            onChange={(e) => onChange(e.target.value)}
          />
          <span style={{ background: !isPreset ? value : undefined }} className="custom-fill">
            {isPreset ? '+' : ''}
          </span>
        </label>
      )}
    </div>
  );
}

export function SliderRow({
  label,
  min,
  max,
  step = 1,
  value,
  display,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  display?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ctl-row">
      <div className="ctl-label">
        {label} <span className="ctl-value">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function TextRow({
  label,
  value,
  placeholder,
  maxLength = 22,
  onChange,
  trailing,
}: {
  label: string;
  value: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (v: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="ctl-row">
      <div className="ctl-label">{label}</div>
      <div className="text-wrap">
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
        {trailing}
      </div>
    </div>
  );
}

export function Segment<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segment">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? 'selected' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span className="ctl-label">{label}</span>
      <span className={`toggle ${checked ? 'on' : ''}`}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="knob" />
      </span>
    </label>
  );
}
