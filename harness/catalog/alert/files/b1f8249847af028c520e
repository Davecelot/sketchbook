import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/alert/contract.json';
import contractDoc from '../../../spec/components/alert/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { feedback: string };

// Lucide "circle-alert" (ISC), decorative.
const icon = html`<svg slot="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>`;

const alert = (feedback = 'neutral', withIcon = true, withAction = false) => html`<sb-alert feedback=${feedback} style="width: 420px">
  ${withIcon ? icon : nothing}
  <sb-alert-title>${feedback === 'danger' ? 'Upload failed' : 'Update available'}</sb-alert-title>
  <sb-alert-description>${feedback === 'danger' ? 'The file is larger than the allowed size. Choose a smaller file.' : 'A newer version is ready to install.'}</sb-alert-description>
  ${withAction ? html`<sb-alert-action><sb-button size="small" variant="tertiary">Retry</sb-button></sb-alert-action>` : nothing}
</sb-alert>`;

const meta: Meta<Args> = {
  title: 'Components/Alert',
  component: 'sb-alert',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: ({ feedback }) => alert(feedback),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Danger: Story = { args: { feedback: 'danger' } };

export const WithoutIcon: Story = { render: ({ feedback }) => alert(feedback, false) };

export const WithAction: Story = { render: ({ feedback }) => alert(feedback, true, true) };

export const WithActionNoIcon: Story = { render: ({ feedback }) => alert(feedback, false, true) };

export const TitleOnly: Story = {
  render: () => html`<sb-alert style="width: 420px">${icon}<sb-alert-title>Saved</sb-alert-title></sb-alert>`,
};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, (c) => alert(c.feedback, true, true)),
};
