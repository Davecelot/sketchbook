import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, svg } from 'lit';

import './docs-article.css';

// Lucide "info" (ISC), decorative.
const info = html`<svg slot="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />`}</svg>`;

// A diagram drawn in currentColor so it follows the theme; the label says what it shows.
const diagram = html`<svg class="docs__diagram" viewBox="0 0 320 180" role="img" aria-label="Diagram: tokens feed components, components feed pages">
  ${svg`<g fill="none" stroke="currentColor" stroke-width="2">
    <rect x="16" y="60" width="80" height="60" rx="8" /><rect x="120" y="60" width="80" height="60" rx="8" /><rect x="224" y="60" width="80" height="60" rx="8" />
    <path d="M96 90h24M200 90h24" />
  </g>`}
</svg>`;

const sections = [
  ['install', 'Install'],
  ['first-page', 'Build a first page'],
  ['faq', 'Questions'],
];

const article = html`<div class="docs">
  <nav class="docs__contents" aria-labelledby="contents-title">
    <p id="contents-title" class="docs__contents-title">On this page</p>
    <ul>
      ${sections.map(([id, title]) => html`<li><a href=${`#${id}`}>${title}</a></li>`)}
    </ul>
  </nav>
  <main class="docs__main">
    <sb-breadcrumb>
      <sb-breadcrumb-list>
        <sb-breadcrumb-item><sb-breadcrumb-link href="#docs">Docs</sb-breadcrumb-link></sb-breadcrumb-item>
        <sb-breadcrumb-separator></sb-breadcrumb-separator>
        <sb-breadcrumb-item><sb-breadcrumb-link href="#guides">Guides</sb-breadcrumb-link></sb-breadcrumb-item>
        <sb-breadcrumb-separator></sb-breadcrumb-separator>
        <sb-breadcrumb-item><sb-breadcrumb-page>Getting started</sb-breadcrumb-page></sb-breadcrumb-item>
      </sb-breadcrumb-list>
    </sb-breadcrumb>
    <article class="docs__article">
      <sb-typography kind="h1">Getting started</sb-typography>
      <sb-typography kind="lead">Install the package, load the tokens and put your first component on a page.</sb-typography>
      <sb-aspect-ratio ratio="16/9" class="docs__media">${diagram}</sb-aspect-ratio>

      <section aria-labelledby="install">
        <sb-typography kind="h2" id="install">Install</sb-typography>
        <sb-typography kind="p">Add the package with your package manager. It brings the components and one stylesheet of tokens.</sb-typography>
        <sb-scroll-area label="Install command" class="docs__code">
          <pre><code>npm install @your-scope/design-system &amp;&amp; npx design-system init --prefix acme --with-tokens</code></pre>
          <sb-scroll-bar orientation="horizontal"></sb-scroll-bar>
        </sb-scroll-area>
        <sb-alert>
          ${info}
          <sb-alert-title>Load the tokens once</sb-alert-title>
          <sb-alert-description>Import the token stylesheet at the root of the app; every component reads from it.</sb-alert-description>
        </sb-alert>
        <sb-collapsible>
          <sb-collapsible-trigger>Show advanced options</sb-collapsible-trigger>
          <sb-collapsible-content>
            <sb-typography kind="p">Pass --verbose to see every step.</sb-typography>
          </sb-collapsible-content>
        </sb-collapsible>
      </section>

      <section aria-labelledby="first-page">
        <sb-typography kind="h2" id="first-page">Build a first page</sb-typography>
        <sb-typography kind="p">Write the markup as plain HTML. Components are custom elements, so any framework can render them.</sb-typography>
        <sb-typography kind="list">
          <li>Start from a kit that is close to what you need.</li>
          <li>Replace the sample text and data.</li>
          <li>Run the checks before you commit.</li>
        </sb-typography>
        <sb-typography kind="p">Press <sb-kbd-group><sb-kbd>Ctrl</sb-kbd><sb-kbd>K</sb-kbd></sb-kbd-group> in the docs to search them.</sb-typography>
        <sb-typography kind="blockquote">Small pages first: a sign-in form tells you more about the system than a style guide does.</sb-typography>
      </section>

      <section aria-labelledby="faq">
        <sb-typography kind="h2" id="faq">Questions</sb-typography>
        <sb-accordion selection="single" collapsible>
          <sb-accordion-item value="offline">
            <sb-accordion-trigger level="3">Does it work offline?</sb-accordion-trigger>
            <sb-accordion-content>Yes. Everything runs in the browser; nothing is fetched after the page loads.</sb-accordion-content>
          </sb-accordion-item>
          <sb-accordion-item value="colors">
            <sb-accordion-trigger level="3">Can I change the colors?</sb-accordion-trigger>
            <sb-accordion-content>Change the brand configuration and rebuild. Components pick up the new tokens.</sb-accordion-content>
          </sb-accordion-item>
        </sb-accordion>
      </section>

      <sb-separator></sb-separator>
      <sb-pagination label="Article pages">
        <sb-pagination-content>
          <sb-pagination-item><sb-pagination-previous href="#introduction">Introduction</sb-pagination-previous></sb-pagination-item>
          <sb-pagination-item><sb-pagination-next href="#theming">Theming</sb-pagination-next></sb-pagination-item>
        </sb-pagination-content>
      </sb-pagination>
    </article>
  </main>
</div>`;

const meta: Meta = {
  title: 'Patterns/Docs Article',
  parameters: { docs: { description: { component: 'Help readers follow a guide with a contents sidebar, diagram, code sample, and links to what comes next.' } }, layout: 'fullscreen', controls: { disable: true } },
  render: () => article,
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const RightToLeft: Story = { render: () => html`<sb-direction dir="rtl">${article}</sb-direction>` };
