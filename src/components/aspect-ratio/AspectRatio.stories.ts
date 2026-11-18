import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/aspect-ratio/contract.json';
import contractDoc from '../../../spec/components/aspect-ratio/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { ratio: number };

const picture = html`<img
  alt="Striped placeholder"
  style="object-fit:cover;border-radius:var(--sb-radius-surface)"
  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='90' viewBox='0 0 160 90'%3E%3Crect width='160' height='90' fill='%23888'/%3E%3Cpath d='M0 90 60 30l30 30 20-20 50 50z' fill='%23bbb'/%3E%3C/svg%3E"
/>`;

const meta: Meta<Args> = {
  title: 'Components/AspectRatio',
  component: 'sb-aspect-ratio',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), ratio: 1.7778 },
  render: ({ ratio }) => html`<div style="width:20rem"><sb-aspect-ratio ratio=${ratio}>${picture}</sb-aspect-ratio></div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Square: Story = {
  render: () => html`<div style="width:12rem"><sb-aspect-ratio>${picture}</sb-aspect-ratio></div>`,
};

export const Fraction: Story = {
  render: () => html`<div style="width:20rem"><sb-aspect-ratio ratio="16/9">${picture}</sb-aspect-ratio></div>`,
};

export const TallContent: Story = {
  render: () => html`<div style="width:12rem"><sb-aspect-ratio ratio="2"><div style="height:400px;background:var(--sb-color-muted)">Tall content</div></sb-aspect-ratio></div>`,
};
