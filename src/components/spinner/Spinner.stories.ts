import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/spinner/contract.json';
import contractDoc from '../../../spec/components/spinner/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { label: string; decorative: boolean };

const meta: Meta<Args> = {
  title: 'Components/Spinner',
  component: 'sb-spinner',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: ({ label, decorative }) => html`<sb-spinner label=${label} ?decorative=${decorative}></sb-spinner>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const CustomLabel: Story = { args: { label: 'Loading results' } };

export const Decorative: Story = { args: { decorative: true } };

export const InheritsColor: Story = {
  render: () => html`<span style="color: var(--sb-color-destructive)"><sb-spinner></sb-spinner></span>`,
};
