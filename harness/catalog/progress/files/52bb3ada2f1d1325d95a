import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/progress/contract.json';
import contractDoc from '../../../spec/components/progress/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { value: number | null; max: number; label: string };

const progress = (a: Partial<Args>) =>
  html`<sb-progress value=${a.value ?? nothing} max=${a.max ?? nothing} label=${a.label || nothing} style="display:block;width:320px"></sb-progress>`;

const meta: Meta<Args> = {
  title: 'Components/Progress',
  component: 'sb-progress',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), value: 60, label: 'Upload progress' },
  render: (a) => progress(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Complete: Story = { args: { value: 100 } };

export const CustomMax: Story = { args: { value: 3, max: 8, label: 'Files processed' } };

export const Indeterminate: Story = {
  render: () => html`<sb-progress label="Preparing export" style="display:block;width:320px"></sb-progress>`,
};

export const NamedByText: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<div style="width:320px;font:14px/20px system-ui">
    <span id="sync-title">Syncing library</span>
    <sb-progress aria-labelledby="sync-title" value="35" style="display:block;margin-top:8px"></sb-progress>
  </div>`,
};
