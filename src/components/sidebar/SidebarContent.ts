import { html, LitElement } from 'lit';

import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-content';

export class SbSidebarContent extends LitElement {
  static override styles = sidebarStyles;

  protected override render() {
    return html`<div part="content"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarContent;
  }
}
