import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/toggle/contract.json';
import contractDoc from '../../../spec/components/toggle/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { variant: string; size: string; selected: boolean; disabled: boolean; label: string };

// Lucide "bold" (ISC), decorative.
const bold = html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" /></svg>`;

const toggle = (a: Partial<Args>, content: unknown = a.label ?? 'Bold') =>
  html`<sb-toggle variant=${a.variant ?? nothing} size=${a.size ?? nothing} ?selected=${a.selected} ?disabled=${a.disabled}>${content}</sb-toggle>`;

const meta: Meta<Args> = {
  title: 'Components/Toggle',
  component: 'sb-toggle',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Bold' },
  render: (a) => toggle(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, (c) => toggle({ variant: c.variant, size: c.size }, `${c.variant} ${c.size}`)),
};

export const Pressed: Story = { args: { selected: true } };

export const Outline: Story = { args: { variant: 'tertiary' } };

export const WithText: Story = { render: () => toggle({ variant: 'tertiary' }, html`${bold} Italic`) };

export const IconOnly: Story = {
  render: () => html`<sb-toggle aria-label="Toggle bold">${bold}</sb-toggle>`,
};

export const Disabled: Story = { args: { disabled: true } };

export const InFieldset: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<fieldset disabled style="border:0;padding:0"><sb-toggle>Locked</sb-toggle></fieldset>`,
};
