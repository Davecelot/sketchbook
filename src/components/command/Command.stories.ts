import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { TemplateResult } from 'lit';
import { html, render } from 'lit';
import { ref } from 'lit/directives/ref.js';

import contract from '../../../spec/components/command/contract.json';
import contractDoc from '../../../spec/components/command/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { label: string; filter: string; loop: boolean; resultsLabel: string };

const icons = {
  calendar: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v4M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>`,
  smile: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"></path></svg>`,
  calculator: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2"></rect><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"></path></svg>`,
  user: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  card: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><path d="M2 10h20"></path></svg>`,
  settings: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"></path></svg>`,
};

const frame = 'display:block;width:450px;max-width:100%;border:1px solid var(--sb-color-border);border-radius:var(--sb-radius-control)';

const command = (a: Partial<Args>, body: TemplateResult, input: TemplateResult = html`<sb-command-input placeholder="Type a command or search..."></sb-command-input>`) =>
  html`<sb-command
    label=${a.label ?? 'Search commands'}
    filter=${a.filter ?? 'auto'}
    ?loop=${a.loop ?? false}
    results-label=${a.resultsLabel ?? '{count} results'}
    style=${frame}
  >
    ${input}
    <sb-command-list>${body}</sb-command-list>
  </sb-command>`;

const groups = ({ withIcons = false, withShortcuts = false, disabled = false } = {}) => html`
  <sb-command-empty>No results found.</sb-command-empty>
  <sb-command-group label="Suggestions">
    <sb-command-item>${withIcons ? icons.calendar : ''}Calendar</sb-command-item>
    <sb-command-item keywords="emoji picker">${withIcons ? icons.smile : ''}Search Emoji</sb-command-item>
    <sb-command-item ?disabled=${disabled}>${withIcons ? icons.calculator : ''}Calculator</sb-command-item>
  </sb-command-group>
  <sb-command-separator></sb-command-separator>
  <sb-command-group label="Settings">
    <sb-command-item keywords="account user">${withIcons ? icons.user : ''}Profile${withShortcuts ? html`<sb-command-shortcut>⌘P</sb-command-shortcut>` : ''}</sb-command-item>
    <sb-command-item>${withIcons ? icons.card : ''}Billing${withShortcuts ? html`<sb-command-shortcut>⌘B</sb-command-shortcut>` : ''}</sb-command-item>
    <sb-command-item>${withIcons ? icons.settings : ''}Settings${withShortcuts ? html`<sb-command-shortcut>⌘S</sb-command-shortcut>` : ''}</sb-command-item>
  </sb-command-group>
`;

const meta: Meta<Args> = {
  title: 'Components/Command',
  component: 'sb-command',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  argTypes: argTypesFrom(contract),
  args: { ...(argsFrom(contract) as Args), label: 'Search commands' },
  render: (a) => command(a, groups()),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const GroupsAndShortcuts: Story = { render: (a) => command(a, groups({ withIcons: true, withShortcuts: true })) };

export const DisabledItem: Story = { render: (a) => command(a, groups({ withIcons: true, disabled: true })) };

export const Empty: Story = {
  render: (a) => command(a, groups(), html`<sb-command-input placeholder="Type a command or search..." value="zzz"></sb-command-input>`),
};

const pages = ['Accordion', 'Alert', 'Badge', 'Billing', 'Button', 'Calendar', 'Card', 'Checkbox'];

// Stands in for a server search: the consumer renders only the matching items on every input.
const renderResults = (list: Element, text: string) =>
  render(
    html`<sb-command-empty>No pages start with that.</sb-command-empty>
      ${pages.filter((p) => p.toLowerCase().startsWith(text.trim().toLowerCase())).map((p) => html`<sb-command-item>${p}</sb-command-item>`)}`,
    list as HTMLElement,
  );

export const ManualFilter: Story = {
  args: { filter: 'manual', label: 'Search pages' },
  render: (a) => {
    const onInput = (e: Event) => {
      const host = e.currentTarget as HTMLElement;
      renderResults(host.querySelector('sb-command-list')!, host.querySelector('sb-command-input')?.value ?? '');
    };
    return html`<sb-command label=${a.label} filter=${a.filter} ?loop=${a.loop} results-label=${a.resultsLabel} style=${frame} @input=${onInput}>
      <sb-command-input placeholder="Search pages..."></sb-command-input>
      <sb-command-list ${ref((list) => list && renderResults(list, ''))}></sb-command-list>
    </sb-command>`;
  },
};

const sections = {
  'Getting started': ['Introduction', 'Installation', 'Theming', 'Dark mode', 'Typography', 'Changelog'],
  Components: ['Accordion', 'Alert', 'Avatar', 'Badge', 'Breadcrumb', 'Button', 'Card', 'Checkbox', 'Collapsible', 'Command', 'Input', 'Kbd'],
  Foundations: ['Color', 'Spacing', 'Radius', 'Elevation', 'Motion', 'Density'],
};

export const Scrollable: Story = {
  args: { label: 'Search documentation' },
  render: (a) =>
    command(
      a,
      html`<sb-command-empty>No results found.</sb-command-empty>
        ${Object.entries(sections).map(
          ([section, items], i) => html`${i ? html`<sb-command-separator></sb-command-separator>` : ''}
            <sb-command-group label=${section}>${items.map((item) => html`<sb-command-item keywords=${section}>${item}</sb-command-item>`)}</sb-command-group>`,
        )}`,
      html`<sb-command-input placeholder="Search documentation..."></sb-command-input>`,
    ),
};

export const InADialog: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const open = (e: Event) => ((e.currentTarget as HTMLElement).nextElementSibling as HTMLDialogElement).showModal();
    const close = (e: Event) => (e.currentTarget as HTMLDialogElement).close();
    return html`<button type="button" @click=${open}>Open command palette</button>
      <dialog aria-label="Command palette" style="padding:0;border:0;width:450px;background:transparent" @sb-select=${close}>
        <sb-command label="Search commands">
          <sb-command-input placeholder="Type a command or search..."></sb-command-input>
          <sb-command-list>${groups({ withIcons: true, withShortcuts: true })}</sb-command-list>
        </sb-command>
      </dialog>`;
  },
};

export const Rtl: Story = {
  name: 'RTL',
  render: (a) => html`<div dir="rtl">${command(a, groups({ withIcons: true, withShortcuts: true }))}</div>`,
};
