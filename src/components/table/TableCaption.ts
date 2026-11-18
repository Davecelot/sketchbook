import { html, LitElement } from 'lit';

import { tableStyles } from './Table.styles';

const TAG = 'sb-table-caption';

/** The caption of a table. */
export class SbTableCaption extends LitElement {
  static override styles = tableStyles;

  protected override willUpdate() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'caption');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTableCaption);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTableCaption;
  }
}
