import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, svg } from 'lit';

import './dashboard.css';

const stats = [
  { title: 'Revenue', value: '$48,200', change: '+12%', note: 'This month' },
  { title: 'Active customers', value: '1,284', change: '+4%', note: 'Signed in this month' },
  { title: 'Open orders', value: '36', change: '−3', note: 'Waiting to ship' },
  { title: 'Refund rate', value: '1.8%', change: '+0.2%', note: 'Last 30 days' },
];

const activity = [
  { who: 'Grace Sample', initials: 'GS', what: 'Paid invoice INV-2041', when: '5 minutes ago' },
  { who: 'Linus Demo', initials: 'LD', what: 'Upgraded to the Team plan', when: '1 hour ago' },
  { who: 'Mary Placeholder', initials: 'MP', what: 'Asked for a refund', when: 'Yesterday' },
];

const orders = [
  ['ORD-1001', 'Paid', '$250.00'],
  ['ORD-1002', 'Pending', '$150.00'],
  ['ORD-1003', 'Paid', '$350.00'],
];

// A sketch of a line chart drawn with currentColor so it follows the theme; the label carries the data.
const chart = html`<svg class="dashboard__chart" viewBox="0 0 320 180" role="img" aria-label="Weekly visits: rising from 1,200 on Monday to 2,100 on Sunday">
  ${svg`<polyline fill="none" stroke="currentColor" stroke-width="3" points="10,150 60,130 110,120 160,95 210,80 260,50 310,30" />`}
</svg>`;

const statCard = (s: (typeof stats)[number], loading: boolean) => html`<sb-card size="small">
  <sb-card-header>
    <sb-card-title><h2>${s.title}</h2></sb-card-title>
    <sb-card-description>${s.note}</sb-card-description>
    ${loading ? '' : html`<sb-card-action><sb-badge variant="secondary">${s.change}</sb-badge></sb-card-action>`}
  </sb-card-header>
  <sb-card-content>${loading ? html`<sb-skeleton class="dashboard__value-placeholder"></sb-skeleton>` : html`<p class="dashboard__value">${s.value}</p>`}</sb-card-content>
</sb-card>`;

const overview = (loading: boolean) => html`<div class="dashboard__grid">
  ${stats.map((s) => statCard(s, loading))}
  <sb-card class="dashboard__wide">
    <sb-card-header>
      <sb-card-title><h2>Quarterly goal</h2></sb-card-title>
      <sb-card-description>$136,000 of $200,000</sb-card-description>
    </sb-card-header>
    <sb-card-content><sb-progress label="Quarterly goal" value="68"></sb-progress></sb-card-content>
  </sb-card>
  <sb-card class="dashboard__wide">
    <sb-card-header>
      <sb-card-title><h2>Visits</h2></sb-card-title>
      <sb-card-description>Last seven days</sb-card-description>
    </sb-card-header>
    <sb-card-content><sb-aspect-ratio ratio="16/9">${loading ? html`<sb-skeleton class="dashboard__fill"></sb-skeleton>` : chart}</sb-aspect-ratio></sb-card-content>
  </sb-card>
  <sb-card class="dashboard__wide">
    <sb-card-header>
      <sb-card-title><h2>Recent activity</h2></sb-card-title>
    </sb-card-header>
    <sb-card-content>
      ${loading
        ? html`<sb-spinner label="Loading activity" decorative></sb-spinner>`
        : html`<sb-item-group>
            ${activity.map(
              (a, i) => html`${i ? html`<sb-item-separator></sb-item-separator>` : ''}
                <sb-item size="small">
                  <sb-item-media><sb-avatar size="small" aria-hidden="true"><sb-avatar-fallback>${a.initials}</sb-avatar-fallback></sb-avatar></sb-item-media>
                  <sb-item-content>
                    <sb-item-title>${a.who}</sb-item-title>
                    <sb-item-description>${a.what}, ${a.when}</sb-item-description>
                  </sb-item-content>
                </sb-item>`,
            )}
          </sb-item-group>`}
    </sb-card-content>
  </sb-card>
  <sb-card class="dashboard__wide">
    <sb-card-header>
      <sb-card-title><h2>Recent orders</h2></sb-card-title>
    </sb-card-header>
    <sb-card-content>
      <sb-table aria-label="Recent orders" aria-busy=${loading ? 'true' : 'false'}>
        <sb-table-header><sb-table-row><sb-table-head>Order</sb-table-head><sb-table-head>Status</sb-table-head><sb-table-head class="dashboard__amount">Amount</sb-table-head></sb-table-row></sb-table-header>
        <sb-table-body>
          ${orders.map(
            ([id, status, amount]) => html`<sb-table-row>
              <sb-table-cell>${id}</sb-table-cell>
              <sb-table-cell><sb-badge variant=${status === 'Paid' ? 'primary' : 'tertiary'}>${status}</sb-badge></sb-table-cell>
              <sb-table-cell class="dashboard__amount">${loading ? html`<sb-skeleton class="dashboard__cell-placeholder"></sb-skeleton>` : amount}</sb-table-cell>
            </sb-table-row>`,
          )}
        </sb-table-body>
      </sb-table>
    </sb-card-content>
  </sb-card>
</div>`;

const dashboard = (loading = false) => html`<div class="dashboard">
  <header class="dashboard__bar">
    <p class="dashboard__product">Workspace</p>
    <sb-separator orientation="vertical"></sb-separator>
    <sb-typography kind="small">North region</sb-typography>
    <sb-avatar size="small" class="dashboard__me"><sb-avatar-fallback label="Ada Example">AE</sb-avatar-fallback></sb-avatar>
  </header>
  <main class="dashboard__main">
    <div class="dashboard__title">
      <h1>Overview</h1>
      ${loading ? html`<sb-spinner label="Loading the overview"></sb-spinner>` : ''}
      <sb-button variant="tertiary">Export</sb-button>
    </div>
    <sb-tabs value="overview">
      <sb-tabs-list aria-label="Dashboard views">
        <sb-tabs-trigger value="overview">Overview</sb-tabs-trigger>
        <sb-tabs-trigger value="customers">Customers</sb-tabs-trigger>
        <sb-tabs-trigger value="reports">Reports</sb-tabs-trigger>
      </sb-tabs-list>
      <sb-tabs-content value="overview" aria-busy=${loading ? 'true' : 'false'}>${overview(loading)}</sb-tabs-content>
      <sb-tabs-content value="customers"><p class="dashboard__note">Customer trends will appear here.</p></sb-tabs-content>
      <sb-tabs-content value="reports"><p class="dashboard__note">Saved reports will appear here.</p></sb-tabs-content>
    </sb-tabs>
  </main>
</div>`;

const meta: Meta = {
  title: 'Patterns/Dashboard',
  parameters: { docs: { description: { component: 'Give your team one place to check progress, review recent activity, and act on orders.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => dashboard(),
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const Loading: Story = { render: () => dashboard(true) };
