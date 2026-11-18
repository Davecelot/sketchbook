import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { sidebarContext } from './context';
import { sidebarStyles } from './Sidebar.styles';

const TAG = 'sb-sidebar-trigger';
let reflectionWarned = false;

export class SbSidebarTrigger extends LitElement {
  static override styles = sidebarStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property({ reflect: true }) label = 'Toggle Sidebar';

  readonly #state = new ContextConsumer(this, { context: sidebarContext, subscribe: true });

  protected override willUpdate() {
    const s = this.#state.value;
    this.toggleAttribute('data-hidden', !!s && !s.narrow && s.collapsible === 'none');
  }

  // An element reference resolves from this shadow root to the light DOM; an ID would not (SB-0009).
  protected override updated() {
    const button = this.renderRoot.querySelector('button');
    const sidebar = this.#state.value?.sidebar();
    if (!button) return;
    if ('ariaControlsElements' in button) button.ariaControlsElements = sidebar ? [sidebar] : null;
    else if (!reflectionWarned) {
      reflectionWarned = true;
      console.warn(`<${TAG}> this browser has no ARIA element reflection, so assistive technology cannot follow the trigger to the sidebar.`);
    }
  }

  protected override render() {
    const s = this.#state.value;
    const expanded = s ? (s.narrow ? s.drawerOpen : s.collapsible === 'none' || s.expanded) : true;
    // Lucide "panel-left" (ISC), decorative.
    return html`<button part="trigger" type="button" aria-label=${this.label} aria-expanded=${expanded ? 'true' : 'false'} aria-keyshortcuts="Control+B Meta+B" @click=${() => s?.activate(this)}>
      <svg part="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
      </svg>
    </button>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbSidebarTrigger);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbSidebarTrigger;
  }
}
