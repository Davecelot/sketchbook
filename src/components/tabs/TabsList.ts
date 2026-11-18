import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { RovingFocusController } from '../../controllers/roving-focus';
import { tabsContext } from './context';
import { tabsStyles } from './Tabs.styles';

const TAG = 'sb-tabs-list';

/** The tablist that holds the tabs. */
export class SbTabsList extends LitElement {
  static override styles = tabsStyles;

  @property({ reflect: true }) variant: 'primary' | 'line' = 'primary';

  readonly #tabs = new ContextConsumer(this, { context: tabsContext, subscribe: true });

  #items = () => [...this.querySelectorAll<HTMLElement>('sb-tabs-trigger')].filter((el) => el.closest(TAG) === this);

  readonly #roving = new RovingFocusController(this, {
    items: this.#items,
    orientation: () => this.#tabs.value?.orientation ?? 'horizontal',
    current: () => this.#items().find((el) => el.getAttribute('value') === this.#tabs.value?.value),
    onMove: (item) => {
      const tabs = this.#tabs.value;
      if (tabs?.activation === 'automatic') tabs.select(item.getAttribute('value') ?? '');
    },
  });

  // Decided once, on first update: an author's role attribute is never overwritten.
  #managesRole?: boolean;

  protected override willUpdate() {
    const orientation = this.#tabs.value?.orientation ?? 'horizontal';
    this.#managesRole ??= !this.hasAttribute('role');
    if (this.#managesRole) {
      this.setAttribute('role', 'tablist');
      this.setAttribute('aria-orientation', orientation);
    }
    this.dataset.orientation = orientation;
  }

  protected override render() {
    return html`<div part="list"><slot @slotchange=${() => this.#roving.sync()}></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTabsList);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTabsList;
  }
}
