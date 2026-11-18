import { html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { safeHref } from '../../utils/safe-href';
import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-menu-button';

export class SbSidebarMenuButton extends LitElement {
  static override styles = sidebarStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property({ reflect: true }) href: string | null = '';

  @property({ type: Boolean, reflect: true }) active = false;

  protected override render() {
    if (!this.href) return html`<button part="button" type="button"><slot></slot></button>`;
    return html`<a part="button" href=${safeHref(this.href)} aria-current=${this.active ? 'page' : nothing}
      ><slot></slot
    ></a>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarMenuButton);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarMenuButton;
  }
}
