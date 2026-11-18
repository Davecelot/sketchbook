import type { TemplateResult } from 'lit';
import { html, nothing } from 'lit';

import { pageOf, PAGES } from './families';
import type { Token } from './tokens';
import { cssValue, cssVar, foundation, modes, resolve, semantic, usersOf } from './tokens';

// Shared shell of a Foundations page: title, intro, how to change it, samples, then every token of
// the family in tables (one per layer and mode). Page chrome uses semantic tokens only.

export const pageTokens = (id: string) => [...foundation, ...semantic].filter((t) => pageOf(t.path) === id);

const anchor = (t: Pick<Token, 'layer' | 'mode' | 'path'>) => `token-${t.layer}-${t.mode ?? 'base'}-${t.path}`;
export const resolvedText = (t: Token) => {
  const r = resolve(t.path, t.mode);
  return r.error ? `(${r.error})` : cssValue(r.value, r.type);
};

export const STYLE = html`<style>
  .sbf {
    max-width: 72rem;
    padding: var(--sb-space-6);
    color: var(--sb-color-foreground);
    background: var(--sb-color-background);
    font-family: var(--sb-font-family-body);
    font-size: var(--sb-font-size-body);
    line-height: var(--sb-font-line-height-body);
  }
  .sbf h1 { font-size: var(--sb-font-size-heading-2); line-height: var(--sb-font-line-height-heading-2); font-weight: var(--sb-font-weight-display); letter-spacing: var(--sb-font-letter-spacing-heading); margin: 0 0 var(--sb-space-stack-md); }
  .sbf h2 { font-size: var(--sb-font-size-heading-4); line-height: var(--sb-font-line-height-heading-4); font-weight: var(--sb-font-weight-heading); margin: var(--sb-space-prose-heading-2) 0 var(--sb-space-stack-md); }
  .sbf h3 { font-size: var(--sb-font-size-large); line-height: var(--sb-font-line-height-large); font-weight: var(--sb-font-weight-heading); margin: var(--sb-space-prose-heading-3) 0 var(--sb-space-stack-sm); }
  .sbf p { margin: 0 0 var(--sb-space-stack-md); max-width: 46rem; }
  .sbf a { color: inherit; text-underline-offset: var(--sb-space-text-underline-offset); }
  .sbf code { font-family: var(--sb-font-family-code); font-size: var(--sb-font-size-caption); overflow-wrap: anywhere; }
  .sbf .muted { color: var(--sb-color-muted-foreground); }
  .sbf table { width: 100%; border-collapse: collapse; margin-bottom: var(--sb-space-stack-lg); }
  .sbf table.tokens { table-layout: fixed; }
  .sbf table.tokens code { overflow-wrap: break-word; }
  .sbf caption { text-align: start; font-weight: var(--sb-font-weight-heading); padding-bottom: var(--sb-space-stack-sm); }
  .sbf th, .sbf td { text-align: start; vertical-align: top; padding: var(--sb-space-inset-sm); border-bottom: var(--sb-border-width-default) solid var(--sb-color-border); }
  .sbf th[scope='col'] { font-weight: var(--sb-font-weight-label); color: var(--sb-color-muted-foreground); }
  .sbf th[scope='row'] { font-weight: var(--sb-font-weight-body); }
  .sbf .samples { display: flex; flex-direction: column; gap: var(--sb-space-stack-md); }
  .sbf .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sb-space-stack-md); }
  .sbf .label { display: flex; flex-direction: column; gap: var(--sb-space-stack-2xs); min-width: min(8rem, 100%); }
  .sbf .box { border: var(--sb-border-width-default) solid var(--sb-color-border); background: var(--sb-color-card); }
  .sbf .fill { background: var(--sb-color-primary); }
  .sbf ul.plain, .sbf ol.plain { list-style: none; padding: 0; margin: 0; }
</style>`;

const usedBy = (t: Token, pageId: string) => {
  const users = usersOf(t.path).filter((u) => !(t.mode && u.mode && u.mode !== t.mode));
  if (!users.length) return html`<span class="muted">none</span>`;
  const shown = users.slice(0, 4);
  return html`${shown.map((u, i) => {
    const label = u.mode ? `${u.path} (${u.mode})` : u.path;
    const linked = u.layer !== 'component' && pageOf(u.path) === pageId;
    return html`${i ? ', ' : nothing}${linked ? html`<a href="#${anchor(u)}"><code>${label}</code></a>` : html`<code>${label}</code>`}`;
  })}${users.length > shown.length ? html`, <span class="muted">+${users.length - shown.length} more</span>` : nothing}`;
};

