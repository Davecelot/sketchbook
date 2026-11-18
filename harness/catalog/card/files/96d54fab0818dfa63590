import { html, LitElement } from 'lit';

import { cardStyles } from './Card.styles';

const TAG = 'sb-card-footer';

export class SbCardFooter extends LitElement {
  static override styles = cardStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCardFooter);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCardFooter;
  }
}
