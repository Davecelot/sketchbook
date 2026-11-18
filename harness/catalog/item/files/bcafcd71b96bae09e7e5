import { html, LitElement } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-description';

export class SbItemDescription extends LitElement {
  static override styles = itemStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemDescription);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemDescription;
  }
}
