import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, PAGE_PARAMETERS, pageTokens, resolvedText } from './page';

const meta: Meta = { title: 'Foundations/Layout grid', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

const STYLE = html`<style>
  .sbf .layout-demo { display: grid; overflow: hidden; border: var(--sb-border-width-default) solid var(--sb-color-border); background: var(--sb-color-card); }
  .sbf .layout-demo div { height: 6rem; background: var(--sb-color-muted); border: var(--sb-border-width-default) dashed var(--sb-color-input); }
</style>`;

// Columns, gutter and margin found by name (the last part of the path); semantic tokens win over foundation ones.
function grid() {
  const tokens = pageTokens('layout-grid');
  const find = (name: string) => {
    const t = [...tokens].reverse().find((x) => x.path.split('.').pop() === name);
    return t && resolvedText(t);
  };
  return { columns: Number(find('columns')), gutter: find('gutter'), margin: find('margin') };
}

export const Page: StoryObj = {
  render: () => {
    const { columns, gutter, margin } = grid();
    const ok = Number.isInteger(columns) && columns > 0;
    return foundationPage({
      id: 'layout-grid',
      intro: html`<p>
        Resize the Storybook preview to see how the columns and gutters adapt. The layout grid divides a page into columns separated by gutters, with a margin on each side. Page sections and cards snap to whole
        columns, so content lines up across a screen.
      </p>`,
      samples: html`${STYLE}
        <section aria-labelledby="sbf-layout">
          <h2 id="sbf-layout">Grid</h2>
          ${ok
            ? html`<p>${columns} columns, ${gutter ?? 'no'} gutter, ${margin ?? 'no'} margin.</p>
                <div
                  class="layout-demo"
                  data-layout-demo
                  role="img"
                  aria-label="${columns} column grid"
                  style="grid-template-columns:repeat(${columns},1fr);column-gap:${gutter ?? '0px'};padding-inline:${margin ?? '0px'}"
                >
                  ${Array.from({ length: columns }, () => html`<div></div>`)}
                </div>`
            : html`<p class="muted">No column count token was found, so there is no grid to draw.</p>`}
        </section>`,
    });
  },
};
