import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { tabsContext } from './context';
import { tabsStyles } from './Tabs.styles';

const TAG = 'sb-tabs-trigger';

/** One tab. */
export class SbTabsTrigger extends LitElement {
  static override styles = tabsStyles;
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  @property({ reflect: true }) value = '';

  @property({ type: Boolean, reflect: true }) disabled = false;

  readonly #tabs = new ContextConsumer(this, { context: tabsContext, subscribe: true });

  #pendingTabIndex: number | null = null;

  // The roving-focus controller sets tabIndex on the host; a tabindex on the generic host would make
  // checkers treat it as an interactive wrapper between tablist and tab, so it is applied to the button.
  override get tabIndex() {
    return this.shadowRoot?.querySelector('button')?.tabIndex ?? this.#pendingTabIndex ?? 0;
  }

  override set tabIndex(value: number) {
    const button = this.shadowRoot?.querySelector('button');
    if (button) button.tabIndex = value;
    else this.#pendingTabIndex = value;
  }

  get #selected() {
    return this.#tabs.value?.value === this.value;
  }

  protected override willUpdate() {
    this.dataset.state = this.#selected ? 'active' : 'inactive';
    this.dataset.orientation = this.#tabs.value?.orientation ?? 'horizontal';
  }

  protected override updated() {
    if (this.#pendingTabIndex !== null) {
      this.tabIndex = this.#pendingTabIndex;
      this.#pendingTabIndex = null;
    }
    // An element reference resolves from this shadow root to the light DOM above it; an ID would not.
    const button = this.shadowRoot?.querySelector('button');
    const panel = this.#tabs.value?.panel(this.value);
    if (button && 'ariaControlsElements' in button) button.ariaControlsElements = panel ? [panel] : null;
  }

  #select = () => {
    if (!this.disabled) this.#tabs.value?.select(this.value);
  };

  protected override render() {
    return html`<button part="trigger" type="button" role="tab" aria-selected=${this.#selected ? 'true' : 'false'} ?disabled=${this.disabled} @click=${this.#select}>
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTabsTrigger);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTabsTrigger;
  }
}
