import { html, LitElement } from 'lit';

import { LabelledByController } from '../../controllers/labelled-by';
import { tableStyles } from './Table.styles';

const TAG = 'sb-table';

/** Rows and columns of data, with table roles on custom elements. */
export class SbTable extends LitElement {
  static override styles = tableStyles;

  readonly #internals = this.attachInternals();

  // Decided once, on first update: an author's role attribute is never overwritten.
  #managesRole?: boolean;

  protected override willUpdate() {
    this.#managesRole ??= !this.hasAttribute('role');
    if (this.#managesRole) this.setAttribute('role', 'table');
  }

  // The table is named by its caption.
  readonly #name = new LabelledByController(this, this.#internals, () => this.querySelector<HTMLElement>(':scope > sb-table-caption'));

  protected override render() {
    return html`<slot @slotchange=${() => this.#name.sync()}></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTable);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTable;
  }
}
