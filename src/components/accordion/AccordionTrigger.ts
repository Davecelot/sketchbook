import { ContextConsumer } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { accordionStyles } from './Accordion.styles';
import { accordionContext, accordionItemContext } from './context';

const TAG = 'sb-accordion-trigger';

/** The heading and button that toggle an accordion item. */
export class SbAccordionTrigger extends LitElement {
  static override styles = accordionStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property({ type: Number, reflect: true }) level = 3;

  readonly #item = new ContextConsumer(this, { context: accordionItemContext, subscribe: true });

  readonly #accordion = new ContextConsumer(this, { context: accordionContext, subscribe: true });

  protected override willUpdate() {
    this.dataset.state = this.#item.value?.open ? 'open' : 'closed';
  }

  protected override updated() {
    // An element reference resolves from this shadow root to the light DOM above it; an ID would not.
    const button = this.shadowRoot?.querySelector('button');
    const content = this.#item.value?.content();
    if (button && 'ariaControlsElements' in button) button.ariaControlsElements = content ? [content] : null;
  }

  // Headings run 1-6 and the page owns h1, so the level is kept within 2-6.
  get #headingLevel() {
    const level = Math.round(Number(this.level));
    return Number.isFinite(level) ? Math.min(6, Math.max(2, level)) : 3;
  }

  #toggle = () => {
    const item = this.#item.value;
    if (item && !item.disabled) this.#accordion.value?.toggle(item.value);
  };

  protected override render() {
    const item = this.#item.value;
    return html`<div part="header" role="heading" aria-level=${this.#headingLevel}>
      <button
        part="trigger"
        type="button"
        aria-expanded=${item?.open ? 'true' : 'false'}
        aria-disabled=${item?.locked ? 'true' : nothing}
        ?disabled=${item?.disabled}
        @click=${this.#toggle}
      >
        <span part="label"><slot></slot></span>
        <svg part="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAccordionTrigger);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAccordionTrigger;
  }
}
