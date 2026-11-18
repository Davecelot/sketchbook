import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing } from 'lit';

import contract from '../../../spec/components/field/contract.json';
import contractDoc from '../../../spec/components/field/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { orientation: string; validation: string };

const meta: Meta<Args> = {
  title: 'Components/Field',
  component: 'sb-field',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args) },
  render: (a) => html`<sb-field orientation=${a.orientation ?? nothing} validation=${a.validation ?? nothing}>
    <sb-field-label>Email</sb-field-label>
    <input type="email" autocomplete="email" />
    <sb-field-description>We only use it to send receipts.</sb-field-description>
    <sb-field-error></sb-field-error>
  </sb-field>`,
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Invalid: Story = {
  render: () => html`<sb-field validation="error">
    <sb-field-label>Email</sb-field-label>
    <input type="email" value="not-an-email" />
    <sb-field-description>We only use it to send receipts.</sb-field-description>
    <sb-field-error>Enter an address like name@example.com.</sb-field-error>
  </sb-field>`,
};

export const Horizontal: Story = {
  render: () => html`<sb-field orientation="horizontal">
    <input type="checkbox" />
    <sb-field-content>
      <sb-field-label>Email me product news</sb-field-label>
      <sb-field-description>At most one message a month.</sb-field-description>
    </sb-field-content>
  </sb-field>`,
};

export const FieldSet: Story = {
  render: () => html`<sb-field-set legend="Notifications">
    <sb-field-description>Choose what we send you.</sb-field-description>
    <sb-field-group>
      <sb-field orientation="horizontal">
        <input type="checkbox" checked />
        <sb-field-label>Order updates</sb-field-label>
      </sb-field>
      <sb-field orientation="horizontal">
        <input type="checkbox" />
        <sb-field-label>Product news</sb-field-label>
      </sb-field>
    </sb-field-group>
  </sb-field-set>`,
};

export const WithSeparator: Story = {
  render: () => html`<sb-field-group>
    <sb-field>
      <sb-field-label>Username</sb-field-label>
      <input type="text" />
    </sb-field>
    <sb-field-separator>or</sb-field-separator>
    <sb-field>
      <sb-field-label>Email</sb-field-label>
      <input type="email" />
    </sb-field>
  </sb-field-group>`,
};

export const Plain: Story = {
  render: () => html`<sb-field-group>
    <sb-field><sb-field-label>First</sb-field-label><input type="text" /></sb-field>
    <sb-field-separator></sb-field-separator>
    <sb-field><sb-field-label>Second</sb-field-label><input type="text" /></sb-field>
  </sb-field-group>`,
};

export const ChoiceTitle: Story = {
  render: () => html`<sb-field orientation="horizontal">
    <input type="radio" name="plan" aria-labelledby="plan-title" />
    <sb-field-content>
      <sb-field-title id="plan-title">Team plan</sb-field-title>
      <sb-field-description>Shared projects and roles.</sb-field-description>
    </sb-field-content>
  </sb-field>`,
};

export const WithDsControls: Story = {
  render: () => html`<sb-field-group>
    <sb-input label="Full name" description="As it appears on your card."></sb-input>
    <sb-input label="Email" error-message="Enter a valid email address." value="nope"></sb-input>
  </sb-field-group>`,
};
