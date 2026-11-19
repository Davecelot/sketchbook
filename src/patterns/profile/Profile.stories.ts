import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, nothing, svg } from 'lit';

import './profile.css';

// Inline portrait, so the story needs no network.
const picture = `data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='gray'/><circle cx='40' cy='32' r='14' fill='silver'/><rect x='14' y='52' width='52' height='36' rx='18' fill='silver'/></svg>")}`;

// Lucide "calendar", "hard-drive" (ISC), decorative.
const icon = (paths: unknown) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const calendar = icon(svg`<path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />`);
const drive = icon(svg`<line x1="22" x2="2" y1="12" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />`);

const keepOnPage = (event: Event) => event.preventDefault();

const connections = [
  { name: 'Calendar', detail: 'Shows your meetings next to tasks. Connected in March.', icon: calendar },
  { name: 'Storage', detail: 'Attach files from your drive. Connected in May.', icon: drive },
];

const profile = (errors = false) => html`<div class="profile">
  <sb-breadcrumb class="profile__crumbs">
    <sb-breadcrumb-list>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#home">Home</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-link href="#account">Account</sb-breadcrumb-link></sb-breadcrumb-item>
      <sb-breadcrumb-separator></sb-breadcrumb-separator>
      <sb-breadcrumb-item><sb-breadcrumb-page>Profile</sb-breadcrumb-page></sb-breadcrumb-item>
    </sb-breadcrumb-list>
  </sb-breadcrumb>
  <main class="profile__main">
    <header class="profile__head">
      <sb-avatar size="large">
        <sb-avatar-image src=${picture} alt="Ada Example"></sb-avatar-image>
        <sb-avatar-fallback label="Ada Example">AE</sb-avatar-fallback>
      </sb-avatar>
      <div>
        <h1>Ada Example</h1>
        <p>ada@example.com</p>
      </div>
      <sb-badge variant="secondary">Admin</sb-badge>
    </header>
    <sb-separator></sb-separator>
    <form aria-labelledby="public-title" @submit=${keepOnPage}>
      <sb-card>
        <sb-card-header>
          <sb-card-title><h2 id="public-title">Public profile</h2></sb-card-title>
          <sb-card-description>Shown to people in your workspace.</sb-card-description>
        </sb-card-header>
        <sb-card-content class="profile__fields">
          <sb-input label="Display name" name="display-name" autocomplete="name" required value=${errors ? nothing : 'Ada Example'} error-message=${errors ? 'Enter the name people see next to your comments.' : nothing}></sb-input>
          <sb-input label="Job title" name="job-title" autocomplete="organization-title" value="Platform engineer"></sb-input>
          <sb-textarea label="Bio" name="bio" rows="4" description="A sentence or two. Links are not shown." value="Builds the tools the rest of the team ships with."></sb-textarea>
        </sb-card-content>
        <sb-card-footer class="profile__actions"><sb-button type="submit">Save profile</sb-button></sb-card-footer>
      </sb-card>
    </form>
    <section aria-labelledby="connections-title">
      <sb-card>
        <sb-card-header>
          <sb-card-title><h2 id="connections-title">Connected accounts</h2></sb-card-title>
          <sb-card-description>Services that can read your workspace data.</sb-card-description>
        </sb-card-header>
        <sb-card-content>
          <sb-item-group>
            ${connections.map(
              (c, i) => html`${i ? html`<sb-item-separator></sb-item-separator>` : nothing}
                <sb-item>
                  <sb-item-media variant="icon">${c.icon}</sb-item-media>
                  <sb-item-content>
                    <sb-item-title>${c.name}</sb-item-title>
                    <sb-item-description>${c.detail}</sb-item-description>
                  </sb-item-content>
                  <sb-item-actions><sb-button variant="tertiary" size="small" aria-label=${`Disconnect ${c.name}`}>Disconnect</sb-button></sb-item-actions>
                </sb-item>`,
            )}
          </sb-item-group>
        </sb-card-content>
      </sb-card>
    </section>
  </main>
</div>`;

const meta: Meta = {
  title: 'Patterns/Profile',
  parameters: { docs: { description: { component: 'Let people update their public profile and see which services are connected.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => profile(),
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const WithErrors: Story = { render: () => profile(true) };
