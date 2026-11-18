import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { itemStyles } from './Item.styles';

const TAG = 'sb-item-media';

export type ItemMediaVariant = 'primary' | 'icon' | 'image';

export class SbItemMedia extends LitElement {
  static override styles = itemStyles;

  @property({ reflect: true }) variant: ItemMediaVariant = 'primary';

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbItemMedia);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbItemMedia;
  }
}
