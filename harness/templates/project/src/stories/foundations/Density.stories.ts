import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, gallery, PAGE_PARAMETERS, pageTokens } from './page';

const meta: Meta = { title: 'Foundations/Density', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

const brand = Object.values(import.meta.glob<{ density?: string }>('../../../brand.config.json', { eager: true, import: 'default' }))[0];

const control = (v: string) => html`<div class="box" style="height:${v};width:8rem;border-radius:var(--sb-radius-control)"></div>`;
const square = (v: string) => html`<div class="box" style="width:${v};max-width:100%;aspect-ratio:1"></div>`;

export const Page: StoryObj = {
  render: () => {
    const tokens = pageTokens('density');
    const controls = tokens.filter((t) => t.path.startsWith('size.control.'));
    return foundationPage({
      id: 'density',
      configHint: 'density',
      intro: html`<p>
          Compare the same controls at each density. Density sets how much room interactive elements take: the height of buttons, inputs and selects, and the sizes of fixed parts such as
          switches and avatars. The foundation is a plain size scale; the semantic layer picks a step for each control size, and the density setting
          moves those picks together. Compact layouts fit more on screen, but pointer targets should stay at least 24px.
        </p>
        <p>Current density in brand.config.json: <strong>${brand?.density ?? 'not set'}</strong>.</p>`,
      samples: html`${controls.length ? gallery(controls, control, 'Control heights') : ''}
      ${gallery(
        tokens.filter((t) => !controls.includes(t)),
        square,
        'Sizes',
      )}`,
    });
  },
};
