import { html, LitElement } from 'lit';

import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-header';

export class SbSidebarHeader extends LitElement {
  static override styles = sidebarStyles;

  protected override render() {
    return html`<div part="header"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarHeader);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarHeader;
  }
}