export function tokenTable(tokens: Token[], pageId: string, caption: string) {
  return html`<table class="tokens">
    <caption>${caption}</caption>
    <colgroup>
      <col style="width:22%" />
      <col style="width:22%" />
      <col style="width:16%" />
      <col style="width:14%" />
      <col style="width:26%" />
    </colgroup>
    <thead>
      <tr>
        <th scope="col">Token</th>
        <th scope="col">CSS variable</th>
        <th scope="col">Value</th>
        <th scope="col">Resolves to</th>
        <th scope="col">Used by</th>
      </tr>
    </thead>
    <tbody>
      ${tokens.map(
        (t) => html`<tr data-token-row data-path=${t.path} data-layer=${t.layer} data-mode=${t.mode ?? ''} id=${anchor(t)}>
          <th scope="row"><code>${t.path}</code>${t.description ? html`<div class="muted">${t.description}</div>` : nothing}</th>
          <td><code data-css-var>${cssVar(t.path)}</code></td>
          <td><code>${cssValue(t.value, t.type)}</code></td>
          <td><code>${resolvedText(t)}</code></td>
          <td>${usedBy(t, pageId)}</td>
        </tr>`,
      )}
    </tbody>
  </table>`;
}

// Every token of the page, grouped by layer and mode, in file order.
export function tokenTables(pageId: string) {
  const tokens = pageTokens(pageId);
  const groups: { title: string; tokens: Token[] }[] = [
    { title: 'Foundation', tokens: tokens.filter((t) => t.layer === 'foundation') },
    { title: 'Semantic', tokens: tokens.filter((t) => t.layer === 'semantic' && !t.mode) },
    ...modes.map((m) => ({ title: `Semantic, ${m} mode`, tokens: tokens.filter((t) => t.layer === 'semantic' && t.mode === m) })),
  ].filter((g) => g.tokens.length);
  return html`<section aria-labelledby="sbf-tokens">
    <h2 id="sbf-tokens">Tokens</h2>
    ${groups.length
      ? groups.map((g) => tokenTable(g.tokens, pageId, `${g.title} (${g.tokens.length})`))
      : html`<p class="muted">No tokens of this family were found in spec/tokens.</p>`}
  </section>`;
}

const HOW = (configHint?: string) => html`<p data-how-to-change>
  <strong>How to change it.</strong> Edit <code>brand.config.json</code>${configHint
    ? html` (<code>${configHint}</code>)`
    : nothing}
  and rebuild with <code>npm run tokens</code>, or use the CLI: <code>sketchbook tokens preset &lt;foundation&gt; &lt;id&gt;</code> switches the whole
  scale to a preset, <code>sketchbook tokens set &lt;key&gt; &lt;value&gt;</code> changes one value. Semantic roles live in
  <code>spec/tokens/semantic/*.tokens.json</code>. This page reads the token files directly, so it follows every edit.
</p>`;

export type PageOptions = { id: string; intro: TemplateResult; configHint?: string; samples?: TemplateResult | typeof nothing };

export function foundationPage({ id, intro, configHint, samples }: PageOptions) {
  const title = PAGES.find((p) => p.id === id)?.title ?? id;
  return html`${STYLE}
    <main class="sbf" data-foundation=${id}>
      <h1>${title}</h1>
      <div data-intro>${intro}</div>
      ${HOW(configHint)} ${samples ?? nothing} ${tokenTables(id)}
    </main>`;
}

// Story parameters shared by every page (title and tags stay literal in each file: Storybook indexes them statically).
export const PAGE_PARAMETERS = { layout: 'fullscreen', controls: { disable: true } };

// A wrapping gallery: one sample per token, labelled with its path and resolved value.
export function gallery(tokens: Token[], sample: (value: string, t: Token) => unknown, title = 'Samples') {
  const id = `sbf-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return html`<section aria-labelledby=${id}>
    <h2 id=${id}>${title}</h2>
    <ul class="plain row" style="align-items:flex-end">
      ${tokens.map(
        (t) => html`<li class="label" data-sample=${t.path}>
          ${sample(resolvedText(t), t)}
          <code>${t.path}</code>
          <span class="muted">${resolvedText(t)}</span>
        </li>`,
      )}
    </ul>
  </section>`;
}
