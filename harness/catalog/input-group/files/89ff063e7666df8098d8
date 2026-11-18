import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import '../button/Button';
import { inputGroupStyles } from './InputGroup.styles';

const TAG = 'sb-input-group-button';

const FORWARDED_ARIA = ['aria-label'];

export class SbInputGroupButton extends LitElement {
  static formAssociated = true;
  static override styles = inputGroupStyles;

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property({ reflect: true }) variant: 'ghost' | 'primary' | 'tertiary' | 'secondary' = 'ghost';

  @property({ reflect: true }) size: 'tiny' | 'small' | 'icon-tiny' | 'icon-small' = 'tiny';

  @property() type: 'button' | 'submit' | 'reset' = 'button';

  @property({ type: Boolean, reflect: true }) disabled = false;

  readonly #internals = this.attachInternals();

  // The inner sb-button reads its own light DOM for a name, which only holds this slot: pass the text on as the name.
  @state() private text = '';

  // Editing a text node in place changes no slot assignment, so slotchange alone misses it.
  readonly #observer = new MutationObserver(() => this.#syncText());

  override connectedCallback() {
    super.connectedCallback();
    this.#observer.observe(this, { childList: true, characterData: true, subtree: true });
    this.#syncText();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  // The inner sb-button sits in this shadow root, outside the page's form: submit and reset are done here.
  #handleClick = () => {
    if (this.disabled) return;
    const form = this.#internals.form;
    if (this.type === 'submit') form?.requestSubmit();
    else if (this.type === 'reset') form?.reset();
  };

  #syncText = () => {
    this.text = this.textContent?.trim() ?? '';
  };

  protected override render() {
    return html`<sb-button
      part="button"
      variant=${this.variant}
      size=${this.size}
      type="button"
      @click=${this.#handleClick}
      ?disabled=${this.disabled}
      aria-label=${this.getAttribute('aria-label') ?? (this.text || nothing)}
      ><slot @slotchange=${this.#syncText}></slot
    ></sb-button>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbInputGroupButton);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbInputGroupButton;
  }
}
