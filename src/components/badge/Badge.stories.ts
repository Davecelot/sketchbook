import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/badge/contract.json';
import contractDoc from '../../../spec/components/badge/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { variant: string; href: string; label: string };

// Check mark, decorative.
const check = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>`;

const meta: Meta<Args> = {
  title: 'Components/Badge',
  component: 'sb-badge',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Badge' },
  render: ({ variant, href, label }) => html`<sb-badge variant=${variant} href=${href || nothing}>${label}</sb-badge>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, ({ variant }) => html`<sb-badge variant=${variant}>${variant}</sb-badge>`),
};

export const AsLink: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, ({ variant }) => html`<sb-badge variant=${variant} href="#badges">${variant}</sb-badge>`),
};

export const WithIcon: Story = {
  render: () => html`<sb-badge variant="secondary">${check}Verified</sb-badge>`,
};

export const Count: Story = {
  render: () => html`<sb-badge variant="destructive">8</sb-badge>`,
};
