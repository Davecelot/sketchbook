import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/breadcrumb/contract.json';
import contractDoc from '../../../spec/components/breadcrumb/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { label: string };

const meta: Meta<Args> = {
  title: 'Components/Breadcrumb',
  component: 'sb-breadcrumb',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: ({ label }) => html`<sb-breadcrumb label=${label}>
    <sb-breadcrumb-list>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#home">Home</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#library">Library</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-page>Reports</sb-breadcrumb-page></sb-breadcrumb-item>
    </sb-breadcrumb-list>
  </sb-breadcrumb>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithEllipsis: Story = {
  render: ({ label }) => html`<sb-breadcrumb label=${label}>
    <sb-breadcrumb-list>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#home">Home</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-ellipsis></sb-breadcrumb-ellipsis></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#archive">Archive</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-page>Annual report</sb-breadcrumb-page></sb-breadcrumb-item>
    </sb-breadcrumb-list>
  </sb-breadcrumb>`,
};

export const CustomSeparator: Story = {
  render: ({ label }) => html`<sb-breadcrumb label=${label}>
    <sb-breadcrumb-list>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#home">Home</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator>/</sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-page>Reports</sb-breadcrumb-page></sb-breadcrumb-item>
    </sb-breadcrumb-list>
  </sb-breadcrumb>`,
};

export const Wrapping: Story = {
  render: ({ label }) => html`<div style="width: 220px"><sb-breadcrumb label=${label}>
    <sb-breadcrumb-list>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#a">Organization settings</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#b">Billing and invoices</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-page>Invoice history</sb-breadcrumb-page></sb-breadcrumb-item>
    </sb-breadcrumb-list>
  </sb-breadcrumb></div>`,
};
