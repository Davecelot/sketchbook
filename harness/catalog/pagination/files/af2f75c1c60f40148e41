import { html, LitElement } from 'lit';

import { paginationStyles } from './Pagination.styles';

const TAG = 'sb-pagination-content';

/** The row that holds the pagination items. */
export class SbPaginationContent extends LitElement {
  static override styles = paginationStyles;

  // Decided once, on first update: an author's role attribute is never overwritten.
  #managesRole?: boolean;

  protected override willUpdate() {
    this.#managesRole ??= !this.hasAttribute('role');
    if (this.#managesRole) this.setAttribute('role', 'list');
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbPaginationContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbPaginationContent;
  }
}
