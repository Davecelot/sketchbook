import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/accordion/contract.json';
import contractDoc from '../../../spec/components/accordion/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { selection: string; collapsible: boolean; value: string; disabled: boolean };

const accordion = (a: Partial<Args>, extra = html``) => html`<sb-accordion
  selection=${a.selection ?? 'single'}
  ?collapsible=${a.collapsible}
  value=${a.value ?? ''}
  ?disabled=${a.disabled}
  style="display:block;width:450px"
>
  <sb-accordion-item value="item-1">
    <sb-accordion-trigger>Shipping</sb-accordion-trigger>
    <sb-accordion-content>Orders ship within two days.</sb-accordion-content>
  </sb-accordion-item>
  <sb-accordion-item value="item-2">
    <sb-accordion-trigger>Returns</sb-accordion-trigger>
    <sb-accordion-content>Returns are accepted for a month.</sb-accordion-content>
  </sb-accordion-item>
  <sb-accordion-item value="item-3">
    <sb-accordion-trigger>Warranty</sb-accordion-trigger>
    <sb-accordion-content>Coverage lasts one year.</sb-accordion-content>
  </sb-accordion-item>
  ${extra}
</sb-accordion>`;

const meta: Meta<Args> = {
  title: 'Components/Accordion',
  component: 'sb-accordion',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: (a) => accordion(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { collapsible: true } };

export const NotCollapsible: Story = { args: { value: 'item-1' } };

export const Multiple: Story = { args: { selection: 'multiple', value: 'item-1 item-3' } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledItem: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<sb-accordion selection="single" collapsible style="display:block;width:450px">
    <sb-accordion-item value="a"><sb-accordion-trigger>First</sb-accordion-trigger><sb-accordion-content>First panel.</sb-accordion-content></sb-accordion-item>
    <sb-accordion-item value="b" disabled><sb-accordion-trigger>Second (disabled)</sb-accordion-trigger><sb-accordion-content>Second panel.</sb-accordion-content></sb-accordion-item>
    <sb-accordion-item value="c"><sb-accordion-trigger level="2">Third</sb-accordion-trigger><sb-accordion-content>Third panel.</sb-accordion-content></sb-accordion-item>
  </sb-accordion>`,
};
