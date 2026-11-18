import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, svg } from 'lit';

import contract from '../../../spec/components/toggle-group/contract.json';
import contractDoc from '../../../spec/components/toggle-group/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { selection: string; variant: string; size: string; spacing: number; orientation: string; value: string; disabled: boolean };

// Lucide "bold", "italic", "underline" (ISC), decorative.
const icon = (paths: unknown) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const bold = icon(svg`<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />`);
const italic = icon(svg`<line x1="19" x2="10" y1="4" y2="4" /><line x1="14" x2="5" y1="20" y2="20" /><line x1="15" x2="9" y1="4" y2="20" />`);
const underline = icon(svg`<path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" x2="20" y1="20" y2="20" />`);

const group = (a: Partial<Args>) => html`<sb-toggle-group
  aria-label="Text formatting"
  selection=${a.selection ?? nothing}
  variant=${a.variant ?? nothing}
  size=${a.size ?? nothing}
  spacing=${a.spacing ?? nothing}
  orientation=${a.orientation ?? nothing}
  value=${a.value || nothing}
  ?disabled=${a.disabled}
>
  <sb-toggle-group-item value="bold" aria-label="Bold">${bold}</sb-toggle-group-item>
  <sb-toggle-group-item value="italic" aria-label="Italic">${italic}</sb-toggle-group-item>
  <sb-toggle-group-item value="underline" aria-label="Underline">${underline}</sb-toggle-group-item>
</sb-toggle-group>`;

const meta: Meta<Args> = {
  title: 'Components/Toggle Group',
  component: 'sb-toggle-group',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args) },
  render: (a) => group(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Multiple: Story = { args: { selection: 'multiple', value: 'bold italic' } };

export const Outline: Story = { args: { variant: 'tertiary' } };

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, (c) => group({ variant: c.variant, size: c.size })),
};

export const Spacing: Story = { args: { variant: 'tertiary', spacing: 2 } };

export const Vertical: Story = { args: { orientation: 'vertical', variant: 'tertiary' } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledItem: Story = {
  render: () => html`<sb-toggle-group aria-label="Alignment" selection="single">
    <sb-toggle-group-item value="left">Left</sb-toggle-group-item>
    <sb-toggle-group-item value="center" disabled>Center</sb-toggle-group-item>
    <sb-toggle-group-item value="right">Right</sb-toggle-group-item>
  </sb-toggle-group>`,
};

export const WithText: Story = {
  render: () => html`<sb-toggle-group aria-label="View" selection="single" variant="tertiary" value="list">
    <sb-toggle-group-item value="list">List</sb-toggle-group-item>
    <sb-toggle-group-item value="grid">Grid</sb-toggle-group-item>
  </sb-toggle-group>`,
};

export const Rtl: Story = {
  render: () => html`<div dir="rtl">${group({ variant: 'tertiary' })}</div>`,
};

export const InFieldset: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<fieldset disabled style="border:0;padding:0">${group({})}</fieldset>`,
};
