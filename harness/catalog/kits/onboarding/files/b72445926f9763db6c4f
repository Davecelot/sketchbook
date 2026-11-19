import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, svg } from 'lit';

import './onboarding.css';

// Lucide "folder-plus", "users", "plug" (ISC), decorative.
const icon = (paths: unknown) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const folder = icon(svg`<path d="M12 10v6" /><path d="M9 13h6" /><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />`);
const team = icon(svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />`);
const plug = icon(svg`<path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />`);

const keepOnPage = (event: Event) => event.preventDefault();

const step = html`<main class="onboarding">
  <sb-card class="onboarding__card">
    <sb-card-header>
      <sb-progress label="Step 2 of 3" value="2" max="3"></sb-progress>
      <sb-card-title><h1 id="role-title">What do you work on?</h1></sb-card-title>
      <sb-card-description>We use this to suggest a first project. You can change it later.</sb-card-description>
    </sb-card-header>
    <sb-card-content>
      <form class="onboarding__form" aria-labelledby="role-title" @submit=${keepOnPage}>
        <sb-toggle-group aria-label="Your role" selection="single" variant="tertiary" spacing="2" value="designer">
          <sb-toggle-group-item value="designer">Designer</sb-toggle-group-item>
          <sb-toggle-group-item value="engineer">Engineer</sb-toggle-group-item>
          <sb-toggle-group-item value="product">Product manager</sb-toggle-group-item>
        </sb-toggle-group>
        <sb-field-set legend="What will you use it for?">
          <sb-field-group class="onboarding__choices">
            <sb-checkbox name="use" value="reviews" label="Design reviews"></sb-checkbox>
            <sb-checkbox name="use" value="handoff" label="Handoff to engineering"></sb-checkbox>
            <sb-checkbox name="use" value="docs" label="Documentation"></sb-checkbox>
          </sb-field-group>
        </sb-field-set>
        <div class="onboarding__actions">
          <sb-button variant="ghost" href="#step-1">Back</sb-button>
          <sb-button type="submit">Continue</sb-button>
        </div>
      </form>
    </sb-card-content>
  </sb-card>
</main>`;

const firstRun = html`<main class="onboarding onboarding--wide">
  <header class="onboarding__header">
    <h1>Welcome, Ada</h1>
    <p>Your workspace is ready. Start with a project, or set up the rest first.</p>
  </header>
  <sb-card>
    <sb-card-content>
      <sb-empty>
        <sb-empty-header>
          <sb-empty-media variant="icon">${folder}</sb-empty-media>
          <sb-empty-title><h2>No projects yet</h2></sb-empty-title>
          <sb-empty-description>A project holds your files, comments and reviews in one place.</sb-empty-description>
        </sb-empty-header>
        <sb-empty-content>
          <sb-button>Create project</sb-button>
          <sb-button variant="tertiary">Import files</sb-button>
        </sb-empty-content>
      </sb-empty>
    </sb-card-content>
  </sb-card>
  <section class="onboarding__next" aria-labelledby="next-title">
    <h2 id="next-title">Next steps</h2>
    <sb-item-group>
      <sb-item variant="tertiary" href="#invite">
        <sb-item-media variant="icon">${team}</sb-item-media>
        <sb-item-content>
          <sb-item-title>Invite your team</sb-item-title>
          <sb-item-description>Reviews go faster with more eyes.</sb-item-description>
        </sb-item-content>
      </sb-item>
      <sb-item variant="tertiary" href="#connect">
        <sb-item-media variant="icon">${plug}</sb-item-media>
        <sb-item-content>
          <sb-item-title>Connect a tool</sb-item-title>
          <sb-item-description>Bring in files from where you keep them.</sb-item-description>
        </sb-item-content>
      </sb-item>
    </sb-item-group>
  </section>
</main>`;

const settingUp = html`<main class="onboarding">
  <sb-card class="onboarding__card">
    <sb-card-header>
      <sb-card-title><h1>Almost there</h1></sb-card-title>
      <sb-card-description>This takes a few seconds. You can leave the page; we keep going.</sb-card-description>
    </sb-card-header>
    <sb-card-content class="onboarding__working">
      <div class="onboarding__status">
        <sb-spinner label="Setting up your workspace"></sb-spinner>
        <span aria-hidden="true">Setting up your workspace</span>
      </div>
      <div class="onboarding__placeholder">
        <sb-skeleton class="onboarding__line"></sb-skeleton>
        <sb-skeleton class="onboarding__line onboarding__line--short"></sb-skeleton>
        <sb-skeleton class="onboarding__line"></sb-skeleton>
      </div>
    </sb-card-content>
  </sb-card>
</main>`;

const meta: Meta = {
  title: 'Patterns/Onboarding',
  parameters: { docs: { description: { component: 'Guide someone through their first setup, then show what to do in an empty workspace.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => step,
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const FirstRun: Story = { render: () => firstRun };

export const SettingUp: Story = { render: () => settingUp };
