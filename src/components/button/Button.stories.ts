import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/button/contract.json';
import contractDoc from '../../../spec/components/button/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = {
  variant: string;
  size: string;
  type: string;
  disabled: boolean;
  loading: boolean;
  href: string;
  label: string;
};

// Lucide "plus" (ISC), decorative.
const plus = html`<svg slot="leading-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>`;

const button = (a: Partial<Args>, content: unknown = a.label ?? 'Button') =>
  html`<sb-button
    variant=${a.variant ?? nothing}
    size=${a.size ?? nothing}
    type=${a.type ?? nothing}
    href=${a.href || nothing}
    ?disabled=${a.disabled}
    ?loading=${a.loading}
    >${content}</sb-button
  >`;

const meta: Meta<Args> = {
  title: 'Components/Button',
  component: 'sb-button',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Button' },
  render: (a) => button(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () =>
    matrixOf(contract, (c) =>
      c.size?.startsWith('icon')
        ? html`<sb-button variant=${c.variant} size=${c.size} aria-label="Add">${plus}</sb-button>`
        : button({ variant: c.variant, size: c.size }, c.variant),
    ),
};

export const WithIcon: Story = { render: () => button({}, html`${plus}New item`) };

export const IconOnly: Story = {
  render: () => html`<sb-button size="icon" variant="tertiary" aria-label="Add item">${plus}</sb-button>`,
};

export const Disabled: Story = { args: { disabled: true } };

export const Loading: Story = { args: { loading: true, label: 'Saving' } };

export const AsLink: Story = { args: { href: '#docs', variant: 'link', label: 'Read the docs' } };

export const InForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<form id="demo" style="display:flex;gap:8px;align-items:center">
    <input name="note" aria-label="Note" value="draft" />
    <sb-button type="submit" name="intent" value="save">Save</sb-button>
    <sb-button type="reset" variant="tertiary">Reset</sb-button>
    <sb-button variant="ghost">Plain</sb-button>
  </form>`,
};
