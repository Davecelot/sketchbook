import { html, LitElement } from 'lit';

import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-error';

export class SbFieldError extends LitElement {
  static override styles = fieldStyles;

  #syncEmpty = (event?: Event) => {
    const slot = (event?.target as HTMLSlotElement | undefined) ?? this.shadowRoot?.querySelector('slot');
    this.toggleAttribute('data-empty', !slot?.assignedNodes().some((node) => node.textContent?.trim()));
  };

  protected override firstUpdated() {
    this.#syncEmpty();
  }

  protected override render() {
    return html`<div part="error" role="alert"><slot @slotchange=${this.#syncEmpty}></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldError);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldError;
  }
}
