import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, PAGE_PARAMETERS, pageTokens, resolvedText } from './page';

const meta: Meta = { title: 'Foundations/Z-index', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

const STYLE = html`<style>
  .sbf .layers li { display: grid; grid-template-columns: 3rem minmax(0, 16rem) auto; gap: var(--sb-space-stack-md); align-items: center; padding-block: var(--sb-space-stack-xs); border-bottom: var(--sb-border-width-default) solid var(--sb-color-border); }
</style>`;

export const Page: StoryObj = {
  render: () => {
    const layers = pageTokens('z-index')
      .map((t) => ({ t, z: Number(resolvedText(t)) }))
      .sort((a, b) => a.z - b.z || a.t.path.localeCompare(b.t.path));
    return foundationPage({
      id: 'z-index',
      intro: html`<p>
        Read from the bottom of the stack to find which layers can cover a dropdown. Z-index decides what covers what when elements overlap. The foundation is a few spaced numbers; the semantic layer names each layer by role
        (dropdown, sticky header, overlay, modal, toast) so no component invents its own number. The list below runs from the bottom of the stack to
        the top.
      </p>`,
      samples: html`${STYLE}
        <section aria-labelledby="sbf-order">
          <h2 id="sbf-order">Stacking order</h2>
          <ol class="plain layers" data-layer-order>
            ${layers.map(
              ({ t, z }) => html`<li data-z=${z}>
                <strong>${z}</strong>
                <code>${t.path}</code>
                <span class="muted">${t.layer}</span>
              </li>`,
            )}
          </ol>
        </section>`,
    });
  },
};
