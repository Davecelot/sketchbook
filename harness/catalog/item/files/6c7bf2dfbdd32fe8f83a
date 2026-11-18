import { html, LitElement } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-content';

export class SbItemContent extends LitElement {
  static override styles = itemStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemContent;
  }
}
