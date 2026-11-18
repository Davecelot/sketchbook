import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { cardStyles } from './Card.styles';

const TAG = 'sb-card';

export type CardSize = 'medium' | 'small';

export class SbCard extends LitElement {
  static override styles = cardStyles;

  @property({ reflect: true }) size: CardSize = 'medium';

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCard);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCard;
  }
}
