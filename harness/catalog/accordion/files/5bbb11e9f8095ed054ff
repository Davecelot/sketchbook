import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { accordionStyles } from './Accordion.styles';
import { accordionContext } from './context';

const TAG = 'sb-accordion';

export type AccordionSelection = 'single' | 'multiple';

/** A stack of headings that each reveal one section. */
export class SbAccordion extends LitElement {
  static override styles = accordionStyles;

  @property({ reflect: true }) selection: AccordionSelection = 'single';

  @property({ type: Boolean, reflect: true }) collapsible = false;

  @property({ reflect: true }) value = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  readonly #provider = new ContextProvider(this, { context: accordionContext });

  constructor() {
    super();
    this.addEventListener('keydown', this.#onKeydown);
  }

  get #values() {
    return this.value.split(/\s+/).filter(Boolean);
  }

  #triggers() {
    return [...this.querySelectorAll<HTMLElement>('sb-accordion-trigger')].filter((el) => el.closest(TAG) === this);
  }

  #button = (trigger: HTMLElement) => trigger.shadowRoot?.querySelector<HTMLButtonElement>('button');

  protected override willUpdate(changed: PropertyValues<this>) {
    if ((['selection', 'collapsible', 'value', 'disabled'] as const).some((p) => changed.has(p)) || !this.#provider.value) {
      const values = this.selection === 'multiple' ? this.#values : this.#values.slice(0, 1);
      this.#provider.setValue(
        {
          selection: this.selection,
          collapsible: this.collapsible,
          disabled: this.disabled,
          isOpen: (v) => values.includes(v),
          toggle: this.#toggle,
        },
        true,
      );
    }
  }

  #toggle = (itemValue: string) => {
    const values = this.#values;
    const isOpen = values.includes(itemValue);
    let next: string[];
    if (this.selection === 'multiple') next = isOpen ? values.filter((v) => v !== itemValue) : [...values, itemValue];
    else if (isOpen) next = this.collapsible ? [] : values;
    else next = [itemValue];
    if (next.join(' ') === values.join(' ')) return;
    this.value = next.join(' ');
    this.dispatchEvent(new CustomEvent('change', { detail: { value: next }, bubbles: true, composed: true }));
  };

  #onKeydown = (event: KeyboardEvent) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const triggers = this.#triggers().filter((el) => {
      const button = this.#button(el);
      return button && !button.disabled;
    });
    const from = triggers.findIndex((el) => event.composedPath().includes(el));
    if (from < 0) return;
    event.preventDefault();
    const last = triggers.length - 1;
    const to = event.key === 'Home' ? 0 : event.key === 'End' ? last : (from + (event.key === 'ArrowDown' ? 1 : -1) + triggers.length) % triggers.length;
    const target = triggers[to];
    if (target) this.#button(target)?.focus();
  };

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAccordion);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAccordion;
  }
}
