import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contractDoc from '../../../spec/components/table/contract.md?raw';
import { docsFrom } from '../../stories/contract';

type Args = { selectedRow: string };

const rows = [
  ['ORD-1001', 'Paid', 'Card', '$250.00'],
  ['ORD-1002', 'Pending', 'Transfer', '$150.00'],
  ['ORD-1003', 'Paid', 'Cash', '$350.00'],
  ['ORD-1004', 'Failed', 'Card', '$450.00'],
];

const table = (selectedRow = '') => html`<sb-table style="width:560px">
  <sb-table-caption>Recent orders</sb-table-caption>
  <sb-table-header>
    <sb-table-row>
      <sb-table-head>Order</sb-table-head>
      <sb-table-head>Status</sb-table-head>
      <sb-table-head>Method</sb-table-head>
      <sb-table-head style="text-align:end">Amount</sb-table-head>
    </sb-table-row>
  </sb-table-header>
  <sb-table-body>
    ${rows.map(
      ([order, status, method, amount]) => html`<sb-table-row ?selected=${order === selectedRow}>
        <sb-table-cell>${order}</sb-table-cell><sb-table-cell>${status}</sb-table-cell><sb-table-cell>${method}</sb-table-cell>
        <sb-table-cell style="text-align:end">${amount}</sb-table-cell>
      </sb-table-row>`,
    )}
  </sb-table-body>
  <sb-table-footer>
    <sb-table-row>
      <sb-table-cell>Total</sb-table-cell><sb-table-cell></sb-table-cell><sb-table-cell></sb-table-cell>
      <sb-table-cell style="text-align:end">$1,200.00</sb-table-cell>
    </sb-table-row>
  </sb-table-footer>
</sb-table>`;

const meta: Meta<Args> = {
  title: 'Components/Table',
  component: 'sb-table',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: { selectedRow: { control: 'select', options: ['', ...rows.map((r) => r[0])], description: 'Marks that row as selected (sb-table-row selected).' } },
  args: { selectedRow: '' },
  render: (a) => table(a.selectedRow),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const SelectedRow: Story = { args: { selectedRow: 'ORD-1002' } };

export const WideInScrollArea: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<sb-scroll-area label="Recent orders" style="max-width:320px">
    ${table()}
    <sb-scroll-bar orientation="horizontal"></sb-scroll-bar>
  </sb-scroll-area>`,
};

export const LabelledByAttribute: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<sb-table aria-label="Stock levels" style="width:360px">
    <sb-table-header><sb-table-row><sb-table-head>Item</sb-table-head><sb-table-head>Units</sb-table-head></sb-table-row></sb-table-header>
    <sb-table-body><sb-table-row><sb-table-cell>Widget</sb-table-cell><sb-table-cell>12</sb-table-cell></sb-table-row></sb-table-body>
  </sb-table>`,
};
