import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, gallery, PAGE_PARAMETERS, pageTokens } from './page';

const meta: Meta = { title: 'Foundations/Border width', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

export const Page: StoryObj = {
  render: () =>
    foundationPage({
      id: 'border-width',
      intro: html`<p>
        Border widths are the few line weights the system draws with: hairline borders around fields and surfaces, a thicker line for emphasis
        and indicators, and the focus ring. A focus ring must stay visible next to every surface it can sit on, so it is wider than a plain border.
      </p>`,
      samples: gallery(pageTokens('border-width'), (v) => html`<div style="width:4rem;height:2.5rem;border:${v} solid var(--sb-color-foreground)"></div>`),
    }),
};
