import { ContextConsumer, ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { RelinkController } from '../../controllers/relink';
import { accordionStyles } from './Accordion.styles';
import { accordionContext, accordionItemContext } from './context';

const TAG = 'sb-accordion-item';

/** One section of an accordion: a trigger and its content. */
export class SbAccordionItem extends LitElement {
  static override styles = accordionStyles;

  @property({ reflect: true }) value = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  readonly #accordion = new ContextConsumer(this, { context: accordionContext, subscribe: true });

  readonly #provider = new ContextProvider(this, { context: accordionItemContext });

  // Trigger and content point at each other: re-resolve when either is added or removed.
  constructor() {
    super();
    new RelinkController(this, {
      selector: 'sb-accordion-trigger, sb-accordion-content',
      owns: (el) => el.parentElement === this,
    });
  }

  #child = (tag: string) => () => this.querySelector<HTMLElement>(`:scope > ${tag}`);

  #warnedSpaces = false;

  // The accordion's value is space-separated, so an item value with whitespace could never be told apart.
  protected override updated() {
    if (this.#warnedSpaces || !/\s/.test(this.value)) return;
    this.#warnedSpaces = true;
    console.warn(`<${TAG}> value "${this.value}" contains whitespace. The accordion value is space-separated, so use a value without spaces.`);
  }

  protected override willUpdate(_changed: PropertyValues<this>) {
    const accordion = this.#accordion.value;
    const open = accordion?.isOpen(this.value) ?? false;
    const disabled = this.disabled || (accordion?.disabled ?? false);
    const locked = open && accordion?.selection === 'single' && !accordion.collapsible;
    this.dataset.state = open ? 'open' : 'closed';
    const current = this.#provider.value;
    if (current?.open === open && current.disabled === disabled && current.locked === locked && current.value === this.value) return;
    this.#provider.setValue(
      { value: this.value, open, disabled, locked, trigger: this.#child('sb-accordion-trigger'), content: this.#child('sb-accordion-content') },
      true,
    );
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAccordionItem);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAccordionItem;
  }
}
