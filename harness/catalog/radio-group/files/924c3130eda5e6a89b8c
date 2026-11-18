import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/radio-group/contract.json';
import contractDoc from '../../../spec/components/radio-group/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { name: string; value: string; required: boolean; disabled: boolean; orientation: string };

const items = html`
  <sb-radio-group-item value="default" label="Default"></sb-radio-group-item>
  <sb-radio-group-item value="comfortable" label="Comfortable"></sb-radio-group-item>
  <sb-radio-group-item value="compact" label="Compact"></sb-radio-group-item>
`;

const group = (a: Partial<Args>, content: unknown = items) => html`<sb-radio-group
  aria-label="Spacing"
  name=${a.name || nothing}
  value=${a.value || nothing}
  orientation=${a.orientation ?? nothing}
  ?required=${a.required}
  ?disabled=${a.disabled}
  >${content}</sb-radio-group
>`;

const meta: Meta<Args> = {
  title: 'Components/Radio Group',
  component: 'sb-radio-group',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args) },
  render: (a) => group(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Preselected: Story = { args: { value: 'comfortable' } };

export const Horizontal: Story = { args: { orientation: 'horizontal', value: 'default' } };

export const Disabled: Story = { args: { disabled: true, value: 'default' } };

export const DisabledItem: Story = {
  render: () => group({}, html`
    <sb-radio-group-item value="a" label="Available"></sb-radio-group-item>
    <sb-radio-group-item value="b" label="Sold out" disabled></sb-radio-group-item>
    <sb-radio-group-item value="c" label="Also available"></sb-radio-group-item>
  `),
};

export const InForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<form id="demo" style="display:grid;gap:12px">
    <label id="plan-label" for="plan">Plan</label>
    ${html`<sb-radio-group id="plan" aria-label="Plan" name="plan" value="pro" required>
      <sb-radio-group-item value="free" label="Free"></sb-radio-group-item>
      <sb-radio-group-item value="pro" label="Pro"></sb-radio-group-item>
      <sb-radio-group-item value="team" label="Team"></sb-radio-group-item>
    </sb-radio-group>`}
    <div style="display:flex;gap:8px">
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </div>
  </form>`,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<form id="demo" style="display:grid;gap:12px">
    ${group({ name: 'spacing', required: true })}
    <button type="submit" style="width:fit-content">Submit</button>
  </form>`,
};

export const InFieldset: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<fieldset disabled style="border:0;padding:0">${group({ name: 'spacing', value: 'compact' })}</fieldset>`,
};

export const Rtl: Story = {
  render: () => html`<div dir="rtl">${group({ value: 'default' })}</div>`,
};
