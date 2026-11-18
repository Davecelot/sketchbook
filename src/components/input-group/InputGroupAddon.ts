import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { inputGroupStyles } from './InputGroup.styles';

const TAG = 'sb-input-group-addon';

export class SbInputGroupAddon extends LitElement {
  static override styles = inputGroupStyles;

  @property({ reflect: true }) align: 'inline-start' | 'inline-end' | 'block-start' | 'block-end' = 'inline-start';

  constructor() {
    super();
    this.addEventListener('click', this.#focusControl);
  }

  #focusControl = (event: MouseEvent) => {
    if (event.composedPath().some((el) => el instanceof HTMLElement && (el.localName === 'button' || el.localName === 'sb-input-group-button'))) return;
    this.parentElement?.querySelector<HTMLElement>(':scope > input, :scope > textarea, :scope > sb-input, :scope > sb-textarea')?.focus();
  };

  protected override render() {
    return html`<div part="addon"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbInputGroupAddon);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbInputGroupAddon;
  }
}
