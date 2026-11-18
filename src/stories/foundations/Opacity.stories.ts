import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, gallery, PAGE_PARAMETERS, pageTokens } from './page';

const meta: Meta = { title: 'Foundations/Opacity', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

export const Page: StoryObj = {
  render: () =>
    foundationPage({
      id: 'opacity',
      intro: html`<p>
        Opacity steps fade an element without changing its color: disabled controls, loading pulses, overlays. Fading lowers contrast, so a faded
        control must still be recognisable, and text that people need to read should not rely on opacity alone.
      </p>`,
      samples: gallery(pageTokens('opacity'), (v) => html`<div class="box" style="width:4rem;height:2.5rem;position:relative"><div class="fill" style="position:absolute;inset:0;opacity:${v}"></div></div>`),
    }),
};
