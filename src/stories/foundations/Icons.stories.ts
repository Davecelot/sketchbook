import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html, svg } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

import { PAGE_PARAMETERS, STYLE } from './page';

const meta: Meta = { title: 'Foundations/Icons', tags: ['!autodocs'], parameters: PAGE_PARAMETERS };
export default meta;

type Node = [string, Record<string, string>];
type Catalog = { set: string; icons: Record<string, { category: string; aliases: string[]; nodes: Node[] }> };

const files = import.meta.glob<Catalog>('../../../spec/icons.json', { eager: true, import: 'default' });
const catalog = Object.values(files)[0] ?? { set: 'lucide', icons: {} };

const markup = (nodes: Node[]) =>
  nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');

const byCategory = Object.entries(catalog.icons).reduce<Record<string, [string, Node[], string[]][]>>((acc, [name, icon]) => {
  (acc[icon.category] ??= []).push([name, icon.nodes, icon.aliases]);
  return acc;
}, {});

const searchIcon = svg`<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />`;

const filter = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const query = input.value.trim().toLowerCase();
  const root = input.closest('main')!;
  let shown = 0;
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((item) => {
    const match = !query || item.dataset.keywords!.includes(query);
    item.hidden = !match;
    if (match) shown++;
  });
  root.querySelectorAll<HTMLElement>('section').forEach((section) => {
    section.hidden = !section.querySelector('[data-icon]:not([hidden])');
  });
  root.querySelector<HTMLElement>('[data-icon-status]')!.textContent = query ? `${shown} of ${Object.keys(catalog.icons).length} icons` : '';
};

export const Page: StoryObj = {
  render: () => html`${STYLE}
    <style>
      .sbf .search { margin-block: var(--sb-space-stack-md) var(--sb-space-stack-xs); }
      .sbf .status { min-height: var(--sb-font-line-height-body); margin: 0 0 var(--sb-space-stack-sm); }
      .sbf .icons { display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: var(--sb-space-stack-sm); }
      .sbf .icons li { display: flex; flex-direction: column; align-items: center; gap: var(--sb-space-stack-xs); padding: var(--sb-space-inset-md); text-align: center; }
      .sbf .icons li[hidden] { display: none; }
      .sbf .icons svg { width: var(--sb-size-icon-xl); height: var(--sb-size-icon-xl); }
      .sbf .icons code { overflow-wrap: anywhere; }
    </style>
    <main class="sbf" data-icon-library>
      <h1>Icons</h1>
      <div data-intro>
        <p>
          The icon library: ${Object.keys(catalog.icons).length} outline icons from ${catalog.set === 'lucide' ? 'Lucide (ISC)' : catalog.set}, all drawn with the same
          stroke and sized by the <code>size.icon.*</code> tokens (see Icon sizes). Icons that carry meaning need an accessible name from the
          component that uses them; decorative ones are hidden from assistive technology.
        </p>
        <p>
          Add or remove icons with <code>sketchbook icons add|remove</code>, then draw them in the design file with
          <code>sketchbook sync icons</code>. This page reads <code>spec/icons.json</code> directly.
        </p>
      </div>
      <sb-input-group class="search" style="max-width: 24rem">
        <sb-input type="search" hide-label label="Search icons" placeholder="Search by name or alias" data-icon-search @input=${filter}></sb-input>
        <sb-input-group-addon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${searchIcon}</svg>
        </sb-input-group-addon>
      </sb-input-group>
      <p role="status" class="muted status" data-icon-status></p>
      ${Object.entries(byCategory)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
          ([category, list]) => html`<section aria-labelledby="icons-${category}">
            <h2 id="icons-${category}" style="text-transform:capitalize">${category} <span class="muted">(${list.length})</span></h2>
            <ul class="plain icons">
              ${list.map(
                ([name, nodes, aliases]) => html`<li class="box" data-icon=${name} data-keywords=${[name, ...aliases].join(' ').toLowerCase()}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${unsafeSVG(markup(nodes))}
                  </svg>
                  <code>${name}</code>
                </li>`,
              )}
            </ul>
          </section>`,
        )}
    </main>`,
};
