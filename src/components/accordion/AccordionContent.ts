import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';

import { LabelledByController } from '../../controllers/labelled-by';
import { accordionStyles } from './Accordion.styles';
import { accordionItemContext } from './context';

const TAG = 'sb-accordion-content';

/** The panel of an accordion item, with an animated height. */
export class SbAccordionContent extends LitElement {
  static override styles = accordionStyles;

  readonly #internals = this.attachInternals();

  readonly #item = new ContextConsumer(this, { context: accordionItemContext, subscribe: true });

  constructor() {
    super();
    this.#internals.role = 'region';
    // The region is named by its trigger, which sits in another shadow root; the controller registers itself.
    new LabelledByController(this, this.#internals, () => this.#item.value?.trigger());
  }

  // Set before render so the first paint is already final and doesn't animate.
  protected override willUpdate() {
    this.dataset.state = this.#item.value?.open ? 'open' : 'closed';
  }

  protected override render() {
    return html`<div part="content"><div part="inner"><div part="body"><slot></slot></div></div></div>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbAccordionContent);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbAccordionContent;
  }
}
