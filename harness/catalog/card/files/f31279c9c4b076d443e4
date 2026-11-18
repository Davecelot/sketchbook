import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/card/contract.json';
import contractDoc from '../../../spec/components/card/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { size: string };

const card = (size?: string, withAction = false, withFooter = true) => html`<sb-card size=${size ?? 'medium'} style="width: 360px">
  <sb-card-header>
    <sb-card-title>Weekly summary</sb-card-title>
    <sb-card-description>Activity from the last seven days.</sb-card-description>
    ${withAction ? html`<sb-card-action><sb-button variant="tertiary" size="small">Refresh</sb-button></sb-card-action>` : ''}
  </sb-card-header>
  <sb-card-content>Totals and trends appear here.</sb-card-content>
  ${withFooter ? html`<sb-card-footer><sb-button>View report</sb-button></sb-card-footer>` : ''}
</sb-card>`;

const meta: Meta<Args> = {
  title: 'Components/Card',
  component: 'sb-card',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: ({ size }) => card(size),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Small: Story = { args: { size: 'small' } };

export const WithAction: Story = { render: ({ size }) => card(size, true) };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, (c) => card(c.size, true)),
};

export const ContentOnly: Story = {
  render: () => html`<sb-card style="width: 360px"><sb-card-content>Just content, no header.</sb-card-content></sb-card>`,
};
