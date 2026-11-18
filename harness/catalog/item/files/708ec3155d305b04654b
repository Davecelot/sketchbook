import { html, LitElement } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-header';

export class SbItemHeader extends LitElement {
  static override styles = itemStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemHeader);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemHeader;
  }
}
