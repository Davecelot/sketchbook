import { html, LitElement } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-footer';

export class SbItemFooter extends LitElement {
  static override styles = itemStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemFooter);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemFooter;
  }
}
