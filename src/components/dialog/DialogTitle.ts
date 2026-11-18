import { html, LitElement } from 'lit';

import { dialogStyles } from './Dialog.styles';

const TAG = 'sb-dialog-title';

export class SbDialogTitle extends LitElement {
  static override styles = dialogStyles;

  readonly #internals = this.attachInternals();

  constructor() {
    super();
    this.#internals.role = 'heading';
    this.#internals.ariaLevel = '2';
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, SbDialogTitle);

declare global {
  interface HTMLElementTagNameMap {
    [TAG]: SbDialogTitle;
  }
}
