import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';

import contractDoc from '../../../spec/components/empty/contract.md?raw';
import { docsFrom } from '../../stories/contract';

// Lucide "folder-code" (ISC), decorative.
const folder = html`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10.5 8 13l2 2.5" /><path d="m14 10.5 2 2.5-2 2.5" /><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" /></svg>`;

const meta: Meta = {
  title: 'Components/Empty',
  component: 'sb-empty',
  parameters: { docs: { description: { component: docsFrom(contractDoc) } } },
  render: () => html`<sb-empty>
    <sb-empty-header>
      <sb-empty-media variant="icon">${folder}</sb-empty-media>
      <sb-empty-title>No reports yet</sb-empty-title>
      <sb-empty-description>Reports you create will be listed here. Create the first one to begin.</sb-empty-description>
    </sb-empty-header>
    <sb-empty-content>
      <sb-button>Create report</sb-button>
      <sb-button variant="tertiary">Import report</sb-button>
    </sb-empty-content>
  </sb-empty>`,
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const Outline: Story = {
  render: () => html`<sb-empty style="border: 1px dashed var(--sb-color-border)">
    <sb-empty-header>
      <sb-empty-media variant="icon">${folder}</sb-empty-media>
      <sb-empty-title>The archive is empty</sb-empty-title>
      <sb-empty-description>Add files to keep them in one place.</sb-empty-description>
    </sb-empty-header>
    <sb-empty-content><sb-button variant="tertiary" size="small">Add files</sb-button></sb-empty-content>
  </sb-empty>`,
};

export const DefaultMedia: Story = {
  render: () => html`<sb-empty>
    <sb-empty-header>
      <sb-empty-media>${folder}</sb-empty-media>
      <sb-empty-title>Nothing matches</sb-empty-title>
      <sb-empty-description>Change the search terms. <a href="#clear">Clear filters</a></sb-empty-description>
    </sb-empty-header>
  </sb-empty>`,
};

export const TitleOnly: Story = {
  render: () => html`<sb-empty><sb-empty-header><sb-empty-title>Nothing here</sb-empty-title></sb-empty-header></sb-empty>`,
};
