import { html, LitElement } from 'lit';

import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-separator';

export class SbFieldSeparator extends LitElement {
  static override styles = fieldStyles;

  #syncText = (event?: Event) => {
    const slot = (event?.target as HTMLSlotElement | undefined) ?? this.shadowRoot?.querySelector('slot');
    this.toggleAttribute('data-has-text', !!slot?.assignedNodes().some((node) => node.textContent?.trim()));
  };

  protected override firstUpdated() {
    this.#syncText();
  }

  protected override render() {
    return html`<div part="separator">
      <span part="line" aria-hidden="true"></span>
      <span part="text"><slot @slotchange=${this.#syncText}></slot></span>
      <span part="line" aria-hidden="true"></span>
    </div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldSeparator);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldSeparator;
  }
}
