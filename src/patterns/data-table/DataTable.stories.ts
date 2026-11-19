import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, svg } from 'lit';

import './data-table.css';

// Lucide "search", "users" (ISC), decorative.
const icon = (paths: unknown) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const search = icon(svg`<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />`);
const users = icon(svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />`);

const customers = [
  { name: 'Ada Example', email: 'ada@example.com', status: 'Active', plan: 'Team', seen: 'Today' },
  { name: 'Grace Sample', email: 'grace@example.com', status: 'Invited', plan: 'Team', seen: 'Never' },
  { name: 'Linus Demo', email: 'linus@example.com', status: 'Active', plan: 'Starter', seen: 'Yesterday' },
  { name: 'Mary Placeholder', email: 'mary@example.com', status: 'Paused', plan: 'Starter', seen: '3 weeks ago' },
  { name: 'Alan Testcase', email: 'alan@example.com', status: 'Invited', plan: 'Enterprise', seen: 'Never' },
  { name: 'Edsger Mock', email: 'edsger@example.com', status: 'Active', plan: 'Enterprise', seen: '2 days ago' },
];

const initials = (name: string) => name.split(' ').map((w) => w[0]).join('');
const badge = { Active: 'primary', Invited: 'secondary', Paused: 'tertiary' } as Record<string, string>;

// Listens on the page, not the document, so "/" is active only while focus is inside it (WCAG 2.1.4).
const slash = (event: KeyboardEvent) => {
  const target = event.composedPath()[0] as HTMLElement;
  if (event.key !== '/' || target.closest?.('input, textarea, select, [contenteditable]')) return;
  const field = (event.currentTarget as HTMLElement).querySelector<HTMLElement>('[data-search]');
  if (!field) return;
  event.preventDefault();
  field.focus();
};

const shown = (count: number) => `Showing ${count} of ${customers.length} customers`;

const filter = (event: Event) => {
  const value = (event as CustomEvent<{ value: string[] }>).detail.value[0] ?? 'all';
  const rows = [...document.querySelectorAll<HTMLElement>('.data-table sb-table-body sb-table-row')];
  for (const row of rows) row.hidden = value !== 'all' && row.dataset.status !== value;
  const status = document.querySelector('.data-table [role="status"]');
  if (status) status.textContent = shown(rows.filter((row) => !row.hidden).length);
};

const selectAll = (event: Event) => {
  const selected = (event.currentTarget as HTMLElement & { selected: boolean }).selected;
  for (const box of document.querySelectorAll<HTMLElement & { selected: boolean }>('.data-table sb-table-body sb-checkbox')) box.selected = selected;
};

const header = html`<header class="data-table__header">
  <div>
    <h1>Customers</h1>
    <p>Everyone with access to your workspace.</p>
  </div>
  <sb-button>Add customer</sb-button>
</header>`;

const toolbar = html`<div class="data-table__toolbar">
  <search aria-label="Customers" class="data-table__search">
    <sb-input-group>
      <sb-input data-search type="search" label="Search customers" hide-label placeholder="Search by name or email"></sb-input>
      <sb-input-group-addon>${search}</sb-input-group-addon>
    </sb-input-group>
    <p class="data-table__hint">Press <sb-kbd>/</sb-kbd> to search</p>
  </search>
  <sb-toggle-group aria-label="Status" selection="single" variant="tertiary" value="all" @change=${filter}>
    <sb-toggle-group-item value="all">All</sb-toggle-group-item>
    <sb-toggle-group-item value="Active">Active</sb-toggle-group-item>
    <sb-toggle-group-item value="Invited">Invited</sb-toggle-group-item>
  </sb-toggle-group>
</div>`;

const head = (selectable: boolean) => html`<sb-table-header>
  <sb-table-row>
    <sb-table-cell class="data-table__select"><sb-checkbox label="Select all customers" hide-label ?disabled=${!selectable} @change=${selectAll}></sb-checkbox></sb-table-cell>
    <sb-table-head>Name</sb-table-head>
    <sb-table-head>Status</sb-table-head>
    <sb-table-head>Plan</sb-table-head>
    <sb-table-head>Last seen</sb-table-head>
  </sb-table-row>
</sb-table-header>`;

const rows = html`${customers.map(
  (c) => html`<sb-table-row data-status=${c.status}>
    <sb-table-cell class="data-table__select"><sb-checkbox label=${`Select ${c.name}`} hide-label></sb-checkbox></sb-table-cell>
    <sb-table-cell>
      <span class="data-table__person">
        <sb-avatar size="small" aria-hidden="true"><sb-avatar-fallback>${initials(c.name)}</sb-avatar-fallback></sb-avatar>
        <span><span class="data-table__name">${c.name}</span><br /><span class="data-table__email">${c.email}</span></span>
      </span>
    </sb-table-cell>
    <sb-table-cell><sb-badge variant=${badge[c.status]}>${c.status}</sb-badge></sb-table-cell>
    <sb-table-cell>${c.plan}</sb-table-cell>
    <sb-table-cell>${c.seen}</sb-table-cell>
  </sb-table-row>`,
)}`;

const placeholders = html`${Array.from(
  { length: 5 },
  () => html`<sb-table-row>
    <sb-table-cell class="data-table__select"><sb-skeleton class="data-table__skeleton-box"></sb-skeleton></sb-table-cell>
    <sb-table-cell><sb-skeleton class="data-table__skeleton-wide"></sb-skeleton></sb-table-cell>
    <sb-table-cell><sb-skeleton class="data-table__skeleton"></sb-skeleton></sb-table-cell>
    <sb-table-cell><sb-skeleton class="data-table__skeleton"></sb-skeleton></sb-table-cell>
    <sb-table-cell><sb-skeleton class="data-table__skeleton"></sb-skeleton></sb-table-cell>
  </sb-table-row>`,
)}`;

const table = (loading: boolean) => html`<sb-scroll-area label="Customer list" class="data-table__scroll">
  <sb-table aria-busy=${loading ? 'true' : 'false'}>
    <sb-table-caption>Customers</sb-table-caption>
    ${head(!loading)}
    <sb-table-body>${loading ? placeholders : rows}</sb-table-body>
  </sb-table>
  <sb-scroll-bar orientation="horizontal"></sb-scroll-bar>
</sb-scroll-area>`;

const pages = html`<sb-pagination label="Customer pages">
  <sb-pagination-content>
    <sb-pagination-item><sb-pagination-previous href="#page-1"></sb-pagination-previous></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#page-1" active>1</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#page-2">2</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-link href="#page-3">3</sb-pagination-link></sb-pagination-item>
    <sb-pagination-item><sb-pagination-next href="#page-2"></sb-pagination-next></sb-pagination-item>
  </sb-pagination-content>
</sb-pagination>`;

const page = (body: unknown) => html`<main class="data-table" @keydown=${slash}>${header}${toolbar}${body}</main>`;

const meta: Meta = {
  title: 'Patterns/Data Table',
  parameters: { docs: { description: { component: 'Help people find orders, narrow the list by status, and select the rows they want to act on.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => page(html`<p role="status" class="data-table__hint">${shown(customers.length)}</p>${table(false)}${pages}`),
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const Loading: Story = { render: () => page(table(true)) };

export const Empty: Story = {
  render: () =>
    page(html`<sb-empty class="data-table__empty">
      <sb-empty-header>
        <sb-empty-media variant="icon">${users}</sb-empty-media>
        <sb-empty-title><h2>No customers yet</h2></sb-empty-title>
        <sb-empty-description>Customers you add or import show up here, with their plan and last visit.</sb-empty-description>
      </sb-empty-header>
      <sb-empty-content>
        <sb-button variant="tertiary">Import customers</sb-button>
      </sb-empty-content>
    </sb-empty>`),
};
