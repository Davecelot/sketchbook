import { html, LitElement } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-group';

export class SbItemGroup extends LitElement {
  static override styles = itemStyles;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'list');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemGroup;
  }
}
