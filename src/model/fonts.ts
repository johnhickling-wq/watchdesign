import type { FontId } from './types';
import marcellusUrl from '@fontsource/marcellus/files/marcellus-latin-400-normal.woff2?url';
import playfairUrl from '@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2?url';
import jostUrl from '@fontsource/jost/files/jost-latin-500-normal.woff2?url';
import oswaldUrl from '@fontsource/oswald/files/oswald-latin-400-normal.woff2?url';
import orbitronUrl from '@fontsource/orbitron/files/orbitron-latin-500-normal.woff2?url';

export interface FontDef {
  id: FontId;
  family: string;
  label: string;
  vibe: string;
  url: string;
  weight: number;
}

export const FONTS: FontDef[] = [
  { id: 'marcellus', family: 'Marcellus', label: 'Marcellus', vibe: 'Refined roman', url: marcellusUrl, weight: 400 },
  { id: 'playfair', family: 'Playfair Display', label: 'Playfair', vibe: 'Classic serif', url: playfairUrl, weight: 500 },
  { id: 'jost', family: 'Jost', label: 'Jost', vibe: 'Bauhaus sans', url: jostUrl, weight: 500 },
  { id: 'oswald', family: 'Oswald', label: 'Oswald', vibe: 'Tool-watch bold', url: oswaldUrl, weight: 400 },
  { id: 'orbitron', family: 'Orbitron', label: 'Orbitron', vibe: 'Future tech', url: orbitronUrl, weight: 500 },
];

export function fontById(id: FontId): FontDef {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

function faceCss(f: FontDef, src: string): string {
  return `@font-face{font-family:'${f.family}';src:url('${src}') format('woff2');font-weight:${f.weight};font-style:normal;font-display:swap;}`;
}

/** Inject @font-face rules into the document so the live preview can use the bundled fonts. */
export function injectFonts(): void {
  const style = document.createElement('style');
  style.textContent = FONTS.map((f) => faceCss(f, f.url)).join('\n');
  document.head.appendChild(style);
}

let embeddedCssPromise: Promise<string> | null = null;

/**
 * Builds @font-face CSS with the woff2 files embedded as data URIs, so a
 * serialized SVG keeps its typography when rasterised inside an <img>.
 */
export function embeddedFontCss(): Promise<string> {
  if (!embeddedCssPromise) {
    embeddedCssPromise = Promise.all(
      FONTS.map(async (f) => {
        const buf = await (await fetch(f.url)).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        return faceCss(f, `data:font/woff2;base64,${btoa(bin)}`);
      }),
    ).then((rules) => rules.join('\n'));
  }
  return embeddedCssPromise;
}
