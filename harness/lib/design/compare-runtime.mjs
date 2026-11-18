// Shared by Node and the compare script (inlined with toString): text normalization and the inventory diff.
// Plain JavaScript on purpose: tsc re-indents what it compiles, and compare-<id>.js carries this text byte for byte.

export const TOLERANCE = 48;

/** @type {(s: unknown) => string} */
export const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// What the diff reports for one state: texts only in Storybook (missing in the file), only in the file, a different order,
// and a horizontal position or content edge that differs by more than a text-sized tolerance.
/**
 * @param {import('./compare.mjs').Inventory} sb
 * @param {import('./compare.mjs').Inventory} fg
 * @returns {import('./compare.mjs').StateDiff}
 */
export function diffInventories(sb, fg) {
  const inRows = (list, at) => {
    const rows = [];
    for (const t of [...list].sort((p, q) => at(p).y - at(q).y)) {
      const last = rows.at(-1);
      if (last && Math.abs(at(t).y - at(last[0]).y) < 10) last.push(t); else rows.push([t]);
    }
    return rows.flatMap((r) => r.sort((p, q) => at(p).x - at(q).x));
  };
  const used = new Set();
  const matched = [];
  const missing = [];
  const group = (list) => { const m = new Map(); for (const t of list) m.set(norm(t.t), [...(m.get(norm(t.t)) ?? []), t]); return m; };
  const drawn = group(fg.texts);
  const anchors = [];
  for (const [text, [a, ...rest]] of group(sb.texts)) if (!rest.length && drawn.get(text)?.length === 1) anchors.push({ a, b: drawn.get(text)[0] });
  const shiftOf = (a) => { let near = null; for (const x of anchors) if (!near || Math.abs(x.a.y - a.y) < Math.abs(near.a.y - a.y)) near = x; return near ? near.b.y - near.a.y : 0; };
  for (const a of inRows(sb.texts, (t) => t)) {
    const dy = shiftOf(a);
    let pick = null;
    let gap = Infinity;
    for (const b of drawn.get(norm(a.t)) ?? []) if (!used.has(b) && Math.abs(b.y - (a.y + dy)) + Math.abs(b.x - a.x) < gap) { gap = Math.abs(b.y - (a.y + dy)) + Math.abs(b.x - a.x); pick = b; }
    if (!pick) { missing.push(norm(a.t)); continue; }
    used.add(pick);
    matched.push({ t: norm(a.t), a, b: pick });
  }
  const extra = fg.texts.filter((b) => !used.has(b)).map((b) => norm(b.t));
  const at = (r, align) => (align === 'CENTER' ? r.x + r.w / 2 : align === 'RIGHT' ? r.x + r.w : r.x);
  const moved = matched.filter((m) => Math.abs(at(m.a, m.b.a) - at(m.b, m.b.a)) > TOLERANCE).map((m) => `${m.t}: Storybook x ${Math.round(at(m.a, m.b.a))}, file x ${Math.round(at(m.b, m.b.a))}`);
  let order = 0;
  for (let i = 0; i < matched.length; i++) for (let j = i + 1; j < matched.length; j++) if (matched[j].a.y - matched[i].a.y > 40 && matched[i].b.y > matched[j].b.y + 10) order++;
  const edges = (list, pick) => ({ left: Math.min(...list.map((m) => pick(m).x)), right: Math.max(...list.map((m) => pick(m).x + pick(m).w)) });
  const ea = matched.length ? edges(matched, (m) => m.a) : { left: 0, right: 0 };
  const eb = matched.length ? edges(matched, (m) => m.b) : { left: 0, right: 0 };
  const lefty = matched.filter((m) => !m.b.a || m.b.a === 'LEFT');
  const sized = matched.filter((m) => m.b.a === 'RIGHT');
  const leftOf = (list, pick) => Math.min(...list.map((m) => pick(m).x));
  const rightOf = (list, pick) => Math.max(...list.map((m) => pick(m).x + pick(m).w));
  const leftOff = lefty.length && Math.abs(leftOf(lefty, (m) => m.a) - leftOf(lefty, (m) => m.b)) > TOLERANCE;
  const rightOff = sized.length && Math.abs(rightOf(sized, (m) => m.a) - rightOf(sized, (m) => m.b)) > TOLERANCE;
  const bounds = leftOff || rightOff ?`content spans x ${Math.round(ea.left)}-${Math.round(ea.right)} in Storybook, ${Math.round(eb.left)}-${Math.round(eb.right)} in the file` : null;
  return { texts: sb.texts.length, matched: matched.length, missing, extra, moved, order, bounds, ok: !missing.length && !moved.length && !order && !bounds };
}
