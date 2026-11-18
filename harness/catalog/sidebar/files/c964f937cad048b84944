import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contract from '../../../spec/components/sidebar/contract.json';
import contractDoc from '../../../spec/components/sidebar/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { label: string; collapsible: 'offcanvas' | 'none'; expanded: boolean };

// Lucide "house" and "book-open" (ISC), decorative.
const house = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>`;
const book = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></svg>`;

type Text = { header: string; footer: string; groups: [string, [string, string][]][]; title: string; body: string };

const en: Text = {
  header: 'Sketchbook',
  footer: 'Version 0.1.0',
  groups: [
    ['Getting started', [['Introduction', '#introduction'], ['Installation', '#installation']]],
    ['Components', [['Button', '#button'], ['Card', '#card'], ['Dialog', '#dialog'], ['Sidebar', '#sidebar']]],
  ],
  title: 'Introduction',
  body: 'A first draft of a design system: tokens, components and the harness that checks them.',
};

const ar: Text = {
  header: 'سكتشبوك',
  footer: 'الإصدار 0.1.0',
  groups: [
    ['البداية', [['مقدمة', '#introduction'], ['التثبيت', '#installation']]],
    ['المكونات', [['زر', '#button'], ['بطاقة', '#card']]],
  ],
  title: 'مقدمة',
  body: 'مسودة أولى لنظام تصميم.',
};

const layout = (a: Partial<Args>, t: Text = en) => html`<sb-sidebar-provider .expanded=${a.expanded ?? true}>
  <sb-sidebar label=${a.label ?? 'Documentation'} collapsible=${a.collapsible ?? 'offcanvas'}>
    <sb-sidebar-header><strong>${t.header}</strong></sb-sidebar-header>
    <sb-sidebar-content>
      ${t.groups.map(
        ([name, items], g) => html`<sb-sidebar-group>
          <sb-sidebar-group-label>${name}</sb-sidebar-group-label>
          <sb-sidebar-menu>
            ${items.map(
              ([text, href], i) => html`<sb-sidebar-menu-item>
                <sb-sidebar-menu-button href=${href} ?active=${g === 0 && i === 0}>${g === 0 ? (i === 0 ? house : book) : ''}${text}</sb-sidebar-menu-button>
              </sb-sidebar-menu-item>`,
            )}
          </sb-sidebar-menu>
        </sb-sidebar-group>`,
      )}
    </sb-sidebar-content>
    <sb-sidebar-footer><small>${t.footer}</small></sb-sidebar-footer>
  </sb-sidebar>
  <main style="padding:16px;display:grid;gap:16px;align-content:start">
    <header style="display:flex;align-items:center;gap:8px">
      <sb-sidebar-trigger></sb-sidebar-trigger>
      <h1 style="margin:0;font-size:20px">${t.title}</h1>
    </header>
    <p style="margin:0">${t.body}</p>
    <a href="#top" style="color:inherit">Back to top</a>
  </main>
</sb-sidebar-provider>`;

const meta: Meta<Args> = {
  title: 'Components/Sidebar',
  component: 'sb-sidebar',
  parameters: { layout: 'fullscreen', docs: { description: { component: docsFrom(contractDoc) }, story: { inline: false, iframeHeight: 480 } } },
  argTypes: { ...argTypesFrom(contract), expanded: { control: 'boolean', description: 'Provider: whether the panel is shown on wide viewports.' } },
  args: { ...(argsFrom(contract) as Args), label: 'Documentation', expanded: true },
  render: (a) => layout(a),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Collapsed: Story = { args: { expanded: false } };

export const NotCollapsible: Story = { args: { collapsible: 'none' } };

export const NarrowDrawer: Story = { name: 'Narrow drawer', globals: { viewport: { value: 'mobile2', isRotated: false } } };

export const Rtl: Story = {
  name: 'RTL',
  render: (a) => html`<div dir="rtl" lang="ar">${layout({ ...a, label: 'التوثيق' }, ar)}</div>`,
};

export const Dark: Story = { globals: { theme: 'dark' } };
