import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import { foundationPage, gallery, PAGE_PARAMETERS, pageTokens } from './page';

const meta: Meta = { title: 'Foundations/Icon sizes', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

// Lucide "star" (ISC), decorative.
const icon = (v: string) =>
  html`<svg aria-hidden="true" style="width:${v};height:${v}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path
      d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
    />
  </svg>`;

export const Page: StoryObj = {
  render: () =>
    foundationPage({
      id: 'icon-sizes',
      intro: html`<p>
        Icon sizes keep glyphs in proportion with the text and controls around them: the default icon sits next to body text, smaller ones go in
        compact controls, larger ones stand alone. An icon that can be clicked needs a hit area larger than its glyph; the control around it
        provides that, so icon size and target size are separate decisions.
      </p>`,
      samples: gallery(pageTokens('icon-sizes'), icon),
    }),
};
