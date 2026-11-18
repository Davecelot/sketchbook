import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { directionStyles } from './Direction.styles';

const TAG = 'sb-direction';

/** Sets the reading direction of everything inside it. */
export class SbDirection extends LitElement {
  static override styles = directionStyles;

  // Reflects to the native dir attribute, which is what the browser applies to the subtree.
  @property({ reflect: true }) override dir: 'ltr' | 'rtl' = 'ltr';

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDirection);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDirection;
  }
}
