import { ContextConsumer } from '@lit/context';
import { html, LitElement, nothing } from 'lit';

import { collapsibleStyles } from './Collapsible.styles';
import { collapsibleContext } from './context';

const TAG = 'sb-collapsible-trigger';

// Only aria-label is forwarded: ID references don't resolve across shadow roots (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

/** The button that toggles its collapsible. */
export class SbCollapsibleTrigger extends LitElement {
  static override styles = collapsibleStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  readonly #state = new ContextConsumer(this, { context: collapsibleContext, subscribe: true });

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  protected override updated() {
    // An element reference resolves from this shadow root to the light DOM above it; an ID would not.
    const button = this.shadowRoot?.querySelector('button');
    const content = this.#state.value?.content();
    if (button && 'ariaControlsElements' in button) button.ariaControlsElements = content ? [content] : null;
  }

  protected override render() {
    const state = this.#state.value;
    return html`<button
      part="trigger"
      type="button"
      aria-expanded=${state?.expanded ? 'true' : 'false'}
      aria-label=${this.getAttribute('aria-label') ?? nothing}
      ?disabled=${state?.disabled}
      @click=${() => state?.toggle()}
    >
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCollapsibleTrigger);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCollapsibleTrigger;
  }
}
