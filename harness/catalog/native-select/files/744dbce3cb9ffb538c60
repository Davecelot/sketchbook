import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/native-select/contract.json';
import contractDoc from '../../../spec/components/native-select/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = {
  label: string;
  hideLabel: boolean;
  description: string;
  errorMessage: string;
  size: string;
  name: string;
  value: string;
  required: boolean;
  disabled: boolean;
};

const options = html`
  <option value="">Choose a region</option>
  <option value="north">North</option>
  <option value="south">South</option>
  <option value="east">East</option>
  <option value="west" disabled>West</option>
  <option value="central">Central</option>
`;

const select = (a: Partial<Args>) => html`<sb-native-select
  label=${a.label ?? nothing}
  ?hide-label=${a.hideLabel}
  description=${a.description || nothing}
  error-message=${a.errorMessage || nothing}
  size=${a.size ?? nothing}
  name=${a.name || nothing}
  value=${a.value || nothing}
  ?required=${a.required}
  ?disabled=${a.disabled}
  >${options}</sb-native-select
>`;

const meta: Meta<Args> = {
  title: 'Components/NativeSelect',
  component: 'sb-native-select',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Region' },
  render: (a) => html`<div style="max-width:320px">${select(a)}</div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Selected: Story = { args: { value: 'south' } };

export const WithDescription: Story = { args: { description: 'Sets the default for new entries.' } };

export const WithError: Story = { args: { errorMessage: 'Choose a region to continue.' } };

export const Required: Story = { args: { required: true } };

export const Disabled: Story = { args: { disabled: true, value: 'north' } };

export const HiddenLabel: Story = { args: { label: 'Sort by', hideLabel: true } };

export const Small: Story = { args: { size: 'small' } };

export const Groups: Story = {
  render: (a) => html`<div style="max-width:320px"><sb-native-select label=${a.label} size=${a.size}>
    <optgroup label="Europe"><option value="fr">France</option><option value="de">Germany</option></optgroup>
    <optgroup label="Asia"><option value="es">Spain</option><option value="jp" disabled>Japan</option></optgroup>
  </sb-native-select></div>`,
};

export const Sizes: Story = {
  render: () =>
    matrixOf(
      contract,
      (c) => html`<div style="width:200px"><sb-native-select label=${`Size ${c.size}`} size=${c.size}><option>One</option><option>Two</option></sb-native-select></div>`,
    ),
};
