import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, svg } from 'lit';

import contract from '../../../spec/components/button-group/contract.json';
import contractDoc from '../../../spec/components/button-group/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { orientation: string };

const chevron = html`<svg slot="leading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svg`<path d="m6 9 6 6 6-6" />`}</svg>`;

const group = (a: Partial<Args>, content: unknown) =>
  html`<sb-button-group aria-label="Message actions" orientation=${a.orientation ?? nothing}>${content}</sb-button-group>`;

const outlineButtons = html`
  <sb-button variant="tertiary">Archive</sb-button>
  <sb-button variant="tertiary">Report</sb-button>
  <sb-button variant="tertiary">Snooze</sb-button>
`;

const meta: Meta<Args> = {
  title: 'Components/Button Group',
  component: 'sb-button-group',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args) },
  render: (a) => group(a, outlineButtons),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const WithSeparator: Story = {
  render: (a) => group(a, html`
    <sb-button variant="secondary">Save</sb-button>
    <sb-button-group-separator></sb-button-group-separator>
    <sb-button variant="secondary" size="icon" aria-label="More save options">${chevron}</sb-button>
  `),
};

export const WithText: Story = {
  render: (a) => group(a, html`
    <sb-button-group-text>Amount</sb-button-group-text>
    <sb-button variant="tertiary">10</sb-button>
    <sb-button variant="tertiary">20</sb-button>
  `),
};

export const Rtl: Story = {
  render: (a) => html`<div dir="rtl">${group(a, outlineButtons)}</div>`,
};

export const Single: Story = {
  render: (a) => group(a, html`<sb-button variant="tertiary">Only</sb-button>`),
};
