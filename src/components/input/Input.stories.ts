import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/input/contract.json';
import contractDoc from '../../../spec/components/input/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = {
  label: string;
  hideLabel: boolean;
  description: string;
  errorMessage: string;
  type: string;
  name: string;
  value: string;
  placeholder: string;
  autocomplete: string;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
};

const input = (a: Partial<Args>) => html`<sb-input
  label=${a.label ?? nothing}
  ?hide-label=${a.hideLabel}
  description=${a.description || nothing}
  error-message=${a.errorMessage || nothing}
  type=${a.type ?? nothing}
  name=${a.name || nothing}
  value=${a.value || nothing}
  placeholder=${a.placeholder || nothing}
  autocomplete=${a.autocomplete || nothing}
  ?required=${a.required}
  ?disabled=${a.disabled}
  ?readonly=${a.readOnly}
></sb-input>`;

const meta: Meta<Args> = {
  title: 'Components/Input',
  component: 'sb-input',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Email', type: 'email', placeholder: 'name@example.com', autocomplete: 'email' },
  render: (a) => html`<div style="max-width:320px">${input(a)}</div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = { args: { description: 'We only use it for receipts.' } };

export const WithError: Story = { args: { value: 'name@', errorMessage: 'Enter an email like name@example.com.' } };

export const Required: Story = { args: { required: true } };

export const Disabled: Story = { args: { disabled: true, value: 'name@example.com' } };

export const Readonly: Story = { args: { readOnly: true, value: 'name@example.com' } };

export const HiddenLabel: Story = { args: { label: 'Search', hideLabel: true, type: 'search', placeholder: 'Search…', autocomplete: '' } };
