import { html, LitElement } from 'lit';

import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-group-label';

export class SbSidebarGroupLabel extends LitElement {
  static override styles = sidebarStyles;

  protected override render() {
    return html`<div part="label"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarGroupLabel);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarGroupLabel;
  }
}
