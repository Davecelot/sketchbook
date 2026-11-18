import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contractDoc from '../../../spec/components/skeleton/contract.md?raw';
import { docsFrom } from '../../stories/contract';

const meta: Meta = {
  title: 'Components/Skeleton',
  component: 'sb-skeleton',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  render: () => html`<sb-skeleton style="width:16rem;height:1rem"></sb-skeleton>`,
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const CardPlaceholder: Story = {
  render: () => html`<div aria-busy="true" style="display:flex;align-items:center;gap:16px">
    <sb-skeleton style="width:3rem;height:3rem;--sb-skeleton-radius:var(--sb-radius-full)"></sb-skeleton>
    <div style="display:grid;gap:8px">
      <sb-skeleton style="width:16rem;height:1rem"></sb-skeleton>
      <sb-skeleton style="width:12rem;height:1rem"></sb-skeleton>
    </div>
  </div>`,
};
