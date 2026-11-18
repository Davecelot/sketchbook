import { ContextConsumer } from '@lit/context';
import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { toggleGroupContext } from './context';
import { toggleGroupStyles } from './ToggleGroup.styles';

const TAG = 'sb-toggle-group-item';

const FORWARDED_ARIA = ['aria-label'];

export class SbToggleGroupItem extends LitElement {
  static override styles = toggleGroupStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property() value: string | null = null;

  @property({ type: Boolean, reflect: true }) disabled = false;

  readonly #group = new ContextConsumer(this, { context: toggleGroupContext, subscribe: true });

  #warnedNoName = false;

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  private get pressed() {
    return this.value !== null && (this.#group.value?.value.includes(this.value) ?? false);
  }

  private get isDisabled() {
    return this.disabled || (this.#group.value?.disabled ?? false);
  }

  #handleClick = () => {
    if (this.isDisabled || this.value === null) return;
    this.#group.value?.toggle(this.value);
  };

  #warnIfNameless = () => {
    if (this.#warnedNoName || this.textContent?.trim() || this.hasAttribute('aria-label')) return;
    this.#warnedNoName = true;
    console.warn(`<${TAG}> has no accessible name. Add text, or aria-label for an icon-only item.`);
  };

  protected override firstUpdated() {
    requestAnimationFrame(this.#warnIfNameless);
  }

  protected override updated() {
    this.toggleAttribute('data-pressed', this.pressed);
  }

  protected override render() {
    const group = this.#group.value;
    return html`<button
      part="button"
      type="button"
      ?disabled=${this.isDisabled}
      aria-pressed=${this.pressed ? 'true' : 'false'}
      aria-label=${this.getAttribute('aria-label') ?? nothing}
      data-variant=${group?.variant ?? 'ghost'}
      data-size=${group?.size ?? 'medium'}
      data-orientation=${group?.orientation ?? 'horizontal'}
      ?data-joined=${group?.spacing === 0}
      @click=${this.#handleClick}
    >
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbToggleGroupItem);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbToggleGroupItem;
  }
}
