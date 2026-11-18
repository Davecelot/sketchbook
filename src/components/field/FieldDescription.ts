import { html, LitElement } from 'lit';

import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-description';

export class SbFieldDescription extends LitElement {
  static override styles = fieldStyles;

  protected override render() {
    return html`<p part="description"><slot></slot></p>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldDescription);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldDescription;
  }
}
