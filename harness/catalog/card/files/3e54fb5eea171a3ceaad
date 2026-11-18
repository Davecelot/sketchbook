import { html, LitElement } from 'lit';

import { cardStyles } from './Card.styles';

const TAG = 'sb-card-description';

export class SbCardDescription extends LitElement {
  static override styles = cardStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCardDescription);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCardDescription;
  }
}
