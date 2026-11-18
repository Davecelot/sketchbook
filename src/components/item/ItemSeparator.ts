import { LitElement, nothing } from 'lit';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-separator';

export class SbItemSeparator extends LitElement {
  static override styles = itemStyles;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
  }

  protected override render() {
    return nothing;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemSeparator);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemSeparator;
  }
}
