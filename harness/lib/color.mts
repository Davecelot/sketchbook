// Color math shared by the foundation generator and the contrast check.
// No dependencies: OKLCH <-> sRGB per Björn Ottosson's OKLab, WCAG 2.x relative
// luminance, and APCA-W3 0.0.98G (Lc) for the informational APCA report.

export interface Rgb { r: number; g: number; b: number }
export interface Oklch { L: number; C: number; H: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a 6-digit hex color: ${hex}`);
  const n = parseInt(m[1] ?? '', 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToOklch({ r, g, b }: Rgb): Oklch {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

function oklchToLinear({ L, C, H }: Oklch): Rgb {
  const h = (H * Math.PI) / 180;
  const A = C * Math.cos(h), B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

const inGamut = ({ r, g, b }: Rgb) => [r, g, b].every((c) => c >= -1e-6 && c <= 1 + 1e-6);

// Converts OKLCH to sRGB hex, reducing chroma (keeping L and H) until in gamut.
export function oklchToHex({ L, C, H }: Oklch): string {
  let lo = 0, hi = C, best: Oklch = { L, C: 0, H };
  if (inGamut(oklchToLinear({ L, C, H }))) best = { L, C, H };
  else {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ L, C: mid, H }))) { lo = mid; best = { L, C: mid, H }; } else hi = mid;
    }
  }
  const lin = oklchToLinear(best);
  return rgbToHex({ r: toGamma(clamp01(lin.r)), g: toGamma(clamp01(lin.g)), b: toGamma(clamp01(lin.b)) });
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function wcagRatio(fg: string, bg: string): number {
  const a = relativeLuminance(fg), b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// APCA-W3 0.0.98G lightness contrast (Lc). Positive = dark text on light bg.
export function apcaLc(textHex: string, bgHex: string): number {
  const y = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const Y = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4;
    return Y > 0.022 ? Y : Y + (0.022 - Y) ** 1.414;
  };
  const Yt = y(textHex), Yb = y(bgHex);
  if (Math.abs(Yb - Yt) < 0.0005) return 0;
  let S: number;
  if (Yb > Yt) { S = (Yb ** 0.56 - Yt ** 0.57) * 1.14; return S < 0.1 ? 0 : (S - 0.027) * 100; }
  S = (Yb ** 0.65 - Yt ** 0.62) * 1.14;
  return S > -0.1 ? 0 : (S + 0.027) * 100;
}
