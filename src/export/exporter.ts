import { BACKGROUNDS, MATERIALS, luma } from '../model/colors';
import { embeddedFontCss, fontById } from '../model/fonts';
import { specSheet } from '../model/labels';
import type { WatchDesign } from '../model/types';
import { VIEW_H, VIEW_W } from '../render/WatchSVG';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Serializes the live SVG with fonts embedded so it rasterises faithfully. */
async function svgToImage(svgEl: SVGSVGElement, pxWidth: number): Promise<HTMLImageElement> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('width', String(pxWidth));
  clone.setAttribute('height', String((pxWidth * VIEW_H) / VIEW_W));
  const style = document.createElementNS(SVG_NS, 'style');
  style.textContent = await embeddedFontCss();
  clone.insertBefore(style, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  const blobUrl = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not rasterise the watch render.'));
      img.src = blobUrl;
    });
    return img;
  } finally {
    // Image keeps drawing fine after revoke once loaded
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png');
  });
}

function paintBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, design: WatchDesign) {
  const bg = BACKGROUNDS[design.background];
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.3, h * 0.1, w * 0.5, h * 0.55, h * 0.85);
  grad.addColorStop(0, bg.top);
  grad.addColorStop(1, bg.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function slug(d: WatchDesign): string {
  return (
    `${d.brand}-${d.model}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'watch-concept'
  );
}

export async function exportWatchPng(
  svgEl: SVGSVGElement,
  design: WatchDesign,
  opts: { backdrop: boolean },
): Promise<Blob> {
  const scale = 2.4;
  const w = Math.round(VIEW_W * scale);
  const h = Math.round(VIEW_H * scale);
  const img = await svgToImage(svgEl, w);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  if (opts.backdrop) paintBackdrop(ctx, w, h, design);
  ctx.drawImage(img, 0, 0, w, h);
  return canvasToBlob(canvas);
}

export async function exportConceptSheet(svgEl: SVGSVGElement, design: WatchDesign): Promise<Blob> {
  const W = 1680;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = BACKGROUNDS[design.background];
  const darkBg = luma(bg.bottom) < 0.45;
  const inkMain = darkBg ? '#f4f1ea' : '#23262c';
  const inkSoft = darkBg ? 'rgba(244,241,234,0.62)' : 'rgba(35,38,44,0.62)';
  const inkFaint = darkBg ? 'rgba(244,241,234,0.28)' : 'rgba(35,38,44,0.25)';

  paintBackdrop(ctx, W, H, design);

  const brandFont = fontById(design.brandFont).family;
  await Promise.all([
    document.fonts.load(`500 64px '${brandFont}'`),
    document.fonts.load(`500 24px 'Jost'`),
    document.fonts.ready,
  ]).catch(() => undefined);

  // watch render, left side
  const watchH = 980;
  const watchW = (watchH * VIEW_W) / VIEW_H;
  const img = await svgToImage(svgEl, watchW * 2);
  ctx.drawImage(img, 70, (H - watchH) / 2, watchW, watchH);

  const x = watchW + 190;
  const colW = W - x - 90;
  let y = 150;

  // header
  ctx.fillStyle = inkSoft;
  ctx.font = `500 22px 'Jost', sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  spaced(ctx, `WATCH CONCEPT · ${today.toUpperCase()}`, x, y, 4);

  y += 86;
  ctx.fillStyle = inkMain;
  ctx.font = `500 76px '${brandFont}', serif`;
  spaced(ctx, design.brand.toUpperCase(), x, y, 10);

  y += 64;
  ctx.fillStyle = inkSoft;
  ctx.font = `italic 400 40px '${fontById('playfair').family}', serif`;
  ctx.fillText(design.model, x, y);

  y += 46;
  ctx.strokeStyle = inkFaint;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + colW, y);
  ctx.stroke();

  // spec rows
  y += 64;
  ctx.font = `500 21px 'Jost', sans-serif`;
  for (const row of specSheet(design)) {
    ctx.fillStyle = inkSoft;
    spaced(ctx, row.label.toUpperCase(), x, y, 3);
    ctx.fillStyle = inkMain;
    ctx.font = `400 26px 'Jost', sans-serif`;
    ctx.fillText(row.value, x + 200, y);
    ctx.font = `500 21px 'Jost', sans-serif`;
    y += 52;
  }

  // palette
  y += 36;
  ctx.fillStyle = inkSoft;
  spaced(ctx, 'PALETTE', x, y, 3);
  y += 30;
  const metal = MATERIALS[design.caseMaterial];
  const swatches: Array<[string, string]> = [
    ['Case', metal.mid],
    ['Dial', design.dialColor],
    ['Accent', design.accentColor],
    ['Strap', design.strapColor],
  ];
  if (design.bezelStyle === 'dive' || design.bezelStyle === 'tachymeter') {
    swatches.push(['Bezel', design.bezelColor]);
  }
  swatches.forEach(([label, color], i) => {
    const sx = x + i * 130;
    ctx.beginPath();
    ctx.arc(sx + 34, y + 34, 34, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = inkFaint;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = inkSoft;
    ctx.font = `400 19px 'Jost', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, sx + 34, y + 96);
    ctx.fillText(color.toUpperCase(), sx + 34, y + 120);
    ctx.textAlign = 'left';
  });

  // footer
  ctx.fillStyle = inkFaint;
  ctx.font = `400 20px 'Jost', sans-serif`;
  spaced(ctx, 'CONCEPT ONLY · MADE FOR FUN IN WATCHLAB', x, H - 90, 3);

  return canvasToBlob(canvas);
}

/** fillText with simple letter-spacing */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + gap;
  }
}
