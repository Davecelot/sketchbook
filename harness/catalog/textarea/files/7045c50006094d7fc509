import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/textarea/contract.json';
import contractDoc from '../../../spec/components/textarea/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = {
  label: string;
  hideLabel: boolean;
  description: string;
  errorMessage: string;
  name: string;
  value: string;
  placeholder: string;
  autocomplete: string;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
};

const textarea = (a: Partial<Args>) => html`<sb-textarea
  label=${a.label ?? nothing}
  ?hide-label=${a.hideLabel}
  description=${a.description || nothing}
  error-message=${a.errorMessage || nothing}
  name=${a.name || nothing}
  value=${a.value || nothing}
  placeholder=${a.placeholder || nothing}
  autocomplete=${a.autocomplete || nothing}
  ?required=${a.required}
  ?disabled=${a.disabled}
  ?readonly=${a.readOnly}
></sb-textarea>`;

const meta: Meta<Args> = {
  title: 'Components/Textarea',
  component: 'sb-textarea',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Message', placeholder: 'Write something…' },
  render: (a) => html`<div style="max-width:360px">${textarea(a)}</div>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const WithDescription: Story = { args: { description: 'Plain text, up to a few paragraphs.' } };

export const WithError: Story = { args: { value: 'Hi', errorMessage: 'Write at least 20 characters.' } };

export const Required: Story = { args: { required: true } };

export const Disabled: Story = { args: { disabled: true, value: 'Not editable right now.' } };

export const Readonly: Story = { args: { readOnly: true, value: 'Read only text.' } };

export const HiddenLabel: Story = { args: { label: 'Notes', hideLabel: true, placeholder: 'Notes…' } };
