import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, svg } from 'lit';

import './form-states.css';

// Lucide "at-sign", "bold" (ISC), decorative.
const icon = (paths: unknown) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const at = icon(svg`<circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />`);
const bold = icon(svg`<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />`);

const options = html`<option value="">Choose one</option><option value="a">First option</option><option value="b">Second option</option>`;

const section = (title: string, id: string, body: unknown) => html`<section class="form-states__section" aria-labelledby=${id}>
  <h2 id=${id}>${title}</h2>
  <div class="form-states__grid">${body}</div>
</section>`;

const gallery = html`<main class="form-states">
  <header class="form-states__header">
    <h1>Form states</h1>
    <p>Every form control in its default, disabled, invalid and read-only states, side by side. Check focus rings by tabbing through.</p>
  </header>
  ${section(
    'Input',
    'input-title',
    html`<sb-input label="Default input" placeholder="Type here"></sb-input>
      <sb-input label="Disabled input" value="Cannot change" disabled></sb-input>
      <sb-input label="Invalid input" value="not-an-email" error-message="Enter an address like name@example.com."></sb-input>
      <sb-input label="Read-only input" value="Shown, not edited" readonly></sb-input>`,
  )}
  ${section(
    'Input group',
    'input-group-title',
    html`<sb-field>
        <sb-field-label>Default group</sb-field-label>
        <sb-input-group><input placeholder="handle" /><sb-input-group-addon>${at}</sb-input-group-addon></sb-input-group>
      </sb-field>
      <sb-field validation="error">
        <sb-field-label>Invalid group</sb-field-label>
        <sb-input-group validation="error"><input value="no spaces allowed" /><sb-input-group-addon>${at}</sb-input-group-addon></sb-input-group>
        <sb-field-error>Use letters, numbers and dashes.</sb-field-error>
      </sb-field>`,
  )}
  ${section(
    'Textarea',
    'textarea-title',
    html`<sb-textarea label="Default textarea" rows="2"></sb-textarea>
      <sb-textarea label="Disabled textarea" rows="2" value="Cannot change" disabled></sb-textarea>
      <sb-textarea label="Invalid textarea" rows="2" error-message="Write at least 20 characters." value="Too short"></sb-textarea>`,
  )}
  ${section(
    'Native select',
    'select-title',
    html`<sb-native-select label="Default select">${options}</sb-native-select>
      <sb-native-select label="Disabled select" disabled>${options}</sb-native-select>
      <sb-native-select label="Invalid select" error-message="Choose an option.">${options}</sb-native-select>`,
  )}
  ${section(
    'Checkbox',
    'checkbox-title',
    html`<sb-checkbox label="Default checkbox"></sb-checkbox>
      <sb-checkbox label="Checked checkbox" selected></sb-checkbox>
      <sb-checkbox label="Disabled checkbox" disabled></sb-checkbox>
      <sb-checkbox label="Invalid checkbox" error-message="Accept to continue."></sb-checkbox>`,
  )}
  ${section(
    'Radio group',
    'radio-title',
    html`<sb-radio-group aria-label="Default radio group" value="one">
        <sb-radio-group-item value="one" label="Option one"></sb-radio-group-item>
        <sb-radio-group-item value="two" label="Option two"></sb-radio-group-item>
      </sb-radio-group>
      <sb-radio-group aria-label="Disabled radio group" value="one" disabled>
        <sb-radio-group-item value="one" label="Locked one"></sb-radio-group-item>
        <sb-radio-group-item value="two" label="Locked two"></sb-radio-group-item>
      </sb-radio-group>`,
  )}
  ${section(
    'Switch',
    'switch-title',
    html`<sb-switch label="Default switch"></sb-switch>
      <sb-switch label="Checked switch" selected></sb-switch>
      <sb-switch label="Disabled switch" disabled></sb-switch>`,
  )}
  ${section(
    'Slider',
    'slider-title',
    html`<sb-slider label="Default slider" value="40"></sb-slider>
      <sb-slider label="Disabled slider" value="40" disabled></sb-slider>`,
  )}
  ${section(
    'Toggle',
    'toggle-title',
    html`<sb-toggle variant="tertiary" aria-label="Default toggle">${bold}</sb-toggle>
      <sb-toggle variant="tertiary" aria-label="Pressed toggle" selected>${bold}</sb-toggle>
      <sb-toggle variant="tertiary" aria-label="Disabled toggle" disabled>${bold}</sb-toggle>`,
  )}
  ${section(
    'Toggle group',
    'toggle-group-title',
    html`<sb-toggle-group aria-label="Default toggle group" selection="single" variant="tertiary" value="day">
        <sb-toggle-group-item value="day">Day</sb-toggle-group-item>
        <sb-toggle-group-item value="week">Week</sb-toggle-group-item>
      </sb-toggle-group>
      <sb-toggle-group aria-label="Disabled toggle group" selection="single" variant="tertiary" value="day" disabled>
        <sb-toggle-group-item value="day">Day</sb-toggle-group-item>
        <sb-toggle-group-item value="week">Week</sb-toggle-group-item>
      </sb-toggle-group>`,
  )}
  ${section(
    'Field and label',
    'field-title',
    html`<sb-field>
        <sb-field-label>Native input in a field</sb-field-label>
        <input class="form-states__native" />
        <sb-field-description>Label, description and error wire themselves to the control.</sb-field-description>
      </sb-field>
      <div class="form-states__pair">
        <sb-label for="plain-native">Label element</sb-label>
        <input id="plain-native" class="form-states__native" />
      </div>`,
  )}
</main>`;

const meta: Meta = {
  title: 'Patterns/Form States',
  parameters: { docs: { description: { component: 'Compare default, disabled, invalid, and read-only controls to check tokens, focus, and right-to-left layout.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => gallery,
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const RightToLeft: Story = { render: () => html`<sb-direction dir="rtl">${gallery}</sb-direction>` };
