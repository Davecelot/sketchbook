import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/direction/contract.json';
import contractDoc from '../../../spec/components/direction/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { dir: 'ltr' | 'rtl' };

const sample = html`<p style="margin:0 0 12px;font:14px/20px system-ui">First words come first: 1, 2, 3.</p>
  <sb-tabs value="one" style="display:block;width:320px">
    <sb-tabs-list aria-label="Sections">
      <sb-tabs-trigger value="one">One</sb-tabs-trigger>
      <sb-tabs-trigger value="two">Two</sb-tabs-trigger>
      <sb-tabs-trigger value="three">Three</sb-tabs-trigger>
    </sb-tabs-list>
    <sb-tabs-content value="one">First panel.</sb-tabs-content>
    <sb-tabs-content value="two">Second panel.</sb-tabs-content>
    <sb-tabs-content value="three">Third panel.</sb-tabs-content>
  </sb-tabs>
  <sb-pagination style="margin-top:12px">
    <sb-pagination-content>
      <sb-pagination-item><sb-pagination-previous href="#a"></sb-pagination-previous></sb-pagination-item>
      <sb-pagination-item><sb-pagination-link href="#a" active>1</sb-pagination-link></sb-pagination-item>
      <sb-pagination-item><sb-pagination-next href="#b"></sb-pagination-next></sb-pagination-item>
    </sb-pagination-content>
  </sb-pagination>`;

const meta: Meta<Args> = {
  title: 'Components/Direction',
  component: 'sb-direction',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: (a) => html`<sb-direction dir=${a.dir}>${sample}</sb-direction>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const RightToLeft: Story = { args: { dir: 'rtl' } };

export const Nested: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<sb-direction dir="rtl">
    <p id="outer" style="margin:0;font:14px/20px system-ui">Outer region</p>
    <sb-direction dir="ltr"><p id="inner" style="margin:0;font:14px/20px system-ui">Inner region</p></sb-direction>
  </sb-direction>`,
};
