import { html, LitElement } from 'lit';

import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-menu';

export class SbSidebarMenu extends LitElement {
  static override styles = sidebarStyles;

  // Decided once, on first update: an author's role attribute is never overwritten.
  #managesRole?: boolean;

  protected override willUpdate() {
    this.#managesRole ??= !this.hasAttribute('role');
    if (this.#managesRole) this.setAttribute('role', 'list');
  }

  protected override render() {
    return html`<div part="menu"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarMenu);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarMenu;
  }
}
