import { html, LitElement } from 'lit';

import { emptyStyles } from './Empty.styles';

const TAG = 'sb-empty-description';

export class SbEmptyDescription extends LitElement {
  static override styles = emptyStyles;

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbEmptyDescription);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbEmptyDescription;
  }
}
