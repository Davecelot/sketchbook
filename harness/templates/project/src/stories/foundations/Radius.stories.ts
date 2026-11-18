import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, gallery, PAGE_PARAMETERS, pageTokens } from './page';

const meta: Meta = { title: 'Foundations/Radius', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

export const Page: StoryObj = {
  render: () =>
    foundationPage({
      id: 'radius',
      configHint: 'radius',
      intro: html`<p>
        Radius rounds the corners of controls and surfaces. The foundation is a short scale from square to fully round; the semantic layer says
        which step each kind of element uses (control, surface, pill), so changing the radius style restyles every component at once. Keep nested
        corners consistent: an inner corner looks right when it is the outer radius minus the padding between them.
      </p>`,
      samples: gallery(pageTokens('radius'), (v) => html`<div class="box" style="width:4rem;height:4rem;border-radius:${v}"></div>`),
    }),
};
