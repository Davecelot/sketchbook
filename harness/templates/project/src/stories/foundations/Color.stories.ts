import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { CONTRAST_MIN } from './families';
import { foundationPage, PAGE_PARAMETERS } from './page';
import type { Token } from './tokens';
import { contrastPairs, foundation, modes, resolve, semantic, wcagRatio } from './tokens';

const meta: Meta = { title: 'Foundations/Color', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

const STYLE = html`<style>
  .sbf .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr)); gap: var(--sb-space-stack-md); }
  .sbf .chip { height: var(--sb-size-control-lg); border-radius: var(--sb-radius-control); border: var(--sb-border-width-default) solid var(--sb-color-border); }
  .sbf .modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(22rem, 100%), 1fr)); gap: var(--sb-space-stack-lg); }
  .sbf .panel table { overflow-wrap: anywhere; }
  .sbf .panel { min-width: 0; padding: var(--sb-space-inset-md); border-radius: var(--sb-radius-surface); border: var(--sb-border-width-default) solid var(--sb-color-border); background: var(--sb-color-background); color: var(--sb-color-foreground); }
  .sbf .panel code { overflow-wrap: anywhere; }
  .sbf .roles { display: grid; gap: var(--sb-space-stack-sm); margin-bottom: var(--sb-space-stack-lg); }
  .sbf .roles li { display: grid; grid-template-columns: var(--sb-size-control-lg) 1fr; gap: var(--sb-space-stack-sm); align-items: center; }
  .sbf .pair { display: flex; }
  .sbf .pair span { width: var(--sb-size-control-default); height: var(--sb-size-control-default); border: var(--sb-border-width-default) solid var(--sb-color-border); }
</style>`;

const upper = (v: unknown) => String(v).toUpperCase();

// Foundation colors grouped by their parent: one ramp per hue, loose colors (white, black) together.
function ramps() {
  const groups = new Map<string, Token[]>();
  for (const t of foundation.filter((x) => x.path.startsWith('color.'))) {
    const parent = t.path.split('.').slice(0, -1).join('.');
    groups.set(parent, [...(groups.get(parent) ?? []), t]);
  }
  return [...groups].map(
    ([parent, tokens]) => html`<section data-ramp=${parent}>
      <h3>${parent === 'color' ? 'Base colors' : parent.replace(/^color\./, '')}</h3>
      <ul class="plain swatches">
        ${tokens.map((t) => {
          const value = String(resolve(t.path, null).value ?? t.value);
          return html`<li data-swatch=${t.path} class="label">
            <div class="chip" style="background:${value}"></div>
            <strong>${t.path.split('.').pop()}</strong>
            <code data-hex>${upper(value)}</code>
          </li>`;
        })}
      </ul>
    </section>`,
  );
}

function contrastTable(mode: string) {
  return html`<table>
    <caption>Contrast pairs, ${mode} mode (spec/tokens/contrast.json)</caption>
    <thead>
      <tr>
        <th scope="col">Pair</th>
        <th scope="col">Sample</th>
        <th scope="col">Kind (minimum)</th>
        <th scope="col">Ratio</th>
        <th scope="col">AA</th>
      </tr>
    </thead>
    <tbody>
      ${contrastPairs.map(({ fg, bg, kind }) => {
        const f = resolve(fg, mode).value;
        const b = resolve(bg, mode).value;
        const ratio = typeof f === 'string' && typeof b === 'string' ? wcagRatio(f, b) : undefined;
        const min = CONTRAST_MIN[kind] ?? 4.5;
        const pass = ratio !== undefined && ratio >= min;
        return html`<tr data-contrast-row data-mode=${mode} data-fg=${fg} data-bg=${bg} data-ratio=${ratio ?? ''} data-pass=${String(pass)}>
          <th scope="row"><code>${fg}</code> on <code>${bg}</code></th>
          <td><div class="pair" aria-hidden="true"><span style="background:${String(f)}"></span><span style="background:${String(b)}"></span></div></td>
          <td>${kind} (${min}:1)</td>
          <td data-ratio-text>${ratio === undefined ? 'n/a' : `${ratio.toFixed(2)}:1`}</td>
          <td data-verdict><strong>${pass ? 'Pass' : 'Fail'}</strong></td>
        </tr>`;
      })}
    </tbody>
  </table>`;
}

// One panel per mode, themed with data-theme so its chrome shows that mode whatever the toolbar says.
const modePanel = (mode: string) => html`<section class="panel" data-mode-panel=${mode} data-theme=${mode} aria-labelledby="sbf-mode-${mode}">
  <h3 id="sbf-mode-${mode}">${mode.charAt(0).toUpperCase() + mode.slice(1)} mode</h3>
  <ul class="plain roles">
    ${semantic
      .filter((t) => t.mode === mode && t.path.startsWith('color.'))
      .map((t) => {
        const r = resolve(t.path, mode);
        return html`<li>
          <div class="chip" style="background:${String(r.value)}"></div>
          <div class="label">
            <strong>${t.path.replace(/^color\./, '')}</strong>
            <code data-chain=${t.path}>${r.chain.join(' → ')} → ${r.error ? `(${r.error})` : upper(r.value)}</code>
          </div>
        </li>`;
      })}
  </ul>
  ${contrastPairs.length ? contrastTable(mode) : html`<p>No contrast pairs declared.</p>`}
</section>`;

export const Page: StoryObj = {
  render: () =>
    foundationPage({
      id: 'color',
      configHint: 'color',
      intro: html`<p>
          Switch Mode in the toolbar and compare the primary, background, and border roles. Color has two layers. The <strong>foundation</strong> is a set of ramps, one per hue, each running from a near-white step to a near-black one;
          its values are generated from the brand inputs. The <strong>semantic</strong> layer names roles (background, primary, border, ring) and
          points each one at a ramp step, separately for every mode. Components only ever use semantic or component tokens.
        </p>
        <p>
          The contrast table checks every pair declared in <code>spec/tokens/contrast.json</code> against WCAG 2.x AA: 4.5:1 for text, 3:1 for large
          text and for interface parts such as borders and focus rings. The same pairs are enforced by <code>npm run check</code>.
        </p>`,
      samples: html`${STYLE}
        <section aria-labelledby="sbf-ramps">
          <h2 id="sbf-ramps">Ramps</h2>
          ${ramps()}
        </section>
        <section aria-labelledby="sbf-semantic">
          <h2 id="sbf-semantic">Semantic colors by mode</h2>
          <div class="modes">${modes.map(modePanel)}</div>
        </section>`,
    }),
};
