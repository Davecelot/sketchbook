import { html, LitElement } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-title';

export class SbItemTitle extends LitElement {
  static override styles = itemStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemTitle);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemTitle;
  }
}
