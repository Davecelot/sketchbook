import { html, LitElement } from 'lit';

import { tableStyles } from './Table.styles';

const TAG = 'sb-table-cell';

/** A data cell. */
export class SbTableCell extends LitElement {
  static override styles = tableStyles;

  protected override willUpdate() {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'cell');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTableCell);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTableCell;
  }
}
