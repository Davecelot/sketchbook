import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { tableStyles } from './Table.styles';

const TAG = 'sb-table-row';

/** One row of a table. */
export class SbTableRow extends LitElement {
  static override styles = tableStyles;

  @property({ type: Boolean, reflect: true }) selected = false;

  protected override willUpdate(_changed: PropertyValues<this>) {
    this.setAttribute('role', 'row');
    if (this.selected) this.setAttribute('aria-selected', 'true');
    else this.removeAttribute('aria-selected');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTableRow);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTableRow;
  }
}
