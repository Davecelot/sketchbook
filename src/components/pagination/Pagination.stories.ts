import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/pagination/contract.json';
import contractDoc from '../../../spec/components/pagination/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { label: string };

const pagination = (label?: string) => html`<sb-pagination label=${label || 'pagination'}>
  <sb-pagination-content>
    <sb-pagination-item><sb-pagination-previous href="#page-1"></sb-pagination-previous></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#page-1">1</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#page-2" active>2</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#page-3">3</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-ellipsis></sb-pagination-ellipsis></sb-pagination-item>
    <sb-pagination-item><sb-pagination-next href="#page-3"></sb-pagination-next></sb-pagination-item>
  </sb-pagination-content>
</sb-pagination>`;

const meta: Meta<Args> = {
  title: 'Components/Pagination',
  component: 'sb-pagination',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: (a) => pagination(a.label),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const TranslatedLabels: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<sb-pagination label="paginación">
    <sb-pagination-content>
      <sb-pagination-item><sb-pagination-previous href="#p1" label="Ir a la página anterior">Anterior</sb-pagination-previous></sb-pagination-item>
      <sb-pagination-item><sb-pagination-link href="#p1" active>1</sb-pagination-link></sb-pagination-item>
      <sb-pagination-item><sb-pagination-link href="#p2" aria-label="Página 2">2</sb-pagination-link></sb-pagination-item>
      <sb-pagination-item><sb-pagination-link href="#all" size="medium">All</sb-pagination-link></sb-pagination-item>
      <sb-pagination-item><sb-pagination-next href="#p2" label="Ir a la página siguiente">Siguiente</sb-pagination-next></sb-pagination-item>
    </sb-pagination-content>
  </sb-pagination>`,
};
