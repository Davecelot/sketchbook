import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, gallery, PAGE_PARAMETERS, pageTokens } from './page';

const meta: Meta = { title: 'Foundations/Elevation', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

export const Page: StoryObj = {
  render: () =>
    foundationPage({
      id: 'elevation',
      intro: html`<p>
        Compare the shadows across surfaces and check how clearly each surface stands out in dark mode. Elevation shows that something floats above the page: menus, popovers, dialogs. Each step is a shadow; the semantic elevation tokens say
        which step a layer uses. Shadows are hard to see on dark backgrounds, so floating surfaces also keep a border and their own background.
      </p>`,
      samples: gallery(pageTokens('elevation'), (v) => html`<div class="box" style="width:6rem;height:4rem;border-radius:var(--sb-radius-surface);box-shadow:${v}"></div>`),
    }),
};
