import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/switch/contract.json';
import contractDoc from '../../../spec/components/switch/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = {
  label: string;
  hideLabel: boolean;
  description: string;
  errorMessage: string;
  size: string;
  name: string;
  value: string;
  selected: boolean;
  required: boolean;
  disabled: boolean;
};

const meta: Meta<Args> = {
  title: 'Components/Switch',
  component: 'sb-switch',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Offline mode' },
  render: (a) => html`<div style="max-width:360px"><sb-switch
    label=${a.label ?? nothing}
    ?hide-label=${a.hideLabel}
    description=${a.description || nothing}
    error-message=${a.errorMessage || nothing}
    size=${a.size ?? nothing}
    name=${a.name || nothing}
    value=${a.value || nothing}
    ?selected=${a.selected}
    ?required=${a.required}
    ?disabled=${a.disabled}
  ></sb-switch></div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Checked: Story = { args: { selected: true } };

export const Small: Story = { args: { size: 'small', selected: true } };

export const WithDescription: Story = { args: { description: 'Pauses syncing until you turn it off.' } };

export const WithError: Story = { args: { errorMessage: 'Turn this on to continue.' } };

export const Required: Story = { args: { required: true } };

export const Disabled: Story = { args: { disabled: true } };

export const DisabledChecked: Story = { args: { disabled: true, selected: true } };

export const HiddenLabel: Story = { args: { label: 'Show alerts', hideLabel: true } };

export const Sizes: Story = {
  render: () =>
    matrixOf(contract, (c) => html`<sb-switch label=${`Size ${c.size}`} size=${c.size} selected></sb-switch>`),
};
