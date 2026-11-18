import { html, LitElement } from 'lit';

import { cardStyles } from './Card.styles';

const TAG = 'sb-card-content';

export class SbCardContent extends LitElement {
  static override styles = cardStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCardContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCardContent;
  }
}
