import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, svg } from 'lit';

import contract from '../../../spec/components/input-group/contract.json';
import contractDoc from '../../../spec/components/input-group/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { validation: string };

// Lucide "search", "copy" (ISC), decorative.
const icon = (paths: unknown) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const search = icon(svg`<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />`);
const copy = icon(svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />`);

const meta: Meta<Args> = {
  title: 'Components/Input Group',
  component: 'sb-input-group',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args) },
  render: (a) => html`<sb-input-group validation=${a.validation ?? nothing} style="max-width:24rem">
    <sb-input hide-label label="Search" placeholder="Search..."></sb-input>
    <sb-input-group-addon>${search}</sb-input-group-addon>
  </sb-input-group>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Invalid: Story = { args: { validation: 'error' } };

export const WithText: Story = {
  render: () => html`<sb-input-group style="max-width:24rem">
    <sb-input hide-label label="Amount" placeholder="0.00"></sb-input>
    <sb-input-group-addon><sb-input-group-text>$</sb-input-group-text></sb-input-group-addon>
    <sb-input-group-addon align="inline-end"><sb-input-group-text>USD</sb-input-group-text></sb-input-group-addon>
  </sb-input-group>`,
};

export const WithButton: Story = {
  render: () => html`<sb-input-group style="max-width:24rem">
    <input aria-label="Share link" value="https://example.com/share/42" readonly />
    <sb-input-group-addon align="inline-end">
      <sb-input-group-button size="icon-tiny" aria-label="Copy link">${copy}</sb-input-group-button>
    </sb-input-group-addon>
  </sb-input-group>`,
};

export const NativeInput: Story = {
  render: (a) => html`<sb-input-group aria-label="Website" validation=${a.validation ?? nothing} style="max-width:24rem">
    <input aria-label="Website" placeholder="example.com" />
    <sb-input-group-addon><sb-input-group-text>https://</sb-input-group-text></sb-input-group-addon>
  </sb-input-group>`,
};

export const TextareaFooter: Story = {
  render: () => html`<sb-input-group style="max-width:24rem">
    <textarea aria-label="Message" rows="3" placeholder="Write a message"></textarea>
    <sb-input-group-addon align="block-end">
      <sb-input-group-text>0 / 280</sb-input-group-text>
      <sb-input-group-button variant="primary" size="small">Send</sb-input-group-button>
    </sb-input-group-addon>
  </sb-input-group>`,
};

export const SbTextareaFooter: Story = {
  render: () => html`<sb-input-group style="max-width:24rem">
    <sb-textarea label="Message" hide-label rows="3" placeholder="Write a message"></sb-textarea>
    <sb-input-group-addon align="block-end">
      <sb-input-group-text>0 / 280</sb-input-group-text>
      <sb-input-group-button variant="primary" size="small">Send</sb-input-group-button>
    </sb-input-group-addon>
  </sb-input-group>`,
};

export const InForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<form id="demo"><sb-input-group style="max-width:24rem">
    <input name="query" aria-label="Query" value="draft" />
    <sb-input-group-addon align="inline-end"><sb-input-group-button type="submit" variant="secondary">Go</sb-input-group-button></sb-input-group-addon>
  </sb-input-group></form>`,
};

export const ButtonDisabled: Story = {
  render: () => html`<sb-input-group style="max-width:24rem">
    <input aria-label="Code" />
    <sb-input-group-addon align="inline-end"><sb-input-group-button disabled>Apply</sb-input-group-button></sb-input-group-addon>
  </sb-input-group>`,
};

export const BlockStart: Story = {
  render: () => html`<sb-input-group aria-label="Comment" style="max-width:24rem">
    <textarea aria-label="Comment" rows="2"></textarea>
    <sb-input-group-addon align="block-start"><sb-input-group-text>Comment</sb-input-group-text></sb-input-group-addon>
  </sb-input-group>`,
};
