import { html, LitElement } from 'lit';

import { cardStyles } from './Card.styles';

const TAG = 'sb-card-title';

export class SbCardTitle extends LitElement {
  static override styles = cardStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCardTitle);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCardTitle;
  }
}
