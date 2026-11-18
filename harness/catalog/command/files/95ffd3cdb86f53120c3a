import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { commandStyles } from './Command.styles';
import { commandContext } from './context';

const TAG = 'sb-command-item';
const SHORTCUT = 'sb-command-shortcut';

const textOf = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof Element) || node.localName === SHORTCUT) return '';
  return [...node.childNodes].map(textOf).join('');
};

export const itemValue = (item: SbCommandItem) => item.value || textOf(item).replace(/\s+/g, ' ').trim();

export const chooseItem = (item: SbCommandItem) => {
  if (item.disabled) return;
  item.dispatchEvent(new CustomEvent('sb-select', { detail: { value: itemValue(item) }, bubbles: true, composed: true }));
};

/** One option of a command list. */
export class SbCommandItem extends LitElement {
  static override styles = commandStyles;

  @property({ reflect: true }) value = '';

  @property({ reflect: true }) keywords = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  readonly #command = new ContextConsumer(this, { context: commandContext });

  constructor() {
    super();
    this.addEventListener('click', () => chooseItem(this));
    this.addEventListener('pointermove', () => {
      if (!this.disabled) this.#command.value?.activate(this);
    });
    // Focus stays in the search field while an item is clicked.
    this.addEventListener('mousedown', (e) => e.preventDefault());
  }

  protected override willUpdate() {
    this.setAttribute('role', 'option');
    if (this.disabled) this.setAttribute('aria-disabled', 'true');
    else this.removeAttribute('aria-disabled');
  }

  protected override render() {
    return html`<div part="item"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCommandItem);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCommandItem;
  }
}
