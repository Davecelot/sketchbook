import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import type { Collapsible } from './context';
import { sidebarContext } from './context';
import { tabbables, wrapTab } from '../../utils/focus-wrap';
import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar';

export class SbSidebar extends LitElement {
  static override styles = sidebarStyles;

  @property({ reflect: true }) label = 'Sidebar';

  @property({ reflect: true }) collapsible: Collapsible = 'offcanvas';

  readonly #state = new ContextConsumer(this, { context: sidebarContext, subscribe: true });

  #warned = false;

  #pressedBackdrop = false;

  constructor() {
    super();
    this.addEventListener('click', (e) => {
      // A modified or non-primary click opens the link elsewhere, so the user stays on this page.
      if (!this.#state.value?.drawerOpen || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const path = e.composedPath();
      const isMenuLink = path.some((n) => n instanceof HTMLAnchorElement && n.hasAttribute('href')) && path.some((n) => n instanceof Element && n.localName === 'sb-sidebar-menu-button');
      if (isMenuLink) this.#state.value.closeDrawer();
    });
  }

  protected override willUpdate() {
    const s = this.#state.value;
    if (s && s.collapsible !== this.collapsible) s.setCollapsible(this.collapsible);
    const collapsed = !!s && !s.narrow && this.collapsible === 'offcanvas' && !s.expanded;
    this.dataset.state = collapsed ? 'collapsed' : 'expanded';
  }

  protected override updated() {
    const dialog = this.renderRoot.querySelector('dialog');
    const wantsOpen = !!this.#state.value?.drawerOpen;
    if (dialog && wantsOpen && !dialog.open) dialog.showModal();
    else if (dialog && !wantsOpen && dialog.open) dialog.close();

    if (!this.#warned && !this.label.trim()) {
      this.#warned = true;
      console.warn('<sb-sidebar> has no accessible name. Set label.');
    }
  }

  // Close only when both the press and the release land on the backdrop, so a drag that starts inside
  // the drawer never closes it. The nav fills the dialog, so the dialog itself is only hit on the backdrop.
  #onPointerDown = (e: PointerEvent) => {
    this.#pressedBackdrop = e.target === e.currentTarget;
  };

  #onClick = (e: MouseEvent) => {
    if (this.#pressedBackdrop && e.target === e.currentTarget) (e.currentTarget as HTMLDialogElement).close();
    this.#pressedBackdrop = false;
  };

  #onKeyDown = (e: KeyboardEvent) => wrapTab(e, tabbables(this));

  protected override render() {
    const nav = html`<nav part="nav" aria-label=${this.label}><slot></slot></nav>`;
    if (!this.#state.value?.narrow) return html`<div part="root">${nav}</div>`;
    return html`<dialog
      part="drawer"
      aria-label=${this.label}
      @close=${() => this.#state.value?.closeDrawer()}
      @pointerdown=${this.#onPointerDown}
      @click=${this.#onClick}
      @keydown=${this.#onKeyDown}
    >
      ${nav}
    </dialog>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebar);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebar;
  }
}
