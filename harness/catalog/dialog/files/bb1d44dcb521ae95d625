import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';

import { dialogContext } from './context';
import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog-trigger';

export class SbDialogTrigger extends LitElement {
  static override styles = dialogStyles;

  readonly #state = new ContextConsumer(this, { context: dialogContext, subscribe: true });

  constructor() {
    super();
    this.addEventListener('click', () => this.#state.value?.setOpen(true));
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialogTrigger);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialogTrigger;
  }
}
