import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, PAGE_PARAMETERS, resolvedText } from './page';
import { foundation, pxRem, resolve } from './tokens';

const meta: Meta = { title: 'Foundations/Spacing', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

const STYLE = html`<style>
  .sbf .bar-row { display: grid; grid-template-columns: minmax(0, 10rem) minmax(0, 9rem) 1fr; gap: var(--sb-space-stack-md); align-items: center; }
  .sbf .bar { height: var(--sb-space-4); flex: none; }
  .sbf .grid-demo { width: calc(var(--_unit) * 48); height: calc(var(--_unit) * 16); max-width: 100%; border: var(--sb-border-width-default) solid var(--sb-color-border);
    background-image: linear-gradient(to right, var(--sb-color-input) 1px, transparent 1px), linear-gradient(to bottom, var(--sb-color-input) 1px, transparent 1px);
    background-size: var(--_unit) var(--_unit); }
</style>`;

const px = (v: string) => (/^-?\d*\.?\d+px$/.test(v) ? parseFloat(v) : undefined);
const gcd = (a: number, b: number): number => (b < 0.001 ? a : gcd(b, a % b));

const steps = () =>
  foundation
    .filter((t) => t.path.startsWith('space.'))
    .map((t) => ({ t, v: resolvedText(t) }))
    .sort((a, b) => (px(a.v) ?? 0) - (px(b.v) ?? 0));

// The base unit: the semantic `space.unit` when there is one, else the largest step that divides every foundation step.
function baseUnit(): string {
  const unit = resolve('space.unit', null);
  if (!unit.error) return String(unit.value);
  const values = steps().map(({ v }) => px(v)).filter((n): n is number => !!n);
  return values.length ? `${values.reduce(gcd)}px` : '4px';
}

export const Page: StoryObj = {
  render: () => {
    const unit = baseUnit();
    return foundationPage({
      id: 'spacing',
      configHint: 'spacing',
      intro: html`<p>
        Compare the raw steps with the gaps and insets you use in a layout. Spacing is one scale of steps built on a base unit. Every gap, padding and margin in a component comes from it, which keeps layouts on a
        shared rhythm. Foundation step names are multiples of the base unit (step 4 is four units); semantic tokens name the job instead: control
        padding, stack gaps, insets.
      </p>`,
      samples: html`${STYLE}
        <section aria-labelledby="sbf-grid">
          <h2 id="sbf-grid">Base grid</h2>
          <p>Base unit: <strong>${pxRem(unit)}</strong>. Each cell below is one unit.</p>
          <div class="grid-demo" data-base-grid style="--_unit:${unit}" role="img" aria-label="Grid of ${unit} cells"></div>
        </section>
        <section aria-labelledby="sbf-scale">
          <h2 id="sbf-scale">Scale</h2>
          <div class="samples">
            ${steps().map(
              ({ t, v }) => html`<div class="bar-row">
                <code>${t.path}</code>
                <span class="muted">${pxRem(v)}</span>
                <div class="bar fill" data-bar=${t.path} style="width:${v}"></div>
              </div>`,
            )}
          </div>
        </section>`,
    });
  },
};
