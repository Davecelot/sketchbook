import { html, LitElement } from 'lit';

import { fieldStyles } from './Field.styles';

const TAG = 'sb-field-title';

export class SbFieldTitle extends LitElement {
  static override styles = fieldStyles;

  protected override render() {
    return html`<div part="title"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbFieldTitle);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbFieldTitle;
  }
}
