import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/avatar/contract.json';
import contractDoc from '../../../spec/components/avatar/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = { size: string };

// Inline 64px gradient portrait, so stories need no network.
const picture =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23888'/><circle cx='32' cy='26' r='12' fill='%23ddd'/><rect x='12' y='42' width='40' height='30' rx='14' fill='%23ddd'/></svg>";

const avatar = (size = 'medium', badge = false) => html`<sb-avatar size=${size}>
  <sb-avatar-image src=${picture} alt="Ada Example"></sb-avatar-image>
  <sb-avatar-fallback label="Ada Example">AE</sb-avatar-fallback>
  ${badge ? html`<sb-avatar-badge label="Online"></sb-avatar-badge>` : ''}
</sb-avatar>`;

const meta: Meta<Args> = {
  title: 'Components/Avatar',
  component: 'sb-avatar',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: ({ size }) => avatar(size),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const FallbackOnly: Story = {
  render: ({ size }) => html`<sb-avatar size=${size}>
    <sb-avatar-image src="/missing-avatar.png" alt=""></sb-avatar-image>
    <sb-avatar-fallback label="Grace Sample">GS</sb-avatar-fallback>
  </sb-avatar>`,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => matrixOf(contract, (c) => avatar(c.size, true)),
};

export const WithBadge: Story = {
  render: ({ size }) => avatar(size, true),
};

// Lucide "plus" (ISC), decorative.
const plus = html`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>`;

export const Group: Story = {
  render: ({ size }) => html`<sb-avatar-group role="group" aria-label="Project members">
    ${avatar(size)}
    <sb-avatar size=${size}><sb-avatar-fallback label="Grace Sample">GS</sb-avatar-fallback></sb-avatar>
    <sb-avatar size=${size}><sb-avatar-fallback label="Linus Demo">LD</sb-avatar-fallback></sb-avatar>
    <sb-avatar-group-count label="3 more members">+3</sb-avatar-group-count>
  </sb-avatar-group>`,
};

export const GroupWithIconCount: Story = {
  render: () => html`<sb-avatar-group>
    <sb-avatar size="large"><sb-avatar-fallback label="Grace Sample">GS</sb-avatar-fallback></sb-avatar>
    <sb-avatar-group-count label="Add member">${plus}</sb-avatar-group-count>
  </sb-avatar-group>`,
};
