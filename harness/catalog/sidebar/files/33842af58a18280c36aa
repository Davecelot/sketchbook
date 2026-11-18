import { html, LitElement } from 'lit';

import { LabelledByController } from '../../controllers/labelled-by';
import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-group';

export class SbSidebarGroup extends LitElement {
  static override styles = sidebarStyles;

  readonly #internals = this.attachInternals();

  // Decided once, on first update: an author's role attribute is never overwritten.
  #managesRole?: boolean;

  // The group is named by its label (SB-0108).
  readonly #name = new LabelledByController(this, this.#internals, () => this.querySelector<HTMLElement>(':scope > sb-sidebar-group-label'));

  static override get observedAttributes() {
    return [...super.observedAttributes, 'aria-label', 'aria-labelledby'];
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null) {
    super.attributeChangedCallback(name, old, value);
    if (name === 'aria-label' || name === 'aria-labelledby') this.#syncRole();
  }

  protected override willUpdate() {
    this.#managesRole ??= !this.hasAttribute('role');
    this.#syncRole();
  }

  // An unnamed group is noise in the accessibility tree, so the role follows the name.
  #syncRole() {
    if (!this.#managesRole) return;
    const named = !!this.querySelector(':scope > sb-sidebar-group-label') || this.hasAttribute('aria-labelledby') || this.hasAttribute('aria-label');
    if (named) this.setAttribute('role', 'group');
    else this.removeAttribute('role');
  }

  #onSlotChange = () => {
    this.#name.sync();
    this.#syncRole();
  };

  protected override render() {
    return html`<div part="group"><slot @slotchange=${this.#onSlotChange}></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarGroup);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarGroup;
  }
}
