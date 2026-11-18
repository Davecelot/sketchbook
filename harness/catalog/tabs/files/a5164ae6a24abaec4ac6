import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/tabs/contract.json';
import contractDoc from '../../../spec/components/tabs/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { value: string; orientation: string; activation: string; variant: string };

const tabs = (a: Partial<Args>, disabledTab = false) => html`<sb-tabs
  value=${a.value ?? ''}
  orientation=${a.orientation ?? 'horizontal'}
  activation=${a.activation ?? 'automatic'}
  style="display:block;width:400px"
>
  <sb-tabs-list variant=${a.variant ?? 'primary'} aria-label="Project sections">
    <sb-tabs-trigger value="overview">Overview</sb-tabs-trigger>
    <sb-tabs-trigger value="activity">Activity</sb-tabs-trigger>
    <sb-tabs-trigger value="settings" ?disabled=${disabledTab}>Settings</sb-tabs-trigger>
  </sb-tabs-list>
  <sb-tabs-content value="overview"><p>A summary of the project.</p></sb-tabs-content>
  <sb-tabs-content value="activity"><p>Recent changes appear here.</p></sb-tabs-content>
  <sb-tabs-content value="settings"><p>Configuration options.</p></sb-tabs-content>
</sb-tabs>`;

const listVariant = { variant: { control: 'inline-radio' as const, options: ['primary', 'line'], description: 'sb-tabs-list variant.' } };

const meta: Meta<Args> = {
  title: 'Components/Tabs',
  component: 'sb-tabs',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: { ...argTypesFrom(contract), ...listVariant },
  args: { ...(argsFrom(contract) as Args), variant: 'primary' },
  render: (a) => tabs(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Line: Story = { args: { variant: 'line', value: 'activity' } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const ManualActivation: Story = { args: { activation: 'manual' } };

export const DisabledTab: Story = { render: (a) => tabs(a, true) };

export const WithFormControl: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`<sb-tabs value="a" style="display:block;width:400px">
    <sb-tabs-list aria-label="Sections"><sb-tabs-trigger value="a">First</sb-tabs-trigger><sb-tabs-trigger value="b">Second</sb-tabs-trigger></sb-tabs-list>
    <sb-tabs-content value="a"><label>Name <input name="name" /></label></sb-tabs-content>
    <sb-tabs-content value="b"><p>Second panel.</p></sb-tabs-content>
  </sb-tabs>`,
};
