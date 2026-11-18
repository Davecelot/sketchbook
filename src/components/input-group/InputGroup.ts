import { html, LitElement, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';

import { inputGroupStyles } from './InputGroup.styles';
import './InputGroupAddon';
import './InputGroupButton';
import './InputGroupText';

const TAG = 'sb-input-group';

// Only aria-label is forwarded: ID references don't resolve across shadow roots (SB-0009).
const FORWARDED_ARIA = ['aria-label'];

export class SbInputGroup extends LitElement {
  static override styles = inputGroupStyles;

  static override get observedAttributes() {
    return [...super.observedAttributes, ...FORWARDED_ARIA];
  }

  @property({ reflect: true }) validation: 'none' | 'error' = 'none';

  @state() private focused = false;

  @state() private block = false;

  readonly #observer = new MutationObserver(() => this.#syncBlock());

  constructor() {
    super();
    this.addEventListener('focusin', (event) => { if (event.target === this.#control()) this.focused = true; });
    this.addEventListener('focusout', (event) => { if (event.target === this.#control()) this.focused = false; });
  }

  override connectedCallback() {
    super.connectedCallback();
    this.#observer.observe(this, { subtree: true, attributes: true, attributeFilter: ['align'] });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (FORWARDED_ARIA.includes(name)) this.requestUpdate();
  }

  #control() {
    return this.querySelector<HTMLElement>(':scope > input, :scope > textarea, :scope > sb-input, :scope > sb-textarea');
  }

  // :has() can't see focus inside the control's own shadow tree, so the shell tracks it with events.
  #syncBlock = () => {
    this.block = !!this.querySelector(':scope > sb-input-group-addon[align^="block-"]');
  };

  #syncInvalid = () => {
    const control = this.#control();
    if (!control) return;
    if (this.validation === 'error') control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  };

  #onSlotChange = () => {
    this.#syncInvalid();
    this.#syncBlock();
  };

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('validation')) this.#syncInvalid();
  }

  protected override render() {
    const label = this.getAttribute('aria-label');
    return html`<div
      part="group"
      role=${label ? 'group' : nothing}
      aria-label=${label ?? nothing}
      ?data-focused=${this.focused}
      ?data-invalid=${this.validation === 'error'}
      ?data-block=${this.block}
    >
      <slot @slotchange=${this.#onSlotChange}></slot>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbInputGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbInputGroup;
  }
}
