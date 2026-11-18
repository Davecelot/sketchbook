import type { TemplateResult } from 'lit';
import { html } from 'lit';

// Builds Storybook controls and the variant-matrix story from a component's contract.json,
// so stories can't drift from the contract (generated instead of hand-kept).

type Prop = { type: string; values?: string[]; default?: unknown; note?: string };
type Contract = {
  component: string;
  summary: string;
  props?: Record<string, Prop>;
  variantMatrix?: { dimensions: Record<string, string[]>; excludedCombinations?: Record<string, string>[] };
};

const defaultText = (value: unknown) => (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '');

export function argTypesFrom(contract: Contract) {
  const out: Record<string, unknown> = {};
  for (const [name, p] of Object.entries(contract.props ?? {})) {
    if (p.type === 'slot' || p.type === 'instanceSwap') continue;
    const control =
      p.type === 'variant' ? { type: (p.values?.length ?? 0) > 4 ? 'select' : 'inline-radio' } : p.type === 'boolean' ? 'boolean' : p.type === 'number' ? 'number' : 'text';
    out[name] = { control, options: p.values, description: p.note, table: { defaultValue: { summary: defaultText(p.default) } } };
  }
  return out;
}

export function argsFrom(contract: Contract) {
  const out: Record<string, unknown> = {};
  for (const [name, p] of Object.entries(contract.props ?? {})) if (p.default !== undefined && p.default !== null) out[name] = p.default;
  return out;
}

// Every combination of the matrix dimensions, minus excluded ones, rendered in a wrapping grid.
export function matrixOf(contract: Contract, render: (combo: Record<string, string>) => TemplateResult) {
  const dims = Object.entries(contract.variantMatrix?.dimensions ?? {});
  const excluded = contract.variantMatrix?.excludedCombinations ?? [];
  let combos: Record<string, string>[] = [{}];
  for (const [dim, values] of dims) combos = combos.flatMap((c) => values.map((v) => ({ ...c, [dim]: v })));
  combos = combos.filter((c) => !excluded.some((x) => Object.entries(x).every(([k, v]) => k === 'reason' || c[k] === v)));
  const [rowDim] = dims[0] ?? [];
  const rows = rowDim ? [...new Set(combos.map((c) => c[rowDim]))] : [''];
  return html`<div style="display:grid;gap:16px">
    ${rows.map(
      (row) => html`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px">
        ${combos.filter((c) => !rowDim || c[rowDim] === row).map(render)}
      </div>`,
   )}
  </div>`;
}

// The component's contract.md as its docs page: front matter, the typed-spec link and the
// agents-only section are dropped. The page updates whenever the contract changes.
export function docsFrom(markdown: string) {
  return markdown
    .replace(/^---[\s\S]*?---\s*/, '')
    .replace(/^# .*\n+/, '')
    .replace(/ ?Typed spec: \[contract\.json\]\(\.\/contract\.json\)\.?/, '')
    .replace(/\n## Spec for agents[\s\S]*$/, '\n')
    .trim();
}
