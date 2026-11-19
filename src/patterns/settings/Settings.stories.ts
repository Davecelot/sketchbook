import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, svg } from 'lit';

import './settings.css';

// Lucide "circle-check" (ISC), decorative.
const check = html`<svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />`}</svg>`;

const keepOnPage = (event: Event) => event.preventDefault();

const actions = html`<sb-button-group class="settings__actions" aria-label="Form actions">
  <sb-button variant="tertiary" type="reset">Cancel</sb-button>
  <sb-button type="submit">Save changes</sb-button>
</sb-button-group>`;

const general = html`<form class="settings__form" aria-labelledby="general-title" @submit=${keepOnPage}>
  <sb-card>
    <sb-card-header>
      <sb-card-title><h2 id="general-title">General</h2></sb-card-title>
      <sb-card-description>Language and region apply to every workspace you belong to.</sb-card-description>
    </sb-card-header>
    <sb-card-content class="settings__fields">
      <sb-native-select label="Language" name="language" value="en">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="pt">Portuguese</option>
      </sb-native-select>
      <sb-native-select label="Time zone" name="timezone" value="utc-3" description="Used for reminders and reports.">
        <option value="utc-5">UTC−05:00</option>
        <option value="utc-3">UTC−03:00</option>
        <option value="utc">UTC</option>
      </sb-native-select>
      <sb-field-set legend="Week starts on">
        <sb-radio-group aria-label="Week starts on" name="week-start" value="monday" orientation="horizontal">
          <sb-radio-group-item value="monday" label="Monday"></sb-radio-group-item>
          <sb-radio-group-item value="sunday" label="Sunday"></sb-radio-group-item>
        </sb-radio-group>
      </sb-field-set>
      <sb-separator></sb-separator>
      <sb-textarea label="Email signature" name="signature" description="Added to messages you send from the app." rows="3"></sb-textarea>
    </sb-card-content>
    <sb-card-footer>${actions}</sb-card-footer>
  </sb-card>
</form>`;

const notifications = html`<form class="settings__form" aria-labelledby="notifications-title" @submit=${keepOnPage}>
  <sb-card>
    <sb-card-header>
      <sb-card-title><h2 id="notifications-title">Notifications</h2></sb-card-title>
      <sb-card-description>Pick what reaches your inbox.</sb-card-description>
    </sb-card-header>
    <sb-card-content class="settings__fields">
      <sb-switch name="mentions" label="Mentions" description="When someone mentions you in a comment." selected></sb-switch>
      <sb-switch name="digest" label="Weekly summary" description="A short recap every Monday."></sb-switch>
      <sb-switch name="product" label="Product news" description="New features, at most once a month."></sb-switch>
      <sb-separator></sb-separator>
      <sb-slider name="lead-time" label="Reminder lead time" description="Minutes before an event, from 0 to 60." min="0" max="60" step="5" value="15"></sb-slider>
    </sb-card-content>
    <sb-card-footer>${actions}</sb-card-footer>
  </sb-card>
</form>`;

const appearance = html`<form class="settings__form" aria-labelledby="appearance-title" @submit=${keepOnPage}>
  <sb-card>
    <sb-card-header>
      <sb-card-title><h2 id="appearance-title">Appearance</h2></sb-card-title>
      <sb-card-description>How the app looks on this device.</sb-card-description>
    </sb-card-header>
    <sb-card-content class="settings__fields">
      <sb-field-set legend="Density">
        <sb-radio-group aria-label="Density" name="density" value="comfortable">
          <sb-radio-group-item value="comfortable" label="Comfortable"></sb-radio-group-item>
          <sb-radio-group-item value="compact" label="Compact"></sb-radio-group-item>
        </sb-radio-group>
      </sb-field-set>
      <sb-switch name="motion" label="Reduce motion" description="Turns off animations that are not needed."></sb-switch>
    </sb-card-content>
    <sb-card-footer>${actions}</sb-card-footer>
  </sb-card>
</form>`;

const settings = (tab = 'general', saved = false) => html`<main class="settings">
  <header class="settings__header">
    <h1>Settings</h1>
    <p>Manage your preferences. Changes apply after you save.</p>
  </header>
  ${saved
    ? html`<sb-alert>
        ${check}
        <sb-alert-title>Changes saved</sb-alert-title>
        <sb-alert-description>Your notification settings are up to date.</sb-alert-description>
      </sb-alert>`
    : nothing}
  <sb-tabs value=${tab} class="settings__tabs">
    <sb-tabs-list aria-label="Settings sections">
      <sb-tabs-trigger value="general">General</sb-tabs-trigger>
      <sb-tabs-trigger value="notifications">Notifications</sb-tabs-trigger>
      <sb-tabs-trigger value="appearance">Appearance</sb-tabs-trigger>
    </sb-tabs-list>
    <sb-tabs-content value="general">${general}</sb-tabs-content>
    <sb-tabs-content value="notifications">${notifications}</sb-tabs-content>
    <sb-tabs-content value="appearance">${appearance}</sb-tabs-content>
  </sb-tabs>
</main>`;

const meta: Meta = {
  title: 'Patterns/Settings',
  parameters: { docs: { description: { component: 'Group preferences by topic so people can find, change, and save them.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => settings(),
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const Notifications: Story = { render: () => settings('notifications') };

export const Saved: Story = { render: () => settings('notifications', true) };
