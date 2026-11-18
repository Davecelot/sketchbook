import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/scroll-area/contract.json';
import contractDoc from '../../../spec/components/scroll-area/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { label: string };

const items = (count: number) =>
  Array.from({ length: count }, (_, i) => html`<div style="padding:8px 0;border-bottom:1px solid #d4d4d4;font:14px/20px system-ui">Entry ${i + 1}</div>`);

const meta: Meta<Args> = {
  title: 'Components/Scroll Area',
  component: 'sb-scroll-area',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Release notes' },
  render: (a) => html`<sb-scroll-area label=${a.label} style="display:block;height:200px;width:240px">${items(30)}</sb-scroll-area>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Horizontal: Story = {
  render: (a) => html`<sb-scroll-area label=${a.label} style="display:block;width:280px">
    <div style="display:flex;gap:16px;padding:8px 0 16px;font:14px/20px system-ui">
      ${Array.from({ length: 12 }, (_, i) => html`<div style="flex:none;width:96px;height:80px;border:1px solid #737373;border-radius:8px;padding:8px">Card ${i + 1}</div>`)}
    </div>
    <sb-scroll-bar orientation="horizontal"></sb-scroll-bar>
  </sb-scroll-area>`,
};

export const BothAxes: Story = {
  render: (a) => html`<sb-scroll-area label=${a.label} style="display:block;height:160px;width:240px">
    <div style="width:520px;font:14px/20px system-ui">${items(20)}</div>
    <sb-scroll-bar orientation="vertical"></sb-scroll-bar>
    <sb-scroll-bar orientation="horizontal"></sb-scroll-bar>
  </sb-scroll-area>`,
};

export const NothingToScroll: Story = {
  render: (a) => html`<sb-scroll-area label=${a.label} style="display:block;height:200px;width:240px">${items(3)}</sb-scroll-area>`,
};
