import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/slider/contract.json';
import contractDoc from '../../../spec/components/slider/contract.md?raw';
import { argsFrom, argTypesFrom, matrixOf, docsFrom } from '../../stories/contract';

type Args = {
  label: string;
  hideLabel: boolean;
  description: string;
  errorMessage: string;
  name: string;
  value: string;
  min: number;
  max: number;
  step: number;
  orientation: string;
  disabled: boolean;
};

const slider = (a: Partial<Args>) => html`<sb-slider
  label=${a.label ?? nothing}
  ?hide-label=${a.hideLabel}
  description=${a.description || nothing}
  error-message=${a.errorMessage || nothing}
  name=${a.name || nothing}
  value=${a.value || nothing}
  min=${a.min ?? nothing}
  max=${a.max ?? nothing}
  step=${a.step ?? nothing}
  orientation=${a.orientation ?? nothing}
  ?disabled=${a.disabled}
></sb-slider>`;

const meta: Meta<Args> = {
  title: 'Components/Slider',
  component: 'sb-slider',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Volume', value: '40' },
  render: (a) => html`<div style="max-width:320px">${slider(a)}</div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Range: Story = { args: { label: 'Budget', value: '20,80' } };

export const Steps: Story = { args: { label: 'Opacity', value: '50', step: 10 } };

export const WithDescription: Story = { args: { description: 'Applies to every channel.' } };

export const WithError: Story = { args: { errorMessage: 'Choose a value below 80.' } };

export const Disabled: Story = { args: { disabled: true } };

export const HiddenLabel: Story = { args: { label: 'Brightness', hideLabel: true } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const VerticalRange: Story = { args: { orientation: 'vertical', label: 'Temperature', value: '25,75' } };

export const Orientations: Story = {
  render: () =>
    matrixOf(
      contract,
      (c) => html`<div style="width:200px"><sb-slider label=${`Level ${c.orientation}`} orientation=${c.orientation} value="30"></sb-slider></div>`,
    ),
};
