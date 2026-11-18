import { ContextProvider } from '@lit/context';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { Collapsible } from './context';
import { sidebarContext } from './context';
import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-provider';
const TEXT_FIELD = 'textarea, select, input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"], [type="range"], [type="color"], [type="file"])';
let breakpointWarned = false;

export class SbSidebarProvider extends LitElement {
  static override styles = sidebarStyles;

  @property({ type: Boolean, reflect: true }) expanded = true;

  @state() private narrow = false;

  @state() private drawerOpen = false;

  @state() private collapsible: Collapsible = 'offcanvas';

  #query?: MediaQueryList;

  #opener: HTMLElement | null = null;

  readonly #provider = new ContextProvider(this, { context: sidebarContext });

  // The stylesheet's media query has sidebar.breakpoint inlined at build time (SB-0109); reading the same token
  // here keeps script and styles on one breakpoint without a second constant.
  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.#onShortcut);
    const breakpoint = getComputedStyle(this).getPropertyValue('--sb-sidebar-breakpoint').trim();
    if (!breakpoint) {
      this.#query = undefined;
      this.narrow = false;
      if (!breakpointWarned) {
        breakpointWarned = true;
        console.warn(`<${TAG}> --sb-sidebar-breakpoint is empty, so the sidebar stays wide and never becomes a drawer.`);
      }
      return;
    }
    this.#query = matchMedia(`(width < ${breakpoint})`);
    this.#query.addEventListener('change', this.#onViewport);
    this.narrow = this.#query.matches;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#query?.removeEventListener('change', this.#onViewport);
    window.removeEventListener('keydown', this.#onShortcut);
  }

  // Control+B or Meta+B toggles the sidebar like the trigger does, except while typing in a text field,
  // where the same keys mean bold.
  #onShortcut = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() !== 'b' || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.defaultPrevented || e.isComposing) return;
    const target = e.composedPath()[0];
    if (target instanceof HTMLElement && (target.isContentEditable || target.matches(TEXT_FIELD))) return;
    if (this.narrow && this.drawerOpen) this.#closeDrawer();
    else if (this.narrow || this.collapsible !== 'none') this.#activate(this.querySelector<HTMLElement>('sb-sidebar-trigger') ?? (document.activeElement as HTMLElement));
    else return;
    e.preventDefault();
  };

  // Swapping the panel and the drawer unrenders whatever held focus, so focus moves to the trigger,
  // or to the first menu button when the trigger is hidden (collapsible=none on a wide viewport).
  #onViewport = () => {
    void this.#reflow();
  };

  #reflow = async () => {
    const sidebar = this.querySelector('sb-sidebar');
    // :focus-within misses focus inside the top-layer drawer in Chromium; the retargeted activeElement does not.
    const hadFocus = !!sidebar?.contains(document.activeElement);
    this.narrow = this.#query!.matches;
    this.drawerOpen = false;
    this.#opener = null;
    if (!hadFocus) return;
    const trigger = this.querySelector('sb-sidebar-trigger');
    await this.updateComplete;
    await Promise.all([sidebar?.updateComplete, trigger?.updateComplete]);
    if (!this.isConnected) return;
    trigger?.focus();
    if (document.activeElement !== trigger) sidebar?.querySelector('sb-sidebar-menu-button')?.focus();
  };

  #refocus = false;

  protected override willUpdate(changed: PropertyValues<this>) {
    // Collapsing the panel hides whatever held focus; checked before the render that hides it.
    this.#refocus = changed.get('expanded') === true && !this.expanded && !this.narrow && !!this.querySelector('sb-sidebar')?.contains(document.activeElement);
    this.#provider.setValue({
      expanded: this.expanded,
      narrow: this.narrow,
      drawerOpen: this.drawerOpen,
      collapsible: this.collapsible,
      activate: this.#activate,
      closeDrawer: this.#closeDrawer,
      setCollapsible: this.#setCollapsible,
      sidebar: () => this.querySelector('sb-sidebar'),
    });
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('expanded') && changed.get('expanded') !== undefined) {
      this.dispatchEvent(new Event('sb-toggle', { bubbles: true, composed: true }));
    }
    if (this.#refocus) this.querySelector('sb-sidebar-trigger')?.focus();
  }

  #activate = (trigger: HTMLElement) => {
    if (this.narrow) {
      this.#opener = trigger;
      this.drawerOpen = true;
    } else if (this.collapsible !== 'none') {
      this.expanded = !this.expanded;
    }
  };

  // Focus moves after the drawer's native dialog has closed: closing it restores focus to whatever held it
  // before showModal(), which would override an earlier focus call.
  #closeDrawer = () => {
    void this.#closeAndRefocus();
  };

  #closeAndRefocus = async () => {
    if (!this.drawerOpen) return;
    this.drawerOpen = false;
    const opener = this.#opener;
    this.#opener = null;
    await this.updateComplete;
    await this.querySelector('sb-sidebar')?.updateComplete;
    opener?.focus();
  };

  #setCollapsible = (value: Collapsible) => {
    this.collapsible = value;
  };

  protected override render() {
    return html`<div part="wrapper"><slot @slotchange=${() => this.requestUpdate()}></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarProvider);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarProvider;
  }
}
