import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/label/contract.json';
import contractDoc from '../../../spec/components/label/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { htmlFor: string; disabled: boolean; text: string };

const meta: Meta<Args> = {
  title: 'Components/Label',
  component: 'sb-label',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: { ...argTypesFrom(contract), text: { control: 'text' } },
  args: { ...(argsFrom(contract) as Args), text: 'Email' },
  render: ({ htmlFor, disabled, text }) => html`<sb-label for=${htmlFor || ''} ?disabled=${disabled}>${text}</sb-label>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const ForInput: Story = {
  render: () => html`<div style="display:grid;gap:8px;max-width:16rem">
    <sb-label for="email">Email</sb-label>
    <input id="email" type="email" autocomplete="email" />
  </div>`,
};

export const ForCheckbox: Story = {
  render: () => html`<div style="display:flex;align-items:center;gap:8px">
    <input id="terms" type="checkbox" />
    <sb-label for="terms">Accept the terms</sb-label>
  </div>`,
};

export const Wrapping: Story = {
  render: () => html`<sb-label><input type="checkbox" /> Send me a copy</sb-label>`,
};

export const WithIcon: Story = {
  render: () => html`<div style="display:grid;gap:8px;max-width:16rem">
    <sb-label for="search"
      ><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
      >Search</sb-label
    >
    <input id="search" type="search" />
  </div>`,
};

export const Disabled: Story = {
  render: () => html`<div style="display:grid;gap:8px;max-width:16rem">
    <sb-label for="locked" disabled>Account id</sb-label>
    <input id="locked" disabled value="A-1024" />
  </div>`,
};

export const LinkInside: Story = {
  render: () => html`<div style="display:flex;align-items:center;gap:8px">
    <input id="policy" type="checkbox" />
    <sb-label for="policy">I agree to the <a href="#policy-text">policy</a></sb-label>
  </div>`,
};
