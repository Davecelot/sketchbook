import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/checkbox/contract.json';
import contractDoc from '../../../spec/components/checkbox/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = {
  label: string;
  hideLabel: boolean;
  description: string;
  errorMessage: string;
  name: string;
  value: string;
  selected: boolean;
  indeterminate: boolean;
  required: boolean;
  disabled: boolean;
};

const meta: Meta<Args> = {
  title: 'Components/Checkbox',
  component: 'sb-checkbox',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Send me product updates' },
  render: (a) => html`<div style="max-width:360px"><sb-checkbox
    label=${a.label ?? nothing}
    ?hide-label=${a.hideLabel}
    description=${a.description || nothing}
    error-message=${a.errorMessage || nothing}
    name=${a.name || nothing}
    value=${a.value || nothing}
    ?selected=${a.selected}
    ?indeterminate=${a.indeterminate}
    ?required=${a.required}
    ?disabled=${a.disabled}
  ></sb-checkbox></div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Checked: Story = { args: { selected: true } };

export const Indeterminate: Story = { args: { label: 'Select all', indeterminate: true } };

export const WithDescription: Story = {
  args: { description: 'You can unsubscribe at any time.' },
};

export const WithError: Story = { args: { errorMessage: 'Select this option to continue.' } };

export const Required: Story = { args: { required: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledChecked: Story = { args: { disabled: true, selected: true } };

export const HiddenLabel: Story = { args: { label: 'Select row 3', hideLabel: true } };
