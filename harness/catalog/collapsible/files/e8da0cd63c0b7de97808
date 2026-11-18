import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/collapsible/contract.json';
import contractDoc from '../../../spec/components/collapsible/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { expanded: boolean; disabled: boolean };

// Lucide "chevrons-up-down" (ISC), decorative.
const chevrons = html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>`;

const item = (text: string) => html`<div style="border:1px solid #d4d4d4;border-radius:6px;padding:8px 16px;font:14px/20px system-ui">${text}</div>`;

const collapsible = (a: Partial<Args>) => html`<sb-collapsible ?expanded=${a.expanded} ?disabled=${a.disabled} style="display:block;width:350px">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;font:14px/20px system-ui">
    <strong>Order details</strong>
    <sb-collapsible-trigger aria-label="Toggle details">${chevrons}</sb-collapsible-trigger>
  </div>
  ${item('Shipping address')}
  <sb-collapsible-content style="display:block">
    <div style="display:grid;gap:8px;padding-top:8px">${item('Billing address')}${item('Delivery notes')}<a href="#more" style="font:14px/20px system-ui">More about this order</a></div>
  </sb-collapsible-content>
</sb-collapsible>`;

const meta: Meta<Args> = {
  title: 'Components/Collapsible',
  component: 'sb-collapsible',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: (a) => collapsible(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Open: Story = { args: { expanded: true } };

export const Disabled: Story = { args: { disabled: true } };

export const TextTrigger: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<sb-collapsible style="display:block;width:350px;font:14px/20px system-ui">
    <sb-collapsible-trigger>Show more options</sb-collapsible-trigger>
    <sb-collapsible-content style="display:block"><p>Extra options appear here.</p></sb-collapsible-content>
  </sb-collapsible>`,
};
