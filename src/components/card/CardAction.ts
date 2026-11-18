import { html, LitElement } from 'lit';

import { cardStyles } from './Card.styles';

const TAG = 'sb-card-action';

export class SbCardAction extends LitElement {
  static override styles = cardStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCardAction);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCardAction;
  }
}
