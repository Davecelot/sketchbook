import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

import { LabelledByController } from '../../controllers/labelled-by';
import { tabsContext } from './context';
import { tabsStyles } from './Tabs.styles';

const TAG = 'sb-tabs-content';

/** The panel of one tab. */
export class SbTabsContent extends LitElement {
  static override styles = tabsStyles;

  @property({ reflect: true }) value = '';

  readonly #internals = this.attachInternals();

  readonly #tabs = new ContextConsumer(this, { context: tabsContext, subscribe: true });

  constructor() {
    super();
    // The panel is named by its tab, which sits in another shadow root; the controller registers itself.
    new LabelledByController(this, this.#internals, () => this.#tabs.value?.trigger(this.value));
  }

  protected override willUpdate() {
    this.dataset.state = this.#tabs.value?.value === this.value ? 'active' : 'inactive';
    this.setAttribute('role', 'tabpanel');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }

  protected override render() {
    return html`<div part="panel"><slot></slot></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbTabsContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbTabsContent;
  }
}
