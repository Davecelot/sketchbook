import { html, LitElement } from 'lit';

import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-footer';

export class SbSidebarFooter extends LitElement {
  static override styles = sidebarStyles;

  protected override render() {
    return html`<div part="footer"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarFooter);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarFooter;
  }
}
