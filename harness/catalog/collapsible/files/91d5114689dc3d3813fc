import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';

import { collapsibleStyles } from './Collapsible.styles';
import { collapsibleContext } from './context';

const TAG = 'sb-collapsible-content';

/** The panel a collapsible shows and hides, with an animated height. */
export class SbCollapsibleContent extends LitElement {
  static override styles = collapsibleStyles;

  readonly #state = new ContextConsumer(this, { context: collapsibleContext, subscribe: true });

  // Set before render so the first paint is already in its final state and doesn't animate.
  protected override willUpdate() {
    this.dataset.state = this.#state.value?.expanded ? 'open' : 'closed';
  }

  protected override render() {
    return html`<div part="content"><div part="inner"><slot></slot></div></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbCollapsibleContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbCollapsibleContent;
  }
}
