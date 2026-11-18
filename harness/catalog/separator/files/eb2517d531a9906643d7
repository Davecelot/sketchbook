import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/separator/contract.json';
import contractDoc from '../../../spec/components/separator/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { orientation: string; decorative: boolean };

const meta: Meta<Args> = {
  title: 'Components/Separator',
  component: 'sb-separator',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: ({ orientation, decorative }) => html`<div style="max-width:20rem">
    <div style="font-weight:500">Account settings</div>
    <div style="color:var(--sb-color-muted-foreground)">Manage your profile and preferences.</div>
    <sb-separator style="margin:16px 0" orientation=${orientation} decorative=${String(decorative)}></sb-separator>
    <div>Notifications</div>
  </div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Vertical: Story = {
  render: () => html`<div style="display:flex;height:20px;align-items:center;gap:16px">
    <span>Home</span><sb-separator orientation="vertical"></sb-separator><span>Reports</span><sb-separator orientation="vertical"></sb-separator><span>Settings</span>
  </div>`,
};

export const Semantic: Story = {
  render: () => html`<div style="max-width:20rem">
    <p style="margin:0 0 16px">Account</p>
    <sb-separator decorative="false"></sb-separator>
    <p style="margin:16px 0 0">Billing</p>
  </div>`,
};

export const SemanticVertical: Story = {
  render: () => html`<div style="display:flex;height:20px;align-items:center;gap:16px">
    <span>One</span><sb-separator orientation="vertical" decorative="false"></sb-separator><span>Two</span>
  </div>`,
};
