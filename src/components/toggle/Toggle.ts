import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import { toggleStyles } from './Toggle.styles';

const TAG = 'sb-toggle';

// Only aria-label is forwarded: ID references don't resolve across shadow roots (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

export type ToggleVariant = 'ghost' | 'tertiary';
export type ToggleSize = 'medium' | 'small' | 'large';

export class SbToggle extends LitElement {
  static formAssociated = true;
  static override styles = toggleStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property({ reflect: true }) variant: ToggleVariant = 'ghost';

  @property({ reflect: true }) size: ToggleSize = 'medium';

  @property({ type: Boolean, reflect: true }) selected = false;

  @property({ type: Boolean, reflect: true }) disabled = false;

  // A <fieldset disabled> must not overwrite the author's disabled attribute.
  @state() private formDisabled = false;

  #warnedNoName = false;

  constructor() {
    super();
    this.attachInternals();
    this.addEventListener('click', (event) => { if (this.isDisabled) event.stopImmediatePropagation(); }, { capture: true });
  }

  override click() {
    if (this.isDisabled) return;
    this.shadowRoot?.querySelector<HTMLElement>('[part="button"]')?.click();
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }

  #handleClick = () => {
    if (this.isDisabled) return;
    this.selected = !this.selected;
    this.dispatchEvent(new CustomEvent('change', { detail: { selected: this.selected }, bubbles: true, composed: true }));
  };

  #warnIfNameless = () => {
    if (this.#warnedNoName || this.textContent?.trim() || this.hasAttribute('aria-label')) return;
    this.#warnedNoName = true;
    console.warn(`<${TAG}> has no accessible name. Add text, or aria-label for an icon-only toggle.`);
  };

  protected override firstUpdated() {
    requestAnimationFrame(this.#warnIfNameless);
  }

  protected override render() {
    return html`<button
      part="button"
      type="button"
      ?disabled=${this.isDisabled}
      aria-pressed=${this.selected ? 'true' : 'false'}
      aria-label=${this.getAttribute('aria-label') ?? nothing}
      @click=${this.#handleClick}
    >
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbToggle);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbToggle;
  }
}
