import { html, LitElement } from 'lit';

import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-content';

export class SbFieldContent extends LitElement {
  static override styles = fieldStyles;

  protected override render() {
    return html`<div part="content"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldContent;
  }
}
