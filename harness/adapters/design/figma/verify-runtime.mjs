// Shared by Node and the script (inlined with toString): value normalization and FNV-1a.
// Plain JavaScript on purpose: tsc re-indents what it compiles, and verify.js carries this text byte for byte.

/** @param {unknown} v @returns {string} */
export function norm(v) {
  if (v && typeof v === 'object' && 'r' in v) {
    const h = [v.r, v.g, v.b, v.a ?? 1].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    return '#' + (h.endsWith('FF') ? h.slice(0, 6) : h);
  }
  if (typeof v === 'number') return String(Math.round(v * 1e4) / 1e4);
  return v === undefined || v === null ? '(none)' : String(v);
}
/** @param {string[]} lines @returns {string} */
export function digest(lines) {
  let h = 0x811c9dc5;
  const s = lines.join('\n');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
