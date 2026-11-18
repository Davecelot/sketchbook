import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/item/contract.json';
import contractDoc from '../../../spec/components/item/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { variant: string; size: string; href: string };

// Lucide "file" (ISC), decorative.
const file = html`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>`;

const portrait = `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='#888'/><circle cx='40' cy='40' r='20' fill='#ddd'/></svg>")}`;

const item = (a: Partial<Args>, withActions = false) => html`<sb-item variant=${a.variant ?? nothing} size=${a.size ?? nothing} href=${a.href || nothing} style="width: 420px">
  <sb-item-media variant="icon">${file}</sb-item-media>
  <sb-item-content>
    <sb-item-title>Quarterly plan</sb-item-title>
    <sb-item-description>Edited yesterday by the planning team.</sb-item-description>
  </sb-item-content>
  ${withActions ? html`<sb-item-actions><sb-button size="small" variant="tertiary">Open</sb-button></sb-item-actions>` : nothing}
</sb-item>`;

const meta: Meta<Args> = {
  title: 'Components/Item',
  component: 'sb-item',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), href: '' },
  render: (a) => item(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, (c) => item({ variant: c.variant, size: c.size })),
};

export const WithActions: Story = { render: (a) => item(a, true) };

export const AsLink: Story = { args: { href: '#plan', variant: 'tertiary' } };

export const MediaVariants: Story = {
  render: () => html`<div style="display:grid;gap:12px;width:420px">
    <sb-item variant="tertiary"><sb-item-media>${file}</sb-item-media><sb-item-content><sb-item-title>Default media</sb-item-title></sb-item-content></sb-item>
    <sb-item variant="tertiary"><sb-item-media variant="icon">${file}</sb-item-media><sb-item-content><sb-item-title>Icon media</sb-item-title></sb-item-content></sb-item>
    <sb-item variant="tertiary"><sb-item-media variant="image"><img alt="" src=${portrait} /></sb-item-media><sb-item-content><sb-item-title>Image media</sb-item-title></sb-item-content></sb-item>
  </div>`,
};

export const HeaderAndFooter: Story = {
  render: () => html`<sb-item variant="tertiary" style="width: 420px">
    <sb-item-header><span>Draft</span><span>3 min read</span></sb-item-header>
    <sb-item-content>
      <sb-item-title>Release notes</sb-item-title>
      <sb-item-description>Changes shipped this month, grouped by area.</sb-item-description>
    </sb-item-content>
    <sb-item-footer><span>Updated today</span><sb-button size="small" variant="ghost">Edit</sb-button></sb-item-footer>
  </sb-item>`,
};

export const Group: Story = {
  render: () => html`<sb-item-group style="width: 420px">
    <sb-item>
      <sb-item-media variant="icon">${file}</sb-item-media>
      <sb-item-content><sb-item-title>Quarterly plan</sb-item-title><sb-item-description>Edited yesterday.</sb-item-description></sb-item-content>
      <sb-item-actions><sb-button size="small" variant="tertiary">Open</sb-button></sb-item-actions>
    </sb-item>
    <sb-item-separator></sb-item-separator>
    <sb-item>
      <sb-item-media variant="icon">${file}</sb-item-media>
      <sb-item-content><sb-item-title>Budget</sb-item-title><sb-item-description>Edited last week.</sb-item-description></sb-item-content>
      <sb-item-actions><sb-button size="small" variant="tertiary">Open</sb-button></sb-item-actions>
    </sb-item>
    <sb-item-separator></sb-item-separator>
    <sb-item href="#notes"><sb-item-content><sb-item-title>Notes</sb-item-title></sb-item-content></sb-item>
  </sb-item-group>`,
};

export const TwoContentBlocks: Story = {
  render: () => html`<sb-item variant="tertiary" style="width: 420px">
    <sb-item-content><sb-item-title>Storage</sb-item-title><sb-item-description>Used by your workspace.</sb-item-description></sb-item-content>
    <sb-item-content>42 GB</sb-item-content>
  </sb-item>`,
};
