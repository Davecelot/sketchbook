import { html, LitElement } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-actions';

export class SbItemActions extends LitElement {
  static override styles = itemStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemActions);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemActions;
  }
}
