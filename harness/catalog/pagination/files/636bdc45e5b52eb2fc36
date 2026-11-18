import { html, LitElement } from 'lit';

import { paginationStyles } from './Pagination.styles';

const TAG = 'sb-pagination-item';

/** One entry of the pagination row. */
export class SbPaginationItem extends LitElement {
  static override styles = paginationStyles;

  // Decided once, on first update: an author's role attribute is never overwritten.
  #managesRole?: boolean;

  protected override willUpdate() {
    this.#managesRole ??= !this.hasAttribute('role');
    if (this.#managesRole) this.setAttribute('role', 'listitem');
  }

  // An item that only holds the (hidden) ellipsis would be an empty list item, so it hides itself too.
  #hidesItself = false;

  #syncHidden = (event: Event) => {
    const children = (event.target as HTMLSlotElement).assignedElements();
    const onlyEllipsis = children.length > 0 && children.every((el) => el.localName === 'sb-pagination-ellipsis');
    if (onlyEllipsis) {
      this.setAttribute('aria-hidden', 'true');
      this.#hidesItself = true;
    } else if (this.#hidesItself) {
      this.removeAttribute('aria-hidden');
      this.#hidesItself = false;
    }
  };

  protected override render() {
    return html`<slot @slotchange=${this.#syncHidden}></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbPaginationItem);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbPaginationItem;
  }
}
