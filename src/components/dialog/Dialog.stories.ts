import type { Meta, StoryObj } from '@storybook/web-components-vite';
import type { TemplateResult } from 'lit';
import { html } from 'lit';

import contract from '../../../spec/components/dialog/contract.json';
import contractDoc from '../../../spec/components/dialog/contract.md?raw';
import { argsFrom, argTypesFrom, docsFrom } from '../../stories/contract';

type Args = { open: boolean };

const header = (title: string, description?: string) => html`<sb-dialog-header>
  <sb-dialog-title>${title}</sb-dialog-title>
  ${description ? html`<sb-dialog-description>${description}</sb-dialog-description>` : ''}
</sb-dialog-header>`;

const fields = html`<div style="display:grid;gap:16px">
  <sb-input label="Name" name="name" value="Pedro Duarte"></sb-input>
  <sb-input label="Username" name="username" value="@peduarte"></sb-input>
</div>`;

const footer = (primary: TemplateResult = html`<sb-button type="submit">Save changes</sb-button>`, cancel = 'Cancel') => html`<sb-dialog-footer>
  <sb-dialog-close><sb-button variant="tertiary">${cancel}</sb-button></sb-dialog-close>
  ${primary}
</sb-dialog-footer>`;

const dialog = (a: Partial<Args>, trigger: string, content: TemplateResult, hideClose = false) =>
  html`<sb-dialog ?open=${a.open}>
    <sb-dialog-trigger><sb-button variant="tertiary">${trigger}</sb-button></sb-dialog-trigger>
    <sb-dialog-content ?hide-close-button=${hideClose}>${content}</sb-dialog-content>
  </sb-dialog>`;

const meta: Meta<Args> = {
  title: 'Components/Dialog',
  component: 'sb-dialog',
  parameters: { docs: { description: { component: docsFrom(contractDoc) }, story: { inline: false, iframeHeight: 480 } } },
  argTypes: argTypesFrom(contract),
  args: argsFrom(contract),
  render: (a) =>
    dialog(a, 'Edit profile', html`${header('Edit profile', "Make changes to your profile here. Click save when you're done.")}${fields}${footer()}`),
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Open: Story = { args: { open: true } };

export const NoCloseButton: Story = {
  render: (a) =>
    dialog(
      a,
      'Share link',
      html`${header('Share link', 'Anyone who has this link will be able to view this.')}
        <sb-input label="Link" hide-label readonly value="https://example.com/docs/installation"></sb-input>
        <sb-dialog-footer><sb-dialog-close><sb-button variant="secondary">Close</sb-button></sb-dialog-close></sb-dialog-footer>`,
      true,
    ),
};

export const Form: Story = {
  render: (a) => {
    const submit = (e: SubmitEvent) => {
      e.preventDefault();
      ((e.currentTarget as HTMLElement).closest('sb-dialog') as HTMLElement & { open: boolean }).open = false;
    };
    return dialog(
      a,
      'New project',
      html`${header('New project', 'Name the project to create it.')}
        <form id="project-form" @submit=${submit} style="display:grid;gap:16px">
          <sb-input label="Project name" name="project" required></sb-input>
          ${footer(html`<sb-button type="submit">Create</sb-button>`)}
        </form>`,
    );
  },
};

const paragraphs = Array.from(
  { length: 12 },
  (_, i) => html`<p style="margin:0">Section ${i + 1}. These terms apply to every use of the service. Read them before you accept; the
    full text scrolls inside the dialog so the page behind stays where it was.</p>`,
);

export const LongContent: Story = {
  render: (a) =>
    dialog(
      a,
      'Read the terms',
      html`${header('Terms of service', 'Last updated November 2026.')}
        <div style="display:grid;gap:12px;font:14px/20px system-ui">${paragraphs}</div>
        ${footer(html`<sb-dialog-close><sb-button>Accept</sb-button></sb-dialog-close>`)}`,
    ),
};

export const SearchPalette: Story = {
  render: (a) => {
    const choose = (e: Event) => (((e.currentTarget as HTMLElement).closest('sb-dialog') as HTMLElement & { open: boolean }).open = false);
    // Autofocus inside a modal dialog is the APG's initial focus, not focus stolen on page load.
    /* eslint-disable lit-a11y/no-autofocus */
    return html`<sb-dialog ?open=${a.open}>
      <sb-dialog-trigger><sb-button variant="tertiary">Search documentation...</sb-button></sb-dialog-trigger>
      <sb-dialog-content aria-label="Search documentation" hide-close-button>
        <sb-command label="Search documentation" autofocus @sb-select=${choose}>
          <sb-command-input placeholder="Type a command or search..."></sb-command-input>
          <sb-command-list>
            <sb-command-empty>No results found.</sb-command-empty>
            <sb-command-group label="Suggestions">
              <sb-command-item>Calendar</sb-command-item>
              <sb-command-item>Search Emoji</sb-command-item>
              <sb-command-item>Calculator</sb-command-item>
            </sb-command-group>
            <sb-command-separator></sb-command-separator>
            <sb-command-group label="Settings">
              <sb-command-item>Profile</sb-command-item>
              <sb-command-item>Billing</sb-command-item>
              <sb-command-item>Settings</sb-command-item>
            </sb-command-group>
          </sb-command-list>
        </sb-command>
      </sb-dialog-content>
    </sb-dialog>`;
    /* eslint-enable lit-a11y/no-autofocus */
  },
};

export const Nested: Story = {
  render: (a) =>
    dialog(
      a,
      'Open settings',
      html`${header('Settings', 'Change how the workspace behaves.')}
        <sb-dialog>
          <sb-dialog-trigger><sb-button variant="tertiary">Advanced...</sb-button></sb-dialog-trigger>
          <sb-dialog-content>
            ${header('Advanced settings', 'These options affect every member.')}
            ${footer(html`<sb-dialog-close><sb-button>Done</sb-button></sb-dialog-close>`)}
          </sb-dialog-content>
        </sb-dialog>
        ${footer(html`<sb-dialog-close><sb-button>Done</sb-button></sb-dialog-close>`)}`,
    ),
};

export const Rtl: Story = {
  name: 'RTL',
  args: { open: true },
  render: (a) =>
    html`<div dir="rtl">
      ${dialog(a, 'تعديل الملف', html`${header('تعديل الملف الشخصي', 'أجرِ التغييرات هنا ثم احفظها.')}${footer(html`<sb-button>حفظ</sb-button>`, 'إلغاء')}`)}
    </div>`,
};
