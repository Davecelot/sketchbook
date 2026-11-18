import { ContextConsumer } from '@lit/context';
import { html, LitElement } from 'lit';

import { dialogContext } from './context';
import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog-close';

export class SbDialogClose extends LitElement {
  static override styles = dialogStyles;

  readonly #state = new ContextConsumer(this, { context: dialogContext, subscribe: true });

  constructor() {
    super();
    this.addEventListener('click', () => this.#state.value?.setOpen(false));
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialogClose);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialogClose;
  }
}
