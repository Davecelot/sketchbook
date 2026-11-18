import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contractDoc from '../../../spec/components/kbd/contract.md?raw';
import { docsFrom } from '../../stories/contract';

type Args = { label: string };

const meta: Meta<Args> = {
  title: 'Components/Kbd',
  component: 'sb-kbd',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: { label: { control: 'text' } },
  args: { label: 'Esc' },
  render: ({ label }) => html`<sb-kbd>${label}</sb-kbd>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Group: Story = {
  render: () => html`<sb-kbd-group><sb-kbd>Ctrl</sb-kbd><sb-kbd>Shift</sb-kbd><sb-kbd>P</sb-kbd></sb-kbd-group>`,
};

export const WithSeparator: Story = {
  render: () => html`<sb-kbd-group><sb-kbd>Ctrl</sb-kbd><span>+</span><sb-kbd>B</sb-kbd></sb-kbd-group>`,
};

// Lucide "arrow-big-up" (ISC); the svg carries the accessible name.
export const WithIcon: Story = {
  render: () => html`<sb-kbd
    ><svg role="img" aria-label="Shift" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18v-6H5l7-7 7 7h-4v6H9z" /></svg
  ></sb-kbd>`,
};

export const InText: Story = {
  render: () => html`<p style="margin:0">Press <sb-kbd>Esc</sb-kbd> to close, or <sb-kbd-group><sb-kbd>Ctrl</sb-kbd><sb-kbd>K</sb-kbd></sb-kbd-group> to search.</p>`,
};
