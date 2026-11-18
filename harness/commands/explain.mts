// sketchbook explain <thing>: answers "why is this like this?" from the spec. A token path, a CSS variable,
// a component name or tag, or a decision id (SB-0001). Falls back to a search across contracts and decisions.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { HarnessConfigJson } from '../../generated/types/harness-config.js';
import { parseJson } from '../lib/files.mjs';
import { loadAll, resolve, tokensForMode } from '../lib/tokens.mjs';

const kebab = (s: string): string => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function explain(root: string, query: string): Promise<string> {
  const out: string[] = [];
  const config = parseJson<HarnessConfigJson>(await readFile(join(root, 'harness.config.json'), 'utf8'));
  const all = await loadAll(root);
  const q = query.trim();
  const tokenPath = q.startsWith(`--${config.prefix}-`) ? null : q;
  const decisions = await readFile(join(root, 'spec/decisions/DECISIONS.md'), 'utf8');

  // Decision
  const dm = /^SB-\d{4}$/i.exec(q);
  if (dm) {
    const re = new RegExp(`### ${q.toUpperCase()} [\\s\\S]*?(?=\\n### |$)`);
    const m = re.exec(decisions);
    return m ? m[0].trim() : `No decision ${q} in spec/decisions/DECISIONS.md.`;
  }

  // Token (by path, or by CSS variable name: match the path whose variable equals the query)
  const allTokens = all.sets.flatMap((s) => s.tokens);
  const byVar = q.startsWith('--') ? allTokens.find((t) => `--${config.prefix}-${t.path.replace(/\./g, '-')}` === q) : null;
  const tok = byVar ?? allTokens.find((t) => t.path === tokenPath);
  if (tok) {
    out.push(`Token ${tok.path}  (CSS --${config.prefix}-${tok.path.replace(/\./g, '-')})`);
    out.push(`Layer: ${tok.layer}${tok.description ? ` · ${tok.description}` : ''}`);
    for (const mode of all.modes) {
      const r = resolve(tokensForMode(all, mode), tok.path);
      out.push(`  ${mode}: ${r.error ? `ERROR ${r.error}` : `${r.chain.join(' -> ')} = ${JSON.stringify(r.value)}`}`);
    }
    const users = allTokens.filter((t) => typeof t.value === 'string' && t.value === `{${tok.path}}`).map((t) => `${t.path} (${t.layer})`);
    if (users.length) out.push(`Aliased by: ${users.join(', ')}`);
    const contracts = all.contracts.filter((c) => JSON.stringify(c.contract ?? {}).includes(tok.path)).map((c) => c.name);
    if (contracts.length) out.push(`Mentioned in contracts: ${contracts.join(', ')}`);
    const dec = [...decisions.matchAll(/### (SB-\d{4}) · [^\n]*/g)].filter((m) => decisions.slice(m.index, m.index + 2000).includes(tok.path.slice(tok.path.lastIndexOf('.') + 1))).map((m) => m[1]);
    if (dec.length) out.push(`Related decisions: ${[...new Set(dec)].join(', ')}`);
    return out.join('\n');
  }

  // Component
  const comp = all.contracts.find((c) => c.name === kebab(q) || c.contract?.tag === q || c.contract?.component?.toLowerCase() === q.toLowerCase() || (c.contract?.elements || []).some((e) => e.tag === q));
  if (comp?.contract) {
    const c = comp.contract;
    out.push(`${c.component} <${c.tag}> · status ${c.status}`);
    out.push(c.summary);
    const props = Object.entries(c.props || {}).map(([n, p]) => `${n}${p.values ? ` (${p.values.join('|')})` : ''}`);
    if (props.length) out.push(`Props: ${props.join(', ')}`);
    if (c.elements?.length) out.push(`Elements: ${c.elements.map((e) => e.tag).join(', ')}`);
    out.push(`Accessibility: ${c.accessibility.role}; name from ${c.accessibility.accessibleNameSource}`);
    const drift = [...(c.realizations?.web?.drift || []), ...(c.realizations?.design?.drift || [])];
    if (drift.length) out.push(`Differs from the references:\n${drift.map((d) => `  • ${d.aspect}: ${d.contract} (reference: ${d.realization})`).join('\n')}`);
    if (c.decisions?.length) out.push(`Decisions: ${c.decisions.join(', ')}`);
    out.push(`Spec: spec/components/${comp.name}/contract.md · Code: src/components/${comp.name}/ · Tests: ${c.realizations?.web?.spec ?? 'none'}`);
    return out.join('\n');
  }

  // Search
  const hits = [];
  for (const c of all.contracts) if (JSON.stringify(c.contract ?? {}).toLowerCase().includes(q.toLowerCase())) hits.push(`contract: ${c.name}`);
  for (const m of decisions.matchAll(/### (SB-\d{4}) · ([^\n]*)/g)) {
    const section = decisions.slice(m.index, m.index + 3000);
    const end = section.indexOf('\n### ');
    if ((end < 0 ? section : section.slice(0, end)).toLowerCase().includes(q.toLowerCase())) hits.push(`decision: ${m[1]} ${m[2]}`);
  }
  return hits.length ? `No exact match for "${q}". Found it in:\n  ${hits.join('\n  ')}` : `Nothing in the spec mentions "${q}".`;
}
